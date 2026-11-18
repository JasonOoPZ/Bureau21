"use client";

import { useState } from "react";
import Link from "next/link";
import { BetControls, CreditsBar } from "@/components/game/casino/bet-controls";
import { useCreditsBump } from "@/components/game/casino/use-credits-bump";
import { useManagedTimers } from "@/components/game/casino/use-managed-timers";

const DIE_FACES: Record<number, string> = { 1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };

export function DiceGame({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);
  const [bet, setBet] = useState(100);
  const [rolling, setRolling] = useState(false);
  const [landed, setLanded] = useState(false);
  const [dice, setDice] = useState<[number, number] | null>(null);
  const [result, setResult] = useState<{ label: string; payout: number } | null>(null);
  const [creditsBump, bumpCredits] = useCreditsBump();
  const timers = useManagedTimers();

  const roll = async (choice: "over" | "under" | "seven") => {
    setRolling(true);
    setLanded(false);
    setResult(null);

    // Visual dice animation
    const anim = timers.every(() => {
      setDice([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);
    }, 80);

    let data;
    try {
      const res = await fetch("/api/game/casino", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "dice", bet, choice }),
      });
      data = await res.json();
    } catch {
      if (!timers.isMounted()) return;
      timers.clear(anim);
      setRolling(false);
      setResult({ label: "Could not reach the casino. Please try again.", payout: 0 });
      return;
    }
    if (!timers.isMounted()) return;

    timers.after(() => {
      timers.clear(anim);
      if (data.dice) setDice(data.dice as [number, number]);
      setRolling(false);
      setLanded(true);
      timers.after(() => {
        setResult({ label: data.label ?? data.error, payout: (data.payout ?? 0) > 0 ? data.payout : (data.net_change ?? 0) });
        if (data.new_credits != null) {
          setCredits(data.new_credits);
          bumpCredits();
        }
      }, 350);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 px-3 py-4">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/primaris/casino" className="hover:text-red-300">← Casino</Link>
          <span>/</span>
          <span className="text-cyan-400">Dice</span>
        </div>

        <div className="bg-[#0b0f14] border border-cyan-900/40 rounded-xl p-6 text-center">
          <h1 className="text-xl font-bold text-cyan-400 mb-1">🎲 Dice Pit</h1>
          <p className="text-slate-500 text-xs mb-6">Roll two dice. Bet on over 7, under 7, or exactly 7.</p>

          <div className="flex justify-center gap-6 my-6">
            {dice ? (
              <>
                <div className={`text-7xl ${rolling ? "animate-dice-tumble" : landed ? "animate-dice-land" : ""}`}>{DIE_FACES[dice[0]]}</div>
                <div className={`text-7xl ${rolling ? "animate-dice-tumble" : landed ? "animate-dice-land" : ""}`} style={{ animationDelay: rolling ? "0.12s" : "0.08s" }}>{DIE_FACES[dice[1]]}</div>
              </>
            ) : (
              <>
                <div className="text-7xl text-slate-700">⚀</div>
                <div className="text-7xl text-slate-700">⚀</div>
              </>
            )}
          </div>
          {dice && !rolling && (
            <div className="text-slate-400 text-sm">Total: <span className="font-bold text-white">{dice[0] + dice[1]}</span></div>
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
          <BetControls bet={bet} onBetChange={setBet} accent="cyan" disabled={rolling} />
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => roll("under")} disabled={rolling || bet > credits}
              className="py-3 rounded-lg bg-blue-700 hover:bg-blue-600 font-bold text-white disabled:opacity-40 transition">
              Under 7<br /><span className="text-xs opacity-70">1.9x</span>
            </button>
            <button onClick={() => roll("seven")} disabled={rolling || bet > credits}
              className="py-3 rounded-lg bg-purple-700 hover:bg-purple-600 font-bold text-white disabled:opacity-40 transition">
              Exactly 7<br /><span className="text-xs opacity-70">4x</span>
            </button>
            <button onClick={() => roll("over")} disabled={rolling || bet > credits}
              className="py-3 rounded-lg bg-orange-700 hover:bg-orange-600 font-bold text-white disabled:opacity-40 transition">
              Over 7<br /><span className="text-xs opacity-70">1.9x</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
