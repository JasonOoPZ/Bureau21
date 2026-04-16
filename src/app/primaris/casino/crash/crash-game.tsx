"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const QUICK_BETS = [50, 100, 250, 500, 1000];

export function CrashGame({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);
  const [bet, setBet] = useState(100);
  const [phase, setPhase] = useState<"idle" | "running" | "crashed" | "cashed">("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [result, setResult] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    setResult(null);
    const res = await fetch("/api/game/casino/crash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bet }),
    });
    const data = await res.json();
    if (!res.ok) { setResult(data.error); return; }

    setCredits((c) => c - bet);
    setPhase("running");
    setMultiplier(1.0);

    // Poll the multiplier
    pollRef.current = setInterval(async () => {
      const r = await fetch("/api/game/casino/crash");
      const d = await r.json();
      if (d.status === "crashed") {
        setPhase("crashed");
        setMultiplier(d.crashPoint);
        setResult(`Crashed at ${d.crashPoint}x! You lost ${bet} ₡`);
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (d.status === "running") {
        setMultiplier(d.multiplier);
      } else {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 200);
  };

  const cashOut = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    const res = await fetch("/api/game/casino/crash", { method: "PUT" });
    const data = await res.json();
    if (data.status === "cashed_out") {
      setPhase("cashed");
      setMultiplier(data.multiplier);
      setCredits((c) => c + data.payout);
      setResult(data.label);
    } else {
      setPhase("crashed");
      setMultiplier(data.crashPoint ?? multiplier);
      setResult(data.label);
    }
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const multColor = multiplier < 1.5 ? "text-cyan-400" : multiplier < 3 ? "text-green-400" : multiplier < 5 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-black text-slate-100 px-3 py-4">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/primaris/casino" className="hover:text-red-300">← Casino</Link>
          <span>/</span>
          <span className="text-red-400">Crash</span>
        </div>

        <div className="bg-[#0b0f14] border border-red-900/40 rounded-xl p-6 text-center">
          <h1 className="text-xl font-bold text-red-400 mb-1">🚀 Crash</h1>
          <p className="text-slate-500 text-xs">Ride the multiplier. Cash out before it crashes.</p>
          <div className={`text-6xl font-mono font-black mt-6 mb-4 ${multColor} transition-colors`}>
            {multiplier.toFixed(2)}x
          </div>
          {phase === "running" && (
            <div className="h-1 bg-gradient-to-r from-cyan-500 via-green-400 to-red-500 rounded-full animate-pulse" />
          )}
          {phase === "crashed" && <div className="text-red-500 font-bold text-lg">💥 CRASHED</div>}
          {phase === "cashed" && <div className="text-green-400 font-bold text-lg">💰 CASHED OUT</div>}
        </div>

        {result && (
          <div className={`rounded-lg p-3 text-sm text-center ${phase === "cashed" ? "bg-green-900/20 border border-green-800 text-green-300" : "bg-red-900/20 border border-red-800 text-red-300"}`}>
            {result}
          </div>
        )}

        <div className="bg-[#0a0d11] border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Credits</span>
            <span className="text-amber-400 font-bold font-mono">{credits.toLocaleString()} ₡</span>
          </div>
          <div className="flex gap-2">
            {QUICK_BETS.map((q) => (
              <button key={q} onClick={() => setBet(q)} disabled={phase === "running"}
                className={`flex-1 py-1.5 rounded text-xs font-bold transition ${bet === q ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                {q}
              </button>
            ))}
          </div>
          <input type="number" value={bet} onChange={(e) => setBet(Math.max(10, Number(e.target.value)))}
            disabled={phase === "running"} min={10}
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-center" />
          {phase === "idle" || phase === "crashed" || phase === "cashed" ? (
            <button onClick={start} disabled={bet > credits}
              className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-500 font-bold text-white disabled:opacity-40 transition">
              🚀 Launch ({bet} ₡)
            </button>
          ) : (
            <button onClick={cashOut}
              className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 font-bold text-white animate-pulse transition">
              💰 Cash Out ({Math.floor(bet * multiplier)} ₡)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
