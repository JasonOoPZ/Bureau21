import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();
    if (!q) return NextResponse.json({ players: [] });

    // Search by exact ID (UUID) or username (case-insensitive prefix match)
    const isUUID = /^[0-9a-f-]{36}$/i.test(q);
    let query = supabase
      .from('characters')
      .select('id, username, level')
      .limit(10);

    if (isUUID) {
      query = query.eq('id', q);
    } else {
      query = query.ilike('username', `%${q}%`);
    }

    const { data } = await query;
    return NextResponse.json({ players: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
