"use client";

import { useState, useEffect } from "react";
import { GAME_CONSTANTS } from "@/lib/constants";

interface TrainingOption {
  key: string;
  label: string;
  cost: number;
  gain?: number;
  efficiency?: number;
}

interface GymState {
  motivation: number;
  motivationCap: number;
  gymStreak: number;
  lastGymAt: string | null;
  strength: number;
  speed: number;
  endurance: number;
  panic: number;
  confidence: number;
  trainingOptions: TrainingOption[];
}

interface Props {
  initial: GymState;
}

const TRAINING_DATA = {
  strength: { label: "Strength", description: "ATK/DEF power", icon: "💪", cost: 15, gain: 0.3 },
  speed: { label: "Speed", description: "Turn order advantage", icon: "⚡", cost: 15, gain: 0.3 },
  endurance: { label: "Endurance", description: "Long-fight resilience", icon: "🛡️", cost: 10, gain: 0.02 },
  panic_control: { label: "Panic Control", description: "Reduce panic buildup", icon: "🧘", cost: 20, gain: -0.05 },
  confidence: { label: "Confidence", description: "Battle confidence boost", icon: "⭐", cost: 25, gain: 2 },
} as const;

const TRAINING_DESCRIPTIONS: Record<string, string> = {
  strength: "Increases ATK and DEF base values.",
  speed: "Determines turn order; higher speed attacks first.",
  endurance: "Boosts stamina and long-fight resilience.",
  panic_control: "Reduces panic, stabilizing performance under pressure.",
  confidence: "Increases confidence. Higher confidence = battle bonuses.",
};

export function GymConsole({ initial }: Props) {
  const [state, setState] = useState<GymState>(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll motivation regen every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/game/gym");
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({ ...prev, motivation: data.motivation }));
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function train(trainingKey: string) {
    if (loading) return;
    setLoading(trainingKey);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/game/gym", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ training: trainingKey }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Training failed.");
        return;
      }

      setMessage(data.message);

      // Refresh gym state
      const refresh = await fetch("/api/game/gym");
      if (refresh.ok) {
        const refreshed = await refresh.json();
        setState(refreshed);
      }
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(null);
    }
  }

  const motivationPct = Math.min(100, (state.motivation / state.motivationCap) * 100);
  const streakBonus = 1 + state.gymStreak * GAME_CONSTANTS.GYM_STREAK_BONUS_PER_DAY;

  // Helper to render stat value
  const StatBar = ({ current, label }: { current: number; label: string }) => {
    return (
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
        <span className="font-mono text-[11px] font-semibold text-emerald-400">
          {current < 1 ? current.toFixed(4) : current.toFixed(2)}
        </span>
      </div>
    );
  };

  // Streak milestone calculation
  const nextMilestone = Math.ceil((state.gymStreak + 1) / 5) * 5;
  const milestonesReached = Math.floor(state.gymStreak / 5);

  return (
    <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* LEFT — Stats */}
      <div className="space-y-3">
        {/* Motivation */}
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Motivation Energy</p>
            <span className="text-[12px] font-bold text-amber-300">
              {state.motivation} / {state.motivationCap}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800">
            <div
              className={`h-2 rounded-full transition-all ${
                motivationPct < 33 ? "bg-red-500" : motivationPct < 66 ? "bg-yellow-500" : "bg-emerald-500"
              }`}
              style={{ width: `${motivationPct}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-slate-600">
            Regens 1 every {GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES} min · Cap: {state.motivationCap}
          </p>
          {state.motivation < state.motivationCap && (
            <p className="mt-1 text-[10px] text-slate-500">
              ⏱️ Next point in ~{GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES} min
            </p>
          )}
          {state.motivation === state.motivationCap && (
            <p className="mt-1 text-[10px] text-emerald-400">
              ✓ At max capacity! Ready to train.
            </p>
          )}
          {state.gymStreak > 0 && (
            <p className="mt-2 text-[10px] text-emerald-500 font-medium">
              🔥 {state.gymStreak}-day streak · ×{streakBonus.toFixed(2)} training bonus
            </p>
          )}
        </div>

        {/* Current stats with progress bars */}
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
          <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">
            Combat Stats
          </p>
          <div className="space-y-3">
            <StatBar current={state.strength} label="Strength" />
            <StatBar current={state.speed} label="Speed" />
            <StatBar current={state.endurance} label="Endurance" />
            <StatBar current={state.panic} label="Panic" />
            <StatBar current={state.confidence} label="Confidence" />
          </div>
        </div>
      </div>

      {/* RIGHT — Training options */}
      <div className="space-y-3">
        {message && (
          <div className="rounded-md border border-emerald-800 bg-emerald-950/20 px-4 py-3 text-[12px] text-emerald-300">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-3 text-[12px] text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
          <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">
            Training Programs
          </p>
          <div className="space-y-2">
            {state.trainingOptions.map((opt) => {
              const data = TRAINING_DATA[opt.key as keyof typeof TRAINING_DATA];
              const canAfford = state.motivation >= opt.cost;
              const isLoading = loading === opt.key;
              const baseGain = data.gain;
              const effectiveGain = baseGain * streakBonus;
              const efficiency = Math.abs(baseGain / opt.cost);
              
              return (
                <div
                  key={opt.key}
                  className={`rounded border transition ${
                    canAfford
                      ? "border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60"
                      : "border-slate-800 bg-slate-950/40 opacity-50"
                  }`}
                >
                  <div className="p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base leading-none">{data.icon}</span>
                          <p className="text-[12px] font-semibold text-slate-200">
                            {data.label}
                          </p>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {data.description}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[10px]">
                          <span className={canAfford ? "text-amber-300" : "text-slate-600"}>
                            Cost: {opt.cost} MOT
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className={`font-mono ${canAfford ? "text-cyan-300" : "text-slate-600"}`}>
                            {opt.key === "panic_control"
                              ? `−${Math.abs(effectiveGain).toFixed(3)}`
                              : `+${(effectiveGain).toFixed(data.gain < 1 ? 3 : 2)}`}
                            {state.gymStreak > 0 && ` (×${streakBonus.toFixed(2)})`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => train(opt.key)}
                        disabled={!canAfford || !!loading}
                        className={`shrink-0 rounded px-2.5 py-1.5 text-[11px] font-medium transition ${
                          canAfford
                            ? "border border-cyan-700 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50"
                            : "border border-slate-700 bg-slate-800/20 text-slate-600 cursor-not-allowed"
                        }`}
                      >
                        {isLoading ? "..." : "Train"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-slate-500">
            Streak Rewards & Tips
          </p>
          <div className="space-y-2">
            {state.gymStreak > 0 && (
              <div className="rounded border border-emerald-900/40 bg-emerald-950/20 p-2">
                <p className="text-[11px] text-emerald-300">
                  🔥 {state.gymStreak}-day streak active
                </p>
                <p className="mt-1 text-[10px] text-emerald-400">
                  Next milestone: Day {nextMilestone} ({nextMilestone - state.gymStreak} sessions away)
                </p>
              </div>
            )}
            <ul className="space-y-1 text-[10px] text-slate-400">
              <li>✓ Train every 24h to extend your current streak.</li>
              <li>✓ Streaks reach max bonus at day 30 (+{(30 * GAME_CONSTANTS.GYM_STREAK_BONUS_PER_DAY * 100).toFixed(0)}%).</li>
              <li>✓ Break {'>'} 48h breaks your streak; regain by training again.</li>
              <li>✓ All gains are permanent and boost your combat stats.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
