"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ChatMsg {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
}

interface Props {
  initialMessages: ChatMsg[];
  currentUser: string;
}

export function ChatClient({ initialMessages, currentUser }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unread, setUnread] = useState(0);

  // Track if the user is scrolled to bottom
  function handleScroll() {
    const el = feedRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAtBottom(near);
    if (near) setUnread(0);
  }

  // Auto-scroll if at bottom
  useEffect(() => {
    if (atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnread(0);
    }
  }, [messages, atBottom]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/game/chat");
      if (res.ok) {
        const data = await res.json();
        const fetched: ChatMsg[] = data.messages.map(
          (m: { id: string; body: string; author: { name: string }; createdAt: string }) => ({
            id: m.id,
            body: m.body,
            authorName: m.author?.name ?? "Unknown",
            createdAt: m.createdAt,
          })
        );
        setMessages((prev) => {
          const newMsgCount = fetched.length - prev.length;
          if (newMsgCount > 0 && !atBottom) {
            setUnread((u) => u + newMsgCount);
          }
          return fetched;
        });
        if (data.onlineCount != null) setOnlineCount(data.onlineCount);
      }
    } catch { /* ignore */ }
  }, [atBottom]);

  // Poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 5_000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/game/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Send failed.");
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          body: data.message.body,
          authorName: currentUser,
          createdAt: new Date().toISOString(),
        },
      ]);
      setInput("");
      setAtBottom(true);
    } catch {
      setError("Connection error.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setAtBottom(true);
    setUnread(0);
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex h-[70vh] flex-col rounded-md border border-slate-800 bg-[#0a0d11]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Station Chat</p>
        {onlineCount != null && (
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
            <span className="text-[10px] text-emerald-400">{onlineCount} online</span>
          </div>
        )}
      </div>

      {/* Message feed */}
      <div ref={feedRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {messages.length === 0 && (
          <p className="py-8 text-center text-[11px] text-slate-600">
            No messages yet. Start the conversation.
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.authorName === currentUser;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div
                className={`max-w-[75%] rounded-md px-3 py-1.5 text-[12px] ${
                  isMe
                    ? "bg-cyan-950/50 text-cyan-100"
                    : "bg-slate-900/60 text-slate-200"
                }`}
              >
                {!isMe && (
                  <span className="block text-[10px] text-cyan-500 font-medium mb-0.5">
                    {msg.authorName}
                  </span>
                )}
                <span>{msg.body}</span>
              </div>
              <span className="self-end text-[9px] text-slate-600">{fmt(msg.createdAt)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />

        {/* Unread badge */}
        {unread > 0 && !atBottom && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 z-10 rounded-full border border-cyan-600 bg-cyan-950/90 px-3 py-1 text-[10px] font-semibold text-cyan-200 shadow-lg transition hover:bg-cyan-900"
          >
            {unread} new message{unread > 1 ? "s" : ""} ↓
          </button>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 p-3">
        {error && (
          <p className="mb-1.5 text-[10px] text-red-400">{error}</p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            maxLength={500}
            className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] text-slate-200 placeholder-slate-600 focus:border-cyan-600 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="rounded border border-cyan-800 bg-cyan-950/40 px-4 py-2 text-[12px] font-medium text-cyan-300 transition hover:bg-cyan-950/70 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
        <p className="mt-1 text-[9px] text-slate-700">Auto-refreshes every 5s · 3s cooldown between messages</p>
      </div>
    </div>
  );
}
