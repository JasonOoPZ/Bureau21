import { hktYearMonth } from "./hkt";

export const GAME_CONSTANTS = {
  MOTIVATION_REGEN_MINUTES: 15,
  MOTIVATION_DAILY_GAIN: 96,
  MOTIVATION_SUBSCRIBER_GAIN: 144,
  MOTIVATION_GUILD_BONUS: 24,
  MOTIVATION_CAP_FREE: 500,
  MOTIVATION_CAP_SUBSCRIBER: 1500,
  MOTIVATION_PER_HOTBUN: 50,
  NEWBIE_PROTECTION_DAYS: 15,
  NEWBIE_PROTECTION_LEVEL: 5,
  CONFIDENCE_START: 5,
  CONFIDENCE_CAP: 50,
  CONFIDENCE_CAP_BOOSTED: 100,
  CONFIDENCE_BOOSTED_SLUG: "base-yellow",
  CONFIDENCE_FLOOR: 5,
  CONFIDENCE_WIN_GAIN: 0.05,
  CONFIDENCE_LOSS_PENALTY: 0.0125,
  AP_PER_LEVEL: 5,
  LF_PER_AP_MULTIPLIER: 2,
  BATTLE_GAUGE_DEFAULT_MINUTES: 10,
  BATTLE_GAUGE_MIN_MINUTES: 1,
  BATTLE_GAUGE_MAX_MINUTES: 30,
  BATTLE_GAUGE_OTHERS_MINUTES: 3,
  BATTLE_VILLAGE_TRAINS_PER_DAY: 15,
  BATTLE_VILLAGE_MAX_TRAINS: 25,
  /** A defender can never be attacked more often than this, whatever they set. */
  PVP_MIN_DEFENDER_COOLDOWN_MINUTES: 5,
  /** Battles allowed between the same two pilots per rolling 24h (either direction). */
  PVP_PAIR_DAILY_CAP: 5,
  /**
   * Share of a pilot's on-hand credits they can lose in PvP per rolling 24h.
   * Measured against credits now + credits already lost in the window, so the
   * allowance does not shrink (or reset) as they lose.
   */
  PVP_DEFENDER_DAILY_LOSS_RATIO: 0.1,
  /** Life Force needed to attack or be attacked: the larger of these two. */
  PVP_MIN_LIFE_FORCE: 5,
  PVP_MIN_LIFE_FORCE_RATIO: 0.2,
  /** Ceiling on the bonus XP for beating a higher-level pilot. */
  PVP_UNDERDOG_MAX_MULTIPLIER: 2,
  XP_PER_LEVEL: 100,
  ATK_DEF_SPLIT_DEFAULT: 50,
  BOT_XP_MULTIPLIER: 1.5,
  BOT_BATTLE_GAUGE_SECONDS: 30,
  STARTING_CREDITS: 300,
  STARTING_LIFE_FORCE: 15,
  STARTING_STRENGTH: 3.0,
  STARTING_SPEED: 5.0,
  STARTING_ENDURANCE: 0.2,
  STARTING_PANIC: 0.0,
  STARTING_CONFIDENCE: 5,
  STARTING_ATK: 2,
  STARTING_DEF: 1,
  GYM_STREAK_BONUS_PER_DAY: 0.02,
  GYM_MAX_DRINKS: 4,
  GYM_ENERGY_FOUNDATION: 25,
  GYM_ENERGY_PER_ENDURANCE: 10,
  GYM_ENERGY_MAX_STREAK: 25,
  GYM_ENERGY_RESET_HOURS: 24,
  SIM_CREDIT_MULTIPLIER: 405,
  SIM_XP_MULTIPLIER: 6,
  SIM_LEVEL_CHANCE: 100,
  SCANNER_PAGE_SIZE: 25,
  WELFARE_DAYS: 30,
  TOKEN_BUY_RATE: 8,
  TOKEN_SELL_RATE: 5,
  TOKENS_PER_DAY: 20,
  BLUE_HERB_REVIVE_LF: 200,
  SEASON_FORMAT: "YYYY-MM",
  UNLOCK_BAZAAR_DAY: 4,
  UNLOCK_SYNDICATE_ROW_DAY: 4,
  UNLOCK_UNDERBELLY_DAY: 8,
  UNLOCK_FULL_STATION_DAY: 15,
  POINTS_PER_LEVEL: 8,
  POINT_STR_GAIN: 1,
  POINT_SPEED_GAIN: 1,
  POINT_END_GAIN: 1,
  POINT_PANIC_GAIN: 1,
  POINT_CONF_GAIN: 1,
} as const;

