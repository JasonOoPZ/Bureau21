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
 * NOTE: runs live in process memory. A serverless instance that did not take
 * the bet cannot settle it. Persisting runs needs a schema change.
 */

interface ActiveGame {
  bet: number;
  startedAt: number;
  pilotId: string;
  crashPoint: number;
  /** Server time of the first cash-out request. Retries settle at this time. */
  cashOutAt: number | null;
  /** In-flight settlement guard. Released again if the settlement fails. */
  settling: boolean;
}

type Settlement =
  | { status: "cashed_out"; multiplier: number; payout: number; crashPoint: number; label: string }
  | { status: "crashed"; reason: "void" | "wall" | "expired"; multiplier: number; crashPoint?: number; label: string };

type SettleIntent = "cashout" | "death" | "expire";

const activeGames = new Map<string, ActiveGame>();
const startingUsers = new Set<string>();

function hasCrashed(game: ActiveGame, now: number): boolean {
  return crashMultiplierAt(now - game.startedAt) > game.crashPoint;
}

function removeGame(uid: string, game: ActiveGame): void {
  if (activeGames.get(uid) === game) activeGames.delete(uid);
}

async function recordLoss(game: ActiveGame): Promise<void> {
  try {
    await prisma.casinoBet.create({
      data: { pilotId: game.pilotId, game: "crash", bet: game.bet, payout: 0, net: -game.bet },
    });
  } catch (err) {
    // The wager was already taken at POST; a missing history row must not lock the player out.
    console.error("[crash] failed to record loss", err);
  }
}

async function payWin(uid: string, game: ActiveGame, payout: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const credited = await tx.pilotState.updateMany({
      where: { userId: uid, credits: { lte: INT32_MAX - payout } },
      data: { credits: { increment: payout } },
    });
    if (credited.count === 0) {
      // Balance too close to the Int column limit: saturate instead of overflowing.
      await tx.pilotState.updateMany({ where: { userId: uid }, data: { credits: INT32_MAX } });
    }
    await tx.casinoBet.create({
      data: { pilotId: game.pilotId, game: "crash", bet: game.bet, payout, net: payout - game.bet },
    });
  });
}

/**
 * Settles a run exactly once. Returns null if another request is settling it.
 * Throws if a winning payout could not be written; the run then stays open
 * with its cash-out time locked so a retry pays the same amount.
 */
async function settleGame(uid: string, game: ActiveGame, intent: SettleIntent, now: number): Promise<Settlement | null> {
  if (game.settling) return null;
  game.settling = true;

  const crashedByVoid = game.cashOutAt === null && hasCrashed(game, now);
  if (intent === "cashout" && game.cashOutAt === null) game.cashOutAt = now;

  if (game.cashOutAt !== null) {
    const outcome = resolveCashOut(game.bet, game.cashOutAt - game.startedAt, game.crashPoint);
    if (outcome.won) {
      try {
        await payWin(uid, game, outcome.payout);
      } catch (err) {
        game.settling = false;
        throw err;
      }
      removeGame(uid, game);
      return {
        status: "cashed_out",
        multiplier: outcome.multiplier,
        payout: outcome.payout,
        crashPoint: game.crashPoint,
        label: `Cashed out at ${outcome.multiplier.toFixed(2)}x! Won ${outcome.payout.toLocaleString()} credits`,
      };
    }
  }

  removeGame(uid, game);
  await recordLoss(game);
  const lost = `Lost ${game.bet.toLocaleString()} credits`;

  if (crashedByVoid || game.cashOutAt !== null) {
    return {
      status: "crashed",
      reason: "void",
      multiplier: game.crashPoint,
      crashPoint: game.crashPoint,
      label: `The void collapsed at ${game.crashPoint.toFixed(2)}x! ${lost}`,
    };
  }
  if (intent === "expire") {
    return { status: "crashed", reason: "expired", multiplier: 0, label: `Run expired. ${lost}` };
  }
  const multiplier = crashMultiplierAt(now - game.startedAt);
  return { status: "crashed", reason: "wall", multiplier, label: `Crashed at ${multiplier.toFixed(2)}x! ${lost}` };
}

