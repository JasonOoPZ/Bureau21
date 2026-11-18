import { authOptions } from "@/auth";
import {
  CRASH_MAX_BET,
  CRASH_MIN_BET,
  CRASH_SESSION_TTL_MS,
  INT32_MAX,
  crashMultiplierAt,
  drawCrashPoint,
  resolveCashOut,
} from "@/lib/casino-crash";
import { prisma } from "@/lib/prisma";
import { Prisma, type CrashRun } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Void Runner (formerly Crash) -- server-authoritative bet tracking.
 *
 * Flow:
 *   POST   -> place bet, deduct credits, draw a hidden crash point
 *   PUT    -> cash out; pays only if the multiplier has not passed the crash point
 *   DELETE -> player died (hit wall), record loss
 *   GET    -> poll; reports (and settles) a run that has crashed
 *
 * The multiplier is e^(0.12 * seconds since start), capped at 100x. The crash
 * point is never sent to the client before the run is settled.
 *
 * Runs are rows in `CrashRun`, so any serverless instance can settle a run
 * another instance started. Two database rules carry the guarantees:
 *   - a partial unique index allows one `status = 'open'` run per pilot, so
 *     parallel POSTs cannot open (and the pilot cannot be debited for) two;
 *   - a run is settled by `UPDATE ... WHERE status = 'open'`. Exactly one
 *     request can win that write; the payout and the history row share its
 *     transaction, so a run is paid once or not at all.
 */

const STATUS_OPEN = "open";
const STATUS_CASHED_OUT = "cashed_out";
const STATUS_CRASHED = "crashed";
/** Abandoned runs of other pilots closed out per bet placed. */
const STALE_SWEEP_BATCH = 10;

type Settlement =
  | { status: "cashed_out"; multiplier: number; payout: number; crashPoint: number; label: string }
  | { status: "crashed"; reason: "void" | "wall" | "expired"; multiplier: number; crashPoint?: number; label: string };

type SettleIntent = "cashout" | "death" | "expire";

type SettleResult =
  | { settled: true; settlement: Settlement }
  /** Another request settled this run first. Nothing was written here. */
  | { settled: false };

function elapsedMs(run: CrashRun, at: Date): number {
  return at.getTime() - run.startedAt.getTime();
}

function hasCrashed(run: CrashRun, now: Date): boolean {
  return crashMultiplierAt(elapsedMs(run, now)) > run.crashPoint;
}

function isExpired(run: CrashRun, now: Date): boolean {
  return elapsedMs(run, now) > CRASH_SESSION_TTL_MS;
}

function findOpenRun(pilotId: string): Promise<CrashRun | null> {
  return prisma.crashRun.findFirst({ where: { pilotId, status: STATUS_OPEN } });
}

/**
 * Record the first cash-out request's server time on the run. Later requests
 * (retries, parallel taps) never move it, so every attempt to settle this run
 * computes the same payout.
 */
async function lockCashOutTime(run: CrashRun, now: Date): Promise<CrashRun | null> {
  if (run.cashOutAt !== null) return run;
  await prisma.crashRun.updateMany({
    where: { id: run.id, status: STATUS_OPEN, cashOutAt: null },
    data: { cashOutAt: now },
  });
  return prisma.crashRun.findUnique({ where: { id: run.id } });
}

/**
 * Close the run as a win. The claim (`status = 'open'` -> `cashed_out`), the
 * credit and the history row are one transaction: if any of it fails the run
 * stays open with its cash-out time locked, and a retry pays the same amount.
 */
async function settleWin(run: CrashRun, payout: number, now: Date): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.crashRun.updateMany({
      where: { id: run.id, status: STATUS_OPEN },
      data: { status: STATUS_CASHED_OUT, settledAt: now, payout },
    });
    if (claimed.count !== 1) return false;

    const credited = await tx.pilotState.updateMany({
      where: { id: run.pilotId, credits: { lte: INT32_MAX - payout } },
      data: { credits: { increment: payout } },
    });
    if (credited.count === 0) {
      // Balance too close to the Int column limit: saturate instead of overflowing.
      await tx.pilotState.updateMany({ where: { id: run.pilotId }, data: { credits: INT32_MAX } });
    }
    await tx.casinoBet.create({
      data: { pilotId: run.pilotId, game: "crash", bet: run.bet, payout, net: payout - run.bet },
    });
    return true;
  });
}

