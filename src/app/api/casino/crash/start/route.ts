import { createHmac, randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SECRET = process.env.CRON_SECRET ?? 'dev-casino-secret';

/**
 * Provably fair crash point generation.
 * P(crash >= k) = 0.96 / k for k >= 1  →  4% house edge.
 */
function generateCrashPoint(gameId: string): number {
  // Derive a deterministic uniform in [0,1) from the gameId
  const hash = createHmac('sha256', SECRET).update(gameId).digest('hex');
  const h = parseInt(hash.substring(0, 8), 16); // 32-bit int
  const u = h / 0x100000000; // uniform [0, 1)
  const point = 0.96 / (1 - u);
  return Math.max(1.0, Math.floor(point * 100) / 100);
}

function makeToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(data).digest('hex');
  return `${data}.${sig}`;
}

function verifyToken<T>(token: string): T | null {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = createHmac('sha256', SECRET).update(data).digest('hex');
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString()) as T;
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
    const { bet } = body as { bet: number };

    if (!Number.isInteger(bet) || bet <= 0 || bet > 1_000_000) {
      return NextResponse.json({ error: 'Invalid bet amount.' }, { status: 400 });
    }

    const { data: character } = await supabase
      .from('characters')
      .select('id, credits_hand, is_dead, level')
      .eq('user_id', user.id)
      .single();

    if (!character) return NextResponse.json({ error: 'Character not found.' }, { status: 404 });
    if (character.is_dead) return NextResponse.json({ error: 'Dead operators cannot gamble.' }, { status: 403 });
    if (character.level < 8) return NextResponse.json({ error: 'Underbelly requires level 8.' }, { status: 403 });
    if (character.credits_hand < bet) return NextResponse.json({ error: 'Not enough credits.' }, { status: 400 });

    // Deduct bet upfront
    await supabase
      .from('characters')
      .update({ credits_hand: character.credits_hand - bet })
      .eq('id', character.id);

    const gameId = randomUUID();
    const crashPoint = generateCrashPoint(gameId);

    const token = makeToken({
      gameId,
      crashPoint,
      bet,
      charId: character.id,
      ts: Date.now(),
    });

    return NextResponse.json({
      token,
      new_credits: character.credits_hand - bet,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
