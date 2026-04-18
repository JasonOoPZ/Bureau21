"use client";

import { useState } from "react";
import Link from "next/link";
import type { BattleOutcome } from "@/lib/battle-engine";

interface Props {
  initialLogs: Array<{
    id: string;
    opponentName: string;
    result: string;
    xpGained: number;
    creditsGained: number;
    roundsCount: number;
    createdAt: string;
  }>;
  pilotLevel: number;
  watchlistCount: number;
  initialTarget?: string;
}

export function BattleHub({ initialLogs, pilotLevel, watchlistCount, initialTarget }: Props) {
  const [callsign, setCallsign] = useState(initialTarget ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<BattleOutcome | null>(null);
  const [logs, setLogs] = useState(initialLogs);

  async function handleFight(e: React.FormEvent) {
    e.preventDefault();
    if (!callsign.trim() || loading) return;
    setLoading(true);
    setError(null);
    setOutcome(null);

    try {
      const res = await fetch("/api/game/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCallsign: callsign.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Battle failed.");
        return;
      }

      setOutcome(data.outcome as BattleOutcome);

      if (data.outcome) {
        setLogs((prev) => [
          {
            id: Date.now().toString(),
            opponentName: callsign.trim(),
            result: data.outcome.winner === "attacker" ? "win" : "loss",
            xpGained: data.outcome.attackerXp,
            creditsGained: data.outcome.attackerCredits,
            roundsCount: data.outcome.totalRounds,
            createdAt: new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ]);
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* ── Watchlist ── */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-red-300 underline decoration-red-800/40">Watchlist:</h2>
        <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
          Your watchlist is used to keep an eye on other pilots that you&apos;d like to engage
          regularly, or anyone you want to keep in mind as a hostile.
          {watchlistCount > 0 && (
            <span className="text-slate-500"> ({watchlistCount} pilot{watchlistCount !== 1 ? "s" : ""} tracked)</span>
          )}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          View or update your watchlist.{" "}
          <Link href="/battle/watchlist" className="text-cyan-400 hover:text-cyan-300 font-semibold">[List]</Link>
        </p>
      </div>

      {/* ── Pilot Scanner ── */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-red-300 underline decoration-red-800/40">Pilot Scanner:</h2>
        <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
          Use the Scanner to search for other pilots using various criteria. Clicking{" "}
          <span className="text-slate-300 font-semibold">Cached</span> repeats your most recent scan.
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          <Link href="/battle/scanner" className="text-cyan-400 hover:text-cyan-300 font-semibold">[Scan]</Link>{" "}
          <Link href="/battle/scanner?cached=true" className="text-cyan-400 hover:text-cyan-300 font-semibold">[Cached]</Link>
        </p>
      </div>

      {/* ── Engage a Pilot ── */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-red-300 underline decoration-red-800/40">Engage a Pilot:</h2>
        <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
          Combat is a way of life on Sol Prime. Enter a full or partial callsign or pilot ID
          below to search for possible targets.{" "}
          (Change <Link href="/battle/settings" className="text-cyan-400 hover:text-cyan-300 underline">combat settings</Link>).{" "}
          If you&apos;re not quite ready to fight, pay a visit to the{" "}
          <Link href="/battle/simulator" className="text-cyan-400 hover:text-cyan-300 underline">Combat Simulator</Link>{" "}
          to train.
        </p>

        <form onSubmit={handleFight} className="mt-3 flex items-center gap-2">
          <span className="text-[11px] text-slate-400 shrink-0">Target:</span>
          <input
            type="text"
            value={callsign}
            onChange={(e) => setCallsign(e.target.value)}
            placeholder="Enter callsign..."
            maxLength={40}
            className="flex-1 rounded border border-slate-700 bg-black/60 px-3 py-1.5 text-[12px] text-slate-200 placeholder:text-slate-600 focus:border-cyan-700 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!callsign.trim() || loading}
            className="rounded border border-red-800 bg-red-950/50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "Fight"}
          </button>
        </form>

        {error && (
          <p className="mt-2 rounded border border-red-900/40 bg-red-950/20 px-3 py-2 text-[11px] text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* ── Battle Outcome ── */}
      {outcome && (
        <div
          className={`rounded-md border p-4 space-y-3 ${
            outcome.winner === "attacker"
              ? "border-emerald-800 bg-emerald-950/20"
              : "border-red-800 bg-red-950/20"
          }`}
        >
          <p
            className={`text-sm font-bold uppercase tracking-widest ${
              outcome.winner === "attacker" ? "text-emerald-300" : "text-red-400"
            }`}
          >
            {outcome.winner === "attacker" ? "⚡ VICTORY" : "✗ DEFEATED"}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="rounded border border-slate-700/40 bg-black/40 p-2">
              <span className="text-slate-500">Rounds</span>
              <p className="text-emerald-300 font-semibold">{outcome.totalRounds}</p>
            </div>
            <div className="rounded border border-slate-700/40 bg-black/40 p-2">
              <span className="text-slate-500">Experience</span>
              <p className="text-emerald-300 font-semibold">+{outcome.attackerXp} XP</p>
            </div>
            {outcome.attackerCredits > 0 && (
              <div className="rounded border border-slate-700/40 bg-black/40 p-2">
                <span className="text-slate-500">Credits</span>
                <p className="text-amber-400 font-semibold">+{outcome.attackerCredits}</p>
              </div>
            )}
            <div className="rounded border border-slate-700/40 bg-black/40 p-2">
              <span className="text-slate-500">Confidence</span>
              <p className={outcome.attackerConfDelta > 0 ? "text-cyan-300 font-semibold" : "text-red-400 font-semibold"}>
                {outcome.attackerConfDelta > 0 ? "+" : ""}{outcome.attackerConfDelta}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 mb-1">Combat Log</p>
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-slate-800 bg-black/80 p-2 font-mono text-[9px] leading-relaxed text-slate-300">
              {outcome.logText}
            </pre>
          </div>
        </div>
      )}

      {/* ── Recent Battles ── */}
      {logs.length > 0 && (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-slate-500">Recent Engagements</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded border border-slate-800/60 bg-slate-900/30 px-2 py-1.5 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className={`font-bold uppercase px-1.5 ${log.result === "win" ? "text-emerald-400" : "text-red-400"}`}>
                    {log.result}
                  </span>
                  <span className="text-slate-300">vs {log.opponentName}</span>
                </div>
                <div className="text-slate-500">+{log.xpGained} XP · {log.roundsCount}r</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Back ── */}
      <div className="text-center">
        <Link href="/lobby" className="text-[11px] text-cyan-400 hover:text-cyan-300">[← Back]</Link>
      </div>
    </div>
  );
}
