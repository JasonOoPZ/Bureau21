import { afterEach, describe, expect, it, vi } from "vitest";

// game-state.ts imports the Prisma client at module load. The helpers under
// test are pure, so the client is replaced with an empty stub.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { xpForLevel } from "@/lib/constants";
import {
  COOLDOWN_SECONDS,
  applyEquipmentBonuses,
  applyLevelProgression,
  applyPassiveRegeneration,
  checkCooldown,
} from "@/lib/game-state";

const NOW = new Date("2026-01-01T12:00:00Z");
const secondsAgo = (seconds: number) => new Date(NOW.getTime() - seconds * 1000);

afterEach(() => {
  vi.useRealTimers();
});

describe("applyLevelProgression", () => {
  it("leaves the pilot alone below the threshold of level * 100 XP", () => {
    expect(applyLevelProgression(99, 1)).toEqual({ xp: 99, level: 1, pointsEarned: 0 });
  });

  it("levels up exactly at the threshold and carries no XP over", () => {
    expect(applyLevelProgression(100, 1)).toEqual({ xp: 0, level: 2, pointsEarned: 8 });
  });

  it("carries leftover XP into the next level", () => {
    expect(applyLevelProgression(250, 2)).toEqual({ xp: 50, level: 3, pointsEarned: 8 });
  });

  it("grants several levels and 8 points per level from one large XP gain", () => {
    // 100 + 200 + 300 = 600 XP clears levels 1 to 3, leaving 50.
    expect(applyLevelProgression(650, 1)).toEqual({ xp: 50, level: 4, pointsEarned: 24 });
  });

  it("levels up at exactly the XP requirement xpForLevel shows in the UI", () => {
    // The house and pilot pages show xpForLevel(5) as the XP needed at level 5.
    const displayedRequirement = xpForLevel(5);

    expect(displayedRequirement).toBe(500);
    expect(applyLevelProgression(displayedRequirement - 1, 5).level).toBe(5);
    expect(applyLevelProgression(displayedRequirement, 5)).toEqual({ xp: 0, level: 6, pointsEarned: 8 });
  });
});

describe("applyPassiveRegeneration", () => {
  const state = (overrides: Partial<Parameters<typeof applyPassiveRegeneration>[0]> = {}) => ({
    fuel: 0,
    hull: 0,
    lifeForce: 1,
    level: 1,
    lastFuelRegen: secondsAgo(0),
    ...overrides,
  });

  it("regenerates 1 fuel per 30s, 1 hull per 60s, and 1 life force per 120s", () => {
    vi.useFakeTimers({ now: NOW });

    const result = applyPassiveRegeneration(state({ lastFuelRegen: secondsAgo(240) }));

    expect(result).toMatchObject({ fuel: 8, hull: 4, lifeForce: 3 });
  });

  it("caps fuel at 10 and hull at 100", () => {
    vi.useFakeTimers({ now: NOW });

    const result = applyPassiveRegeneration(state({ fuel: 9, hull: 99, lastFuelRegen: secondsAgo(86_400) }));

    expect(result.fuel).toBe(10);
    expect(result.hull).toBe(100);
  });

  it("caps life force at max(15, level * 5)", () => {
    vi.useFakeTimers({ now: NOW });

    expect(applyPassiveRegeneration(state({ level: 1, lastFuelRegen: secondsAgo(86_400) })).lifeForce).toBe(15);
    expect(applyPassiveRegeneration(state({ level: 10, lastFuelRegen: secondsAgo(86_400) })).lifeForce).toBe(50);
  });

  it("leaves the regen timestamp untouched when no 30s boundary was crossed", () => {
    // 12:00:01 to 12:00:29 sits inside one 30s interval of the fixed clock.
    const lastFuelRegen = new Date(NOW.getTime() + 1_000);
    const now = new Date(NOW.getTime() + 29_000);

    const result = applyPassiveRegeneration(state({ lastFuelRegen }), now);

    expect(result).toMatchObject({ fuel: 0, hull: 0, lifeForce: 1 });
    expect(result.lastFuelRegen).toBe(lastFuelRegen);
  });

  it("counts interval boundaries on a fixed clock, not elapsed time", () => {
    vi.useFakeTimers({ now: NOW });

    // Only 29s elapsed, but 12:00:00 is a 30s, 60s and 120s boundary.
    const result = applyPassiveRegeneration(state({ lastFuelRegen: secondsAgo(29) }));

    expect(result).toMatchObject({ fuel: 1, hull: 1, lifeForce: 2 });
    expect(result.lastFuelRegen).toEqual(NOW);
  });

  it("counts each boundary exactly once however often regen runs", () => {
    const start = new Date(NOW.getTime() + 1_000);
    const end = new Date(NOW.getTime() + 601_000);
    let current = state({ lastFuelRegen: start });

    for (let ms = start.getTime() + 7_000; ms <= end.getTime(); ms += 7_000) {
      current = { ...current, ...applyPassiveRegeneration(current, new Date(ms)), fuel: 0 };
    }
    const once = applyPassiveRegeneration(state({ lastFuelRegen: start }), new Date(current.lastFuelRegen));

    expect(current.hull).toBe(once.hull);
    expect(current.lifeForce).toBe(once.lifeForce);
    expect(once.hull).toBeGreaterThanOrEqual(9);
  });

  it("uses the explicit now argument instead of the wall clock", () => {
    vi.useFakeTimers({ now: NOW });
    const later = new Date(NOW.getTime() + 240_000);

    const result = applyPassiveRegeneration(state({ lastFuelRegen: NOW }), later);

    expect(result).toMatchObject({ fuel: 8, hull: 4, lifeForce: 3 });
    expect(result.lastFuelRegen).toBe(later);
  });

  it("moves the regen timestamp to now once anything regenerated", () => {
    vi.useFakeTimers({ now: NOW });

    const result = applyPassiveRegeneration(state({ lastFuelRegen: secondsAgo(30) }));

    expect(result.lastFuelRegen).toEqual(NOW);
  });

  it("regenerates hull and life force for a pilot acting every 45s", () => {
    vi.useFakeTimers({ now: NOW });
    let current = state({ lastFuelRegen: NOW });

    // Ten minutes of play (585s), one action every 45 seconds. Each call grants
    // fuel and moves the shared timer; hull and LF progress must survive that.
    for (let i = 0; i < 13; i++) {
      vi.advanceTimersByTime(45_000);
      current = { ...current, ...applyPassiveRegeneration(current), fuel: 0 };
    }

    expect(current.hull).toBe(9); // floor(585 / 60) at 1 per 60s
    expect(current.lifeForce).toBe(5); // 1 + floor(585 / 120) at 1 per 120s
  });

  it("leaves life force above the level max alone (allocated HP is not clamped)", () => {
    vi.useFakeTimers({ now: NOW });

    const idle = applyPassiveRegeneration(state({ lifeForce: 40, level: 1 }));
    const afterADay = applyPassiveRegeneration(
      state({ lifeForce: 40, level: 1, lastFuelRegen: secondsAgo(86_400) })
    );

    expect(idle.lifeForce).toBe(40);
    expect(afterADay.lifeForce).toBe(40);
  });

  it("leaves fuel and hull above their caps alone", () => {
    vi.useFakeTimers({ now: NOW });

    const result = applyPassiveRegeneration(state({ fuel: 12, hull: 130, lastFuelRegen: secondsAgo(600) }));

    expect(result).toMatchObject({ fuel: 12, hull: 130 });
  });
});

