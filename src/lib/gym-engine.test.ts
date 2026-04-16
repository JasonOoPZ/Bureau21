import { afterEach, describe, expect, it, vi } from 'vitest';

import { GAME } from '@/lib/constants';
import { calcMaxGymEnergy, runGymWorkout } from '@/lib/gym-engine';
import type { Character } from '@/types/game';

function buildCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char-1',
    user_id: 'user-1',
    username: 'tester',
    level: 10,
    xp: 0,
    credits_hand: 100,
    credits_bank: 0,
    bytes: 0,
    marks: 0,
    tokens: 0,
    alignment: 0,
    age_days: 10,
    is_dead: false,
    life_force: 15,
    max_life_force: 15,
    strength: 3,
    speed: 5,
    endurance: 5,
    panic: 0,
    confidence: 10,
    max_confidence: 75,
    motivation: 0,
    max_motivation: 0,
    atk_def_split: 50,
    ap_available: 0,
    gym_streak: 0,
    last_gym_date: null,
    gym_energy_used: 0,
    gym_energy_date: null,
    is_newbie: true,
    newbie_until: '2026-05-01T00:00:00.000Z',
    welfare_days_remaining: 30,
    battle_gauge_minutes: 0,
    last_motivation_regen: '2026-04-15T00:00:00.000Z',
    onboarding_step: 0,
    syndicate_id: null,
    loan_amount: 0,
    loan_created_at: null,
    bond_amount: 0,
    bond_rate: 0,
    bond_created_at: null,
    bond_matures_at: null,
    created_at: '2026-04-01T00:00:00.000Z',
    last_login: '2026-04-16T00:00:00.000Z',
    ...overrides,
  };
}

describe('gym-engine', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates max gym energy from base, level, and endurance', () => {
    expect(calcMaxGymEnergy(1, 0.2)).toBe(10);
    expect(calcMaxGymEnergy(10, 5)).toBe(12);
    expect(calcMaxGymEnergy(50, 25)).toBe(20);
  });

  it('rejects invalid workout difficulties', () => {
    const character = buildCharacter();
    expect(() => runGymWorkout(character, 'strength', 0)).toThrow(
      'Difficulty must be between 1 and 5.'
    );
    expect(() => runGymWorkout(character, 'strength', 6)).toThrow(
      'Difficulty must be between 1 and 5.'
    );
  });

  it('resets daily energy usage when gym date is not today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T12:00:00.000Z'));
    const yesterday = '2026-04-15';
    const character = buildCharacter({
      gym_energy_date: yesterday,
      gym_energy_used: 99,
      level: 1,
      endurance: 0.2,
      age_days: 0,
    });

    const result = runGymWorkout(character, 'strength', 1);

    expect(result.energy_used).toBe(1);
    expect(result.max_energy).toBe(GAME.GYM_BASE_REPS);
  });

  it('throws when remaining gym energy is insufficient', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T12:00:00.000Z'));
    const character = buildCharacter({
      gym_energy_date: '2026-04-16',
      gym_energy_used: 11,
      level: 10,
      endurance: 5,
    });

    expect(() => runGymWorkout(character, 'strength', 2)).toThrow(
      'Not enough gym energy.'
    );
  });

  it('increases streak when last workout was yesterday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T12:00:00.000Z'));
    const character = buildCharacter({
      last_gym_date: '2026-04-15',
      gym_streak: 3,
      gym_energy_date: '2026-04-16',
      gym_energy_used: 0,
      age_days: 10,
    });

    const result = runGymWorkout(character, 'strength', 2);
    const expectedGain = parseFloat(
      (0.01 * 2 * (1 + 10 * 0.001) * (1 + 3 * GAME.STREAK_BONUS)).toFixed(4)
    );

    expect(result.streak).toBe(4);
    expect(result.gain_amount).toBe(expectedGain);
    expect(result.new_value).toBe(parseFloat((3 + expectedGain).toFixed(4)));
  });

  it('keeps streak on same day and resets after a gap', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T12:00:00.000Z'));

    const sameDay = buildCharacter({
      last_gym_date: '2026-04-16',
      gym_streak: 5,
      gym_energy_date: '2026-04-16',
    });
    const afterGap = buildCharacter({
      last_gym_date: '2026-04-10',
      gym_streak: 5,
      gym_energy_date: '2026-04-16',
    });

    expect(runGymWorkout(sameDay, 'speed', 1).streak).toBe(5);
    expect(runGymWorkout(afterGap, 'speed', 1).streak).toBe(1);
  });
});
