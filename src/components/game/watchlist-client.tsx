"use client";

import { useState } from "react";
import Link from "next/link";

interface WatchlistEntry {
  id: string;
  blockComms: boolean;
  notes: string;
  targetPilot: {
    id: string;
    userId: string;
    callsign: string;
    level: number;
    characterSlug: string;
    gender: string;
    currentSector: string;
  };
}

interface Props {
  initialEntries: WatchlistEntry[];
}

export function WatchlistClient({ initialEntries }: Props) {
  const [entries, setEntries] = useState<WatchlistEntry[]>(initialEntries);
  const [addCallsign, setAddCallsign] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addCallsign.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/game/battle/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCallsign: addCallsign.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add."); return; }
      setEntries((prev) => [data.entry, ...prev]);
      setAddCallsign("");
    } catch { setError("Connection error."); } finally { setLoading(false); }
  }

  async function handleRemove(id: string) {
    try {
      const res = await fetch("/api/game/battle/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch { /* ignore */ }
  }

  async function handleToggleComms(id: string, current: boolean) {
    try {
      const res = await fetch("/api/game/battle/watchlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, blockComms: !current }),
      });
      if (res.ok) setEntries((prev) => prev.map((e) => e.id === id ? { ...e, blockComms: !current } : e));
    } catch { /* ignore */ }
  }

  async function handleSaveNotes(id: string) {
    try {
      const res = await fetch("/api/game/battle/watchlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes: notesValue }),
      });
      if (res.ok) {
        setEntries((prev) => prev.map((e) => e.id === id ? { ...e, notes: notesValue } : e));
        setEditingNotes(null);
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-3">
      {/* Add pilot form */}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={addCallsign}
          onChange={(e) => setAddCallsign(e.target.value)}
          placeholder="Add pilot by callsign..."
          maxLength={40}
          className="flex-1 rounded border border-slate-700 bg-black/60 px-3 py-1.5 text-[12px] text-slate-200 placeholder:text-slate-600 focus:border-cyan-700 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!addCallsign.trim() || loading}
          className="rounded border border-cyan-800 bg-cyan-950/40 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </form>

      {error && (
        <p className="rounded border border-red-900/40 bg-red-950/20 px-3 py-2 text-[11px] text-red-400">{error}</p>
      )}

      {/* Watchlist table */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-500">ID</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-500">Pilot</th>
              <th className="px-3 py-2 text-center text-[10px] uppercase tracking-wider text-slate-500">Block Comms</th>
              <th className="px-3 py-2 text-center text-[10px] uppercase tracking-wider text-slate-500">Scan</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-500">Notes</th>
              <th className="px-3 py-2 text-center text-[10px] uppercase tracking-wider text-slate-500">Remove</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-[11px] text-emerald-600/70">
                  This watchlist is entirely devoid of names.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-800/40 hover:bg-slate-900/30">
                  <td className="px-3 py-2 text-slate-500 font-mono">{entry.targetPilot.id.slice(-6).toUpperCase()}</td>
                  <td className="px-3 py-2">
                    <Link href={`/pilot/${entry.targetPilot.userId}`} className="text-cyan-400 hover:text-cyan-300 font-semibold">
                      {entry.targetPilot.callsign}
                    </Link>
                    <span className="ml-2 text-slate-600">Lv {entry.targetPilot.level}</span>
                    <span className="ml-1 text-slate-700">{entry.targetPilot.gender === "male" ? "♂" : entry.targetPilot.gender === "female" ? "♀" : ""}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleToggleComms(entry.id, entry.blockComms)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition ${
                        entry.blockComms
                          ? "border-red-800 bg-red-950/30 text-red-400"
                          : "border-slate-700 bg-slate-900/30 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {entry.blockComms ? "Blocked" : "Open"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Link
                      href={`/battle/scanner?level=${entry.targetPilot.level}`}
                      className="text-cyan-400 hover:text-cyan-300 text-[10px]"
                    >
                      Scan
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {editingNotes === entry.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          maxLength={200}
                          className="flex-1 rounded border border-slate-700 bg-black/60 px-2 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:border-cyan-700"
                          onKeyDown={(e) => { if (e.key === "Enter") handleSaveNotes(entry.id); if (e.key === "Escape") setEditingNotes(null); }}
                        />
                        <button onClick={() => handleSaveNotes(entry.id)} className="text-emerald-400 text-[10px]">✓</button>
                        <button onClick={() => setEditingNotes(null)} className="text-red-400 text-[10px]">✗</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingNotes(entry.id); setNotesValue(entry.notes); }}
                        className="text-slate-500 hover:text-slate-300 text-[10px] text-left"
                      >
                        {entry.notes || "Add note..."}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="text-red-500 hover:text-red-400 text-[10px] font-semibold"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-center">
        <Link href="/battle" className="text-[11px] text-cyan-400 hover:text-cyan-300">[← Back]</Link>
      </div>
    </div>
  );
}
