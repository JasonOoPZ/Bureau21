"use client";

import { useState } from "react";

interface Props { motivation: number; ore: number; }

export function MiningRigClient({ motivation: initMot, ore: initOre }: Props) {
  const [motivation, setMotivation] = useState(initMot);
  const [ore, setOre] = useState(initOre);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ oreGained: number; find: string } | null>(null);

  const mine = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/game/mining", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setResult({ oreGained: 0, find: data.error }); return; }
      setResult(data);
      setOre(data.totalOre);
      setMotivation(data.motivationLeft);
    } catch { setResult({ oreGained: 0, find: "Network error." }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] text-slate-400">
          The Mining Rig bores into passing asteroids, extracting raw ore for smelting and trade.
          Each extraction run costs 15 motivation. Rare veins can yield massive hauls.
        </p>
        <div className="mt-3 flex gap-6 text-[11px]">
          <div><span className="text-slate-500">Ore: </span><span className="font-bold text-slate-200">{ore.toLocaleString()}</span></div>
          <div><span className="text-slate-500">Motivation: </span><span className="font-bold text-amber-300">{motivation}</span></div>
        </div>
      </div>

      <button
        onClick={mine}
        disabled={loading || motivation < 15}
        className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-cyan-700 hover:text-cyan-200 disabled:opacity-50"
      >
        {loading ? "Drilling..." : "Extract Ore (15 MOT)"}
      </button>

      {result && (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 text-[12px]">
          <p className={`font-bold ${result.oreGained > 10 ? "text-amber-300" : "text-slate-300"}`}>{result.find}</p>
          {result.oreGained > 0 && <p className="mt-1 font-mono text-emerald-400">+{result.oreGained} ore</p>}
        </div>
      )}
    </div>
  );
}
