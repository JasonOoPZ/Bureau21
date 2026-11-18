/**
 * Void Runner (crash) -- pure game math shared by the API route and the client.
 *
 * The multiplier grows with wall-clock time. Every run has a crash point that
 * is drawn on the server when the bet is placed and stays hidden until the run
 * is settled. A cash-out only pays if the multiplier has not passed it.
 */

export const CRASH_GROWTH_PER_SECOND = 0.12;
export const CRASH_MAX_MULTIPLIER = 100;
export const CRASH_HOUSE_EDGE = 0.03;
export const CRASH_MIN_BET = 10;
export const CRASH_MAX_BET = 1_000_000;
/** A run can never be cashed out earlier than this, so 1.00x is always a loss. */
export const CRASH_MIN_ELAPSED_MS = 500;
/** Runs nobody settled are closed out as a loss after this long. */
export const CRASH_SESSION_TTL_MS = 10 * 60 * 1000;
/** `credits` is a Postgres Int column. */
export const INT32_MAX = 2_147_483_647;

const UINT32_RANGE = 0x1_0000_0000;

/** Multiplier after `elapsedMs`, floored to 2 decimals and hard-capped. */
export function crashMultiplierAt(elapsedMs: number): number {
  const safeElapsed = Number.isFinite(elapsedMs) ? elapsedMs : 0;
  const seconds = Math.max(safeElapsed, CRASH_MIN_ELAPSED_MS) / 1000;
  const raw = Math.floor(Math.exp(seconds * CRASH_GROWTH_PER_SECOND) * 100) / 100;
  return Math.min(CRASH_MAX_MULTIPLIER, Math.max(1, raw));
}

/**
 * Crash point for a uniform `r` in [0, 1): max(1, floor(100 * 0.97 / (1 - r)) / 100).
 * P(crashPoint >= m) is about 0.97 / m, so cashing out at any target has an
 * expected return of about 97%.
 */
export function crashPointFromUniform(r: number): number {
  const clamped = Math.min(Math.max(r, 0), 1 - 1 / UINT32_RANGE);
  const point = Math.floor((100 * (1 - CRASH_HOUSE_EDGE)) / (1 - clamped)) / 100;
  return Math.max(1, point);
}

/** Draws a crash point from the platform CSPRNG (never Math.random). */
export function drawCrashPoint(): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return crashPointFromUniform(buf[0] / UINT32_RANGE);
}

export type CrashOutcome =
  | { won: true; multiplier: number; payout: number }
  | { won: false; multiplier: number; payout: 0 };

/**
 * Outcome of trying to cash out `bet` after `elapsedMs` against `crashPoint`.
 * The payout is bounded by bet * CRASH_MAX_MULTIPLIER and by INT32_MAX.
 */
export function resolveCashOut(bet: number, elapsedMs: number, crashPoint: number): CrashOutcome {
  const multiplier = crashMultiplierAt(elapsedMs);
  const validBet = Number.isInteger(bet) && bet >= CRASH_MIN_BET && bet <= CRASH_MAX_BET;
  if (!validBet || !(crashPoint >= 1) || multiplier > crashPoint) {
    return { won: false, multiplier, payout: 0 };
  }
  const payout = Math.min(Math.floor(bet * multiplier), bet * CRASH_MAX_MULTIPLIER, INT32_MAX);
  return { won: true, multiplier, payout };
}