/** Close the run as a loss. The wager was already taken when the bet was placed. */
async function settleLoss(run: CrashRun, now: Date): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.crashRun.updateMany({
      where: { id: run.id, status: STATUS_OPEN },
      data: { status: STATUS_CRASHED, settledAt: now, payout: 0 },
    });
    if (claimed.count !== 1) return false;

    await tx.casinoBet.create({
      data: { pilotId: run.pilotId, game: "crash", bet: run.bet, payout: 0, net: -run.bet },
    });
    return true;
  });
}

/**
 * Settles a run exactly once. Throws if the database write fails; the run then
 * stays open (with its cash-out time locked, if one was requested) so a retry
 * reaches the same outcome.
 */
async function settleRun(openRun: CrashRun, intent: SettleIntent, now: Date): Promise<SettleResult> {
  const crashedByVoid = openRun.cashOutAt === null && hasCrashed(openRun, now);
  const run = intent === "cashout" ? await lockCashOutTime(openRun, now) : openRun;
  if (!run || run.status !== STATUS_OPEN) return { settled: false };

  if (run.cashOutAt !== null) {
    const outcome = resolveCashOut(run.bet, elapsedMs(run, run.cashOutAt), run.crashPoint);
    if (outcome.won) {
      if (!(await settleWin(run, outcome.payout, now))) return { settled: false };
      return {
        settled: true,
        settlement: {
          status: "cashed_out",
          multiplier: outcome.multiplier,
          payout: outcome.payout,
          crashPoint: run.crashPoint,
          label: `Cashed out at ${outcome.multiplier.toFixed(2)}x! Won ${outcome.payout.toLocaleString()} credits`,
        },
      };
    }
  }

  if (!(await settleLoss(run, now))) return { settled: false };
  const lost = `Lost ${run.bet.toLocaleString()} credits`;

  if (crashedByVoid || run.cashOutAt !== null) {
    return {
      settled: true,
      settlement: {
        status: "crashed",
        reason: "void",
        multiplier: run.crashPoint,
        crashPoint: run.crashPoint,
        label: `The void collapsed at ${run.crashPoint.toFixed(2)}x! ${lost}`,
      },
    };
  }
  if (intent === "expire") {
    return {
      settled: true,
      settlement: { status: "crashed", reason: "expired", multiplier: 0, label: `Run expired. ${lost}` },
    };
  }
  const multiplier = crashMultiplierAt(elapsedMs(run, now));
  return {
    settled: true,
    settlement: {
      status: "crashed",
      reason: "wall",
      multiplier,
      label: `Crashed at ${multiplier.toFixed(2)}x! ${lost}`,
    },
  };
}

/**
 * Closes out runs nobody came back for (any pilot), so their wager reaches the
 * bet history and a locked-in cash-out that failed to write still gets paid.
 */
async function sweepStaleRuns(now: Date): Promise<void> {
  try {
    const stale = await prisma.crashRun.findMany({
      where: { status: STATUS_OPEN, startedAt: { lt: new Date(now.getTime() - CRASH_SESSION_TTL_MS) } },
      orderBy: { startedAt: "asc" },
      take: STALE_SWEEP_BATCH,
    });
    for (const run of stale) {
      await settleRun(run, "expire", now);
    }
  } catch (err) {
    console.error("[crash] failed to settle expired runs", err);
  }
}

async function requirePilotId(): Promise<{ pilotId: string } | { response: NextResponse }> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const pilot = await prisma.pilotState.findUnique({ where: { userId }, select: { id: true } });
  if (!pilot) return { response: NextResponse.json({ error: "Pilot not found." }, { status: 404 }) };
  return { pilotId: pilot.id };
}

