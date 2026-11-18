import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Two limiters live here.
 *
 * 1. `rateLimit` - in-memory sliding window. Per serverless instance, so on
 *    Vercel an attacker spread over N warm instances gets N times the budget
 *    and a cold start forgets everything. Fine for cheap per-user gameplay
 *    throttles, NOT for brute-force protection.
 *
 * 2. `durableRateLimit` - Postgres-backed, shared by every instance. Used
 *    for login, registration, password reset, quickposts and board posts and
 *    votes. One `RateLimitHit` row per hit, keyed by a SHA-256 hash and
 *    expiring with its window.
 */

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface RateLimitEntry {
  timestamps: number[];
  /** The window this key was last checked with. Expiry is per key. */
  windowMs: number;
}

const store = new Map<string, RateLimitEntry>();

// Sweep stale entries at most once per minute.
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

/**
 * Each key is expired against ITS OWN window. (The sweep used to apply the
 * current caller's window to every key, so a 60s bank call wiped the 15 min
 * registration history and that limit reset after about a minute.)
 */
function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    const cutoff = now - entry.windowMs;
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

/**
 * In-memory limiter. Check-and-record in one call.
 * @param key - Unique identifier (e.g. `bank:<userId>`)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [], windowMs };
    store.set(key, entry);
  }

  entry.windowMs = windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return {
      limited: true,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs),
    };
  }

  entry.timestamps.push(now);
  return {
    limited: false,
    remaining: maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

// ── Durable (Postgres) limiter ──────────────────────────────────────────────

/** Roughly one call in 25 also deletes expired limiter rows. */
const DURABLE_SWEEP_CHANCE = 0.04;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Keys contain emails and IPs; only their hash is stored. */
function durableKey(key: string): string {
  return sha256(key);
}

function sweepExpired(): void {
  if (Math.random() >= DURABLE_SWEEP_CHANCE) return;
  prisma.rateLimitHit
    .deleteMany({ where: { expires: { lt: new Date() } } })
    .catch((error) => console.error("[rate-limit] sweep failed", error));
}

/** Count live hits for a key without recording one. */
export async function isRateLimited(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
  const now = new Date();
  const live = { key: durableKey(key), expires: { gt: now } };

  const count = await prisma.rateLimitHit.count({ where: live });
  if (count < maxRequests) {
    return { limited: false, remaining: maxRequests - count, retryAfterMs: 0 };
  }

  const oldest = await prisma.rateLimitHit.findFirst({
    where: live,
    orderBy: { expires: "asc" },
    select: { expires: true },
  });
  const retryAfterMs = oldest ? Math.max(0, oldest.expires.getTime() - now.getTime()) : windowMs;
  return { limited: true, remaining: 0, retryAfterMs };
}

/** Record one hit for a key. It stops counting after `windowMs`. */
export async function recordRateLimitHit(key: string, windowMs: number): Promise<void> {
  await prisma.rateLimitHit.create({
    data: { key: durableKey(key), expires: new Date(Date.now() + windowMs) },
  });
  sweepExpired();
}

/**
 * Shared sliding-window limiter: check, then record when allowed.
 *
 * Check and record are two statements, so K truly simultaneous requests can
 * overshoot the limit by up to K-1. That is acceptable for throttling; where
 * exactly-once matters use a unique constraint (as board votes do).
 *
 * If the database is unreachable it degrades to the in-memory limiter rather
 * than failing open.
 */
export async function durableRateLimit(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
  try {
    const state = await isRateLimited(key, maxRequests, windowMs);
    if (state.limited) return state;
    await recordRateLimitHit(key, windowMs);
    return { limited: false, remaining: state.remaining - 1, retryAfterMs: 0 };
  } catch (error) {
    console.error("[rate-limit] durable limiter failed, using in-memory fallback", error);
    return rateLimit(key, maxRequests, windowMs);
  }
}


type HeaderSource = Headers | Record<string, string | string[] | undefined> | undefined | null;

function readHeader(headers: HeaderSource, name: string): string | undefined {
  if (!headers) return undefined;
  if (typeof (headers as Headers).get === "function") return (headers as Headers).get(name) ?? undefined;
  const value = (headers as Record<string, string | string[] | undefined>)[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Client IP for rate-limit keys. On Vercel `x-forwarded-for` is overwritten
 * by the platform, so its first entry is trustworthy there. Behind any other
 * proxy make sure the header is set by the proxy, not passed through.
 */
export function clientIp(headers: HeaderSource): string {
  const forwarded = readHeader(headers, "x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || readHeader(headers, "x-real-ip")?.trim() || "unknown";
}

export function tooManyRequests(message: string, retryAfterMs: number): Response {
  return Response.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))) } }
  );
}
