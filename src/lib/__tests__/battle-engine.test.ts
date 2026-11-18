import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePvpBattle, simulateWinChance, type PvpPilotInput } from "@/lib/battle-engine";
import type { HeroBonuses } from "@/lib/hero-data";

/**
 * rollDamage() draws Math.random() twice per strike:
 *   1. variance = floor(r * 5) - 2   -> 0.5 gives 0, 0 gives -2
 *   2. crit     = r < 0.07 + bonus   -> 0.5 never crits, 0 always crits
 */
const NO_VARIANCE_NO_CRIT = 0.5;
const LOW_ROLL_ALWAYS_CRIT = 0;

function pilot(overrides: Partial<PvpPilotInput> = {}): PvpPilotInput {
  return {
    callsign: "Pilot",
    level: 1,
    lifeForce: 15,
    strength: 20, // 50/50 split -> ATK 10, DEF 10
    speed: 5,
    confidence: 5,
    atkSplit: 50,
    inventory: [],
    ...overrides,
  };
}

/** ATK 40, DEF 0: one-shots a level 1 pilot (15 LF) through DEF 10. */
function glassCannon(overrides: Partial<PvpPilotInput> = {}): PvpPilotInput {
  return pilot({ callsign: "Cannon", strength: 40, atkSplit: 100, ...overrides });
}

function heroBonuses(overrides: Partial<HeroBonuses> = {}): HeroBonuses {
  return { atkPct: 0, defPct: 0, speedFlat: 0, maxLfPct: 0, confidenceFlat: 0, xpPct: 0, ...overrides };
}

function fixRandom(value: number) {
  vi.spyOn(Math, "random").mockReturnValue(value);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolvePvpBattle damage", () => {
  it("deals ATK minus DEF when there is no variance or crit", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon(), pilot({ callsign: "Target" }));

    expect(outcome.rounds[0]).toMatchObject({
      round: 1,
      attacker: "Cannon",
      defender: "Target",
      damage: 30,
      crit: false,
      defenderLfAfter: 0,
    });
  });

  it("deals at least 1 damage when DEF exceeds ATK", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);
    const attacker = pilot({ callsign: "Weak", strength: 2 }); // ATK 1
    const defender = pilot({ callsign: "Wall", strength: 200 }); // DEF 100

    const outcome = resolvePvpBattle(attacker, defender);

    expect(outcome.rounds[0].damage).toBe(1);
    expect(outcome.rounds[0].defenderLfAfter).toBe(14);
  });

  it("doubles damage on a crit, after variance is applied", () => {
    fixRandom(LOW_ROLL_ALWAYS_CRIT);

    const outcome = resolvePvpBattle(glassCannon(), pilot());

    // (40 ATK - 10 DEF - 2 variance) * 2
    expect(outcome.rounds[0]).toMatchObject({ damage: 56, crit: true });
  });

  it("adds equipped weapon and armor bonuses, and ignores unequipped items", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);
    const attacker = pilot({
      callsign: "Armed",
      inventory: [
        { type: "weapon", bonusType: "atk", bonusAmt: 5, equipped: true },
        { type: "weapon", bonusType: "atk", bonusAmt: 100, equipped: false },
      ],
    });
    const defender = pilot({
      callsign: "Plated",
      inventory: [{ type: "armor", bonusType: "def", bonusAmt: 2, equipped: true }],
    });

    const outcome = resolvePvpBattle(attacker, defender);

    // ATK 10 + 5 against DEF 10 + 2
    expect(outcome.rounds[0].damage).toBe(3);
  });

  it("applies hero ATK and DEF percentage bonuses", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(
      pilot({ callsign: "Buffed" }),
      pilot({ callsign: "Guarded" }),
      heroBonuses({ atkPct: 100 }), // ATK 10 -> 20
      heroBonuses({ defPct: 50 }) // DEF 10 -> 15
    );

    expect(outcome.rounds[0].damage).toBe(5);
  });
});

describe("resolvePvpBattle turn order", () => {
  it("lets the attacker strike first when speeds are equal", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(pilot({ callsign: "A" }), pilot({ callsign: "D" }));

    expect(outcome.rounds[0].attacker).toBe("A");
    expect(outcome.rounds[1].attacker).toBe("D");
  });

  it("lets the defender strike first when the defender is faster", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(pilot({ callsign: "A" }), pilot({ callsign: "D", speed: 6 }));

    expect(outcome.rounds[0].attacker).toBe("D");
  });

  it("counts hero flat speed toward turn order", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(
      pilot({ callsign: "A" }),
      pilot({ callsign: "D" }),
      undefined,
      heroBonuses({ speedFlat: 1 })
    );

    expect(outcome.rounds[0].attacker).toBe("D");
  });

  it("ends the fight before the loser can strike back", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon(), glassCannon({ callsign: "Slow", speed: 1 }));

    expect(outcome.totalRounds).toBe(1);
    expect(outcome.winner).toBe("attacker");
    expect(outcome.attackerLfAfter).toBe(15);
  });
});

