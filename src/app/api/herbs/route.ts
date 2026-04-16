import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Character } from '@/types/game';

const HERB_COST = 5;

const HERB_TABLE = [
  { name: 'Blue Herb', weight: 1 },
  { name: 'Golden Herb', weight: 9 },
  { name: 'Red Herb', weight: 30 },
  { name: 'Green Herb', weight: 60 },
];

function pickHerb(): string {
  const total = HERB_TABLE.reduce((s, h) => s + h.weight, 0);
  let rand = Math.random() * total;
  for (const herb of HERB_TABLE) {
    rand -= herb.weight;
    if (rand <= 0) return herb.name;
  }
  return 'Green Herb';
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: character } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!character) {
      return NextResponse.json({ error: 'Character not found.' }, { status: 404 });
    }

    const char = character as Character;

    if (char.motivation < HERB_COST) {
      return NextResponse.json(
        { error: `Not enough motivation. Need ${HERB_COST}.` },
        { status: 400 }
      );
    }

    const herbName = pickHerb();

    // Find the item in database
    const { data: item } = await supabase
      .from('items')
      .select('id')
      .eq('name', herbName)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Item not found in database.' }, { status: 500 });
    }

    // Add to inventory (upsert quantity)
    const { data: existing } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('character_id', char.id)
      .eq('item_id', item.id)
      .single();

    if (existing) {
      await supabase
        .from('inventory')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('inventory').insert({
        character_id: char.id,
        item_id: item.id,
        quantity: 1,
      });
    }

    // Deduct motivation
    await supabase
      .from('characters')
      .update({ motivation: char.motivation - HERB_COST })
      .eq('id', char.id);

    const rarityMap: Record<string, string> = {
      'Blue Herb': '💙 LEGENDARY',
      'Golden Herb': '✨ Rare',
      'Red Herb': '🌹 Uncommon',
      'Green Herb': '🌿 Common',
    };

    return NextResponse.json({
      herb_name: herbName,
      message: `Found: ${herbName} [${rarityMap[herbName] ?? 'Common'}]! Added to inventory.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
