"use client";

import { useState } from "react";
import Link from "next/link";

const QUICK_BETS = [50, 100, 250, 500, 1000];

export function SlotsGame({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);
  const [bet, setBet] = useState(100);
  const [reels, setReels] = useState(["🪙", "🪙", "🪙"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ label: string; payout: number } | null>(null);

  const spin = async () => {
    setSpinning(true);
    setResult(null);
    // Visual spin
    const symbols = ["🎰", "💎", "⚡", "🔥", "💀", "🪙"];
    const spinInterval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
    }, 80);

    const res = await fetch("/api/game/casino", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "slots", bet }),
    });
    const data = await res.json();

    // Stop spin after delay for drama
    setTimeout(() => {
      clearInterval(spinInterval);
      if (data.reels) setReels(data.reels);
      setResult({ label: data.label ?? data.error, payout: data.net_change ?? 0 });
      if (data.new_credits != null) setCredits(data.new_credits);
      setSpinning(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 px-3 py-4">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/primaris/casino" className="hover:text-red-300">← Casino</Link>
          <span>/</span>
          <span className="text-amber-400">Slots</span>
        </div>

        <div className="bg-[#0b0f14] border border-amber-900/40 rounded-xl p-6 text-center">
          <h1 className="text-xl font-bold text-amber-400 mb-1">🎰 Slot Machine</h1>
          <p className="text-slate-500 text-xs">Three reels. One jackpot. Pure chaos.</p>

          <div className="flex justify-center gap-4 my-8">
            {reels.map((s, i) => (
              <div key={i}
                className={`w-20 h-20 bg-slate-900 border-2 ${spinning ? "border-amber-500 animate-pulse" : "border-slate-700"} rounded-xl flex items-center justify-center text-5xl transition-all`}>
                {s}
              </div>
            ))}
          </div>

          {result && (
            <div className={`rounded-lg p-3 text-sm ${result.payout > 0 ? "bg-green-900/20 border border-green-800 text-green-300" : result.payout === 0 ? "bg-slate-800 text-slate-400" : "bg-red-900/20 border border-red-800 text-red-300"}`}>
              {result.label}
              {result.payout !== 0 && (
                <span className="ml-2 font-bold">{result.payout > 0 ? "+" : ""}{result.payout} ₡</span>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#0a0d11] border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Credits</span>
            <span className="text-amber-400 font-bold font-mono">{credits.toLocaleString()} ₡</span>
          </div>
          <div className="flex gap-2">
            {QUICK_BETS.map((q) => (
              <button key={q} onClick={() => setBet(q)} disabled={spinning}
                className={`flex-1 py-1.5 rounded text-xs font-bold transition ${bet === q ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                {q}
              </button>
            ))}
          </div>
          <input type="number" value={bet} onChange={(e) => setBet(Math.max(10, Number(e.target.value)))}
            disabled={spinning} min={10}
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-center" />
          <button onClick={spin} disabled={spinning || bet > credits}
            className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold text-white disabled:opacity-40 transition">
            {spinning ? "Spinning..." : `🎰 Spin (${bet} ₡)`}
          </button>
        </div>

        <div className="text-xs text-slate-600 text-center space-y-0.5">
          <p>Triple 🎰 = 50x | Triple 💎 = 20x | Triple ⚡ = 10x</p>
          <p>Triple 🔥 = 5x | Triple 💀 = 3x | Triple 🪙 = 2x | Pair = 1.2x</p>
        </div>
      </div>
    </div>
  );
}