describe("resolvePvpBattle life force", () => {
  it("floors the loser's reported life force at 1 instead of 0", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon(), pilot());

    expect(outcome.winner).toBe("attacker");
    expect(outcome.defenderLfAfter).toBe(1);
  });

  it("floors the attacker's life force at 1 when the attacker loses", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(pilot({ speed: 1 }), glassCannon());

    expect(outcome.winner).toBe("defender");
    expect(outcome.attackerLfAfter).toBe(1);
  });

  it("does not clamp starting life force above the level max (allocated HP is kept)", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(pilot(), pilot({ lifeForce: 999 }));

    // Level 1 max is 15, but the pilot fights with all 999; the first hit of 1 leaves 998.
    expect(outcome.rounds[0].defenderLfAfter).toBe(998);
  });

  it("multiplies starting life force by a hero max LF bonus", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(
      pilot(),
      pilot({ lifeForce: 15 }),
      undefined,
      heroBonuses({ maxLfPct: 100 }) // 15 -> 30
    );

    expect(outcome.rounds[0].defenderLfAfter).toBe(29);
  });

  it("spends hero bonus life force first and never returns more than the pilot brought", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(
      pilot(),
      pilot({ lifeForce: 15 }),
      undefined,
      heroBonuses({ maxLfPct: 100 }) // 15 -> 30
    );

    // The attacker dies on strike 30, after landing 15 hits: 30 - 15 = 15 left,
    // which is exactly what the defender brought.
    expect(outcome.winner).toBe("defender");
    expect(outcome.defenderLfAfter).toBe(15);
  });
});

describe("resolvePvpBattle round limit", () => {
  // ATK equals DEF on both sides, so every strike deals 1 and nobody dies.
  const turtle = (overrides: Partial<PvpPilotInput>) =>
    pilot({ level: 10, lifeForce: 50, ...overrides });

  it("stops after 20 rounds (40 strikes) when nobody is knocked out", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(turtle({ callsign: "A" }), turtle({ callsign: "D" }));

    expect(outcome.totalRounds).toBe(40);
    expect(outcome.attackerLfAfter).toBe(30);
    expect(outcome.defenderLfAfter).toBe(30);
  });

  it("awards a dead-even timed-out draw to the defender", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(turtle({ callsign: "A" }), turtle({ callsign: "D" }));

    expect(outcome.winner).toBe("defender");
  });

  it("awards a timed-out fight to the attacker only when strictly ahead", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(turtle({ callsign: "A", lifeForce: 51 }), turtle({ callsign: "D" }));

    expect(outcome.winner).toBe("attacker");
  });

  it("awards a timed-out fight to whoever has more life force left", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(
      turtle({ callsign: "A" }),
      turtle({ callsign: "D", level: 20, lifeForce: 100 })
    );

    expect(outcome.winner).toBe("defender");
    expect(outcome.defenderLfAfter).toBe(80);
  });
});

