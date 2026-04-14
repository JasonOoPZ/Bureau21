"use client";

import { useState } from "react";

interface Props { motivation: number; credits: number; }

export function SmugglerClient({ motivation: initMot, credits: initCredits }: Props) {
  const [motivation, setMotivation] = useState(initMot);
  const [credits, setCredits] = useState(initCredits);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ outcome: string; success: boolean; creditsGained: number } | null>(null);
  const [history, setHistory] = useState<{ success: boolean; credits: number }[]>([]);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/game/smuggler", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setResult({ outcome: data.error, success: false, creditsGained: 0 }); return; }
      setResult(data);
      setMotivation(data.motivationLeft);
      setCredits(data.credits);
      setHistory((h) => [{ success: data.success, credits: data.creditsGained }, ...h.slice(0, 9)]);
    } catch { setResult({ outcome: "Network error.", success: false, creditsGained: 0 }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] text-slate-400">
          The Smuggler&apos;s Den operates in the shadows. Accept a cargo delivery contract and hope
          you don&apos;t get intercepted by station security. Higher risk, higher reward.
        </p>
        <p className="mt-2 text-[10px] text-slate-500">
          Each run costs 25 motivation. 10% chance of getting busted (lose credits). Big payouts for lucky runs.
        </p>
        <div className="mt-3 flex gap-6 text-[11px]">
          <div><span className="text-slate-500">Credits: </span><span className="font-bold text-amber-300">{credits.toLocaleString()}</span></div>
          <div><span className="text-slate-500">Motivation: </span><span className="font-bold text-amber-300">{motivation}</span></div>
        </div>
      </div>

      <button
        onClick={run}
        disabled={loading || motivation < 25}
        className="w-full rounded-md border border-purple-800 bg-purple-950/30 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-purple-300 transition hover:bg-purple-900/30 disabled:opacity-50"
      >
        {loading ? "Running cargo..." : "Accept Contract (25 MOT)"}
      </button>

      {result && (
        <div className={`rounded-md border p-4 text-[12px] ${result.success ? "border-emerald-800 bg-emerald-950/20" : "border-red-900 bg-red-950/20"}`}>
          <p className={`font-bold ${result.success ? "text-emerald-300" : "text-red-300"}`}>
            {result.success ? "DELIVERY COMPLETE" : "BUSTED"}
          </p>
          <p className="mt-1 text-slate-400">{result.outcome}</p>
          <p className={`mt-1 font-mono ${result.creditsGained >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {result.creditsGained >= 0 ? "+" : ""}{result.creditsGained.toLocaleString()} credits
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Run History</p>
          <div className="mt-2 space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className={h.success ? "text-emerald-400" : "text-red-400"}>{h.success ? "Delivered" : "Busted"}</span>
                <span className={h.credits >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {h.credits >= 0 ? "+" : ""}{h.credits.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
