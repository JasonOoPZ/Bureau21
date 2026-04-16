import { afterEach, describe, expect, it, vi } from 'vitest';

import { runBattle } from '@/lib/battle-engine';
import type { CharacterStats, Item } from '@/types/game';

function character(overrides: Partial<CharacterStats> = {}): CharacterStats {
  return {
    id: 'char',
    username: 'operator',
    level: 10,
    strength: 20,
    speed: 10,
    endurance: 0,
    panic: 0,
    atk_def_split: 50,
    life_force: 30,
    max_life_force: 30,
    credits_hand: 1000,
    alignment: 10,
    age_days: 1,
    is_dead: false,
    is_newbie: false,
    newbie_until: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

const weapon: Item = {
  id: 'wpn',
  name: 'Blade',
  type: 'weapon',
  description: '',
  atk_bonus: 10,
  def_bonus: 0,
  heal_amount: 0,
  is_revive: false,
  level_req: 1,
  max_strength: 0,
  buy_price: 0,
  sell_price: 0,
  rarity: 'common',
};

const armor: Item = {
  ...weapon,
  id: 'arm',
  type: 'armor',
  atk_bonus: 0,
  def_bonus: 5,
};

describe('battle-engine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves deterministic attacker win with weapon/armor effects', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const attacker = character({
      id: 'a1',
      username: 'attacker',
      level: 10,
      strength: 100,
      speed: 15,
      atk_def_split: 70,
      life_force: 30,
    });
    const defender = character({
      id: 'd1',
      username: 'defender',
      level: 5,
      strength: 20,
      speed: 5,
      atk_def_split: 50,
      life_force: 30,
      credits_hand: 1000,
      alignment: 10,
    });

    const result = runBattle(attacker, defender, weapon, armor);

    expect(result.winner_id).toBe('a1');
    expect(result.attacker_survived).toBe(true);
    expect(result.defender_survived).toBe(false);
    expect(result.xp_gained).toBe(25);
    expect(result.credits_stolen).toBe(200);
    expect(result.alignment_change).toBe(-5);
    expect(result.log_entries.at(0)).toContain('attacker');
    expect(result.log_entries.at(-1)).toContain('wins');
  });

  it('handles panic attack branch for instant target knockout', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const attacker = character({
      id: 'a2',
      username: 'panic-attacker',
      panic: 100,
      speed: 20,
      strength: 10,
      atk_def_split: 50,
    });
    const defender = character({
      id: 'd2',
      username: 'defender',
      level: 3,
      life_force: 15,
      alignment: -10,
    });

    const result = runBattle(attacker, defender, null, null);

    expect(result.winner_id).toBe('a2');
    expect(result.defender_survived).toBe(false);
    expect(result.alignment_change).toBe(3);
    expect(result.log_entries.some((line) => line.includes('PANICS'))).toBe(true);
  });

  it('returns defender as winner when attacker cannot finish and is defeated', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const attacker = character({
      id: 'a3',
      username: 'weak',
      level: 5,
      strength: 8,
      speed: 4,
      life_force: 10,
      atk_def_split: 40,
      panic: 0,
      endurance: 0,
    });
    const defender = character({
      id: 'd3',
      username: 'strong',
      level: 8,
      strength: 30,
      speed: 10,
      life_force: 20,
      atk_def_split: 60,
      alignment: 5,
    });

    const result = runBattle(attacker, defender, null, null);

    expect(result.winner_id).toBe('d3');
    expect(result.xp_gained).toBe(0);
    expect(result.credits_stolen).toBe(0);
    expect(result.alignment_change).toBe(0);
    expect(result.attacker_survived).toBe(false);
  });
});
