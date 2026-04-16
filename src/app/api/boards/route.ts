import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BoardType } from '@/types/game';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { board, title, body } = await request.json();

  if (!board || !title || !body) {
    return NextResponse.json({ error: 'board, title, and body are required' }, { status: 400 });
  }

  if (title.trim().length < 3 || title.trim().length > 120) {
    return NextResponse.json({ error: 'Title must be 3–120 characters' }, { status: 400 });
  }

  if (body.trim().length < 5 || body.trim().length > 5000) {
    return NextResponse.json({ error: 'Body must be 5–5000 characters' }, { status: 400 });
  }

  const { data: character, error: charError } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (charError) {
    return NextResponse.json({ error: 'Failed to retrieve character' }, { status: 500 });
  }

  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  const { error } = await supabase.from('messages').insert({
    board: board as BoardType,
    author_id: character.id,
    title: title.trim(),
    body: body.trim(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
