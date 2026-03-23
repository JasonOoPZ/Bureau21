"use client";

import { useCallback, useState } from "react";

interface QuickPost {
  id: string;
  body: string;
  read: boolean;
  createdAt: string;
  from?: { id: string; name: string | null };
  to?: { id: string; name: string | null };
}

type Tab = "inbox" | "sent" | "compose";

export function QuickPostClient({
  initialReceived,
  initialSent,
  initialUnread,
}: {
  initialReceived: QuickPost[];
  initialSent: QuickPost[];
  initialUnread: number;
}) {
  const [received, setReceived] = useState<QuickPost[]>(initialReceived);
  const [sent, setSent] = useState<QuickPost[]>(initialSent);
  const [unread, setUnread] = useState(initialUnread);
  const [tab, setTab] = useState<Tab>("inbox");
  const [toCallsign, setToCallsign] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const flash = (m: string, isErr = false) => {
    if (isErr) setErr(m);
    else setMsg(m);
    setTimeout(() => { setMsg(null); setErr(null); }, 4000);
  };

  // Mark all as read when inbox tab opens
  const markAllRead = useCallback(async () => {
    if (unread === 0) return;
    await fetch("/api/game/quickpost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setReceived((prev) => prev.map((p) => ({ ...p, read: true })));
    setUnread(0);
  }, [unread]);

  const handleSend = async () => {
    if (!toCallsign.trim() || !body.trim()) return;
    setBusy(true);
    const res = await fetch("/api/game/quickpost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toCallsign: toCallsign.trim(), body: body.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error ?? "Send failed.", true);
    } else {
      setSent((prev) => [data.post, ...prev]);
      flash(`Message sent to ${toCallsign}.`);
      setToCallsign("");
      setBody("");
      setTab("sent");
    }
    setBusy(false);
  };

  const fmt = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-3">
      {/* Alert */}
      {(msg || err) && (
        <div className={`rounded border px-3 py-2 text-[11px] ${err ? "border-red-800/60 bg-red-950/20 text-red-400" : "border-emerald-800/60 bg-emerald-950/20 text-emerald-300"}`}>
          {msg ?? err}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1">
        {([
          { id: "inbox", label: `Inbox${unread > 0 ? ` (${unread})` : ""}` },
          { id: "sent", label: "Sent" },
          { id: "compose", label: "+ Compose" },
        ] as { id: Tab; label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              if (id === "inbox") {
                void markAllRead();
              }
            }}
            className={`rounded border px-3 py-1.5 text-[10px] uppercase tracking-wider transition ${
              tab === id
                ? "border-cyan-700 bg-cyan-900/20 text-cyan-300"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}
          >
            {unread > 0 && id === "inbox" ? (
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                {label}
              </span>
            ) : (
              label
            )}
          </button>
        ))}
      </div>

      {/* Inbox */}
      {tab === "inbox" && (
        <div className="space-y-1.5">
          {received.length === 0 ? (
            <div className="rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-8 text-center">
              <p className="text-[11px] text-slate-600">No messages received yet.</p>
            </div>
          ) : (
            received.map((p) => (
              <div
                key={p.id}
                className={`rounded-md border px-4 py-3 ${
                  p.read ? "border-slate-800 bg-[#0a0d11]" : "border-cyan-900/50 bg-cyan-950/10"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-slate-200">
                    {p.from?.name ?? "Unknown"}
                    {!p.read && (
                      <span className="ml-2 text-[9px] uppercase tracking-widest text-cyan-400">New</span>
                    )}
                  </span>
                  <span className="text-[9px] text-slate-600">{fmt(p.createdAt)}</span>
                </div>
                <p className="text-[11px] text-slate-400 whitespace-pre-wrap">{p.body}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sent */}
      {tab === "sent" && (
        <div className="space-y-1.5">
          {sent.length === 0 ? (
            <div className="rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-8 text-center">
              <p className="text-[11px] text-slate-600">No messages sent.</p>
            </div>
          ) : (
            sent.map((p) => (
              <div key={p.id} className="rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] text-slate-400">
                    To: <span className="text-slate-200">{p.to?.name ?? "Unknown"}</span>
                  </span>
                  <span className="text-[9px] text-slate-600">{fmt(p.createdAt)}</span>
                </div>
                <p className="text-[11px] text-slate-400 whitespace-pre-wrap">{p.body}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Compose */}
      {tab === "compose" && (
        <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">New Quick Post</p>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">To (pilot callsign)</label>
            <input
              value={toCallsign}
              onChange={(e) => setToCallsign(e.target.value)}
              maxLength={40}
              placeholder="Enter exact callsign"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-[12px] text-slate-200 placeholder-slate-600 focus:border-cyan-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Message (max 500)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="What do you want to say?"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 focus:border-cyan-700 focus:outline-none resize-none"
            />
            <p className="mt-0.5 text-right text-[9px] text-slate-600">{body.length}/500</p>
          </div>
          <button
            onClick={handleSend}
            disabled={busy || !toCallsign.trim() || !body.trim()}
            className="rounded border border-cyan-700 bg-cyan-900/20 px-4 py-1.5 text-[11px] text-cyan-200 hover:bg-cyan-900/40 disabled:opacity-50 transition"
          >
            {busy ? "Sending…" : "Send Post"}
          </button>
        </div>
      )}
    </div>
  );
}