describe("resolvePvpBattle rewards", () => {
  it("pays the winner XP and credits scaled by the loser's level", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon({ level: 3 }), pilot({ level: 3 }));

    // base XP = 30 + 3 * 12, credits = 15 + 3 * 5
    expect(outcome.attackerXp).toBe(66);
    expect(outcome.attackerCredits).toBe(30);
  });

  it("pays the loser no XP and takes the winner's credits from the loser", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon({ level: 3 }), pilot({ level: 3 }));

    expect(outcome.defenderXp).toBe(0);
    expect(outcome.defenderCredits).toBe(-30);
    expect(outcome.attackerCredits + outcome.defenderCredits).toBe(0);
  });

  it("swaps the rewards when the defender wins", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(pilot({ level: 3, speed: 1 }), glassCannon({ level: 3 }));

    expect(outcome.winner).toBe("defender");
    expect(outcome.defenderXp).toBe(66);
    expect(outcome.defenderCredits).toBe(30);
    expect(outcome.attackerXp).toBe(0);
    expect(outcome.attackerCredits).toBe(-30);
  });

  it("never takes more credits than the loser has on hand", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon({ level: 3 }), pilot({ level: 3, credits: 12 }));

    expect(outcome.attackerCredits).toBe(12);
    expect(outcome.defenderCredits).toBe(-12);
    expect(outcome.attackerXp).toBe(66);
  });

  it("limits the loser's payment to maxLoss, paying XP but no credits when it is 0", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const partial = resolvePvpBattle(glassCannon({ level: 3 }), pilot({ level: 3, credits: 1000, maxLoss: 7 }));
    const exhausted = resolvePvpBattle(glassCannon({ level: 3 }), pilot({ level: 3, credits: 1000, maxLoss: 0 }));

    expect(partial.attackerCredits).toBe(7);
    expect(partial.defenderCredits).toBe(-7);
    expect(exhausted.attackerCredits).toBe(0);
    expect(exhausted.defenderCredits + exhausted.attackerCredits).toBe(0);
    expect(exhausted.attackerXp).toBe(66);
  });

  it("gives a lower-level winner +10% XP per level of difference", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon({ level: 1 }), pilot({ level: 5, lifeForce: 15 }));

    // base 30 + 5 * 12 = 90, times 1.4
    expect(outcome.attackerXp).toBe(126);
  });

  it("gives no underdog bonus when the winner is the higher level", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon({ level: 9 }), pilot({ level: 2 }));

    expect(outcome.attackerXp).toBe(54); // 30 + 2 * 12
  });

  it("applies each side's hero XP bonus to that side's own XP", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(
      glassCannon({ level: 3 }),
      pilot({ level: 3 }),
      heroBonuses({ xpPct: 50 }),
      heroBonuses({ xpPct: 100 })
    );

    expect(outcome.attackerXp).toBe(99); // 66 * 1.5
    expect(outcome.defenderXp).toBe(0); // the loser earns nothing to multiply
  });

  it("applies the defender's hero XP bonus when the defender wins", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(
      pilot({ level: 3, speed: 1 }),
      glassCannon({ level: 3 }),
      heroBonuses({ xpPct: 50 }),
      heroBonuses({ xpPct: 100 })
    );

    expect(outcome.defenderXp).toBe(132); // 66 * 2
    expect(outcome.attackerXp).toBe(0);
  });

  it("caps the underdog XP multiplier at 2x", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    // A level 1 pilot beating a level 100 pilot who is already at 0 LF.
    const outcome = resolvePvpBattle(pilot({ level: 1 }), pilot({ level: 100, lifeForce: 0 }));

    // base 30 + 100 * 12 = 1230, times 2 (uncapped it was 10.9x = 13,407)
    expect(outcome.attackerXp).toBe(2460);
  });
});

describe("resolvePvpBattle confidence", () => {
  it("gives the winner +0.05 confidence", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon(), pilot());

    // The delta is (new confidence - old confidence), so it carries float noise.
    expect(outcome.attackerConfDelta).toBeCloseTo(0.05, 10);
  });

  it("costs the loser 0.0125 confidence when above the floor of 5", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon(), pilot({ confidence: 5.5 }));

    expect(outcome.defenderConfDelta).toBeCloseTo(-0.0125, 10);
  });

  it("caps the winner's daily momentum at +0.95 so wins never mint a whole point", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const nearCap = resolvePvpBattle(glassCannon({ confidence: 7.93 }), pilot());
    const atCap = resolvePvpBattle(glassCannon({ confidence: 7.95 }), pilot());

    expect(7.93 + nearCap.attackerConfDelta).toBeCloseTo(7.95, 10);
    expect(atCap.attackerConfDelta).toBe(0);
  });

  it("never lets a loss dip into the whole (allocated) part of confidence", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon(), pilot({ confidence: 8.005 }));

    expect(8.005 + outcome.defenderConfDelta).toBe(8);
  });

  it("does not reduce the loser's confidence at the floor", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon(), pilot({ confidence: 5 }));

    expect(outcome.defenderConfDelta).toBe(0);
  });
});

