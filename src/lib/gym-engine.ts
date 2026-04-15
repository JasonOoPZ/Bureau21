import { Character, GymResult, WorkoutType } from '@/types/game';
import { GAME } from '@/lib/constants';

/**
 * Computes the maximum gym energy (reps) available today for a character.
 *
 * The pool is split 50/50:
 *   - Streak portion  : base reps + streak-day bonus (encourages daily visits)
 *   - Endurance portion: log2-scaled to reward the stat without runaway abuse
 *
 * Examples (streak=0, end=0.2) → ~12 reps/day  (new player)
 *          (streak=7, end=4)   → ~44 reps/day
 *          (streak=30, end=100)→ ~136 reps/day  (veteran)
 *          (streak=30, end=1000)→ ~169 reps/day (max practical)
 */
export function calcMaxGymEnergy(gymStreak: number, endurance: number): number {
  const streak = Math.min(gymStreak, GAME.GYM_STREAK_CAP);
  const streakReps = GAME.GYM_BASE_REPS + streak * GAME.GYM_STREAK_REPS;
  const endReps = Math.floor(Math.log2(1 + endurance) * GAME.GYM_END_SCALE);
  return streakReps + endReps;
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

  const maxEnergy = calcMaxGymEnergy(character.gym_streak, character.endurance);
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
