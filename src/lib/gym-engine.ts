import { Character, GymResult, WorkoutType } from '@/types/game';
import { GAME } from '@/lib/constants';

export function runGymWorkout(
  character: Character,
  workout_type: WorkoutType,
  difficulty: number
): GymResult {
  const cost = 5 + difficulty * 2;

  if (character.motivation < cost) {
    throw new Error(
      `Not enough motivation. Need ${cost}, have ${character.motivation}.`
    );
  }

  if (difficulty < 1 || difficulty > 5) {
    throw new Error('Difficulty must be between 1 and 5.');
  }

  const baseGain = 0.01 * difficulty * (1 + character.age_days * 0.001);
  const streakMultiplier = 1 + character.gym_streak * GAME.STREAK_BONUS;
  const finalGain = baseGain * streakMultiplier;

  const currentValue = character[workout_type] as number;
  const newValue = parseFloat((currentValue + finalGain).toFixed(4));
  const motivationRemaining = character.motivation - cost;

  const today = new Date().toISOString().split('T')[0];
  const lastGym = character.last_gym_date;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
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
    motivation_remaining: motivationRemaining,
    streak: newStreak,
  };
}
