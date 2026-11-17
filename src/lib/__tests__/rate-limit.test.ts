import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const NOW = new Date("2026-01-01T12:00:00Z");

// The limiter keeps its store in module state, so each test loads a fresh copy.
async function loadRateLimit() {
  vi.resetModules();
  const { rateLimit } = await import("@/lib/rate-limit");
  return rateLimit;
}

beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows requests up to the maximum and counts down the remainder", async () => {
    const rateLimit = await loadRateLimit();

    expect(rateLimit("user", 3, 60_000)).toEqual({ limited: false, remaining: 2, retryAfterMs: 0 });
    expect(rateLimit("user", 3, 60_000)).toEqual({ limited: false, remaining: 1, retryAfterMs: 0 });
    expect(rateLimit("user", 3, 60_000)).toEqual({ limited: false, remaining: 0, retryAfterMs: 0 });
  });

  it("limits the request after the maximum and says when to retry", async () => {
    const rateLimit = await loadRateLimit();
    rateLimit("user", 2, 60_000);
    vi.advanceTimersByTime(10_000);
    rateLimit("user", 2, 60_000);

    const result = rateLimit("user", 2, 60_000);

    // The oldest request leaves the window 50s from now.
    expect(result).toEqual({ limited: true, remaining: 0, retryAfterMs: 50_000 });
  });

  it("does not count rejected requests against the window", async () => {
    const rateLimit = await loadRateLimit();
    rateLimit("user", 1, 60_000);
    rateLimit("user", 1, 60_000); // rejected
    rateLimit("user", 1, 60_000); // rejected

    vi.advanceTimersByTime(60_000);

    expect(rateLimit("user", 1, 60_000).limited).toBe(false);
  });

  it("allows requests again once the window has slid past the old ones", async () => {
    const rateLimit = await loadRateLimit();
    rateLimit("user", 1, 60_000);

    vi.advanceTimersByTime(59_999);
    expect(rateLimit("user", 1, 60_000).limited).toBe(true);

    vi.advanceTimersByTime(1);
    expect(rateLimit("user", 1, 60_000).limited).toBe(false);
  });

  it("tracks each key separately", async () => {
    const rateLimit = await loadRateLimit();
    rateLimit("alice", 1, 60_000);

    expect(rateLimit("bob", 1, 60_000).limited).toBe(false);
    expect(rateLimit("alice", 1, 60_000).limited).toBe(true);
  });

  it("known issue: a short-window caller's cleanup erases a long-window caller's history", async () => {
    const rateLimit = await loadRateLimit();
    // Registration allows 5 attempts per 15 minutes per IP.
    for (let i = 0; i < 5; i++) rateLimit("register:1.2.3.4", 5, 900_000);
    expect(rateLimit("register:1.2.3.4", 5, 900_000).limited).toBe(true);

    // Two minutes later any player hits a 60s-window endpoint. The periodic
    // cleanup uses that caller's 60s window as the cutoff for every key.
    vi.advanceTimersByTime(120_000);
    rateLimit("bank:someone-else", 30, 60_000);

    // The registration limit should hold for another 13 minutes, but is gone.
    expect(rateLimit("register:1.2.3.4", 5, 900_000)).toMatchObject({ limited: false, remaining: 4 });
  });
});
