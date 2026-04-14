"use client";

import { useState } from "react";

type GameType = "coin_flip" | "slots" | "high_low";

interface Props {
  credits: number;
}

export function CasinoClient({ credits: initCredits }: Props) {
  const [credits, setCredits] = useState(initCredits);
  const [bet, setBet] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ won: boolean; payout: number; detail: string } | null>(null);
  const [history, setHistory] = useState<{ game: string; won: boolean; payout: number }[]>([]);

  const play = async (game: GameType) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/game/casino", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, bet }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ won: false, payout: 0, detail: data.error });
        return;
      }
      setResult(data);
      setCredits(data.credits);
      setHistory((h) => [{ game, won: data.won, payout: data.payout }, ...h.slice(0, 9)]);
    } catch {
      setResult({ won: false, payout: 0, detail: "Network error." });
    } finally {
      setLoading(false);
    }
  };

  const games: { key: GameType; label: string; desc: string }[] = [
    { key: "coin_flip", label: "Coin Flip", desc: "50/50 — double or nothing (48% win rate)" },
    { key: "slots", label: "Slot Machine", desc: "1% jackpot ×10, 7% triple ×3, 17% even" },
    { key: "high_low", label: "High-Low", desc: "Draw a card. Beat the house's card to win" },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] text-slate-400">
          Welcome to the lower-deck casino. No surveillance, no regulations, no refunds.
          Place your bets wisely — the house always has a slight edge.
        </p>
        <p className="mt-2 text-[12px] text-slate-300">
          Credits: <span className="font-bold text-amber-300">{credits.toLocaleString()}</span>
        </p>
      </div>

      {/* Bet Amount */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <label className="text-[11px] uppercase tracking-wider text-slate-500">Wager Amount</label>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="number"
            min={10}
            max={Math.min(10000, credits)}
            value={bet}
            onChange={(e) => setBet(Math.max(10, Math.min(10000, parseInt(e.target.value) || 10)))}
            className="w-28 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-center text-[12px] text-slate-200 focus:border-cyan-600 focus:outline-none"
          />
          <div className="flex gap-1">
            {[50, 100, 500, 1000].map((v) => (
              <button
                key={v}
                onClick={() => setBet(Math.min(v, credits))}
                className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 hover:border-cyan-700 hover:text-cyan-300"
              >
                {v}
              </button>
            ))}
            <button
              onClick={() => setBet(Math.min(10000, credits))}
              className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 hover:border-amber-700 hover:text-amber-300"
            >
              MAX
            </button>
          </div>
        </div>
      </div>

      {/* Games */}
      <div className="grid gap-2 sm:grid-cols-3">
        {games.map((g) => (
          <button
            key={g.key}
            onClick={() => play(g.key)}
            disabled={loading || credits < bet}
            className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 text-left transition hover:border-purple-700 disabled:opacity-50"
          >
            <p className="text-[12px] font-bold text-purple-300">{g.label}</p>
            <p className="mt-1 text-[10px] text-slate-500">{g.desc}</p>
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-md border p-4 text-[12px] ${
            result.won
              ? "border-emerald-800 bg-emerald-950/20 text-emerald-300"
              : "border-red-900 bg-red-950/20 text-red-300"
          }`}
        >
          <p className="font-bold">{result.won ? "WIN" : result.payout === 0 ? "PUSH" : "LOSS"}</p>
          <p className="mt-1">{result.detail}</p>
          {result.payout !== 0 && (
            <p className="mt-1 font-mono">
              {result.payout > 0 ? "+" : ""}
              {result.payout.toLocaleString()} credits
            </p>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Recent Plays</p>
          <div className="mt-2 space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 capitalize">{h.game.replace("_", " ")}</span>
                <span className={h.won ? "text-emerald-400" : "text-red-400"}>
                  {h.payout > 0 ? "+" : ""}{h.payout.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
