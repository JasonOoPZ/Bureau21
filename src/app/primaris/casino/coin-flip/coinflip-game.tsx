"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const QUICK_BETS = [50, 100, 250, 500, 1000];

function CoinFace({ side, size = "lg" }: { side: "heads" | "tails"; size?: "lg" | "sm" }) {
  const isHeads = side === "heads";
  const dim = size === "lg" ? "w-32 h-32 sm:w-36 sm:h-36" : "w-24 h-24";
  return (
    <div className={`${dim} rounded-full flex flex-col items-center justify-center ${
      isHeads
        ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
        : "bg-gradient-to-br from-slate-400 via-zinc-300 to-slate-500 shadow-[0_0_30px_rgba(148,163,184,0.3)]"
    }`}>
      <span className={size === "lg" ? "text-5xl" : "text-3xl"}>{isHeads ? "👑" : "💀"}</span>
      <span className={`font-black uppercase tracking-wider ${
        size === "lg" ? "text-[10px] mt-1" : "text-[8px] mt-0.5"
      } ${isHeads ? "text-amber-900" : "text-slate-700"}`}>
        {side}
      </span>
    </div>
  );
}

export function CoinFlipGame({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);
  const [bet, setBet] = useState(100);
  const [flipping, setFlipping] = useState(false);
  const [coin, setCoin] = useState<"heads" | "tails" | null>(null);
  const [landed, setLanded] = useState(false);
  const [result, setResult] = useState<{ label: string; payout: number } | null>(null);
  const [creditsBump, setCreditsBump] = useState(false);
  const [spinKey, setSpinKey] = useState(0);

  useEffect(() => {
    if (creditsBump) {
      const t = setTimeout(() => setCreditsBump(false), 400);
      return () => clearTimeout(t);
    }
  }, [creditsBump]);

  const flip = async (choice: "heads" | "tails") => {
    setFlipping(true);
    setLanded(false);
    setResult(null);
    setCoin(null);
    setSpinKey((k) => k + 1);

    const res = await fetch("/api/game/casino", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "coinflip", bet, choice }),
    });
    const data = await res.json();
    const winner: "heads" | "tails" = data.result ?? choice;

    // Coin spin is 1.6s — after it finishes, show landed state
    setTimeout(() => {
      setFlipping(false);
      setCoin(winner);
      setLanded(true);
      setTimeout(() => {
        setResult({ label: data.label ?? data.error, payout: data.net_change ?? 0 });
        if (data.new_credits != null) {
          setCredits(data.new_credits);
          setCreditsBump(true);
        }
      }, 400);
    }, 1650);
  };

  // The spin animation ends at rotateY(3600deg) = 0deg (heads showing)
  // or rotateY(3780deg) = 180deg (tails showing)
  // So: heads result → coin-spin-3d (lands on 0/360), tails → coin-spin-3d-half (lands on 180)
  const spinClass = coin === "tails" ? "animate-coin-spin-half" : "animate-coin-spin";

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

          <div className="my-8 flex justify-center" style={{ perspective: "800px" }}>
            {/* Idle state */}
            {!flipping && !coin && (
              <div className="relative" style={{ transformStyle: "preserve-3d" }}>
                <CoinFace side="heads" />
              </div>
            )}

            {/* Spinning state — 3D coin with two faces */}
            {flipping && (
              <div
                key={spinKey}
                className={spinClass}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="relative w-32 h-32 sm:w-36 sm:h-36" style={{ transformStyle: "preserve-3d" }}>
                  {/* Front face (heads) */}
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                    <CoinFace side="heads" />
                  </div>
                  {/* Back face (tails) */}
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <CoinFace side="tails" />
                  </div>
                </div>
              </div>
            )}

            {/* Landed state — show winning side */}
            {!flipping && coin && (
              <div className={landed ? "animate-coin-land" : ""}>
                <CoinFace side={coin} />
              </div>
            )}
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
          <div className="flex justify-between text-xs text-slate-400">
            <span>Credits</span>
            <span className={`text-amber-400 font-bold font-mono ${creditsBump ? "animate-credits-bump" : ""}`}>{credits.toLocaleString()} ₡</span>
          </div>
          <div className="flex gap-2">
            {QUICK_BETS.map((q) => (
              <button key={q} onClick={() => setBet(q)} disabled={flipping}
                className={`flex-1 py-1.5 rounded text-xs font-bold transition ${bet === q ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                {q}
              </button>
            ))}
          </div>
          <input type="number" value={bet} onChange={(e) => setBet(Math.max(10, Number(e.target.value)))}
            disabled={flipping} min={10}
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-center" />
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
