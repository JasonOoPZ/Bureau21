import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: me } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (!me) return NextResponse.json({ error: 'Character not found.' }, { status: 404 });

    const url = new URL(request.url);
    const withCharacterId = url.searchParams.get('with');

    // Validate UUID format to prevent injection via string interpolation in .or()
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (withCharacterId) {
      if (!UUID_RE.test(withCharacterId)) {
        return NextResponse.json({ error: 'Invalid character ID.' }, { status: 400 });
      }
      // Fetch conversation thread
      const { data } = await supabase
        .from('direct_messages')
        .select('*, sender:sender_id(id,username), recipient:recipient_id(id,username)')
        .or(
          `and(sender_id.eq.${me.id},recipient_id.eq.${withCharacterId}),and(sender_id.eq.${withCharacterId},recipient_id.eq.${me.id})`
        )
        .order('created_at', { ascending: true });

      // Mark unread messages as read
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('recipient_id', me.id)
        .eq('sender_id', withCharacterId)
        .eq('is_read', false);

      return NextResponse.json({ messages: data ?? [] });
    } else {
      // Fetch inbox — latest message per conversation partner
      const { data } = await supabase
        .from('direct_messages')
        .select('*, sender:sender_id(id,username), recipient:recipient_id(id,username)')
        .or(`sender_id.eq.${me.id},recipient_id.eq.${me.id}`)
        .order('created_at', { ascending: false });

      // Deduplicate by conversation partner
      const seen = new Set<string>();
      const conversations = (data ?? []).filter((msg) => {
        const partner = msg.sender_id === me.id ? msg.recipient_id : msg.sender_id;
        if (seen.has(partner)) return false;
        seen.add(partner);
        return true;
      });

      return NextResponse.json({ conversations });
    }
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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: me } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (!me) return NextResponse.json({ error: 'Character not found.' }, { status: 404 });

    const body = await request.json();
    const { recipientId, message: msgBody } = body as { recipientId: string; message: string };

    if (!recipientId || !msgBody?.trim()) {
      return NextResponse.json({ error: 'Recipient and message are required.' }, { status: 400 });
    }
    if (msgBody.trim().length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 chars).' }, { status: 400 });
    }
    if (recipientId === me.id) {
      return NextResponse.json({ error: "You can't message yourself." }, { status: 400 });
    }

    // Verify recipient exists
    const { data: recipient } = await supabase
      .from('characters')
      .select('id, username')
      .eq('id', recipientId)
      .single();
    if (!recipient) return NextResponse.json({ error: 'Recipient not found.' }, { status: 404 });

    const { error } = await supabase.from('direct_messages').insert({
      sender_id: me.id,
      recipient_id: recipientId,
      body: msgBody.trim(),
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, to: recipient.username });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
