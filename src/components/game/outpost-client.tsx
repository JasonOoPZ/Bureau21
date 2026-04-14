"use client";

import { useState } from "react";

interface Props { credits: number; level: number; canClaim: boolean; hoursLeft: number; }

export function OutpostClient({ credits: initCredits, level, canClaim: initCan, hoursLeft: initHours }: Props) {
  const [credits, setCredits] = useState(initCredits);
  const [canClaim, setCanClaim] = useState(initCan);
  const [hoursLeft, setHoursLeft] = useState(initHours);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ creditsClaimed: number; xpClaimed: number } | null>(null);

  const claim = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/game/outpost", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setResult({ creditsClaimed: 0, xpClaimed: 0 }); setHoursLeft(parseInt(data.error?.match(/(\d+)h/)?.[1] || "24")); return; }
      setResult(data);
      setCredits(data.credits);
      setCanClaim(false);
      setHoursLeft(24);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const expectedIncome = 50 + level * 10;

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] text-slate-400">
          Your forward outpost generates passive income from trade routes and resource extraction.
          Supplies replenish every 24 hours. Income scales with your pilot level.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-4 text-[11px]">
          <div><span className="text-slate-500">Credits: </span><span className="font-bold text-amber-300">{credits.toLocaleString()}</span></div>
          <div><span className="text-slate-500">Level: </span><span className="font-bold text-cyan-300">{level}</span></div>
          <div><span className="text-slate-500">Daily Income: </span><span className="font-bold text-emerald-300">{expectedIncome} cr</span></div>
          <div><span className="text-slate-500">Status: </span><span className={`font-bold ${canClaim ? "text-emerald-300" : "text-amber-300"}`}>{canClaim ? "Ready" : `${hoursLeft}h remaining`}</span></div>
        </div>
      </div>

      <button
        onClick={claim}
        disabled={loading || !canClaim}
        className="w-full rounded-md border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-900/30 disabled:opacity-50"
      >
        {loading ? "Collecting..." : canClaim ? "Collect Supplies" : `Resupplying (${hoursLeft}h)`}
      </button>

      {result && result.creditsClaimed > 0 && (
        <div className="rounded-md border border-emerald-800 bg-emerald-950/20 p-4 text-[12px]">
          <p className="font-bold text-emerald-300">Supplies Collected!</p>
          <div className="mt-1 flex gap-4 text-[11px]">
            <span className="text-amber-300">+{result.creditsClaimed} credits</span>
            <span className="text-cyan-300">+{result.xpClaimed} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}
