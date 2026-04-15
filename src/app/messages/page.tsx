'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { DirectMessage } from '@/types/game';

interface ConvMsg extends DirectMessage {
  sender: { id: string; username: string } | undefined;
  recipient: { id: string; username: string } | undefined;
}

export default function MessagesPage() {
  const [myId, setMyId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConvMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; level: number }[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; username: string } | null>(null);
  const [msgBody, setMsgBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const loadConversations = useCallback(async () => {
    const resp = await fetch('/api/messages');
    if (resp.ok) {
      const data = await resp.json();
      setConversations(data.conversations ?? []);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      const { data } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      if (data) setMyId(data.id);
      await loadConversations();
      setLoading(false);
    });
  }, [supabase, router, loadConversations]);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const resp = await fetch(`/api/players?q=${encodeURIComponent(q)}`);
    if (resp.ok) {
      const data = await resp.json();
      setSearchResults(data.players ?? []);
    }
  }

  async function handleSend() {
    if (!selectedRecipient || !msgBody.trim()) return;
    setSending(true);
    setSendError(null);
    const resp = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: selectedRecipient.id, message: msgBody }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      setSendError(data.error ?? 'Failed to send.');
    } else {
      setComposeOpen(false);
      setSelectedRecipient(null);
      setMsgBody('');
      setSearchQuery('');
      setSearchResults([]);
      await loadConversations();
      router.push(`/messages/${selectedRecipient.id}`);
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
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div className="border-b border-slate-700 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-500">✉️ Messages</h1>
          <p className="text-slate-400 text-sm mt-1">Private comms between operators</p>
        </div>
        <button
          onClick={() => setComposeOpen(!composeOpen)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-lg text-sm min-h-[48px]"
        >
          ✏️ New Message
        </button>
      </div>

      {composeOpen && (
        <div className="bg-slate-800 border border-amber-500/40 rounded-lg p-4 space-y-3">
          <h3 className="text-amber-400 font-semibold text-sm">New Direct Message</h3>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Search by Player ID or Name</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Enter player name or ID..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
            />
            {searchResults.length > 0 && !selectedRecipient && (
              <ul className="mt-1 bg-slate-900 border border-slate-600 rounded-lg divide-y divide-slate-700">
                {searchResults.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => { setSelectedRecipient(p); setSearchQuery(p.username); setSearchResults([]); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                    >
                      <span className="font-semibold">{p.username}</span>
                      <span className="text-slate-500 ml-2 text-xs">Lv {p.level}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedRecipient && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-cyan-400 text-xs">→ {selectedRecipient.username}</span>
                <button
                  onClick={() => { setSelectedRecipient(null); setSearchQuery(''); }}
                  className="text-slate-500 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Message</label>
            <textarea
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Type your message..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm resize-none"
            />
            <p className="text-slate-600 text-xs text-right">{msgBody.length}/1000</p>
          </div>
          {sendError && (
            <p className="text-red-400 text-xs">{sendError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSend}
              disabled={sending || !selectedRecipient || !msgBody.trim()}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-sm"
            >
              {sending ? 'Sending...' : '📨 Send'}
            </button>
            <button
              onClick={() => setComposeOpen(false)}
              className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-500 text-4xl mb-3">📭</p>
          <p className="text-slate-400 text-sm">No messages yet.</p>
          <p className="text-slate-500 text-xs mt-1">Hit &quot;New Message&quot; to reach another operator.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const isMe = conv.sender?.id === myId;
            const partner = isMe ? conv.recipient : conv.sender;
            const unread = !conv.is_read && !isMe;
            return (
              <Link
                key={conv.id}
                href={`/messages/${partner?.id}`}
                className={`block bg-slate-800 hover:bg-slate-750 border rounded-lg p-4 transition-colors ${unread ? 'border-cyan-500/60' : 'border-slate-700'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold text-sm ${unread ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {unread && <span className="w-2 h-2 bg-cyan-400 rounded-full inline-block mr-2 mb-0.5" />}
                    {partner?.username ?? 'Unknown'}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {new Date(conv.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-400 text-xs truncate">
                  {isMe ? <span className="text-slate-500">You: </span> : null}
                  {conv.body}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
