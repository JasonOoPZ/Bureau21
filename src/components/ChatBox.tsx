'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatMessage } from '@/types/game';
import { timeAgo } from '@/lib/utils';

interface Props {
  authorId: string;
  authorName: string;
  room?: string;
}

export default function ChatBox({ authorId, authorName, room = 'town_square' }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('*')
      .eq('room', room)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data.reverse());
      });

    const channel = supabase
      .channel(`chat_${room}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room=eq.${room}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText('');

    await supabase.from('chat_messages').insert({
      room,
      author_id: authorId,
      author_name: authorName,
      body,
    });

    setSending(false);
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 flex flex-col h-80">
      <div className="p-2 border-b border-slate-700">
        <h3 className="text-cyan-400 font-semibold text-sm">💬 {room === 'town_square' ? 'Town Square' : room}</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {messages.map((m) => (
          <div key={m.id} className="text-xs">
            <span className="text-amber-400 font-semibold">{m.author_name}: </span>
            <span className="text-slate-300">{m.body}</span>
            <span className="text-slate-600 ml-1">{timeAgo(m.created_at)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="p-2 border-t border-slate-700 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Say something..."
          className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold rounded text-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}
