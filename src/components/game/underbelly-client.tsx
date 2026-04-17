"use client";

import { useState } from "react";

interface RollResult {
  won: boolean;
  bet: number;
  creditDelta: number;
  newCredits: number;
  die1: number;
  die2: number;
  diceTotal: number;
  message: string;
}

const DIE_FACES: Record<number, string> = {
  1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅",
};

const QUICK_BETS = [10, 25, 50, 100, 250, 500];

interface Props {
  initialCredits: number;
  pilotLevel: number;
  hasGodCard?: boolean;
}

export function UnderbellyClient({ initialCredits, pilotLevel, hasGodCard }: Props) {
  const [credits, setCredits] = useState(initialCredits);
  const [bet, setBet] = useState(25);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<RollResult | null>(null);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const UNLOCK_LEVEL = 5;
  const locked = !hasGodCard && pilotLevel < UNLOCK_LEVEL;

  const roll = async () => {
    if (locked) return;
    if (bet < 10 || bet > 500) return;
    if (credits < bet) {
      setError("Not enough credits.");
      return;
    }
    setError(null);
    setRolling(true);
    try {
      const res = await fetch("/api/game/underbelly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet }),
      });
      const data: RollResult = await res.json();
      if (!res.ok) throw new Error((data as unknown as { error: string }).error);
      setResult(data);
      setCredits(data.newCredits);
      setHistory((h) => [data, ...h].slice(0, 10));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Roll failed.");
    } finally {
      setRolling(false);
    }
  };

  if (locked) {
    return (
      <div className="rounded-xl border border-slate-700 bg-[#0b0f14] p-8 text-center">
        <div className="mb-3 text-4xl">🔒</div>
        <h3 className="mb-2 font-[family-name:var(--font-orbitron)] text-lg font-bold text-slate-300">
          Access Restricted
        </h3>
        <p className="text-sm text-slate-400">
          The Underbelly requires Level {UNLOCK_LEVEL}. You are Level {pilotLevel}.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Keep training and fighting to unlock this district.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credits strip */}
      <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4 flex items-center justify-between">
        <span className="text-sm text-slate-400">Your Credits</span>
        <span className="font-[family-name:var(--font-orbitron)] text-xl font-bold text-amber-300">
          {credits.toLocaleString()} cr
        </span>
      </div>

      {/* Dice game */}
      <div className="rounded-xl border border-purple-900/40 bg-[#0d0816] p-6">
        <h2 className="mb-1 font-[family-name:var(--font-orbitron)] text-base font-bold text-purple-300">
          Double or Nothing Dice
        </h2>
        <p className="mb-6 text-xs text-slate-500">
          Roll two dice against the house. Win chance: 45% · Payout: 1.9× your bet.
        </p>

        {/* Dice display */}
        <div className="mb-6 flex items-center justify-center gap-6">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-xl border-2 text-5xl transition-all
              ${result ? (result.won ? "border-emerald-500 bg-emerald-900/20" : "border-red-500 bg-red-900/20") : "border-slate-600 bg-slate-800"}`}
          >
            {rolling ? "🎲" : result ? DIE_FACES[result.die1] : "⚀"}
          </div>
          <span className="text-2xl text-slate-500">+</span>
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-xl border-2 text-5xl transition-all
              ${result ? (result.won ? "border-emerald-500 bg-emerald-900/20" : "border-red-500 bg-red-900/20") : "border-slate-600 bg-slate-800"}`}
          >
            {rolling ? "🎲" : result ? DIE_FACES[result.die2] : "⚁"}
          </div>
          {result && (
            <div className="ml-4 text-center">
              <div className="text-3xl font-black text-slate-200">{result.diceTotal}</div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
          )}
        </div>

        {/* RESULT MESSAGE */}
        {result && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-center text-sm font-semibold
              ${result.won
                ? "border-emerald-800/50 bg-emerald-900/20 text-emerald-300"
                : "border-red-800/50 bg-red-900/20 text-red-400"}`}
          >
            {result.message}
            <div className="mt-1 text-xs font-normal text-slate-400">
              {result.won
                ? `+${result.creditDelta} credits`
                : `${result.creditDelta} credits`}
            </div>
          </div>
        )}

        {/* Bet input */}
        <div className="mb-4">
          <label className="mb-2 flex justify-between text-xs text-slate-400">
            <span>Bet Amount</span>
            <span className="text-amber-300">{bet} cr</span>
          </label>
          <input
            type="range" min={10} max={Math.min(500, credits)} step={5}
            value={Math.min(bet, credits)}
            onChange={(e) => setBet(parseInt(e.target.value))}
            className="w-full accent-purple-400"
            disabled={rolling}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_BETS.map((q) => (
              <button
                key={q}
                onClick={() => setBet(Math.min(q, credits))}
                disabled={credits < q || rolling}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors
                  ${bet === q
                    ? "bg-purple-700 text-white"
                    : "border border-slate-700 text-slate-400 hover:border-purple-600 hover:text-purple-300"}
                  disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {q} cr
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={roll}
          disabled={rolling || credits < bet || bet < 10}
          className="w-full rounded-lg bg-purple-700 py-3 text-sm font-bold text-white hover:bg-purple-600 disabled:opacity-60 transition-colors"
        >
          {rolling ? "Rolling…" : `Roll for ${bet} cr`}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-900/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">Recent Rolls</h3>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {DIE_FACES[h.die1]} {DIE_FACES[h.die2]} — Total {h.diceTotal} — bet {h.bet} cr
                </span>
                <span className={h.won ? "text-emerald-400 font-semibold" : "text-red-400"}>
                  {h.won ? `+${h.creditDelta}` : h.creditDelta} cr
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* House rules */}
      <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">House Rules</h3>
        <ul className="space-y-2 text-xs text-slate-400">
          <li className="flex gap-2"><span className="text-purple-400">▸</span> The house wins 55% of rolls. Payout is 1.9× your stake on a win.</li>
          <li className="flex gap-2"><span className="text-purple-400">▸</span> Minimum bet: 10 credits. Maximum bet: 500 credits per roll.</li>
          <li className="flex gap-2"><span className="text-purple-400">▸</span> You cannot bet more than your current credit balance.</li>
          <li className="flex gap-2"><span className="text-purple-400">▸</span> No cooldowns — but the house edge compounds fast. Gamble responsibly, Operator.</li>
        </ul>
      </div>
    </div>
  );
}
