"use client";

import { useState } from "react";
import Link from "next/link";
import type { BattleOutcome } from "@/lib/battle-engine";

interface Props {
  targetCallsign: string;
  winPct: number;
  avgRounds: number;
  avgLfRemaining: number;
}

export function EngageButton({ targetCallsign, winPct, avgRounds, avgLfRemaining }: Props) {
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<BattleOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rewards, setRewards] = useState<{ xp: number; credits: number; confDelta: number } | null>(null);

  async function handleEngage() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setOutcome(null);

    try {
      const res = await fetch("/api/game/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCallsign }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Battle failed.");
        return;
      }

      const o = data.outcome as BattleOutcome;
      setOutcome(o);
      setRewards({
        xp: o.attackerXp,
        credits: o.attackerCredits,
        confDelta: o.attackerConfDelta,
      });
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Post-battle combat log view ──
  if (outcome) {
    const won = outcome.winner === "attacker";
    return (
      <section className="rounded-md border border-slate-700 bg-black p-4 space-y-3">
        {/* Header */}
        <div className="rounded border border-slate-700 bg-slate-900/60 px-4 py-2 text-center">
          <p className="text-[13px] font-bold uppercase tracking-widest text-slate-200">Combat!</p>
        </div>

        {/* Round-by-round log */}
        <div className="space-y-0.5 text-[12px] leading-relaxed font-mono">
          {outcome.rounds.map((r, i) => {
            const isPlayerAttacking = r.attacker !== targetCallsign;
            const attackerLabel = isPlayerAttacking ? "You" : r.attacker;
            const defenderLabel = isPlayerAttacking ? r.defender : "you";
            const isCrit = r.crit;

            return (
              <p key={i} className="text-slate-300">
                <span className="text-slate-500">{r.round}: </span>
                {attackerLabel} attacked{" "}
                <span className="font-bold text-white">{defenderLabel}</span>{" "}
                for{" "}
                <span className={isCrit ? "font-bold text-amber-400" : "text-red-400"}>
                  {r.damage} damage
                </span>
                {isCrit && <span className="text-amber-400"> [CRIT]</span>}.{" "}
                <span className="text-slate-500">({r.defenderLfAfter} left)</span>
              </p>
            );
          })}

          {/* Final blow / terminal line */}
          {outcome.rounds.length > 0 && (
            <p className="text-amber-400 italic mt-1">
              Fatal: {won ? "You terminate" : `${targetCallsign} terminates you for`}{" "}
              <span className="font-bold text-white">{won ? targetCallsign : ""}</span>.
            </p>
          )}
        </div>

        {/* Outcome summary */}
        <div className="border-t border-slate-800 pt-3 space-y-1 text-[12px]">
          <p className={won ? "font-bold text-emerald-400" : "font-bold text-red-400"}>
            {won ? `You defeated ${targetCallsign}.` : `${targetCallsign} defeated you.`}
          </p>
          {rewards && (
            <>
              <p className="text-slate-300">
                You earned <span className="font-bold text-white">{rewards.xp}</span> experience.
              </p>
              {rewards.credits > 0 && (
                <p className="text-slate-300">
                  You looted <span className="font-bold text-amber-400">{rewards.credits}</span> credits.
                </p>
              )}
              <p className="text-slate-300">
                You gained{" "}
                <span className={`font-bold ${rewards.confDelta >= 0 ? "text-cyan-300" : "text-red-400"}`}>
                  {rewards.confDelta >= 0 ? "+" : ""}{rewards.confDelta.toFixed(4)}
                </span>{" "}
                maximum confidence.
              </p>
            </>
          )}
        </div>

        {/* Back link */}
        <div className="text-center pt-2">
          <Link href="/battle" className="text-[12px] text-cyan-400 hover:text-cyan-300 font-semibold">
            [Back]
          </Link>
        </div>
      </section>
    );
  }

  // ── Pre-battle: Snoop Analysis + Engage ──
  return (
    <section className="rounded-md border border-amber-900/40 bg-[#0f0d0a] p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400 underline decoration-amber-800/40 underline-offset-4">
        ⚠ Snoop Analysis
      </p>
      <p className="mb-3 text-[11px] text-slate-500 leading-relaxed">
        Based on a combat simulation analysis comparing your current stats, equipment,
        and loadout against this pilot&apos;s known configuration:
      </p>

      {/* Win chance meter */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-slate-400">Estimated Victory Chance</span>
          <span className={`font-bold font-mono ${
            winPct >= 70 ? "text-emerald-400" :
            winPct >= 40 ? "text-amber-400" :
            "text-red-400"
          }`}>
            {winPct}%
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${
              winPct >= 70 ? "bg-emerald-500" :
              winPct >= 40 ? "bg-amber-500" :
              "bg-red-500"
            }`}
            style={{ width: `${winPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded border border-slate-800 bg-black/40 px-3 py-2">
          <span className="text-slate-500">Avg Rounds</span>
          <p className="text-slate-200 font-semibold">{avgRounds}</p>
        </div>
        <div className="rounded border border-slate-800 bg-black/40 px-3 py-2">
          <span className="text-slate-500">Avg LF Remaining (Win)</span>
          <p className="text-emerald-300 font-semibold">{avgLfRemaining}</p>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-slate-600 italic">
        Simulation based on 100 engagements at full health. Actual results may vary.
      </p>

      {error && (
        <p className="mt-2 rounded border border-red-900/40 bg-red-950/20 px-3 py-2 text-[11px] text-red-400">
          {error}
        </p>
      )}

      <div className="mt-3 text-center">
        <button
          onClick={handleEngage}
          disabled={loading}
          className="rounded border border-red-800 bg-red-950/50 px-5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Engaging..." : `Engage ${targetCallsign}`}
        </button>
      </div>
    </section>
  );
}