describe("checkCooldown", () => {
  it("defaults to a 2 second cooldown", () => {
    expect(COOLDOWN_SECONDS).toBe(2);
  });

  it("is false while the cooldown is still running", () => {
    vi.useFakeTimers({ now: NOW });

    expect(checkCooldown(secondsAgo(1.9))).toBe(false);
  });

  it("is true once the cooldown has elapsed", () => {
    vi.useFakeTimers({ now: NOW });

    expect(checkCooldown(secondsAgo(2))).toBe(true);
  });

  it("honours a custom cooldown", () => {
    vi.useFakeTimers({ now: NOW });

    expect(checkCooldown(secondsAgo(30), 60)).toBe(false);
    expect(checkCooldown(secondsAgo(60), 60)).toBe(true);
  });
});

describe("applyEquipmentBonuses", () => {
  const base = { credits: 100, xp: 50, hullDamage: 10, fuelCost: 1 };
  const item = (bonusType: string, bonusAmt: number, equipped = true) => ({
    type: "weapon",
    bonusType,
    bonusAmt,
    equipped,
  });

  it("returns the base values with nothing equipped", () => {
    expect(applyEquipmentBonuses([item("credits", 50, false)], base)).toEqual(base);
  });

  it("applies credit and XP bonuses as percentages", () => {
    const result = applyEquipmentBonuses([item("credits", 10), item("xp", 20)], base);

    expect(result.credits).toBe(110);
    expect(result.xp).toBe(60);
  });

  it("compounds two bonuses of the same kind", () => {
    const result = applyEquipmentBonuses([item("credits", 10), item("credits", 10)], base);

    expect(result.credits).toBe(121);
  });

  it("subtracts hull bonuses from damage and never goes below zero", () => {
    expect(applyEquipmentBonuses([item("hull", 4)], base).hullDamage).toBe(6);
    expect(applyEquipmentBonuses([item("hull", 40)], base).hullDamage).toBe(0);
  });

  it("saves 1 fuel when the fuel bonus roll succeeds", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    expect(applyEquipmentBonuses([item("fuel", 25)], base).fuelCost).toBe(0);
  });

  it("keeps the fuel cost when the fuel bonus roll fails", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);

    expect(applyEquipmentBonuses([item("fuel", 25)], base).fuelCost).toBe(1);
  });

  it("does not mutate the base object", () => {
    const frozen = Object.freeze({ ...base });

    applyEquipmentBonuses([item("credits", 10)], frozen);

    expect(frozen.credits).toBe(100);
  });
});
