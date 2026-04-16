import { calculateATK, calculateDEF, GAME_CONSTANTS, getCombatBonuses, getConfidenceCap } from "@/lib/constants";
import type { HeroBonuses } from "@/lib/hero-data";

/* ═══════════════════════════════════════════════
   PVP Battle Engine — Bureau 21
   Confidence: +0.05 per win, -0.0125 per loss (only above floor of 5)
   ═════════════════════════════════════════════ */

export interface BattleFighter {
  name: string;
  lf: number;
  maxLf: number;
  atk: number;
  def: number;
  speed: number;
}

export interface BattleRoundLog {
  round: number;
  attacker: string;
  defender: string;
  damage: number;
  crit: boolean;
  defenderLfAfter: number;
}

export interface BattleOutcome {
  winner: "attacker" | "defender";
  rounds: BattleRoundLog[];
  totalRounds: number;
  attackerXp: number;
  defenderXp: number;
  attackerCredits: number;
  defenderCredits: number;
  attackerLfAfter: number;
  defenderLfAfter: number;
  attackerConfDelta: number;
  defenderConfDelta: number;
  logText: string;
}

export interface PvpPilotInput {
  callsign: string;
  level: number;
  lifeForce: number;
  strength: number;
  speed: number;
  confidence: number;
  atkSplit: number;
  characterSlug?: string;
  inventory: { type: string; bonusType: string; bonusAmt: number; equipped: boolean }[];
}

function maxLF(level: number): number {
  return Math.max(GAME_CONSTANTS.STARTING_LIFE_FORCE, level * 5);
}

function rollDamage(atk: number, def: number, critBonus = 0): { damage: number; crit: boolean } {
  const variance = Math.floor(Math.random() * 5) - 2;
  const crit = Math.random() < (0.07 + critBonus);
  let damage = Math.max(1, atk - def + variance);
  if (crit) damage = Math.floor(damage * 2);
  return { damage, crit };
}

function buildPvpFighter(
  pilot: PvpPilotInput,
  heroBonuses?: HeroBonuses
): { fighter: BattleFighter; critBonus: number } {
  const { weaponBonus, armorBonus: defBonus } = getCombatBonuses(pilot.inventory);

  const heroAtkMult = 1 + ((heroBonuses?.atkPct ?? 0) / 100);
  const heroDefMult = 1 + ((heroBonuses?.defPct ?? 0) / 100);
  const heroLfMult = 1 + ((heroBonuses?.maxLfPct ?? 0) / 100);
  const heroSpd = heroBonuses?.speedFlat ?? 0;
  const heroConf = heroBonuses?.confidenceFlat ?? 0;

  const confCap = getConfidenceCap(pilot.characterSlug);
  const appliedConfidence = Math.min(confCap, pilot.confidence + heroConf);
  const critBonus = (appliedConfidence / confCap) * 0.08;

  const playerATK = Math.max(1, Math.floor(calculateATK(pilot.strength, pilot.atkSplit, weaponBonus) * heroAtkMult));
  const playerDEF = Math.max(0, Math.floor(calculateDEF(pilot.strength, pilot.atkSplit, defBonus) * heroDefMult));
  const playerMaxLf = Math.floor(maxLF(pilot.level) * heroLfMult);

  return {
    fighter: {
      name: pilot.callsign,
      lf: Math.min(pilot.lifeForce, playerMaxLf),
      maxLf: playerMaxLf,
      atk: playerATK,
      def: playerDEF,
      speed: pilot.speed + heroSpd,
    },
    critBonus,
  };
}

/**
 * Resolve a PVP battle between two real players.
 * XP/credit rewards scale with the loser's level.
 */
