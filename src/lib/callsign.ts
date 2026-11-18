import { Prisma } from "@prisma/client";
import { z } from "zod";
import type { Db } from "@/lib/economy";

/**
 * Callsigns identify pilots to other players (transfers, quickposts, PVP
 * targeting), so they must be unique ignoring case.
 *
 * The database guarantees it: `PilotState.callsignLower` holds the
 * normalised name (`callsignKey`) under a unique index, and a trigger keeps
 * it in step with `callsign` on every write. Every write of a callsign still
 * goes through `claimCallsign` first, which serializes writers of the same
 * name with a transaction-scoped advisory lock and also checks `User.name`
 * (accounts that have no pilot yet reserve their name too), so a clash is
 * reported as CallsignTakenError instead of a unique-index failure.
 */

export const CALLSIGN_MIN = 2;
export const CALLSIGN_MAX = 24;
export const CALLSIGN_PATTERN = /^[a-zA-Z0-9 _-]+$/;

const FALLBACK_CALLSIGN = "Pilot";
const SUFFIX_ATTEMPTS = 6;

/** Trim and collapse inner whitespace so "Nova  21" and "Nova 21" are one name. */
export function normalizeCallsign(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** The unique key for a callsign: normalised and lower-cased. */
export function callsignKey(raw: string): string {
  return normalizeCallsign(raw).toLowerCase();
}

/**
 * The columns to write whenever a callsign is stored. Always spread this
 * instead of writing `callsign` alone, so the unique key can never go stale.
 */
export function callsignFields(callsign: string): { callsign: string; callsignLower: string } {
  return { callsign, callsignLower: callsignKey(callsign) };
}

/** True when a write lost a race for a callsign at the unique index. */
export function isCallsignConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = error.meta?.target;
  return Array.isArray(target) ? target.includes("callsignLower") : String(target ?? "").includes("callsignLower");
}

export const callsignSchema = z
  .string()
  .transform(normalizeCallsign)
  .pipe(
    z
      .string()
      .min(CALLSIGN_MIN, `Callsign must be at least ${CALLSIGN_MIN} characters.`)
      .max(CALLSIGN_MAX, `Callsign must be at most ${CALLSIGN_MAX} characters.`)
      .regex(CALLSIGN_PATTERN, "Callsign may only contain letters, numbers, spaces, hyphens, and underscores.")
  );

export class CallsignTakenError extends Error {
  constructor() {
    super("That callsign is already taken.");
    this.name = "CallsignTakenError";
  }
}

async function lockCallsign(tx: Db, callsign: string): Promise<void> {
  const lockKey = `callsign:${callsignKey(callsign)}`;
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))::text AS locked`;
}

async function isCallsignTaken(tx: Db, callsign: string, exceptUserId?: string): Promise<boolean> {
  // Sequential, not Promise.all: `tx` is one connection.
  const pilot = await tx.pilotState.findUnique({
    where: { callsignLower: callsignKey(callsign) },
    select: { userId: true },
  });
  if (pilot && pilot.userId !== exceptUserId) return true;

  // Accounts without a pilot yet hold their name too.
  const user = await tx.user.findFirst({
    where: {
      name: { equals: callsign, mode: "insensitive" },
      id: exceptUserId ? { not: exceptUserId } : undefined,
    },
    select: { id: true },
  });
  return Boolean(user);
}

/**
 * Reserve `callsign` for the rest of the transaction. MUST be called inside
 * an interactive transaction, before the row that stores the callsign is
 * written. Throws CallsignTakenError if another account holds it.
 */
export async function claimCallsign(tx: Db, callsign: string, exceptUserId?: string): Promise<void> {
  await lockCallsign(tx, callsign);
  if (await isCallsignTaken(tx, callsign, exceptUserId)) throw new CallsignTakenError();
}

/** Strip a free-form display name (e.g. from Google) down to a legal callsign. */
function sanitizeCallsign(raw: string | null | undefined): string {
  const cleaned = normalizeCallsign((raw ?? "").replace(/[^a-zA-Z0-9 _-]/g, "")).slice(0, CALLSIGN_MAX).trim();
  return cleaned.length >= CALLSIGN_MIN ? cleaned : FALLBACK_CALLSIGN;
}

/**
 * Derive a legal, unused callsign from a display name and reserve it for the
 * transaction. Adds a numeric suffix when the plain name is taken.
 */
export async function claimAvailableCallsign(
  tx: Db,
  displayName: string | null | undefined,
  exceptUserId?: string
): Promise<string> {
  const base = sanitizeCallsign(displayName);

  for (let attempt = 0; attempt < SUFFIX_ATTEMPTS; attempt++) {
    const suffix = attempt === 0 ? "" : `-${Math.floor(1000 + Math.random() * 9000)}`;
    const candidate = `${base.slice(0, CALLSIGN_MAX - suffix.length).trim()}${suffix}`;
    await lockCallsign(tx, candidate);
    if (!(await isCallsignTaken(tx, candidate, exceptUserId))) return candidate;
  }

  throw new CallsignTakenError();
}

export interface PilotRef {
  id: string;
  userId: string;
  callsign: string;
}

/**
 * Resolve a pilot by callsign (transfers, quickposts, attacks, watchlist,
 * intel). One indexed lookup on the unique key: it ignores case and can never
 * match two pilots.
 */
export async function findPilotByCallsign(db: Db, rawCallsign: string): Promise<PilotRef | null> {
  const key = callsignKey(rawCallsign);
  if (!key) return null;

  return db.pilotState.findUnique({
    where: { callsignLower: key },
    select: { id: true, userId: true, callsign: true },
  });
}

/** Two accounts without a pilot can still share a display name. */
export const AMBIGUOUS_CALLSIGN_MESSAGE =
  "More than one account uses that name, so it cannot be used as a recipient. Ask them to rename.";
