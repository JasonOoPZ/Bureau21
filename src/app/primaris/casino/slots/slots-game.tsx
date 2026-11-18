"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { BetControls, CreditsBar } from "@/components/game/casino/bet-controls";
import { useCreditsBump } from "@/components/game/casino/use-credits-bump";
import { useManagedTimers } from "@/components/game/casino/use-managed-timers";

const REEL_IDS = ["left", "middle", "right"] as const;

export function SlotsGame({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);
  const [bet, setBet] = useState(100);
  const [reels, setReels] = useState(["🪙", "🪙", "🪙"]);
  const [spinning, setSpinning] = useState(false);
  const [reelsStopped, setReelsStopped] = useState([false, false, false]);
  const [isJackpot, setIsJackpot] = useState(false);
  const [result, setResult] = useState<{ label: string; payout: number } | null>(null);
  const [creditsBump, bumpCredits] = useCreditsBump();
  const timers = useManagedTimers();

  const spin = useCallback(async () => {
    setSpinning(true);
    setResult(null);
    setIsJackpot(false);
    setReelsStopped([false, false, false]);
    // Visual spin
    const symbols = ["🎰", "💎", "⚡", "🔥", "💀", "🪙"];
    const spinInterval = timers.every(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
    }, 80);

    let data;
    try {
      const res = await fetch("/api/game/casino", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "slots", bet }),
      });
      data = await res.json();
    } catch {
      if (!timers.isMounted()) return;
      timers.clear(spinInterval);
      setSpinning(false);
      setResult({ label: "Could not reach the casino. Please try again.", payout: 0 });
      return;
    }
    if (!timers.isMounted()) return;

    // Staggered reel stops for dramatic effect
    const finalReels = data.reels ?? reels;
    timers.after(() => {
      timers.clear(spinInterval);
      // Stop reel 1
      setReels((prev) => [finalReels[0], prev[1], prev[2]]);
      setReelsStopped([true, false, false]);

      // Stop reel 2
      timers.after(() => {
        setReels((prev) => [prev[0], finalReels[1], prev[2]]);
        setReelsStopped([true, true, false]);

        // Stop reel 3
        timers.after(() => {
          setReels(finalReels);
          setReelsStopped([true, true, true]);
          setSpinning(false);
          const payout = data.payout ?? 0;
          const net = data.net_change ?? 0;
          setResult({ label: data.label ?? data.error, payout: payout > 0 ? payout : net });
          if (payout >= bet * 10) setIsJackpot(true);
          if (data.new_credits != null) {
            setCredits(data.new_credits);
            bumpCredits();
          }
        }, 300);
      }, 300);
    }, 800);
  }, [bet, reels, timers, bumpCredits]);

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
              <div key={REEL_IDS[i]}
                className={`w-20 h-20 bg-slate-900 border-2 rounded-xl flex items-center justify-center text-5xl transition-all ${
                  spinning && !reelsStopped[i]
                    ? "border-amber-500 animate-reel-spin"
                    : reelsStopped[i] && spinning
                    ? "border-amber-400 animate-reel-stop"
                    : isJackpot
                    ? "border-amber-400 animate-slot-glow"
                    : "border-slate-700"
                }`}
                style={spinning && !reelsStopped[i] ? { animationDelay: `${i * 0.08}s` } : undefined}
              >
                {s}
              </div>
            ))}
          </div>

          {result && (
            <div className={`rounded-lg p-3 text-sm ${
              result.payout > 0
                ? isJackpot
                  ? "bg-amber-900/30 border border-amber-600 animate-jackpot"
                  : "bg-green-900/20 border border-green-800 text-green-300 animate-win-glow"
                : result.payout === 0
                ? "bg-slate-800 text-slate-400"
                : "bg-red-900/20 border border-red-800 text-red-300 animate-loss-shake"
            }`}>
              {result.label}
              {result.payout !== 0 && (
                <span className="ml-2 font-bold">{result.payout > 0 ? "+" : ""}{result.payout} ₡</span>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#0a0d11] border border-slate-800 rounded-xl p-4 space-y-3">
          <CreditsBar credits={credits} bump={creditsBump} />
          <BetControls bet={bet} onBetChange={setBet} accent="amber" disabled={spinning} />
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