/** Closes out abandoned runs. Called on every request, not only GET. */
async function expireStaleGames(now: number): Promise<void> {
  const stale = [...activeGames.entries()].filter(
    ([, game]) => !game.settling && now - game.startedAt > CRASH_SESSION_TTL_MS
  );
  await Promise.all(
    stale.map(([uid, game]) =>
      settleGame(uid, game, "expire", now).catch((err) => {
        console.error("[crash] failed to settle expired run", err);
      })
    )
  );
}

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const noActiveGame = () => NextResponse.json({ error: "No active game." }, { status: 400 });
const settleFailed = () =>
  NextResponse.json({ error: "Could not settle the run. Please try again." }, { status: 500 });

async function settleResponse(uid: string, game: ActiveGame, intent: SettleIntent, now: number) {
  try {
    const settlement = await settleGame(uid, game, intent, now);
    if (!settlement) {
      return NextResponse.json({ error: "Run is being settled." }, { status: 409 });
    }
    return NextResponse.json(settlement);
  } catch (err) {
    console.error("[crash] settlement failed", err);
    return settleFailed();
  }
}

// POST -- place a bet
export async function POST(request: Request) {
  const uid = await requireUserId();
  if (!uid) return unauthorized();

  const now = Date.now();
  await expireStaleGames(now);

  const body = (await request.json().catch(() => null)) as { bet?: unknown } | null;
  const bet = body?.bet;
  if (typeof bet !== "number" || !Number.isInteger(bet) || bet < CRASH_MIN_BET || bet > CRASH_MAX_BET) {
    return NextResponse.json({ error: "Invalid bet (10-1,000,000)." }, { status: 400 });
  }

  if (startingUsers.has(uid)) {
    return NextResponse.json({ error: "Game already running." }, { status: 400 });
  }
  startingUsers.add(uid);
  try {
    const existing = activeGames.get(uid);
    if (existing) {
      const isFinished = existing.cashOutAt !== null || hasCrashed(existing, now);
      if (!isFinished) {
        return NextResponse.json({ error: "Game already running." }, { status: 400 });
      }
      // The previous run already crashed (or has a pending cash-out): close it first.
      const closed = await settleGame(uid, existing, "expire", now).catch(() => null);
      if (!closed) return settleFailed();
    }

    const pilot = await prisma.pilotState.findUnique({ where: { userId: uid }, select: { id: true } });
    if (!pilot) return NextResponse.json({ error: "Pilot not found." }, { status: 404 });

    // Guarded decrement: the balance can never go below zero, even under concurrent requests.
    const debited = await prisma.pilotState.updateMany({
      where: { userId: uid, credits: { gte: bet } },
      data: { credits: { decrement: bet } },
    });
    if (debited.count === 0) {
      return NextResponse.json({ error: "Not enough credits." }, { status: 400 });
    }

    activeGames.set(uid, {
      bet,
      startedAt: Date.now(),
      pilotId: pilot.id,
      crashPoint: drawCrashPoint(),
      cashOutAt: null,
      settling: false,
    });
    return NextResponse.json({ status: "started" });
  } finally {
    startingUsers.delete(uid);
  }
}

// PUT -- cash out
export async function PUT() {
  const uid = await requireUserId();
  if (!uid) return unauthorized();

  const now = Date.now();
  await expireStaleGames(now);

  const game = activeGames.get(uid);
  if (!game) return noActiveGame();
  return settleResponse(uid, game, "cashout", now);
}

// DELETE -- player died (hit wall)
export async function DELETE() {
  const uid = await requireUserId();
  if (!uid) return unauthorized();

  const now = Date.now();
  await expireStaleGames(now);

  const game = activeGames.get(uid);
  if (!game) return noActiveGame();
  return settleResponse(uid, game, "death", now);
}

// GET -- poll the run; reveals the crash point only once the run has crashed and is settled
export async function GET() {
  const uid = await requireUserId();
  if (!uid) return unauthorized();

  const now = Date.now();
  await expireStaleGames(now);

  const game = activeGames.get(uid);
  if (!game) return NextResponse.json({ status: "idle" });
  if (game.settling) return NextResponse.json({ status: "running" });

  if (game.cashOutAt !== null || hasCrashed(game, now)) {
    return settleResponse(uid, game, "expire", now);
  }
  return NextResponse.json({ status: "running" });
}
