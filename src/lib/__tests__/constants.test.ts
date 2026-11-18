import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GAME_CONSTANTS,
  calculateATK,
  calculateDEF,
  calculateMotivationRegen,
  computeGymEnergy,
  getCombatBonuses,
  getConfidenceCap,
  getCurrentSeason,
  hpPerPoint,
  isNewbieProtected,
  lfFromAP,
  xpForLevel,
} from "@/lib/constants";

afterEach(() => {
  vi.useRealTimers();
});

describe("xpForLevel", () => {
  it("needs 100 XP at level 1", () => {
    expect(xpForLevel(1)).toBe(100);
  });

  it("needs level * 100 XP, the same threshold level progression uses", () => {
    expect(xpForLevel(3)).toBe(300);
    expect(xpForLevel(10)).toBe(1000);
  });

  it("treats a level below 1 as level 1", () => {
    expect(xpForLevel(0)).toBe(100);
  });

  it("never decreases as level rises", () => {
    for (let level = 1; level < 60; level++) {
      expect(xpForLevel(level + 1)).toBeGreaterThanOrEqual(xpForLevel(level));
    }
  });
});

describe("getConfidenceCap", () => {
  it("is 50 for ordinary characters", () => {
    expect(getConfidenceCap("base-red")).toBe(50);
  });

  it("is 100 for the boosted character", () => {
    expect(getConfidenceCap(GAME_CONSTANTS.CONFIDENCE_BOOSTED_SLUG)).toBe(100);
  });

  it("falls back to 50 when the slug is missing", () => {
    expect(getConfidenceCap(undefined)).toBe(50);
    expect(getConfidenceCap(null)).toBe(50);
  });
});

describe("calculateATK and calculateDEF", () => {
  it("splits strength by the ATK/DEF percentage and adds gear", () => {
    expect(calculateATK(20, 70, 3)).toBe(17);
    expect(calculateDEF(20, 70, 2)).toBe(8);
  });

  it("rounds each half down, so an odd strength loses a point overall", () => {
    expect(calculateATK(3, 50, 0)).toBe(1);
    expect(calculateDEF(3, 50, 0)).toBe(1);
  });

  it("puts everything into ATK at a 100 split", () => {
    expect(calculateATK(20, 100, 0)).toBe(20);
    expect(calculateDEF(20, 100, 0)).toBe(0);
  });
});

describe("getCombatBonuses", () => {
  const item = (type: string, bonusType: string, bonusAmt: number, equipped = true) => ({
    type,
    bonusType,
    bonusAmt,
    equipped,
  });

  it("returns zero for an empty inventory", () => {
    expect(getCombatBonuses([])).toEqual({ weaponBonus: 0, armorBonus: 0 });
  });

  it("sums atk and def bonuses from equipped items", () => {
    const bonuses = getCombatBonuses([
      item("weapon", "atk", 4),
      item("weapon", "atk", 6),
      item("armor", "def", 3),
    ]);

    expect(bonuses).toEqual({ weaponBonus: 10, armorBonus: 3 });
  });

  it("ignores unequipped items", () => {
    expect(getCombatBonuses([item("weapon", "atk", 50, false)])).toEqual({ weaponBonus: 0, armorBonus: 0 });
  });

  it("converts a legacy credits weapon at one tenth of its bonus", () => {
    expect(getCombatBonuses([item("weapon", "credits", 25)]).weaponBonus).toBe(2);
  });

  it("converts a legacy shield at half of its bonus", () => {
    expect(getCombatBonuses([item("shield", "hull", 5)]).armorBonus).toBe(2);
  });

  it("gives no combat bonus for engines", () => {
    expect(getCombatBonuses([item("engine", "fuel", 30)])).toEqual({ weaponBonus: 0, armorBonus: 0 });
  });
});

describe("small stat helpers", () => {
  it("hpPerPoint is a flat 1 at every level", () => {
    expect(hpPerPoint(1)).toBe(1);
    expect(hpPerPoint(80)).toBe(1);
  });

  it("lfFromAP is twice the level", () => {
    expect(lfFromAP(7)).toBe(14);
  });
});

describe("isNewbieProtected", () => {
  it("protects a young, low-level account", () => {
    expect(isNewbieProtected(14, 4)).toBe(true);
  });

  it("ends protection at 15 days", () => {
    expect(isNewbieProtected(15, 1)).toBe(false);
  });

  it("ends protection at level 5", () => {
    expect(isNewbieProtected(1, 5)).toBe(false);
  });
});

describe("computeGymEnergy", () => {
  it("is the 25 foundation for a brand new pilot with no endurance", () => {
    expect(computeGymEnergy(0, 0)).toEqual({ foundation: 25, enduranceBonus: 0, streakBonus: 0, max: 25 });
  });

  it("adds 10 per endurance point, rounded down", () => {
    expect(computeGymEnergy(0.25, 0).enduranceBonus).toBe(2);
  });

  it("caps the streak bonus at 25", () => {
    const energy = computeGymEnergy(1, 40);

    expect(energy.streakBonus).toBe(25);
    expect(energy.max).toBe(60);
  });
});

describe("calculateMotivationRegen", () => {
  const NOW = new Date("2026-01-01T12:00:00Z");
  const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

  it("adds 1 motivation per full 15 minutes elapsed", () => {
    vi.useFakeTimers({ now: NOW });

    expect(calculateMotivationRegen(minutesAgo(44), 10, 500)).toBe(12);
  });

  it("adds nothing before the first 15 minutes are up", () => {
    vi.useFakeTimers({ now: NOW });

    expect(calculateMotivationRegen(minutesAgo(14), 10, 500)).toBe(10);
  });

  it("never exceeds the cap", () => {
    vi.useFakeTimers({ now: NOW });

    expect(calculateMotivationRegen(minutesAgo(60 * 24 * 30), 490, 500)).toBe(500);
  });
});

describe("getCurrentSeason", () => {
  it("formats the current month as YYYY-MM with a zero-padded month", () => {
    vi.useFakeTimers({ now: new Date(2026, 2, 15, 12) });

    expect(getCurrentSeason()).toBe("2026-03");
  });
});
