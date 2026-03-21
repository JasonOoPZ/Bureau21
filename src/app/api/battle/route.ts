import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runBattle } from '@/lib/battle-engine';
import { Character, Item } from '@/types/game';
import { getCurrentSeason, isProtected } from '@/lib/constants';

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
    const { defender_id } = body as { defender_id: string };

    if (!defender_id) {
      return NextResponse.json({ error: 'defender_id required' }, { status: 400 });
    }

    const { data: attackerData } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!attackerData) {
      return NextResponse.json({ error: 'Attacker character not found.' }, { status: 404 });
    }

    const attacker = attackerData as Character;

    if (attacker.is_dead) {
      return NextResponse.json({ error: 'You are dead.' }, { status: 400 });
    }

    if (attacker.id === defender_id) {
      return NextResponse.json({ error: 'Cannot battle yourself.' }, { status: 400 });
    }

    const { data: defenderData } = await supabase
      .from('characters')
      .select('*')
      .eq('id', defender_id)
      .single();

    if (!defenderData) {
      return NextResponse.json({ error: 'Defender not found.' }, { status: 404 });
    }

    const defender = defenderData as Character;

    if (defender.is_dead) {
      return NextResponse.json({ error: 'Target is already dead.' }, { status: 400 });
    }

    if (isProtected(defender.age_days, defender.level)) {
      return NextResponse.json({ error: 'Target has newbie protection.' }, { status: 400 });
    }

    // Get equipped weapon for attacker
    const { data: atkWeaponData } = await supabase
      .from('inventory')
      .select('*, item:items(*)')
      .eq('character_id', attacker.id)
      .eq('is_equipped', true)
      .single();

    const weapon: Item | null =
      atkWeaponData?.item?.type === 'weapon' ? (atkWeaponData.item as Item) : null;

    // Get equipped armor for defender
    const { data: defArmorData } = await supabase
      .from('inventory')
      .select('*, item:items(*)')
      .eq('character_id', defender.id)
      .eq('is_equipped', true)
      .single();

    const armor: Item | null =
      defArmorData?.item?.type === 'armor' ? (defArmorData.item as Item) : null;

    const result = runBattle(attacker, defender, weapon, armor);

    const attackerWon = result.winner_id === attacker.id;

    // Update attacker
    const atkUpdates: Partial<Character> = {
      is_dead: !result.attacker_survived,
      credits_hand: attacker.credits_hand + result.credits_stolen,
      xp: attacker.xp + result.xp_gained,
      alignment: attacker.alignment + result.alignment_change,
    };

    if (!result.attacker_survived) {
      atkUpdates.life_force = 0;
    }

    // Check for level up
    const { xpForLevel } = await import('@/lib/constants');
    let newLevel = attacker.level;
    let newXP = atkUpdates.xp ?? attacker.xp;
    while (newXP >= xpForLevel(newLevel + 1)) {
      newXP -= xpForLevel(newLevel + 1);
      newLevel++;
    }
    atkUpdates.level = newLevel;
    atkUpdates.xp = newXP;

    await supabase.from('characters').update(atkUpdates).eq('id', attacker.id);

    // Update defender
    const defUpdates: Partial<Character> = {
      is_dead: !result.defender_survived,
      credits_hand: Math.max(0, defender.credits_hand - result.credits_stolen),
    };
    if (!result.defender_survived) {
      defUpdates.life_force = 0;
    }
    await supabase.from('characters').update(defUpdates).eq('id', defender.id);

    // Record battle
    await supabase.from('battles').insert({
      attacker_id: attacker.id,
      defender_id: defender.id,
      winner_id: result.winner_id,
      xp_gained: result.xp_gained,
      credits_stolen: result.credits_stolen,
      alignment_change: result.alignment_change,
      log_text: result.log_entries.join('\n'),
    });

    // Add kill feed entry if defender died
    if (!result.defender_survived) {
      await supabase.from('kill_feed').insert({
        event_type: 'kill',
        message: `${attacker.username} eliminated ${defender.username} and took ${result.credits_stolen} credits.`,
        actor_id: attacker.id,
        target_id: defender.id,
      });
    }

    // Update leaderboard
    const season = getCurrentSeason();
    const { data: existing } = await supabase
      .from('leaderboards')
      .select('id, score')
      .eq('character_id', attacker.id)
      .eq('season', season)
      .eq('category', 'warlord')
      .single();

    if (existing) {
      await supabase
        .from('leaderboards')
        .update({ score: existing.score + (attackerWon ? 1 : 0), updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else if (attackerWon) {
      await supabase.from('leaderboards').insert({
        character_id: attacker.id,
        season,
        category: 'warlord',
        score: 1,
      });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
