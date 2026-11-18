import type { Prisma } from "@prisma/client";
import { GAME_CONSTANTS } from "./constants";
import { isSameHktDay } from "./hkt";

/**
 * Pure rules for a pilot's regenerating stats (fuel, hull, Life Force,
 * motivation) and confidence. No database access: everything here is
 * deterministic given its arguments, so it can be unit-tested directly.
 */

export const FUEL_CAP = 10;
export const HULL_CAP = 100;
export const LIFE_FORCE_PER_LEVEL = 5;

const FUEL_REGEN_MS = 30_000;
const HULL_REGEN_MS = 60_000;
const LIFE_FORCE_REGEN_MS = 120_000;
const MOTIVATION_REGEN_MS = GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES * 60_000;

/** What a pilot's Life Force maximum is computed from. */
export interface LifeForceSource {
  level: number;
  /** `PilotState.bonusLifeForce`: Life Force bought with allocation points. */
  bonusLifeForce?: number;
}

/**
 * The single source of truth for a pilot's Life Force maximum: the level-based
 * amount plus the Life Force bought with allocation points
 * (`PilotState.bonusLifeForce`). Regen, herbs and level-up refills all fill up
 * to this value, so allocated HP comes back after it is lost in a fight.
 *
 * Still nothing clamps `lifeForce` down to it: filling only ever goes up.
 */
export function maxLifeForce(pilot: LifeForceSource): number {
  const natural = Math.max(GAME_CONSTANTS.STARTING_LIFE_FORCE, pilot.level * LIFE_FORCE_PER_LEVEL);
  return natural + Math.max(0, pilot.bonusLifeForce ?? 0);
}

/** Max to show next to a pilot's Life Force (never below what they hold). */
export function displayMaxLifeForce(pilot: LifeForceSource & { lifeForce: number }): number {
  return Math.max(maxLifeForce(pilot), pilot.lifeForce);
}

/** Life Force a pilot needs to start, or be the target of, a PvP battle. */
export function pvpMinLifeForce(pilot: LifeForceSource): number {
  return Math.max(
    GAME_CONSTANTS.PVP_MIN_LIFE_FORCE,
    Math.ceil(maxLifeForce(pilot) * GAME_CONSTANTS.PVP_MIN_LIFE_FORCE_RATIO)
  );
}

/** Fill toward `cap` without ever lowering a value that is already above it. */
function fillToward(current: number, gain: number, cap: number): number {
  if (current >= cap) return current;
  return Math.min(cap, current + gain);
}

/** How many multiples of `intervalMs` lie in the half-open range (from, to]. */
function intervalsCrossed(fromMs: number, toMs: number, intervalMs: number): number {
  return Math.max(0, Math.floor(toMs / intervalMs) - Math.floor(fromMs / intervalMs));
}

export interface VitalsState {
  fuel: number;
  hull: number;
  lifeForce: number;
  level: number;
  bonusLifeForce?: number;
  lastFuelRegen: Date;
}

/**
 * Passive regeneration: 1 fuel / 30s, 1 hull / 60s, 1 Life Force / 120s.
 *
 * All three stats share the one `lastFuelRegen` timestamp, so a gain cannot be
 * "elapsed / interval" (resetting the stamp for the fastest stat would throw
 * away the slower stats' partial progress). Instead each stat gains one point
 * per interval boundary on a fixed clock that falls between the stamp and now.
 * Every boundary is counted exactly once however often regen runs, so the
 * stamp can always advance to `now` without losing or double-counting time.
 */
export function applyPassiveRegeneration(state: VitalsState, now: Date = new Date()) {
  const from = state.lastFuelRegen.getTime();
  const to = now.getTime();

  const fuelGain = intervalsCrossed(from, to, FUEL_REGEN_MS);
  const hullGain = intervalsCrossed(from, to, HULL_REGEN_MS);
  const lifeForceGain = intervalsCrossed(from, to, LIFE_FORCE_REGEN_MS);

  // Fuel has the shortest interval and the others are multiples of it, so no
  // fuel boundary means no boundary at all: leave the stamp untouched.
  const ticked = fuelGain > 0;

  return {
    fuel: fillToward(state.fuel, fuelGain, FUEL_CAP),
    hull: fillToward(state.hull, hullGain, HULL_CAP),
    lifeForce: fillToward(state.lifeForce, lifeForceGain, maxLifeForce(state)),
    lastFuelRegen: ticked ? now : state.lastFuelRegen,
  };
}

