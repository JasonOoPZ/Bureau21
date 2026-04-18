"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  initial: {
    autoHerbs: boolean;
    hideBattleLogs: boolean;
    battleCooldown: number;
    combatStimUse: string;
    atkSplit: number;
    herbs: number;
  };
}

export function BattleSettingsClient({ initial }: Props) {
  const [autoHerbs, setAutoHerbs] = useState(initial.autoHerbs);
  const [hideBattleLogs, setHideBattleLogs] = useState(initial.hideBattleLogs);
  const [battleCooldown, setBattleCooldown] = useState(initial.battleCooldown);
  const [combatStimUse, setCombatStimUse] = useState(initial.combatStimUse);
  const [atkSplit, setAtkSplit] = useState(initial.atkSplit);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/game/battle/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoHerbs, hideBattleLogs, battleCooldown, combatStimUse, atkSplit }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed."); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* ── Combat Settings ── */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 space-y-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-amber-400">Combat Settings:</p>

        <label className="flex items-start gap-2 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={autoHerbs}
            onChange={(e) => setAutoHerbs(e.target.checked)}
            className="accent-red-500 mt-0.5"
          />
          <span>
            Auto-use herbs to full heal when you lose life from combat (Must have{" "}
            <span className="text-emerald-400 font-bold">Herbs</span>)
            {initial.herbs > 0 && <span className="text-slate-500"> — you have {initial.herbs}</span>}
          </span>
        </label>

        <label className="flex items-start gap-2 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={hideBattleLogs}
            onChange={(e) => setHideBattleLogs(e.target.checked)}
            className="accent-red-500 mt-0.5"
          />
          <span>
            Hide battle logs on battles you initiate. (Displays results only)
          </span>
        </label>

        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          Allow myself to be attacked at most once every
          <select
            value={battleCooldown}
            onChange={(e) => setBattleCooldown(parseInt(e.target.value))}
            className="rounded border border-slate-700 bg-black/60 px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-700"
          >
            {[1, 2, 3, 5, 10, 15, 20, 30].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          minute(s).
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          Use combat stims
          <select
            value={combatStimUse}
            onChange={(e) => setCombatStimUse(e.target.value)}
            className="rounded border border-slate-700 bg-black/60 px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-700"
          >
            <option value="never">never</option>
            <option value="attack_only">when I attack</option>
            <option value="defend_only">when I defend</option>
            <option value="attack_or_defend">when I attack or defend</option>
          </select>
        </div>
      </div>

      {/* ── Strength Split ── */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 space-y-3">
        <p className="text-[12px] font-bold uppercase tracking-widest text-amber-400">Strength Split:</p>

        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          I want to allocate
          <select
            value={atkSplit}
            onChange={(e) => setAtkSplit(parseInt(e.target.value))}
            className="rounded border border-slate-700 bg-black/60 px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-700"
          >
            {Array.from({ length: 21 }, (_, i) => i * 5).map((pct) => (
              <option key={pct} value={pct}>{pct}%</option>
            ))}
          </select>
          of my strength to attack and the remaining to defense.
        </div>

        {/* Visual split bar */}
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden flex">
          <div className="bg-red-500 transition-all" style={{ width: `${atkSplit}%` }} />
          <div className="bg-emerald-500 transition-all" style={{ width: `${100 - atkSplit}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-slate-600">
          <span>Attack ({atkSplit}%)</span>
          <span>Defense ({100 - atkSplit}%)</span>
        </div>
      </div>

      {/* Save / Messages */}
      {error && (
        <p className="rounded border border-red-900/40 bg-red-950/20 px-3 py-2 text-[11px] text-red-400">{error}</p>
      )}
      {saved && (
        <p className="rounded border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-[11px] text-emerald-400">
          Settings saved.
        </p>
      )}

      <div className="text-center space-x-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded border border-cyan-800 bg-cyan-950/40 px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-cyan-300 transition hover:bg-cyan-900/40 disabled:opacity-40"
        >
          {loading ? "Saving..." : "Update"}
        </button>
      </div>

      <div className="text-center">
        <Link href="/battle" className="text-[11px] text-cyan-400 hover:text-cyan-300">[← Back]</Link>
      </div>
    </div>
  );
}
