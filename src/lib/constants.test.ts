import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  calcATK,
  calcDEF,
  GAME,
  getCurrentSeason,
  isProtected,
  xpForLevel,
} from '@/lib/constants';

describe('constants', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes XP curve by level', () => {
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(2)).toBe(114);
    expect(xpForLevel(5)).toBe(174);
  });

  it('computes attack and defense values from split and bonuses', () => {
    expect(calcATK(10, 50, 3)).toBe(8);
    expect(calcDEF(10, 50, 2)).toBe(7);
  });

  it('formats current season as YYYY-MM', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'));
    expect(getCurrentSeason()).toBe('2026-03');
  });

  it('applies newbie protection only when both day and level limits pass', () => {
    expect(isProtected(GAME.NEWBIE_DAYS - 1, GAME.NEWBIE_LEVEL - 1)).toBe(true);
    expect(isProtected(GAME.NEWBIE_DAYS, GAME.NEWBIE_LEVEL - 1)).toBe(false);
    expect(isProtected(GAME.NEWBIE_DAYS - 1, GAME.NEWBIE_LEVEL)).toBe(false);
  });
});
