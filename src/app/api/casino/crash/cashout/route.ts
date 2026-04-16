import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SECRET = process.env.CRON_SECRET ?? 'dev-casino-secret';

interface CrashToken {
  gameId: string;
  crashPoint: number;
  bet: number;
  charId: string;
  ts: number;
}

function verifyToken(token: string): CrashToken | null {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = createHmac('sha256', SECRET).update(data).digest('hex');
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString()) as CrashToken;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { token, cashout_multiplier } = body as { token: string; cashout_multiplier: number };

    if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 });
    if (!cashout_multiplier || cashout_multiplier < 1) {
      return NextResponse.json({ error: 'Invalid cashout multiplier.' }, { status: 400 });
    }

    const state = verifyToken(token);
    if (!state) return NextResponse.json({ error: 'Invalid game token.' }, { status: 400 });

    // Verify it's this user's game
    const { data: character } = await supabase
      .from('characters')
      .select('id, credits_hand')
      .eq('user_id', user.id)
      .single();

    if (!character || character.id !== state.charId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    // Game expired after 5 minutes
    if (Date.now() - state.ts > 5 * 60 * 1000) {
      return NextResponse.json({
        won: false,
        crash_point: state.crashPoint,
        payout: 0,
        net_change: -state.bet,
        new_credits: character.credits_hand,
        message: 'Game expired.',
      });
    }

    const won = cashout_multiplier <= state.crashPoint;
    const payout = won ? Math.floor(state.bet * cashout_multiplier) : 0;
    const newCredits = character.credits_hand + payout;

    if (payout > 0) {
      await supabase
        .from('characters')
        .update({ credits_hand: newCredits })
        .eq('id', character.id);
    }

    return NextResponse.json({
      won,
      crash_point: state.crashPoint,
      cashout_multiplier: won ? cashout_multiplier : null,
      payout,
      net_change: payout - state.bet,
      new_credits: newCredits,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
