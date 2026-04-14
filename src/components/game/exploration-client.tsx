"use client";

import { useState } from "react";

interface Props { motivation: number; fuel: number; }

export function ExplorationClient({ motivation: initMot, fuel: initFuel }: Props) {
  const [motivation, setMotivation] = useState(initMot);
  const [fuel, setFuel] = useState(initFuel);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    event: string; eventType: string;
    creditsGained: number; xpGained: number; oreGained: number; herbsGained: number;
  } | null>(null);

  const explore = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/game/exploration", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setResult({ event: data.error, eventType: "error", creditsGained: 0, xpGained: 0, oreGained: 0, herbsGained: 0 }); return; }
      setResult(data);
      setMotivation(data.motivationLeft);
      setFuel(data.fuelLeft);
    } catch { setResult({ event: "Network error.", eventType: "error", creditsGained: 0, xpGained: 0, oreGained: 0, herbsGained: 0 }); }
    finally { setLoading(false); }
  };

  const typeColor: Record<string, string> = {
    legendary: "border-amber-800 bg-amber-950/20",
    rare: "border-purple-800 bg-purple-950/20",
    uncommon: "border-cyan-800 bg-cyan-950/20",
    common: "border-emerald-800 bg-emerald-950/20",
    empty: "border-slate-800 bg-[#0a0d11]",
    miss: "border-red-900 bg-red-950/20",
    error: "border-red-900 bg-red-950/20",
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] text-slate-400">
          Launch expeditions into uncharted sectors. Each exploration costs 20 motivation and 5 fuel.
          Discoveries range from abandoned stations to rare mineral deposits — or nothing at all.
        </p>
        <div className="mt-3 flex gap-6 text-[11px]">
          <div><span className="text-slate-500">Fuel: </span><span className="font-bold text-cyan-300">{fuel}</span></div>
          <div><span className="text-slate-500">Motivation: </span><span className="font-bold text-amber-300">{motivation}</span></div>
        </div>
      </div>

      <button
        onClick={explore}
        disabled={loading || motivation < 20 || fuel < 5}
        className="w-full rounded-md border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-900/30 disabled:opacity-50"
      >
        {loading ? "Scanning..." : "Launch Expedition (20 MOT + 5 Fuel)"}
      </button>

      {result && (
        <div className={`rounded-md border p-4 text-[12px] ${typeColor[result.eventType] || typeColor.empty}`}>
          <p className="font-semibold text-slate-200">{result.event}</p>
          {(result.creditsGained > 0 || result.xpGained > 0 || result.oreGained > 0 || result.herbsGained > 0) && (
            <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
              {result.creditsGained > 0 && <span className="text-amber-300">+{result.creditsGained} credits</span>}
              {result.xpGained > 0 && <span className="text-cyan-300">+{result.xpGained} XP</span>}
              {result.oreGained > 0 && <span className="text-slate-300">+{result.oreGained} ore</span>}
              {result.herbsGained > 0 && <span className="text-emerald-300">+{result.herbsGained} herbs</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
