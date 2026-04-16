import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runGymWorkout } from '@/lib/gym-engine';
import { Character, WorkoutType } from '@/types/game';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workout_type, difficulty } = body as {
      workout_type: WorkoutType;
      difficulty: number;
    };

    const validWorkouts: WorkoutType[] = ['strength', 'speed', 'endurance', 'panic'];
    if (!validWorkouts.includes(workout_type)) {
      return NextResponse.json({ error: 'Invalid workout type.' }, { status: 400 });
    }
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
      return NextResponse.json({ error: 'Difficulty must be 1–5.' }, { status: 400 });
    }

    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (charError || !character) {
      return NextResponse.json({ error: 'Character not found.' }, { status: 404 });
    }

    const char = character as Character;

    if (char.is_dead) {
      return NextResponse.json({ error: 'You are dead. Wait for revival.' }, { status: 400 });
    }

    const result = runGymWorkout(char, workout_type, difficulty);

    const today = new Date().toISOString().split('T')[0];

    const { error: updateError } = await supabase
      .from('characters')
      .update({
        [workout_type]: result.new_value,
        gym_streak: result.streak,
        last_gym_date: today,
        gym_energy_used: result.energy_used,
        gym_energy_date: today,
      })
      .eq('id', char.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update character.' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