export function resolvePvpBattle(
  attackerInput: PvpPilotInput,
  defenderInput: PvpPilotInput,
  attackerHeroBonuses?: HeroBonuses,
  defenderHeroBonuses?: HeroBonuses
): BattleOutcome {
  const { fighter: attacker, critBonus: atkCrit } = buildPvpFighter(attackerInput, attackerHeroBonuses);
  const { fighter: defender, critBonus: defCrit } = buildPvpFighter(defenderInput, defenderHeroBonuses);

  const rounds: BattleRoundLog[] = [];
  let atkLf = attacker.lf;
  let defLf = defender.lf;

  const attackerFirst = attacker.speed >= defender.speed;

  for (let round = 1; round <= 20; round++) {
    if (atkLf <= 0 || defLf <= 0) break;

    const first = attackerFirst ? { f: attacker, crit: atkCrit, isAtk: true } : { f: defender, crit: defCrit, isAtk: false };
    const second = attackerFirst ? { f: defender, crit: defCrit, isAtk: false } : { f: attacker, crit: atkCrit, isAtk: true };

    // First combatant strikes
    {
      const target = first.isAtk ? defender : attacker;
      const { damage, crit } = rollDamage(first.f.atk, target.def, first.crit);
      if (first.isAtk) {
        defLf = Math.max(0, defLf - damage);
        rounds.push({ round, attacker: attacker.name, defender: defender.name, damage, crit, defenderLfAfter: defLf });
      } else {
        atkLf = Math.max(0, atkLf - damage);
        rounds.push({ round, attacker: defender.name, defender: attacker.name, damage, crit, defenderLfAfter: atkLf });
      }
      if (atkLf <= 0 || defLf <= 0) break;
    }

    // Second combatant strikes
    {
      const target = second.isAtk ? defender : attacker;
      const { damage, crit } = rollDamage(second.f.atk, target.def, second.crit);
      if (second.isAtk) {
        defLf = Math.max(0, defLf - damage);
        rounds.push({ round, attacker: attacker.name, defender: defender.name, damage, crit, defenderLfAfter: defLf });
      } else {
        atkLf = Math.max(0, atkLf - damage);
        rounds.push({ round, attacker: defender.name, defender: attacker.name, damage, crit, defenderLfAfter: atkLf });
      }
    }
  }

  const attackerWon = defLf <= 0 || (atkLf > 0 && defLf > 0 && atkLf >= defLf);

  // XP: winner gets base XP scaled by opponent level, loser gets participation XP
  const loserLevel = attackerWon ? defenderInput.level : attackerInput.level;
  const winnerLevel = attackerWon ? attackerInput.level : defenderInput.level;
  const baseXp = Math.max(20, Math.floor(30 + loserLevel * 12));
  // Underdog bonus: if winner is lower level, scale up
  const levelDiff = loserLevel - winnerLevel;
  const underdogMult = levelDiff > 0 ? 1 + levelDiff * 0.1 : 1;

  const winXp = Math.round(baseXp * underdogMult);
  const loseXp = Math.max(5, Math.floor(baseXp * 0.15));

  // Credits: winner takes a cut from the battle
  const winCredits = Math.max(10, Math.floor(15 + loserLevel * 5));
  const loseCredits = 0;

  // Apply hero XP multipliers
  const atkHeroXpMult = 1 + ((attackerHeroBonuses?.xpPct ?? 0) / 100);
  const defHeroXpMult = 1 + ((defenderHeroBonuses?.xpPct ?? 0) / 100);

  const attackerXp = Math.round((attackerWon ? winXp : loseXp) * atkHeroXpMult);
  const defenderXp = Math.round((attackerWon ? loseXp : winXp) * defHeroXpMult);
  const attackerCredits = attackerWon ? winCredits : loseCredits;
  const defenderCredits = attackerWon ? loseCredits : winCredits;

  const atkConfCap = getConfidenceCap(attackerInput.characterSlug);
  const defConfCap = getConfidenceCap(defenderInput.characterSlug);

  // Win: +0.05, Loss: -0.0125 (only deducted if above floor of 5)
  const attackerConfDelta = attackerWon
    ? GAME_CONSTANTS.CONFIDENCE_WIN_GAIN
    : attackerInput.confidence > GAME_CONSTANTS.CONFIDENCE_FLOOR
      ? -GAME_CONSTANTS.CONFIDENCE_LOSS_PENALTY
      : 0;
  const defenderConfDelta = attackerWon
    ? defenderInput.confidence > GAME_CONSTANTS.CONFIDENCE_FLOOR
      ? -GAME_CONSTANTS.CONFIDENCE_LOSS_PENALTY
      : 0
    : GAME_CONSTANTS.CONFIDENCE_WIN_GAIN;

  // Build log text
  const logLines: string[] = [];

  // Hero bonuses summary
  function heroSummary(label: string, bonuses?: HeroBonuses) {
    if (!bonuses) return;
    const parts: string[] = [];
    if (bonuses.atkPct > 0) parts.push(`+${bonuses.atkPct.toFixed(1)}% ATK`);
    if (bonuses.defPct > 0) parts.push(`+${bonuses.defPct.toFixed(1)}% DEF`);
    if (bonuses.speedFlat > 0) parts.push(`+${bonuses.speedFlat.toFixed(1)} SPD`);
    if (bonuses.maxLfPct > 0) parts.push(`+${bonuses.maxLfPct.toFixed(1)}% LF`);
    if (bonuses.confidenceFlat > 0) parts.push(`+${bonuses.confidenceFlat.toFixed(0)} CONF`);
    if (bonuses.xpPct > 0) parts.push(`+${bonuses.xpPct.toFixed(1)}% XP`);
    if (parts.length > 0) logLines.push(`〔${label} Support: ${parts.join(" · ")}〕`);
  }
  heroSummary(attackerInput.callsign, attackerHeroBonuses);
  heroSummary(defenderInput.callsign, defenderHeroBonuses);

  rounds.forEach((r) => {
    const critTag = r.crit ? " [CRIT]" : "";
    logLines.push(`Round ${r.round} — ${r.attacker} hits ${r.defender} for ${r.damage} dmg${critTag}. ${r.defender} LF: ${r.defenderLfAfter}`);
  });

  const winnerName = attackerWon ? attacker.name : defender.name;
  const loserName = attackerWon ? defender.name : attacker.name;
  logLines.push(`⚡ ${winnerName} defeats ${loserName}! +${attackerWon ? attackerXp : defenderXp} XP, +${attackerWon ? attackerCredits : defenderCredits} cr.`);

  return {
    winner: attackerWon ? "attacker" : "defender",
    rounds,
    totalRounds: rounds.length,
    attackerXp,
    defenderXp,
    attackerCredits,
    defenderCredits,
    attackerLfAfter: Math.max(1, atkLf),
    defenderLfAfter: Math.max(1, defLf),
    attackerConfDelta,
    defenderConfDelta,
    logText: logLines.join("\n"),
  };
}

/** Summary of a player that can be attacked */
export interface PvpTarget {
  id: string;
  userId: string;
  callsign: string;
  level: number;
  characterSlug: string;
}