const noActiveGame = () => NextResponse.json({ error: "No active game." }, { status: 400 });
const alreadyRunning = () => NextResponse.json({ error: "Game already running." }, { status: 400 });
const settleFailed = () =>
  NextResponse.json({ error: "Could not settle the run. Please try again." }, { status: 500 });

async function settleResponse(run: CrashRun, intent: SettleIntent, now: Date) {
  try {
    const result = await settleRun(run, intent, now);
    if (!result.settled) {
      return NextResponse.json({ error: "Run already settled." }, { status: 409 });
    }
    return NextResponse.json(result.settlement);
  } catch (err) {
    console.error("[crash] settlement failed", err);
    return settleFailed();
  }
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

class InsufficientCreditsError extends Error {}

// POST -- place a bet
export async function POST(request: Request) {
  const auth = await requirePilotId();
  if ("response" in auth) return auth.response;
  const { pilotId } = auth;

  const body = (await request.json().catch(() => null)) as { bet?: unknown } | null;
  const bet = body?.bet;
  if (typeof bet !== "number" || !Number.isInteger(bet) || bet < CRASH_MIN_BET || bet > CRASH_MAX_BET) {
    return NextResponse.json({ error: "Invalid bet (10-1,000,000)." }, { status: 400 });
  }

  const now = new Date();
  await sweepStaleRuns(now);

  const existing = await findOpenRun(pilotId);
  if (existing) {
    const isFinished = existing.cashOutAt !== null || hasCrashed(existing, now) || isExpired(existing, now);
    if (!isFinished) return alreadyRunning();
    // The previous run already crashed (or has a pending cash-out): close it first.
    try {
      await settleRun(existing, "expire", now);
    } catch (err) {
      console.error("[crash] could not close the previous run", err);
      return settleFailed();
    }
  }

  try {
    // One transaction: the debit only stands if the run row exists. The
    // guarded decrement keeps the balance at or above zero, and the partial
    // unique index refuses a second open run, rolling its debit back.
    await prisma.$transaction(async (tx) => {
      const debited = await tx.pilotState.updateMany({
        where: { id: pilotId, credits: { gte: bet } },
        data: { credits: { decrement: bet } },
      });
      if (debited.count === 0) throw new InsufficientCreditsError();

      await tx.crashRun.create({
        data: { pilotId, bet, crashPoint: drawCrashPoint(), startedAt: new Date() },
      });
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: "Not enough credits." }, { status: 400 });
    }
    if (isUniqueViolation(err)) return alreadyRunning();
    throw err;
  }

  return NextResponse.json({ status: "started" });
}

// PUT -- cash out
export async function PUT() {
  const auth = await requirePilotId();
  if ("response" in auth) return auth.response;

  const run = await findOpenRun(auth.pilotId);
  if (!run) return noActiveGame();

  const now = new Date();
  // A run nobody settled within the TTL is closed without taking a new cash-out.
  return settleResponse(run, isExpired(run, now) ? "expire" : "cashout", now);
}

// DELETE -- player died (hit wall)
export async function DELETE() {
  const auth = await requirePilotId();
  if ("response" in auth) return auth.response;

  const run = await findOpenRun(auth.pilotId);
  if (!run) return noActiveGame();

  const now = new Date();
  return settleResponse(run, isExpired(run, now) ? "expire" : "death", now);
}

// GET -- poll the run; reveals the crash point only once the run has crashed and is settled
export async function GET() {
  const auth = await requirePilotId();
  if ("response" in auth) return auth.response;

  const run = await findOpenRun(auth.pilotId);
  if (!run) return NextResponse.json({ status: "idle" });

  const now = new Date();
  if (run.cashOutAt !== null || hasCrashed(run, now) || isExpired(run, now)) {
    const response = await settleResponse(run, "expire", now);
    // Lost the race to another request that settled it: nothing is running now.
    return response.status === 409 ? NextResponse.json({ status: "idle" }) : response;
  }
  return NextResponse.json({ status: "running" });
}
