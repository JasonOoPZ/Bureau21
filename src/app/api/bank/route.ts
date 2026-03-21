import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Character } from '@/types/game';

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
    const { action, amount } = body as { action: 'deposit' | 'withdraw'; amount: number };

    if (!['deposit', 'withdraw'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive integer.' }, { status: 400 });
    }

    const { data: character } = await supabase
      .from('characters')
      .select('id, credits_hand, credits_bank')
      .eq('user_id', user.id)
      .single();

    if (!character) {
      return NextResponse.json({ error: 'Character not found.' }, { status: 404 });
    }

    const char = character as Pick<Character, 'id' | 'credits_hand' | 'credits_bank'>;

    if (action === 'deposit') {
      if (char.credits_hand < amount) {
        return NextResponse.json({ error: 'Not enough credits on hand.' }, { status: 400 });
      }
      await supabase
        .from('characters')
        .update({
          credits_hand: char.credits_hand - amount,
          credits_bank: char.credits_bank + amount,
        })
        .eq('id', char.id);

      return NextResponse.json({
        message: `Deposited ${amount.toLocaleString()} credits into the bank.`,
      });
    } else {
      if (char.credits_bank < amount) {
        return NextResponse.json({ error: 'Not enough credits in bank.' }, { status: 400 });
      }
      await supabase
        .from('characters')
        .update({
          credits_hand: char.credits_hand + amount,
          credits_bank: char.credits_bank - amount,
        })
        .eq('id', char.id);

      return NextResponse.json({
        message: `Withdrew ${amount.toLocaleString()} credits from the bank.`,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
