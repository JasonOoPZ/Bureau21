"use client";

import { useId } from "react";

export const QUICK_BETS = [100, 500, 1000, 10000, 25000];
export const MIN_BET = 10;

export type BetAccent = "slate" | "cyan" | "amber" | "emerald";

// Full class names so the Tailwind scanner keeps them.
const ACTIVE_CLASS: Record<BetAccent, string> = {
  slate: "bg-slate-600 text-white",
  cyan: "bg-cyan-600 text-white",
  amber: "bg-amber-600 text-white",
  emerald: "bg-emerald-600 text-white",
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

/** The "Credits  1,234 ₡" row at the top of every casino bet panel. */
export function CreditsBar({ credits, bump }: { credits: number; bump: boolean }) {
  return (
    <div className="flex justify-between text-xs text-slate-400">
      <span>Credits</span>
      <span className={`text-amber-400 font-bold font-mono ${bump ? "animate-credits-bump" : ""}`}>
        {credits.toLocaleString("en-US")} ₡
      </span>
    </div>
  );
}

interface BetControlsProps {
  bet: number;
  onBetChange: (bet: number) => void;
  accent: BetAccent;
  disabled?: boolean;
}

/** Quick-bet chips plus the free-form bet input shared by the casino games. */
export function BetControls({ bet, onBetChange, accent, disabled = false }: BetControlsProps) {
  const inputId = useId();
  return (
    <>
      <div className="flex gap-2" role="group" aria-label="Quick bets">
        {QUICK_BETS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onBetChange(q)}
            disabled={disabled}
            aria-pressed={bet === q}
            className={`flex-1 py-1.5 rounded text-xs font-bold transition ${FOCUS_RING} ${
              bet === q ? ACTIVE_CLASS[accent] : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {q}
          </button>
        ))}
      </div>
      <label htmlFor={inputId} className="sr-only">
        Bet amount in credits
      </label>
      <input
        id={inputId}
        type="number"
        value={bet}
        onChange={(e) => onBetChange(Math.max(MIN_BET, Number(e.target.value)))}
        disabled={disabled}
        min={MIN_BET}
        className={`w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-center ${FOCUS_RING}`}
      />
    </>
  );
}
