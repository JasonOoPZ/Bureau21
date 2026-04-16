import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GAME } from '@/lib/constants';

/**
 * Midnight reset — fires at 00:00 UTC every day.
 *
 * Handles economy progression:
 *   - Revives dead characters
 *   - Increments age_days
 *   - Adds daily motivation (+ guild bonus if applicable)
 *   - Decrements welfare days
 *   - Grants daily tokens
 *   - Expires newbie protection when due
 *
 * Confidence + gym energy are restocked by the noon reset (midday-reset at 04:00 UTC / 12:00 HKT).
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // 1. Revive all dead characters
    await supabase
      .from('characters')
      .update({ is_dead: false, life_force: 1 })
      .eq('is_dead', true);

    // 2. Increment age_days, add motivation, grant tokens
    const { data: allChars } = await supabase
      .from('characters')
      .select('id, age_days, motivation, max_motivation, welfare_days_remaining, tokens, is_newbie, newbie_until, syndicate_id');

    if (allChars) {
      const now = new Date();

      for (const char of allChars) {
        const motivationGain = GAME.MOTIVATION_DAILY_BASE + (char.syndicate_id ? GAME.MOTIVATION_GUILD_BONUS : 0);
        const newMotivation = Math.min(char.motivation + motivationGain, char.max_motivation);
        const newWelfare = Math.max(0, char.welfare_days_remaining - 1);
        const newIsNewbie = new Date(char.newbie_until) > now ? char.is_newbie : false;

        await supabase
          .from('characters')
          .update({
            age_days: char.age_days + 1,
            motivation: newMotivation,
            welfare_days_remaining: newWelfare,
            is_newbie: newIsNewbie,
            tokens: char.tokens + GAME.TOKENS_DAILY,
          })
          .eq('id', char.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Daily reset completed.',
      processed: allChars?.length ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
