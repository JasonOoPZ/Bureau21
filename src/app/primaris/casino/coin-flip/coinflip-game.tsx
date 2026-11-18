"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { BetControls, CreditsBar } from "@/components/game/casino/bet-controls";
import { useCreditsBump } from "@/components/game/casino/use-credits-bump";
import { useManagedTimers } from "@/components/game/casino/use-managed-timers";

function CoinFace({ side }: { side: "heads" | "tails" }) {
  const isHeads = side === "heads";
  return (
    <div className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center select-none ${
      isHeads
        ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
        : "bg-gradient-to-br from-slate-400 via-zinc-300 to-slate-500 shadow-[0_0_30px_rgba(148,163,184,0.3)]"
    }`}>
      <span className="text-5xl">{isHeads ? "👑" : "💀"}</span>
      <span className={`font-black uppercase tracking-wider text-[10px] mt-1 ${
        isHeads ? "text-amber-900" : "text-slate-700"
      }`}>
        {side}
      </span>
    </div>
  );
}

export function CoinFlipGame({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);
  const [bet, setBet] = useState(100);
  const [flipping, setFlipping] = useState(false);
  const [visibleFace, setVisibleFace] = useState<"heads" | "tails">("heads");
  const [coin, setCoin] = useState<"heads" | "tails" | null>(null);
  const [landed, setLanded] = useState(false);
  const [result, setResult] = useState<{ label: string; payout: number } | null>(null);
  const [creditsBump, bumpCredits] = useCreditsBump();
  const timers = useManagedTimers();
  const flipInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const flip = async (choice: "heads" | "tails") => {
    setFlipping(true);
    setLanded(false);
    setResult(null);
    setCoin(null);

    // Start toggling the visible face rapidly — heads/tails alternate
    let faceToggle = false;
    flipInterval.current = timers.every(() => {
      faceToggle = !faceToggle;
      setVisibleFace(faceToggle ? "tails" : "heads");
    }, 150);

    let data;
    try {
      const res = await fetch("/api/game/casino", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "coinflip", bet, choice }),
      });
      data = await res.json();
    } catch {
      if (!timers.isMounted()) return;
      timers.clear(flipInterval.current);
      setFlipping(false);
      setResult({ label: "Could not reach the casino. Please try again.", payout: 0 });
      return;
    }
    if (!timers.isMounted()) return;
    const winner: "heads" | "tails" = data.result ?? choice;

    // After 1.6s of spinning, slow down then stop on winning face
    timers.after(() => {
      // Slow down the flipping
      timers.clear(flipInterval.current);
      let slowCount = 0;
      const slowFlip = timers.every(() => {
        slowCount++;
        setVisibleFace((prev) => (prev === "heads" ? "tails" : "heads"));
        if (slowCount >= 4) {
          timers.clear(slowFlip);
          // Land on winning face
          setVisibleFace(winner);
          setFlipping(false);
          setCoin(winner);
          setLanded(true);
          timers.after(() => {
            setResult({ label: data.label ?? data.error, payout: (data.payout ?? 0) > 0 ? data.payout : (data.net_change ?? 0) });
            if (data.new_credits != null) {
              setCredits(data.new_credits);
              bumpCredits();
            }
          }, 400);
        }
      }, 250);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 px-3 py-4">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/primaris/casino" className="hover:text-red-300">← Casino</Link>
          <span>/</span>
          <span className="text-slate-300">Coin Flip</span>
        </div>

        <div className="bg-[#0b0f14] border border-slate-700 rounded-xl p-6 text-center">
          <h1 className="text-xl font-bold text-slate-200 mb-1">🪙 Coin Flip</h1>
          <p className="text-slate-500 text-xs mb-6">Double or nothing. Pick a side.</p>

          <div className="my-8 flex justify-center">
            <div className={`transition-transform ${
              flipping ? "animate-coin-spin" : landed ? "animate-coin-land" : ""
            }`}>
              {/* During spin: show whichever face the JS interval says */}
              {flipping && <CoinFace side={visibleFace} />}
              {/* Landed: show winning face */}
              {!flipping && coin && <CoinFace side={coin} />}
              {/* Idle: show heads */}
              {!flipping && !coin && <CoinFace side="heads" />}
            </div>
          </div>

          {/* Result label below coin */}
          {coin && !flipping && (
            <div className="text-lg font-bold text-slate-300 uppercase tracking-wide animate-coin-land">{coin}</div>
          )}

          {result && (
            <div className={`mt-4 rounded-lg p-3 text-sm ${
              result.payout > 0
                ? "bg-green-900/20 border border-green-800 text-green-300 animate-win-glow"
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
          <BetControls bet={bet} onBetChange={setBet} accent="slate" disabled={flipping} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => flip("heads")} disabled={flipping || bet > credits}
              className="py-3 rounded-lg bg-amber-700 hover:bg-amber-600 font-bold text-white disabled:opacity-40 transition">
              👑 Heads
            </button>
            <button onClick={() => flip("tails")} disabled={flipping || bet > credits}
              className="py-3 rounded-lg bg-indigo-700 hover:bg-indigo-600 font-bold text-white disabled:opacity-40 transition">
              💀 Tails
            </button>
          </div>
          <p className="text-center text-xs text-slate-600">Win = 1.95x your bet</p>
        </div>
      </div>
    </div>
  );
}
