import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GAME } from '@/lib/constants';

/**
 * Noon reset — fires at 04:00 UTC (12:00 HKT) every day.
 *
 * Restocks player activity energy:
 *   - Revives dead characters (life_force = 1)
 *   - Resets confidence back to CONFIDENCE_START (does NOT change max_confidence)
 *   - Resets gym_energy_used to 0 so players get a fresh daily pool
 *
 * Stats that are intentionally left untouched:
 *   strength, speed, endurance, panic, max_confidence
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // 1. Revive dead characters
    const { data: revived } = await supabase
      .from('characters')
      .update({ is_dead: false, life_force: 1 })
      .eq('is_dead', true)
      .select('id');

    // 2. Restock confidence (current only) and gym energy for all characters.
    //    max_confidence, strength, speed, endurance, panic are NOT touched.
    await supabase
      .from('characters')
      .update({
        confidence: GAME.CONFIDENCE_START,
        gym_energy_used: 0,
      });

    return NextResponse.json({
      success: true,
      message: 'Noon restock completed (12:00 HKT).',
      revived: revived?.length ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