describe("resolvePvpBattle log text", () => {
  it("names the winner, the loser, and the rewards taken from the loser, then explains the knockout", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon({ level: 3 }), pilot({ callsign: "Target", level: 3 }));

    const lines = outcome.logText.split("\n");
    expect(lines.at(-2)).toBe("⚡ Cannon defeats Target! +66 XP, +30 cr taken from Target.");
    expect(lines.at(-1)).toBe("Target is dragged clear of the fight with 1 LF.");
  });

  it("ends on the result line, with no knockout line, when the fight times out", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);
    const turtle = (callsign: string) => pilot({ callsign, level: 10, lifeForce: 50 });

    const outcome = resolvePvpBattle(turtle("A"), turtle("D"));

    // base 30 + 10 * 12 = 150 XP, stake 15 + 10 * 5 = 65 credits
    expect(outcome.logText.split("\n").at(-1)).toBe("⚡ D defeats A! +150 XP, +65 cr taken from A.");
  });

  it("tags critical hits", () => {
    fixRandom(LOW_ROLL_ALWAYS_CRIT);

    const outcome = resolvePvpBattle(glassCannon(), pilot());

    expect(outcome.logText).toContain("[CRIT]");
  });

  it("lists active hero support bonuses before the rounds", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon(), pilot(), heroBonuses({ atkPct: 12.5 }));

    expect(outcome.logText.split("\n")[0]).toBe("〔Cannon Support: +12.5% ATK〕");
  });
});

/**
 * Current behaviour that looks wrong. These tests pin what the engine does
 * today so a deliberate gameplay fix shows up as a test change.
 */
describe("resolvePvpBattle known issues (documented, not endorsed)", () => {
  it("logs the knockout at 0 LF while the outcome reports 1 LF", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(glassCannon(), pilot());

    expect(outcome.rounds.at(-1)?.defenderLfAfter).toBe(0);
    expect(outcome.defenderLfAfter).toBe(1);
  });

  it("hands full rewards for a zero-round win over a defender with 0 life force", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(pilot({ level: 1 }), pilot({ level: 3, lifeForce: 0 }));

    expect(outcome.totalRounds).toBe(0);
    expect(outcome.winner).toBe("attacker");
    expect(outcome.attackerXp).toBe(79); // (30 + 3 * 12) * 1.2 underdog
    expect(outcome.attackerCredits).toBe(30);
  });

  it("declares an attacker with 0 life force the winner when the defender also has 0", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const outcome = resolvePvpBattle(pilot({ lifeForce: 0 }), pilot({ lifeForce: 0 }));

    expect(outcome.winner).toBe("attacker");
  });
});

describe("simulateWinChance", () => {
  it("reports 100% for an attacker who always one-shots first", () => {
    const result = simulateWinChance(glassCannon(), pilot(), undefined, undefined, 25);

    expect(result).toEqual({ winPct: 100, avgRounds: 1, avgLfRemaining: 15 });
  });

  it("reports 0% and 0 remaining life force for a hopeless attacker", () => {
    const result = simulateWinChance(pilot({ speed: 1 }), glassCannon(), undefined, undefined, 25);

    expect(result).toEqual({ winPct: 0, avgRounds: 1, avgLfRemaining: 0 });
  });

  it("simulates both pilots at full life force regardless of current life force", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const result = simulateWinChance(pilot({ lifeForce: 1 }), pilot({ lifeForce: 1 }), undefined, undefined, 1);

    // From 1 LF the first strike would end it. From full LF (15) with 1 damage
    // per strike, the attacker lands the 15th hit on strike 29.
    expect(result.avgRounds).toBe(29);
  });

  it("reflects a hero max LF bonus in the simulated fight", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);
    const simulate = (attackerBonuses?: HeroBonuses) =>
      simulateWinChance(pilot({ level: 10 }), pilot({ level: 10 }), attackerBonuses, undefined, 1);

    const unbuffed = simulate();
    const buffed = simulate(heroBonuses({ maxLfPct: 100 }));

    // Evenly matched at 50 LF each, 20 rounds end 30 v 30 and the tie goes to the defender.
    expect(unbuffed).toEqual({ winPct: 0, avgRounds: 40, avgLfRemaining: 0 });
    // Doubled to 100 LF the attacker ends on 80 v 30 and wins. The 20 damage came
    // out of the bonus, so the attacker keeps the full 50 they brought.
    expect(buffed).toEqual({ winPct: 100, avgRounds: 40, avgLfRemaining: 50 });
  });

  it("simulates a pilot holding life force above the level max at what they hold", () => {
    fixRandom(NO_VARIANCE_NO_CRIT);

    const result = simulateWinChance(
      pilot({ level: 10, lifeForce: 70 }),
      pilot({ level: 10 }),
      undefined,
      undefined,
      1
    );

    // 70 v 50 ends 50 v 30 after 20 rounds: the allocated HP is not clamped to 50.
    expect(result).toEqual({ winPct: 100, avgRounds: 40, avgLfRemaining: 50 });
  });
});
