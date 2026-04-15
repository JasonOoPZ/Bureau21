import { Character, GymResult, WorkoutType } from '@/types/game';
import { GAME } from '@/lib/constants';

/**
 * Computes the maximum gym energy (reps) available today for a character.
 *
 * The pool has three components:
 *   - Base (25%)      : 10 reps — everyone starts with this
 *   - Level (25%)     : floor(level / GYM_LEVEL_RATIO) — 1 rep per 10 levels
 *   - Endurance (50%) : floor(endurance / GYM_END_RATIO) — 1 rep per 5 endurance
 *
 * Examples (level=1, end=0.2)  → 10 reps   (new operator)
 *          (level=10, end=5)   → 12 reps
 *          (level=50, end=25)  → 20 reps
 *          (level=100, end=50) → 30 reps
 *          (level=200, end=100)→ 50 reps
 */
export function calcMaxGymEnergy(level: number, endurance: number): number {
  const base = GAME.GYM_BASE_REPS;
  const levelReps = Math.floor(level / GAME.GYM_LEVEL_RATIO);
  const endReps = Math.floor(endurance / GAME.GYM_END_RATIO);
  return base + levelReps + endReps;
}

export function runGymWorkout(
  character: Character,
  workout_type: WorkoutType,
  difficulty: number
): GymResult {
  if (difficulty < 1 || difficulty > 5) {
    throw new Error('Difficulty must be between 1 and 5.');
  }

  const today = new Date().toISOString().split('T')[0];
  const energyDate = character.gym_energy_date;
  const energyUsed = energyDate === today ? character.gym_energy_used : 0;

  const maxEnergy = calcMaxGymEnergy(character.level, character.endurance);
  const cost = difficulty;

  if (energyUsed + cost > maxEnergy) {
    throw new Error(
      `Not enough gym energy. Need ${cost}, have ${maxEnergy - energyUsed} remaining.`
    );
  }

  const baseGain = 0.01 * difficulty * (1 + character.age_days * 0.001);
  const streakMultiplier = 1 + character.gym_streak * GAME.STREAK_BONUS;
  const finalGain = parseFloat((baseGain * streakMultiplier).toFixed(4));

  const currentValue = character[workout_type] as number;
  const newValue = parseFloat((currentValue + finalGain).toFixed(4));

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastGym = character.last_gym_date;
  const newStreak =
    lastGym === yesterday
      ? character.gym_streak + 1
      : lastGym === today
      ? character.gym_streak
      : 1;

  return {
    stat_name: workout_type,
    gain_amount: finalGain,
    new_value: newValue,
    energy_used: energyUsed + cost,
    energy_remaining: maxEnergy - (energyUsed + cost),
    max_energy: maxEnergy,
    streak: newStreak,
  };
}
