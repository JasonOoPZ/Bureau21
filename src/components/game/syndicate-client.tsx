"use client";

import { useState } from "react";

interface SyndicateInfo {
  id: string;
  name: string;
  tag: string;
  description: string;
  treasury: number;
  leaderId: string;
  memberCount: number;
}

type View = "roster" | "create" | "join";

export function SyndicateClient({
  pilotId,
  initialCurrent,
  initialRole,
  initialList,
}: {
  pilotId: string;
  initialCurrent: SyndicateInfo | null;
  initialRole: string | null;
  initialList: SyndicateInfo[];
}) {
  const [current, setCurrent] = useState<SyndicateInfo | null>(initialCurrent);
  const [role, setRole] = useState<string | null>(initialRole);
  const [list, setList] = useState<SyndicateInfo[]>(initialList);
  const [view, setView] = useState<View>("roster");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Form state
  const [createName, setCreateName] = useState("");
  const [createTag, setCreateTag] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [joinTag, setJoinTag] = useState("");

  const flash = (m: string, isErr = false) => {
    if (isErr) setErr(m);
    else setMsg(m);
    setTimeout(() => {
      setMsg(null);
      setErr(null);
    }, 4000);
  };

  const refresh = async () => {
    const res = await fetch("/api/game/syndicate");
    const data = await res.json();
    setCurrent(data.current);
    setRole(data.currentRole);
    setList(data.syndicates);
  };

  const handleCreate = async () => {
    setBusy(true);
    const res = await fetch("/api/game/syndicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName, tag: createTag, description: createDesc }),
    });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error ?? "Failed.", true);
    } else {
      await refresh();
      setView("roster");
      flash(`Syndicate [${createTag.toUpperCase()}] ${createName} founded.`);
      setCreateName("");
      setCreateTag("");
      setCreateDesc("");
    }
    setBusy(false);
  };

  const handleJoin = async () => {
    setBusy(true);
    const res = await fetch("/api/game/syndicate/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: joinTag }),
    });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error ?? "Failed.", true);
    } else {
      await refresh();
      setView("roster");
      flash(`Joined [${joinTag.toUpperCase()}].`);
      setJoinTag("");
    }
    setBusy(false);
  };

  const handleLeave = async () => {
    if (!confirm("Leave your syndicate? If you are the last member it will be disbanded.")) return;
    setBusy(true);
    const res = await fetch("/api/game/syndicate/leave", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error ?? "Failed.", true);
    } else {
      setCurrent(null);
      setRole(null);
      await refresh();
      flash(data.disbanded ? "Syndicate disbanded." : "You left the syndicate.");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      {/* Status messages */}
      {(msg || err) && (
        <div
          className={`rounded border px-3 py-2 text-[11px] ${
            err
              ? "border-red-800/60 bg-red-950/20 text-red-400"
              : "border-emerald-800/60 bg-emerald-950/20 text-emerald-300"
          }`}
        >
          {msg ?? err}
        </div>
      )}

      {/* Current syndicate card */}
      {current ? (
        <div className="rounded-md border border-purple-900/60 bg-gradient-to-r from-purple-950/20 to-slate-950 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded border border-purple-700 px-2 py-1 text-[10px] font-bold tracking-widest text-purple-300">
                  [{current.tag}]
                </span>
                <span className="text-[16px] font-bold text-slate-100">{current.name}</span>
              </div>
              {current.description && (
                <p className="mt-2 text-[11px] text-slate-400">{current.description}</p>
              )}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded border border-slate-700 bg-slate-900/40 p-2">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Role</p>
                  <p className="text-[11px] text-purple-300 font-semibold capitalize mt-0.5">{role}</p>
                </div>
                <div className="rounded border border-slate-700 bg-slate-900/40 p-2">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Members</p>
                  <p className="text-[11px] text-slate-300 font-semibold mt-0.5">{current.memberCount}</p>
                </div>
                <div className="rounded border border-slate-700 bg-slate-900/40 p-2">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Treasury</p>
                  <p className="text-[11px] text-amber-300 font-semibold font-mono mt-0.5">{current.treasury}</p>
                </div>
                <div className="rounded border border-slate-700 bg-slate-900/40 p-2">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Status</p>
                  <p className="text-[11px] text-cyan-300 font-semibold mt-0.5">Active</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLeave}
              disabled={busy}
              className="shrink-0 rounded border border-red-900/50 bg-red-950/20 px-3 py-1.5 text-[10px] font-medium text-red-400 hover:border-red-700 hover:bg-red-950/30 disabled:opacity-50 transition"
            >
              Leave
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-4">
          <p className="text-[11px] text-slate-500">
            You are not in a syndicate.{" "}
            <button onClick={() => setView("create")} className="text-cyan-400 hover:underline font-semibold">
              Found one
            </button>{" "}
            or{" "}
            <button onClick={() => setView("join")} className="text-cyan-400 hover:underline font-semibold">
              join by tag.
            </button>
          </p>
        </div>
      )}

      {/* Nav tabs */}
      {!current && (
        <div className="flex gap-1">
          {(["roster", "create", "join"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded border px-3 py-1.5 text-[10px] uppercase tracking-wider transition ${
                view === v
                  ? "border-purple-700 bg-purple-900/20 text-purple-300"
                  : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}
            >
              {v === "roster" ? "All Syndicates" : v === "create" ? "+ Create" : "Join by Tag"}
            </button>
          ))}
        </div>
      )}

      {/* Create form */}
      {view === "create" && !current && (
        <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4 space-y-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-300 mb-1">
              🎖️ Found a Syndicate
            </p>
            <p className="text-[10px] text-slate-500">
              Create your own faction to recruit pilots, pool resources, and dominate the fringe.
            </p>
          </div>

          {/* Name input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider">Syndicate Name</label>
              <span className="text-[9px] text-slate-600">{createName.length}/40</span>
            </div>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              maxLength={40}
              placeholder="e.g. Void Corsairs"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-[12px] text-slate-200 placeholder-slate-600 focus:border-purple-700 focus:outline-none transition"
            />
            <p className="mt-1 text-[9px] text-slate-600">
              {createName.length < 3 ? "✗ Minimum 3 characters" : "✓ Valid"}
            </p>
          </div>

          {/* Tag input */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">
              Faction Tag (2–6 chars, A-Z & 0-9 only)
            </label>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  value={createTag}
                  onChange={(e) => setCreateTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  maxLength={6}
                  placeholder="VOIDC"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-[12px] font-mono text-purple-300 placeholder-slate-600 focus:border-purple-700 focus:outline-none transition"
                />
                <p className="mt-1 text-[9px] text-slate-600">
                  {createTag.length === 0 ? "Min 2 chars required" : createTag.length < 2 ? `${2 - createTag.length} more needed` : "✓ Valid"}
                </p>
              </div>
              <div className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-[11px] font-mono text-slate-400 font-bold">
                [{createTag || "TAG"}]
              </div>
            </div>
          </div>

          {/* Description input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider">Description (Optional)</label>
              <span className="text-[9px] text-slate-600">{createDesc.length}/200</span>
            </div>
            <textarea
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="E.g. Elite PvP faction recruiting experienced pilots. Focus on battle training and territory control."
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] text-slate-300 placeholder-slate-600 focus:border-purple-700 focus:outline-none transition resize-none"
            />
          </div>

          {/* Creation guidelines */}
          <div className="rounded border border-slate-800 bg-slate-950 p-2.5 space-y-1 text-[9px] text-slate-500">
            <p className="font-semibold text-slate-400">Founding Benefits:</p>
            <ul className="space-y-0.5">
              <li>✓ Become the Faction Leader with full control</li>
              <li>✓ Access shared Treasury for pooled resources</li>
              <li>✓ Recruit members and assign roles</li>
              <li>✓ Participate in Syndicate Wars (coming soon)</li>
            </ul>
          </div>

          <button
            onClick={handleCreate}
            disabled={busy || createName.length < 3 || createTag.length < 2}
            className="w-full rounded border border-purple-700 bg-purple-900/40 px-4 py-2.5 text-[12px] font-semibold text-purple-200 hover:bg-purple-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {busy ? "🔄 Founding Syndicate..." : "🎖️ Found Syndicate"}
          </button>
        </div>
      )}

      {/* Join form */}
      {view === "join" && !current && (
        <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4 space-y-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-300 mb-1">
              🤝 Join a Syndicate
            </p>
            <p className="text-[10px] text-slate-500">
              Enter a faction&apos;s tag to request membership.
            </p>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">
              Faction Tag (A-Z, 0-9)
            </label>
            <div className="flex gap-2">
              <input
                value={joinTag}
                onChange={(e) => setJoinTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                maxLength={6}
                placeholder="VOIDC"
                className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-[12px] font-mono text-purple-300 placeholder-slate-600 focus:border-purple-700 focus:outline-none transition"
              />
              <button
                onClick={handleJoin}
                disabled={busy || joinTag.length < 2}
                className="rounded border border-purple-700 bg-purple-900/40 px-4 py-2 text-[11px] font-semibold text-purple-200 hover:bg-purple-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {busy ? "🔄" : "🤝"}
              </button>
            </div>
            <p className="mt-1 text-[9px] text-slate-600">
              {joinTag.length === 0 ? "Enter a tag to join" : joinTag.length < 2 ? "Min 2 chars" : "✓ Ready"}
            </p>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950 p-2.5 space-y-1 text-[9px] text-slate-500">
            <p className="font-semibold text-slate-400">Finding a Faction:</p>
            <ul className="space-y-0.5">
              <li>• Browse active syndicates below for their tags</li>
              <li>• Asks faction leader and already members first</li>
              <li>• Once accepted, gain access to treasury and team benefits</li>
            </ul>
          </div>
        </div>
      )}

      {/* Syndicate roster */}
      {(view === "roster" || current) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-slate-400">
              🎖️ Active Syndicates
            </p>
            <span className="text-[9px] text-slate-600">{list.length} total</span>
          </div>

          {list.length === 0 ? (
            <div className="rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-6 text-center">
              <p className="text-[11px] text-slate-600">
                No syndicates exist yet. <button onClick={() => setView("create")} className="text-cyan-400 hover:underline">Be the first to found one.</button>
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {list.map((s) => {
                const isMe = s.id === current?.id;
                return (
                  <div
                    key={s.id}
                    className={`rounded-md border transition ${
                      isMe
                        ? "border-purple-800/60 bg-gradient-to-r from-purple-950/20 to-purple-950/10"
                        : "border-slate-800 bg-[#0a0d11] hover:border-slate-700"
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-widest ${
                              isMe
                                ? "border-purple-700 bg-purple-900/30 text-purple-300"
                                : "border-slate-700 text-slate-400"
                            }`}>
                              [{s.tag}]
                            </span>
                            <span className="text-[13px] font-semibold text-slate-100 truncate">{s.name}</span>
                            {isMe && (
                              <span className="text-[9px] uppercase tracking-widest text-purple-400 font-bold shrink-0">
                                ★ Your Faction
                              </span>
                            )}
                          </div>
                          {s.description && (
                            <p className="text-[10px] text-slate-500 line-clamp-2">{s.description}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[10px]">
                            <div className="text-slate-400">{s.memberCount} members</div>
                            <div className="text-amber-300 font-mono mt-0.5">{s.treasury} ₹</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
