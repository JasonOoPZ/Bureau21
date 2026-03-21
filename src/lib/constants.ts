export const GAME = {
  MOTIVATION_REGEN_MINUTES: 15,
  MOTIVATION_DAILY_BASE: 96,
  MOTIVATION_SUBSCRIBER: 144,
  MOTIVATION_GUILD_BONUS: 24,
  MOTIVATION_CAP_FREE: 500,
  MOTIVATION_CAP_SUB: 1500,
  MOTIVATION_PER_BUN: 50,
  NEWBIE_DAYS: 15,
  NEWBIE_LEVEL: 5,
  CONFIDENCE_START: 10,
  CONFIDENCE_CAP: 75,
  AP_PER_LEVEL: 5,
  LF_PER_AP_MULT: 2,
  GAUGE_DEFAULT: 10,
  GAUGE_OTHERS: 3,
  VILLAGE_TRAINS: 15,
  VILLAGE_MAX: 25,
  SPLIT_DEFAULT: 50,
  START_CREDITS: 300,
  START_LF: 15,
  START_STR: 3.0,
  START_SPD: 5.0,
  START_END: 0.2,
  START_PAN: 0.0,
  START_CONF: 10,
  WELFARE_DAYS: 30,
  TOKENS_DAILY: 20,
  TOKEN_BUY: 3,
  TOKEN_SELL: 2,
  STREAK_BONUS: 0.02,
  GYM_MAX_DRINKS: 4,
  BLUE_HERB_LF: 200,
  UNLOCK_BAZAAR: 4,
  UNLOCK_SYNDICATE: 4,
  UNLOCK_UNDERBELLY: 8,
  UNLOCK_FULL: 15,
} as const;

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function calcATK(str: number, split: number, wpn: number): number {
  return Math.floor((str * split) / 100) + wpn;
}

export function calcDEF(str: number, split: number, arm: number): number {
  return Math.floor((str * (100 - split)) / 100) + arm;
}

export function getCurrentSeason(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function isProtected(days: number, level: number): boolean {
  return days < GAME.NEWBIE_DAYS && level < GAME.NEWBIE_LEVEL;
}
