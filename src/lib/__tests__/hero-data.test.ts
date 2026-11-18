import { describe, expect, it } from "vitest";
import {
  HERO_MAX_LEVEL,
  HERO_TEMPLATES,
  RARITY_WEIGHTS,
  applyHeroXpProgression,
  computeHeroBonuses,
  heroEffectiveBonus,
  heroXpForLevel,
  type HeroBonusType,
  type HeroTemplate,
} from "@/lib/hero-data";

function templateWith(bonusType: HeroBonusType): HeroTemplate {
  const template = HERO_TEMPLATES.find((t) => t.bonusType === bonusType);
  if (!template) throw new Error(`no hero template grants ${bonusType}`);
  return template;
}

describe("hero templates", () => {
  it("have unique slugs", () => {
    const slugs = HERO_TEMPLATES.map((t) => t.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("have rarity weights that add up to 100%", () => {
    const total = Object.values(RARITY_WEIGHTS).reduce((sum, weight) => sum + weight, 0);

    expect(total).toBe(100);
  });
});

describe("heroXpForLevel and applyHeroXpProgression", () => {
  it("needs level * 100 XP per level", () => {
    expect(heroXpForLevel(4)).toBe(400);
  });

  it("stays put below the threshold", () => {
    expect(applyHeroXpProgression(99, 1)).toEqual({ xp: 99, level: 1 });
  });

  it("levels up several times and carries the remainder", () => {
    // 100 + 200 clears levels 1 and 2, leaving 25.
    expect(applyHeroXpProgression(325, 1)).toEqual({ xp: 25, level: 3 });
  });

  it("stops at the max level and clamps leftover XP below the next threshold", () => {
    const result = applyHeroXpProgression(1_000_000, HERO_MAX_LEVEL - 1);

    expect(result).toEqual({ xp: heroXpForLevel(HERO_MAX_LEVEL) - 1, level: HERO_MAX_LEVEL });
  });
});

describe("heroEffectiveBonus", () => {
  it("is the base bonus at level 1 and grows linearly per level", () => {
    const template = HERO_TEMPLATES[0];

    expect(heroEffectiveBonus(template, 1)).toBe(template.bonusBase);
    expect(heroEffectiveBonus(template, 5)).toBeCloseTo(template.bonusBase + 4 * template.bonusPerLevel);
  });
});

describe("computeHeroBonuses", () => {
  it("is all zeros with no active heroes", () => {
    expect(computeHeroBonuses([])).toEqual({
      atkPct: 0,
      defPct: 0,
      speedFlat: 0,
      maxLfPct: 0,
      confidenceFlat: 0,
      xpPct: 0,
    });
  });

  it("routes each hero's bonus to the matching stat", () => {
    const atkHero = templateWith("atk_pct");
    const xpHero = templateWith("xp_pct");

    const bonuses = computeHeroBonuses([
      { heroSlug: atkHero.slug, level: 1 },
      { heroSlug: xpHero.slug, level: 3 },
    ]);

    expect(bonuses.atkPct).toBeCloseTo(heroEffectiveBonus(atkHero, 1));
    expect(bonuses.xpPct).toBeCloseTo(heroEffectiveBonus(xpHero, 3));
    expect(bonuses.defPct).toBe(0);
  });

  it("stacks two heroes that grant the same stat", () => {
    const atkHero = templateWith("atk_pct");

    const bonuses = computeHeroBonuses([
      { heroSlug: atkHero.slug, level: 1 },
      { heroSlug: atkHero.slug, level: 2 },
    ]);

    expect(bonuses.atkPct).toBeCloseTo(heroEffectiveBonus(atkHero, 1) + heroEffectiveBonus(atkHero, 2));
  });

  it("ignores heroes whose slug no longer exists", () => {
    expect(computeHeroBonuses([{ heroSlug: "retired-hero", level: 20 }]).atkPct).toBe(0);
  });
});
