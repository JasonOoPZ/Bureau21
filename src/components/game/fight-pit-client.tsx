"use client";

import { useState } from "react";

interface Props {
  motivation: number;
  lifeForce: number;
  credits: number;
  level: number;
}

export function FightPitClient({ motivation: initMot, lifeForce: initLF, credits: initCredits, level }: Props) {
  const [motivation, setMotivation] = useState(initMot);
  const [lifeForce, setLifeForce] = useState(initLF);
  const [credits, setCredits] = useState(initCredits);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    won: boolean; opponent: string; opponentLevel: number;
    rounds: string[]; creditsReward: number; entryFee: number;
    xpReward: number; lfLost: number; lfRemaining: number;
  } | null>(null);

  const fight = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/game/fight-pit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResult({ won: false, opponent: "Error", opponentLevel: 0, rounds: [data.error], creditsReward: 0, entryFee: 0, xpReward: 0, lfLost: 0, lfRemaining: lifeForce });
        return;
      }
      setResult(data);
      setMotivation(data.motivationLeft);
      setLifeForce(data.lfRemaining);
      setCredits(data.netCredits + credits + 100); // +100 because netCredits already subtracted fee
    } catch {
      setResult({ won: false, opponent: "Error", opponentLevel: 0, rounds: ["Network error."], creditsReward: 0, entryFee: 0, xpReward: 0, lfLost: 0, lfRemaining: lifeForce });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] text-slate-400">
          Deep beneath Primaris, the Fight Pit draws the desperate and the dangerous.
          No weapons, no shields, no rules. Just raw brutality and a cheering crowd.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-4 text-center text-[11px]">
          <div><span className="text-slate-500">Credits</span><br/><span className="font-bold text-amber-300">{credits.toLocaleString()}</span></div>
          <div><span className="text-slate-500">Life Force</span><br/><span className="font-bold text-emerald-300">{lifeForce}</span></div>
          <div><span className="text-slate-500">Motivation</span><br/><span className="font-bold text-amber-300">{motivation}</span></div>
        </div>
        <p className="mt-3 text-[10px] text-slate-500">
          Entry: 100 credits + 15 motivation. Rewards scale with opponent level.
          <strong className="text-red-400"> You WILL take real damage.</strong>
        </p>
      </div>

      <button
        onClick={fight}
        disabled={loading || credits < 100 || lifeForce < 5 || motivation < 15}
        className="w-full rounded-md border border-red-800 bg-red-950/30 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-900/30 disabled:opacity-50"
      >
        {loading ? "Fighting..." : "Enter the Pit"}
      </button>

      {result && (
        <div className={`rounded-md border p-4 ${result.won ? "border-emerald-800 bg-emerald-950/20" : "border-red-900 bg-red-950/20"}`}>
          <div className="flex items-center justify-between">
            <p className={`text-[13px] font-bold ${result.won ? "text-emerald-300" : "text-red-300"}`}>
              {result.won ? "VICTORY" : "DEFEAT"} vs {result.opponent} (Lv.{result.opponentLevel})
            </p>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div><span className="text-slate-500">Credits</span><br/><span className={result.won ? "text-emerald-400" : "text-red-400"}>{result.won ? `+${result.creditsReward - result.entryFee}` : `-${result.entryFee}`}</span></div>
            <div><span className="text-slate-500">XP</span><br/><span className="text-cyan-400">+{result.xpReward}</span></div>
            <div><span className="text-slate-500">LF Lost</span><br/><span className="text-red-400">-{result.lfLost}</span></div>
          </div>
          <div className="mt-3 max-h-36 overflow-y-auto rounded border border-slate-800 bg-black/50 p-2">
            {result.rounds.map((r, i) => (
              <p key={i} className="text-[10px] text-slate-400">{r}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