export interface MotivationState {
  motivation: number;
  lastMotivationAt: Date;
}

/**
 * Motivation regen: +1 per 15 minutes up to the cap. The timestamp advances
 * only by the whole intervals that were converted into motivation, so the
 * partial interval in progress survives any number of actions.
 */
export function regenMotivation(
  state: MotivationState,
  now: Date = new Date(),
  cap: number = GAME_CONSTANTS.MOTIVATION_CAP_FREE
): MotivationState {
  const last = state.lastMotivationAt.getTime();
  const intervals = Math.floor((now.getTime() - last) / MOTIVATION_REGEN_MS);
  if (intervals <= 0) {
    return { motivation: state.motivation, lastMotivationAt: state.lastMotivationAt };
  }

  const motivation = fillToward(state.motivation, intervals, cap);
  // At the cap nothing is accruing, so there is no partial interval to keep.
  const lastMotivationAt =
    motivation >= cap ? now : new Date(last + intervals * MOTIVATION_REGEN_MS);
  return { motivation, lastMotivationAt };
}

/**
 * Plan a motivation spend as a compare-and-swap on the snapshot it was
 * computed from. Merge `guard` into the WHERE and `data` into the SET of one
 * guarded update: of N parallel requests built from the same snapshot only one
 * applies; the others match no row and must be rejected.
 */
export function planMotivationSpend(pilot: MotivationState, cost: number, now: Date = new Date()) {
  const regen = regenMotivation(pilot, now);
  return {
    available: regen.motivation,
    remaining: regen.motivation - cost,
    guard: {
      motivation: pilot.motivation,
      lastMotivationAt: pilot.lastMotivationAt,
    } satisfies Prisma.PilotStateWhereInput,
    data: {
      motivation: regen.motivation - cost,
      lastMotivationAt: regen.lastMotivationAt,
    } satisfies Prisma.PilotStateUpdateManyMutationInput,
  };
}

/* ── Confidence ─────────────────────────────────────────────────────────────
   There is no column for confidence bought with allocation points, so the
   single `confidence` float encodes both parts:
     whole part      = permanent confidence (the floor of 5 + allocated points)
     fractional part = today's battle momentum (+0.05 / win, -0.0125 / loss)
   The midnight-HKT reset drops only the fraction. Momentum is capped below 1
   so battles can never mint a permanent point, and a loss can never dip into
   the whole part.
   A separate `confidenceMomentum` column was considered and not added: this
   encoding already keeps allocated points across the reset, and the only
   thing a column would buy is daily momentum above +0.95, which is a balance
   change, not a correctness fix.
   ───────────────────────────────────────────────────────────────────────── */

export const CONFIDENCE_MOMENTUM_CAP = 0.95;

export function resolveDailyConfidence(
  confidence: number,
  lastResetAt: Date,
  now: Date = new Date()
): { confidence: number; didReset: boolean } {
  if (isSameHktDay(lastResetAt, now)) return { confidence, didReset: false };
  return {
    confidence: Math.max(GAME_CONSTANTS.CONFIDENCE_FLOOR, Math.floor(confidence)),
    didReset: true,
  };
}

/** Confidence after one battle result. `cap` is the pilot's confidence cap. */
export function applyBattleConfidence(confidence: number, won: boolean, cap: number): number {
  const permanent = Math.max(GAME_CONSTANTS.CONFIDENCE_FLOOR, Math.floor(confidence));
  if (won) {
    const ceiling = Math.min(cap, permanent + CONFIDENCE_MOMENTUM_CAP);
    return fillToward(confidence, GAME_CONSTANTS.CONFIDENCE_WIN_GAIN, ceiling);
  }
  return Math.max(permanent, confidence - GAME_CONSTANTS.CONFIDENCE_LOSS_PENALTY);
}
