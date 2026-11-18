import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createInitialState, processOfflineProgress, type OfflineReport } from "@/lib/hydroponics/engine";
import { applyHydroponicsAction, hydroponicsActionSchema } from "@/lib/hydroponics/server-actions";
import { sanitizeState } from "@/lib/hydroponics/server-sanitize";
import type { HydroponicsGameState } from "@/lib/hydroponics/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Hydroponics Bay API -- the server owns the game state and every credit change.
 *
 *   GET  -> load state, apply offline progress (wages, auto-harvest)
 *   POST -> apply ONE validated action ({ action: "sell", cropId, tier, amount }, ...)
 *
 * The client never sends a game state or a credit amount. Costs and sale
 * proceeds are recomputed here from the stored state with the pure engine.
 */

/** `credits` is a Postgres Int column. */
const INT32_MAX = 2_147_483_647;
const MAX_BODY_BYTES = 2_048;
const WAGE_WRITE_ATTEMPTS = 3;
const MIN_REPORTED_OFFLINE_HOURS = 0.01;

type Tx = Prisma.TransactionClient;

class ActionError extends Error {
  constructor(message: string, readonly status: number = 400) {
    super(message);
  }
}

const toJson = (state: HydroponicsGameState) => state as unknown as Prisma.InputJsonValue;

async function ensureStateRow(pilotId: string): Promise<void> {
  const existing = await prisma.hydroponicsData.findUnique({ where: { pilotId }, select: { id: true } });
  if (existing) return;
  try {
    await prisma.hydroponicsData.create({ data: { pilotId, gameState: toJson(createInitialState()) } });
  } catch (err) {
    // A concurrent request created the row first; that is fine.
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
  }
}

/**
 * Locks the pilot's hydroponics row for the rest of the transaction and
 * returns its sanitized state. Every read-modify-write of the JSON state goes
 * through this, so two requests can never both spend the same inventory.
 */
async function lockState(tx: Tx, pilotId: string, now: number): Promise<HydroponicsGameState> {
  // An UPDATE takes the row lock until commit; a concurrent request blocks here
  // and then reads the state the first one committed (READ COMMITTED).
  const locked = await tx.hydroponicsData.updateMany({ where: { pilotId }, data: { updatedAt: new Date(now) } });
  if (locked.count !== 1) throw new ActionError("Hydroponics data not found. Reload the page.", 404);
  const row = await tx.hydroponicsData.findUniqueOrThrow({ where: { pilotId }, select: { gameState: true } });
  return sanitizeState(row.gameState, now);
}

async function readCredits(tx: Tx, pilotId: string): Promise<number> {
  const pilot = await tx.pilotState.findUnique({ where: { id: pilotId }, select: { credits: true } });
  if (!pilot) throw new ActionError("Pilot not found.", 404);
  return pilot.credits;
}

async function saveState(tx: Tx, pilotId: string, state: HydroponicsGameState): Promise<void> {
  await tx.hydroponicsData.update({ where: { pilotId }, data: { gameState: toJson(state) } });
}

/** Deducts `cost` only if the balance covers it. The balance can never go below zero. */
async function spendCredits(tx: Tx, pilotId: string, cost: number): Promise<boolean> {
  const result = await tx.pilotState.updateMany({
    where: { id: pilotId, credits: { gte: cost } },
    data: { credits: { decrement: cost } },
  });
  return result.count === 1;
}

/** Adds `amount` only if the result still fits the Int column. */
async function earnCredits(tx: Tx, pilotId: string, amount: number): Promise<boolean> {
  const result = await tx.pilotState.updateMany({
    where: { id: pilotId, credits: { lte: INT32_MAX - amount } },
    data: { credits: { increment: amount } },
  });
  return result.count === 1;
}

interface OfflineResult {
  state: HydroponicsGameState;
  report: OfflineReport;
}

/**
 * Runs offline progress and charges wages with a guarded decrement. If the
 * balance moved under us (another game spent credits), recompute against the
 * fresh balance. Wages can only ever reduce credits.
 */
async function applyOfflineProgress(tx: Tx, pilotId: string, stored: HydroponicsGameState, now: number): Promise<OfflineResult> {
  for (let attempt = 0; attempt < WAGE_WRITE_ATTEMPTS; attempt++) {
    const credits = Math.max(0, await readCredits(tx, pilotId));
    const { state, report, creditsDelta } = processOfflineProgress(stored, credits, now);
    const wages = Math.max(0, Math.round(-creditsDelta));
    if (wages === 0 || (await spendCredits(tx, pilotId, wages))) {
      return { state, report: { ...report, wagesDeducted: wages, creditsDelta: -wages } };
    }
  }
  // Could not pin the balance down: treat the pilot as broke (unpaid staff quit, nothing is charged).
  const { state, report } = processOfflineProgress(stored, 0, now);
  return { state, report: { ...report, wagesDeducted: 0, creditsDelta: 0 } };
}

/** GET — Load game state + calculate offline progress */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  await ensureStateRow(pilot.id);
  const now = Date.now();

  const result = await prisma.$transaction(async (tx) => {
    const stored = await lockState(tx, pilot.id, now);
    const { state, report } = await applyOfflineProgress(tx, pilot.id, stored, now);
    await saveState(tx, pilot.id, state);
    return { state, report, credits: await readCredits(tx, pilot.id) };
  });

  return NextResponse.json({
    state: result.state,
    credits: result.credits,
    offline: result.report.elapsedHours > MIN_REPORTED_OFFLINE_HOURS ? result.report : null,
    serverNow: now,
  });
}

/** POST — Apply one server-validated action atomically */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rawBody = await request.text().catch(() => "");
  if (rawBody.length === 0 || rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
  let body: unknown = null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
  const parsed = hydroponicsActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  await ensureStateRow(pilot.id);
  const now = Date.now();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const stored = await lockState(tx, pilot.id, now);
      const credits = await readCredits(tx, pilot.id);
      const outcome = applyHydroponicsAction(stored, credits, parsed.data, now);
      if (!outcome.ok) throw new ActionError(outcome.error);

      const delta = outcome.creditsDelta;
      if (!Number.isSafeInteger(delta)) throw new ActionError("Invalid credit operation.");
      // Throwing rolls the transaction back, so state and credits always move together.
      if (delta < 0 && !(await spendCredits(tx, pilot.id, -delta))) {
        throw new ActionError("Not enough credits.");
      }
      if (delta > 0 && !(await earnCredits(tx, pilot.id, delta))) {
        throw new ActionError("Your credit balance is at the maximum. Spend some credits first.");
      }

      const state = { ...outcome.state, lastSave: now, lastOnline: now };
      await saveState(tx, pilot.id, state);
      return { state, credits: await readCredits(tx, pilot.id) };
    });

    return NextResponse.json({ ok: true, state: result.state, credits: result.credits, serverNow: now });
  } catch (err) {
    if (err instanceof ActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[hydroponics] action failed", err);
    return NextResponse.json({ error: "Could not save your action. Please try again." }, { status: 500 });
  }
}
