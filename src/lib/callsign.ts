import { z } from "zod";
import type { Db } from "@/lib/economy";

/**
 * Callsigns identify pilots to other players (transfers, quickposts, PVP
 * targeting), so they must be unique ignoring case.
 *
 * There is no database unique index yet (it needs a schema change, see the
 * PR notes). Until then uniqueness is enforced here: every write of a
 * callsign goes through `claimCallsign`, which serializes writers of the
 * same name with a transaction-scoped advisory lock and then checks both
 * PilotState.callsign and User.name.
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
  const lockKey = `callsign:${callsign.toLowerCase()}`;
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))::text AS locked`;
}

async function isCallsignTaken(tx: Db, callsign: string, exceptUserId?: string): Promise<boolean> {
  const notSelf = exceptUserId ? { not: exceptUserId } : undefined;
  const [pilot, user] = await Promise.all([
    tx.pilotState.findFirst({
      where: { callsign: { equals: callsign, mode: "insensitive" }, userId: notSelf },
      select: { id: true },
    }),
    tx.user.findFirst({
      where: { name: { equals: callsign, mode: "insensitive" }, id: notSelf },
      select: { id: true },
    }),
  ]);
  return Boolean(pilot || user);
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

export type PilotLookup =
  | { status: "found"; pilot: { id: string; userId: string; callsign: string } }
  | { status: "not_found" }
  | { status: "ambiguous" };

/**
 * Resolve a pilot by callsign for anything that moves value or messages.
 * Case-insensitive exact match; refuses to guess when legacy duplicates
 * exist (rows created before uniqueness was enforced).
 */
export async function findPilotByCallsign(db: Db, rawCallsign: string): Promise<PilotLookup> {
  const callsign = normalizeCallsign(rawCallsign);
  if (!callsign) return { status: "not_found" };

  const matches = await db.pilotState.findMany({
    where: { callsign: { equals: callsign, mode: "insensitive" } },
    select: { id: true, userId: true, callsign: true },
    take: 2,
  });

  if (matches.length === 0) return { status: "not_found" };
  if (matches.length > 1) return { status: "ambiguous" };
  return { status: "found", pilot: matches[0] };
}

export const AMBIGUOUS_CALLSIGN_MESSAGE =
  "More than one pilot uses that callsign, so it cannot be used as a recipient. Ask them to rename.";
