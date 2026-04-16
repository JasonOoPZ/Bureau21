import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .order('buy_price', { ascending: true });

    return NextResponse.json({ items: items ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const { action, item_id, quantity = 1 } = body as {
      action: 'buy' | 'sell';
      item_id: string;
      quantity: number;
    };

    if (!['buy', 'sell'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    const { data: character } = await supabase
      .from('characters')
      .select('id, credits_hand, level')
      .eq('user_id', user.id)
      .single();

    if (!character) {
      return NextResponse.json({ error: 'Character not found.' }, { status: 404 });
    }

    const { data: item } = await supabase
      .from('items')
      .select('*')
      .eq('id', item_id)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
    }

    if (action === 'buy') {
      if (item.level_req > character.level) {
        return NextResponse.json(
          { error: `Requires level ${item.level_req}.` },
          { status: 400 }
        );
      }
      const cost = item.buy_price * quantity;
      if (character.credits_hand < cost) {
        return NextResponse.json({ error: 'Not enough credits.' }, { status: 400 });
      }

      const { data: existing } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('character_id', character.id)
        .eq('item_id', item_id)
        .single();

      if (existing) {
        await supabase
          .from('inventory')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
      } else {
        await supabase.from('inventory').insert({
          character_id: character.id,
          item_id,
          quantity,
        });
      }

      await supabase
        .from('characters')
        .update({ credits_hand: character.credits_hand - cost })
        .eq('id', character.id);

      return NextResponse.json({
        message: `Bought ${quantity}x ${item.name} for ${cost.toLocaleString()} credits.`,
      });
    } else {
      const { data: inv } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('character_id', character.id)
        .eq('item_id', item_id)
        .single();

      if (!inv || inv.quantity < quantity) {
        return NextResponse.json({ error: 'Not enough items to sell.' }, { status: 400 });
      }

      const earned = item.sell_price * quantity;

      if (inv.quantity === quantity) {
        await supabase.from('inventory').delete().eq('id', inv.id);
      } else {
        await supabase
          .from('inventory')
          .update({ quantity: inv.quantity - quantity })
          .eq('id', inv.id);
      }

      await supabase
        .from('characters')
        .update({ credits_hand: character.credits_hand + earned })
        .eq('id', character.id);

      return NextResponse.json({
        message: `Sold ${quantity}x ${item.name} for ${earned.toLocaleString()} credits.`,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
