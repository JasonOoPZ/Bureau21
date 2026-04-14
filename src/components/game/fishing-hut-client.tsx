"use client";

import { useState } from "react";

interface Props { motivation: number; credits: number; fish: number; }

export function FishingHutClient({ motivation: initMot, credits: initCredits, fish: initFish }: Props) {
  const [motivation, setMotivation] = useState(initMot);
  const [credits, setCredits] = useState(initCredits);
  const [fish, setFish] = useState(initFish);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ catchName: string; catchValue: number; rarity: string } | null>(null);
  const [history, setHistory] = useState<{ name: string; value: number; rarity: string }[]>([]);

  const cast = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/game/fishing", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setResult({ catchName: data.error, catchValue: 0, rarity: "miss" }); return; }
      setResult(data);
      setMotivation(data.motivationLeft);
      setCredits(data.credits);
      setFish(data.totalFish);
      if (data.catchValue > 0) {
        setHistory((h) => [{ name: data.catchName, value: data.catchValue, rarity: data.rarity }, ...h.slice(0, 9)]);
      }
    } catch { setResult({ catchName: "Network error.", catchValue: 0, rarity: "miss" }); }
    finally { setLoading(false); }
  };

  const rarityColor: Record<string, string> = {
    legendary: "text-amber-300",
    rare: "text-purple-300",
    uncommon: "text-cyan-300",
    common: "text-slate-300",
    junk: "text-slate-500",
    miss: "text-red-400",
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] text-slate-400">
          Cast your line into the void between bulkheads. Strange things swim in the station&apos;s coolant channels
          and exterior hull pockets. Each cast costs 10 motivation.
        </p>
        <div className="mt-3 flex gap-6 text-[11px]">
          <div><span className="text-slate-500">Fish Caught: </span><span className="font-bold text-cyan-300">{fish}</span></div>
          <div><span className="text-slate-500">Credits: </span><span className="font-bold text-amber-300">{credits.toLocaleString()}</span></div>
          <div><span className="text-slate-500">Motivation: </span><span className="font-bold text-amber-300">{motivation}</span></div>
        </div>
      </div>

      <button
        onClick={cast}
        disabled={loading || motivation < 10}
        className="w-full rounded-md border border-cyan-800 bg-cyan-950/30 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/30 disabled:opacity-50"
      >
        {loading ? "Reeling in..." : "Cast Line (10 MOT)"}
      </button>

      {result && (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 text-[12px]">
          <p className={`font-bold ${rarityColor[result.rarity] || "text-slate-300"}`}>{result.catchName}</p>
          {result.catchValue > 0 && <p className="mt-1 font-mono text-emerald-400">+{result.catchValue} credits</p>}
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Recent Catches</p>
          <div className="mt-2 space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className={rarityColor[h.rarity] || "text-slate-300"}>{h.name}</span>
                <span className="text-emerald-400">+{h.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
