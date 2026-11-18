import { Prisma, type PilotState } from "@prisma/client";
import { NextResponse } from "next/server";
import { applyLevelProgression } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";

/**
 * Atomic economy helpers.
 *
 * Every balance / cooldown change must be a single conditional write:
 * the guard lives in the SQL WHERE clause, never in a JS `if` on a row that
 * was read earlier. With N concurrent copies of the same request, Postgres
 * row-locks the pilot, re-evaluates the guard for each waiter after the
 * previous one commits, and only the requests whose guard still holds apply.
 */

/** Either the root client or an interactive-transaction client. */
export type Db = Prisma.TransactionClient;

const TX_MAX_WAIT_MS = 5_000;
const TX_TIMEOUT_MS = 10_000;
const LEVEL_SETTLE_ATTEMPTS = 5;

/** Thrown inside a transaction to roll it back and answer with a client error. */
export class EconomyError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly extra: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "EconomyError";
  }
}

/**
 * Apply `data` to the pilot only if `guard` holds at write time.
 * Returns the fresh row, or null when the guard failed (nothing was written).
 *
 * Inside a transaction the returned row stays locked until commit, so
 * follow-up reads (inventory count, roster count) are serialized per pilot.
 */
export async function guardedPilotUpdate(
  db: Db,
  userId: string,
  guard: Prisma.PilotStateWhereInput,
  data: Prisma.PilotStateUpdateManyMutationInput
): Promise<PilotState | null> {
  const rows = await db.pilotState.updateManyAndReturn({
    where: { AND: [{ userId }, guard] },
    data,
  });
  return rows[0] ?? null;
}

/** Run a multi-step economy operation atomically. Throw EconomyError to abort. */
export function economyTx<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
  return prisma.$transaction(fn, { maxWait: TX_MAX_WAIT_MS, timeout: TX_TIMEOUT_MS });
}

/**
 * Convert an error thrown by an economy operation into a response.
 * Unknown errors are re-thrown so they still surface as 500s.
 */
export function economyErrorResponse(error: unknown): NextResponse {
  if (error instanceof EconomyError) {
    return NextResponse.json({ error: error.message, ...error.extra }, { status: error.status });
  }
  // Lock contention / transaction timeout under a request flood: fail closed.
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2028" || error.code === "P2034")
  ) {
    return NextResponse.json({ error: "Server busy. Try again." }, { status: 503 });
  }
  throw error;
}

/**
 * Convert banked XP into levels. XP is always granted with `{ increment }`;
 * this then consumes it with a compare-and-swap on `level`, so concurrent
 * XP grants are never lost and a level-up is never awarded twice.
 */
export async function settleLevelProgression(
  db: Db,
  userId: string
): Promise<{ level: number; xp: number } | null> {
  for (let attempt = 0; attempt < LEVEL_SETTLE_ATTEMPTS; attempt++) {
    const pilot = await db.pilotState.findUnique({
      where: { userId },
      select: { xp: true, level: true },
    });
    if (!pilot) return null;

    const progressed = applyLevelProgression(pilot.xp, pilot.level);
    if (progressed.level === pilot.level) return pilot;

    const consumed = pilot.xp - progressed.xp;
    const applied = await guardedPilotUpdate(
      db,
      userId,
      { level: pilot.level, xp: { gte: consumed } },
      {
        xp: { decrement: consumed },
        level: progressed.level,
        unspentPoints: { increment: progressed.pointsEarned },
      }
    );
    if (applied) return { level: applied.level, xp: applied.xp };
  }

  return db.pilotState.findUnique({ where: { userId }, select: { xp: true, level: true } });
}

export const INVENTORY_CAP = 20;

type NewInventoryItem = Omit<Prisma.InventoryItemUncheckedCreateInput, "pilotId">;

/**
 * Buy an item: debit first, then enforce the inventory cap, then create.
 * The guarded debit row-locks the pilot for the rest of the transaction, so
 * parallel purchases queue up and each one counts the items the previous one
 * created. A full inventory rolls the debit back.
 */
export async function purchaseInventoryItem(
  userId: string,
  price: number,
  item: NewInventoryItem,
  errors: { insufficientCredits: string; inventoryFull: string }
): Promise<PilotState> {
  return economyTx(async (tx) => {
    const pilot = await guardedPilotUpdate(
      tx,
      userId,
      { credits: { gte: price } },
      { credits: { decrement: price } }
    );
    if (!pilot) throw new EconomyError(errors.insufficientCredits);

    const owned = await tx.inventoryItem.count({ where: { pilotId: pilot.id } });
    if (owned >= INVENTORY_CAP) throw new EconomyError(errors.inventoryFull);

    await tx.inventoryItem.create({ data: { ...item, pilotId: pilot.id } });
    return pilot;
  });
}
