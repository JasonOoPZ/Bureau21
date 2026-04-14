"use client";

import { useState } from "react";

interface Props { motivation: number; credits: number; }

export function SalvageYardClient({ motivation: initMot, credits: initCredits }: Props) {
  const [motivation, setMotivation] = useState(initMot);
  const [credits, setCredits] = useState(initCredits);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    item: { name: string; type: string; tier: number } | null;
    message?: string;
  } | null>(null);

  const salvage = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/game/salvage", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setResult({ found: false, item: null, message: data.error }); return; }
      setResult(data);
      setMotivation(data.motivationLeft);
      setCredits(data.credits);
    } catch { setResult({ found: false, item: null, message: "Network error." }); }
    finally { setLoading(false); }
  };

  const tierLabel: Record<number, string> = { 1: "Common", 2: "Rare", 3: "Legendary" };
  const tierColor: Record<number, string> = { 1: "text-slate-300", 2: "text-purple-300", 3: "text-amber-300" };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] text-slate-400">
          The Salvage Yard is a graveyard of derelict ships and discarded equipment.
          Pay 200 credits and spend 10 motivation to dig through the wreckage. You might find something valuable — or nothing at all.
        </p>
        <div className="mt-3 flex gap-6 text-[11px]">
          <div><span className="text-slate-500">Credits: </span><span className="font-bold text-amber-300">{credits.toLocaleString()}</span></div>
          <div><span className="text-slate-500">Motivation: </span><span className="font-bold text-amber-300">{motivation}</span></div>
        </div>
      </div>

      <button
        onClick={salvage}
        disabled={loading || credits < 200 || motivation < 10}
        className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-cyan-700 hover:text-cyan-200 disabled:opacity-50"
      >
        {loading ? "Searching..." : "Scavenge (200 CR + 10 MOT)"}
      </button>

      {result && (
        <div className={`rounded-md border p-4 text-[12px] ${result.found ? "border-emerald-800 bg-emerald-950/20" : "border-slate-800 bg-[#0a0d11]"}`}>
          {result.found && result.item ? (
            <>
              <p className="font-bold text-emerald-300">Found something!</p>
              <p className={`mt-1 font-bold ${tierColor[result.item.tier]}`}>
                {result.item.name} <span className="text-[10px] text-slate-500">({tierLabel[result.item.tier]} {result.item.type})</span>
              </p>
              <p className="mt-1 text-[10px] text-slate-500">Added to your inventory.</p>
            </>
          ) : (
            <p className="text-slate-400">{result.message || "Nothing useful in the wreckage."}</p>
          )}
        </div>
      )}
    </div>
  );
}