/** HP gained per allocation point. Fixed 1:1 ratio. */
export function hpPerPoint(_level: number): number {
  return 1;
}

/**
 * XP needed to advance from `level` to `level + 1`. The single source of truth:
 * level progression and every XP bar must use this, never their own curve.
 */
export function xpForLevel(level: number): number {
  return Math.max(1, level) * GAME_CONSTANTS.XP_PER_LEVEL;
}

export function getConfidenceCap(characterSlug?: string | null): number {
  return characterSlug === GAME_CONSTANTS.CONFIDENCE_BOOSTED_SLUG
    ? GAME_CONSTANTS.CONFIDENCE_CAP_BOOSTED
    : GAME_CONSTANTS.CONFIDENCE_CAP;
}

export function calculateATK(strength: number, atkDefSplit: number, weaponBonus: number): number {
  return Math.floor((strength * atkDefSplit) / 100) + weaponBonus;
}

export function calculateDEF(strength: number, atkDefSplit: number, armorBonus: number): number {
  return Math.floor((strength * (100 - atkDefSplit)) / 100) + armorBonus;
}

/** Compute combat ATK/DEF bonuses from equipped inventory items */
export function getCombatBonuses(
  inventory: { type: string; bonusType: string; bonusAmt: number; equipped: boolean }[]
): { weaponBonus: number; armorBonus: number } {
  let weaponBonus = 0;
  let armorBonus = 0;
  for (const item of inventory) {
    if (!item.equipped) continue;
    if (item.bonusType === "atk") weaponBonus += item.bonusAmt;
    else if (item.bonusType === "def") armorBonus += item.bonusAmt;
    else if (item.type === "weapon" && item.bonusType === "credits")
      weaponBonus += Math.floor(item.bonusAmt / 10);
    else if (item.type === "shield")
      armorBonus += Math.floor(item.bonusAmt / 2);
  }
  return { weaponBonus, armorBonus };
}

export function lfFromAP(level: number): number {
  return GAME_CONSTANTS.LF_PER_AP_MULTIPLIER * level;
}

/** Current season id ("YYYY-MM"), rolling over at midnight HKT on the 1st. */
export function getCurrentSeason(now: Date = new Date()): string {
  return hktYearMonth(now);
}

export function isNewbieProtected(ageDays: number, level: number): boolean {
  return ageDays < GAME_CONSTANTS.NEWBIE_PROTECTION_DAYS && level < GAME_CONSTANTS.NEWBIE_PROTECTION_LEVEL;
}

export function calculateMotivationRegen(lastCheckTime: Date, currentMotivation: number, maxMotivation: number): number {
  const now = new Date();
  const minutesElapsed = Math.floor((now.getTime() - lastCheckTime.getTime()) / (1000 * 60));
  const regenAmount = Math.floor(minutesElapsed / GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES);
  if (currentMotivation >= maxMotivation) return currentMotivation;
  return Math.min(currentMotivation + regenAmount, maxMotivation);
}

/** Compute gym energy max from its three components. */
export function computeGymEnergy(endurance: number, gymStreak: number) {
  const foundation = GAME_CONSTANTS.GYM_ENERGY_FOUNDATION;
  const enduranceBonus = Math.floor(endurance * GAME_CONSTANTS.GYM_ENERGY_PER_ENDURANCE);
  const streakBonus = Math.min(GAME_CONSTANTS.GYM_ENERGY_MAX_STREAK, gymStreak);
  return { foundation, enduranceBonus, streakBonus, max: foundation + enduranceBonus + streakBonus };
}
