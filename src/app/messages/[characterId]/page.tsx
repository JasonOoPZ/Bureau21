'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { DirectMessage } from '@/types/game';

interface ThreadMsg extends DirectMessage {
  sender: { id: string; username: string } | undefined;
  recipient: { id: string; username: string } | undefined;
}

export default function ConversationPage() {
  const params = useParams();
  const characterId = params.characterId as string;
  const [myId, setMyId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState('...');
  const [messages, setMessages] = useState<ThreadMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const loadMessages = useCallback(async () => {
    const resp = await fetch(`/api/messages?with=${characterId}`);
    if (resp.ok) {
      const data = await resp.json();
      setMessages(data.messages ?? []);
    }
  }, [characterId]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      const { data: me } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      if (me) setMyId(me.id);

      const { data: partner } = await supabase
        .from('characters')
        .select('id, username')
        .eq('id', characterId)
        .single();
      if (partner) setPartnerName(partner.username);

      await loadMessages();
      setLoading(false);
    });
  }, [supabase, router, characterId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!reply.trim()) return;
    setSending(true);
    setError(null);
    const resp = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: characterId, message: reply }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      setError(data.error ?? 'Failed to send.');
    } else {
      setReply('');
      await loadMessages();
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl flex flex-col h-full space-y-4">
      <div className="border-b border-slate-700 pb-4">
        <Link href="/messages" className="text-slate-400 text-sm hover:text-slate-200 mb-2 block">
          ← Back to Messages
        </Link>
        <h1 className="text-xl font-bold text-amber-500">💬 {partnerName}</h1>
        <p className="text-slate-500 text-xs font-mono mt-0.5">ID: {characterId}</p>
      </div>

      <div className="flex-1 space-y-3 min-h-0 overflow-y-auto max-h-[60vh]">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">No messages yet. Say something.</p>
        )}
        {messages.map((msg) => {
          const mine = msg.sender_id === myId;
          return (
            <div
              key={msg.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  mine
                    ? 'bg-amber-600/30 border border-amber-600/50 text-slate-100'
                    : 'bg-slate-800 border border-slate-700 text-slate-200'
                }`}
              >
                <p className={`text-xs mb-1 ${mine ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {mine ? 'You' : (msg.sender?.username ?? partnerName)}
                </p>
                <p className="text-sm leading-relaxed">{msg.body}</p>
                <p className="text-xs text-slate-500 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                  {new Date(msg.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-2">
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            maxLength={1000}
            placeholder="Reply... (Enter to send)"
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm resize-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !reply.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold px-4 rounded-lg text-sm min-h-[48px]"
          >
            📨
          </button>
        </div>
      </div>
    </div>
  );
}
