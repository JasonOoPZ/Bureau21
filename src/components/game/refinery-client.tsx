"use client";

import { useState } from "react";

interface Props { credits: number; ore: number; }

export function RefineryClient({ credits: initCredits, ore: initOre }: Props) {
  const [credits, setCredits] = useState(initCredits);
  const [ore, setOre] = useState(initOre);
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const refine = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/game/refinery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) { setResult(data.error); return; }
      setOre(data.oreLeft);
      setCredits(data.credits);
      setResult(`Smelted ${data.oreUsed} ore → ${data.creditsGained} credits.`);
    } catch { setResult("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] text-slate-400">
          The Refinery converts raw ore into tradeable credits. Current exchange rate: <span className="text-cyan-300">3 credits per ore</span>.
          Bulk smelting operations welcome.
        </p>
        <div className="mt-3 flex gap-6 text-[11px]">
          <div><span className="text-slate-500">Ore: </span><span className="font-bold text-slate-200">{ore.toLocaleString()}</span></div>
          <div><span className="text-slate-500">Credits: </span><span className="font-bold text-amber-300">{credits.toLocaleString()}</span></div>
        </div>
      </div>

      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <label className="text-[11px] uppercase tracking-wider text-slate-500">Ore to Smelt</label>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={ore}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Math.min(ore, parseInt(e.target.value) || 1)))}
            className="w-24 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-center text-[12px] text-slate-200 focus:border-cyan-600 focus:outline-none"
          />
          <span className="text-[11px] text-slate-400">→ {(amount * 3).toLocaleString()} credits</span>
          <button
            onClick={() => setAmount(ore)}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 hover:border-cyan-700 hover:text-cyan-300"
          >ALL</button>
        </div>
      </div>

      <button
        onClick={refine}
        disabled={loading || ore < 1}
        className="w-full rounded-md border border-amber-800 bg-amber-950/30 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-amber-300 transition hover:bg-amber-900/30 disabled:opacity-50"
      >
        {loading ? "Smelting..." : "Smelt Ore"}
      </button>

      {result && (
        <div className="rounded-md border border-cyan-900/40 bg-cyan-950/20 px-4 py-2 text-[11px] text-cyan-300">
          {result}
        </div>
      )}
    </div>
  );
}
