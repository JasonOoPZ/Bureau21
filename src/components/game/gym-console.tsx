"use client";

import { useState, useEffect, useMemo } from "react";
import { GAME_CONSTANTS } from "@/lib/constants";

interface TrainingOption {
  key: string;
  label: string;
  cost: number;
}

interface EnergyBreakdown {
  foundation: number;
  enduranceBonus: number;
  streakBonus: number;
  max: number;
}

interface GymLogEntry {
  training: string;
  gain: number;
  energyCost: number;
  createdAt: string;
}

interface GymState {
  gymEnergy: number;
  energyBreakdown: EnergyBreakdown;
  hoursUntilReset: number;
  gymStreak: number;
  lastGymAt: string | null;
  strength: number;
  speed: number;
  endurance: number;
  panic: number;
  confidence: number;
  confidenceCap: number;
  trainingOptions: TrainingOption[];
  gymLogs: GymLogEntry[];
}

interface Props {
  initial: GymState;
}

const TRAINING_DATA = {
  strength: { label: "Strength", description: "ATK/DEF power", icon: "💪", cost: 8, gain: 0.3 },
  speed: { label: "Speed", description: "Turn order advantage", icon: "⚡", cost: 8, gain: 0.3 },
  endurance: { label: "Endurance", description: "Long-fight resilience + energy pool", icon: "🛡️", cost: 5, gain: 0.02 },
  panic_control: { label: "Panic Control", description: "Reduce panic buildup", icon: "🧘", cost: 10, gain: -0.05 },
} as const;

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function formatHours(h: number) {
  const hrs = Math.floor(h);
  const mins = Math.floor((h - hrs) * 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

/** Group gym logs by day and sum gains per stat */
function aggregateLogs(logs: GymLogEntry[], days: number) {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  const filtered = logs.filter((l) => new Date(l.createdAt).getTime() >= cutoff);

  const byDay: Record<string, Record<string, number>> = {};
  const totals: Record<string, number> = {};

  for (const log of filtered) {
    const day = new Date(log.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    if (!byDay[day]) byDay[day] = {};
    byDay[day][log.training] = (byDay[day][log.training] ?? 0) + Math.abs(log.gain);
    totals[log.training] = (totals[log.training] ?? 0) + Math.abs(log.gain);
  }

  return { byDay, totals, sessions: filtered.length };
}

const STAT_COLORS: Record<string, string> = {
  strength: "bg-red-500",
  speed: "bg-cyan-500",
  endurance: "bg-amber-500",
  panic_control: "bg-purple-500",
};

const STAT_TEXT_COLORS: Record<string, string> = {
  strength: "text-red-400",
  speed: "text-cyan-400",
  endurance: "text-amber-400",
  panic_control: "text-purple-400",
};

export function GymConsole({ initial }: Props) {
  const [state, setState] = useState<GymState>(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gainView, setGainView] = useState<"week" | "month">("week");

  // Poll energy regen every 60s
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/game/gym");
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    }, 60_000);
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

      // Refresh full state
      const refresh = await fetch("/api/game/gym");
      if (refresh.ok) setState(await refresh.json());
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(null);
    }
  }

  const { energyBreakdown: eb } = state;
  const energyPct = eb.max > 0 ? Math.min(100, (state.gymEnergy / eb.max) * 100) : 0;
  const streakBonus = 1 + state.gymStreak * GAME_CONSTANTS.GYM_STREAK_BONUS_PER_DAY;

  const gains = useMemo(
    () => aggregateLogs(state.gymLogs, gainView === "week" ? 7 : 30),
    [state.gymLogs, gainView]
  );

  // Daily activity sparkline (last 7 or 30 days)
  const dayKeys = Object.keys(gains.byDay);
  const maxDaySessions = Math.max(
    1,
    ...Object.values(gains.byDay).map((d) => Object.values(d).reduce((a, b) => a + b, 0))
  );

  return (
    <div className="space-y-4">
      {/* ── Gym Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-amber-900/40 bg-gradient-to-r from-[#0f0d08] via-[#11100a] to-[#0f0d08]">
        <div className="absolute inset-0 opacity-10" style={{ background: "repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(245,158,11,0.08) 40px, rgba(245,158,11,0.08) 41px)" }} />
        <div className="relative flex items-center gap-4 p-5">
          <div className="text-5xl">🏋️</div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-amber-300">Galaxy Gym</h2>
            <p className="text-[11px] text-slate-400">Cybernetic Performance Enhancement Facility</p>
          </div>
          <div className="ml-auto hidden sm:block text-right">
            <div className="text-[10px] uppercase tracking-widest text-slate-600">Sector</div>
            <div className="text-sm font-bold text-amber-400">Training Bay</div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ── LEFT — Energy & Stats ──────────────────────────────── */}
        <div className="space-y-3">
          {/* Gym Energy System */}
          <div className="rounded-lg border border-amber-900/40 bg-[#0a0d11] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500">⚡ Gym Energy</p>
              <span className="text-[13px] font-black text-amber-300 font-mono">
                {state.gymEnergy} / {eb.max}
              </span>
            </div>

            {/* Main energy bar */}
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden mb-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  energyPct < 25 ? "bg-red-500" : energyPct < 50 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${energyPct}%` }}
              />
            </div>

            {/* Energy breakdown */}
            <div className="space-y-2 mb-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-semibold">Energy Composition</p>

              {/* Foundation */}
              <div>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-slate-400">🏗️ Foundation</span>
                  <span className="text-slate-300 font-mono">{eb.foundation}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800">
                  <div className="h-1.5 rounded-full bg-slate-500" style={{ width: `${(eb.foundation / eb.max) * 100}%` }} />
                </div>
                <p className="text-[8px] text-slate-600 mt-0.5">Fixed base energy (25%)</p>
              </div>

              {/* Endurance */}
              <div>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-slate-400">🛡️ Endurance Pool</span>
                  <span className="text-amber-300 font-mono">{eb.enduranceBonus}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800">
                  <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${eb.max > 0 ? (eb.enduranceBonus / eb.max) * 100 : 0}%` }} />
                </div>
                <p className="text-[8px] text-slate-600 mt-0.5">Endurance × {GAME_CONSTANTS.GYM_ENERGY_PER_ENDURANCE} (50%)</p>
              </div>

              {/* Streak */}
              <div>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-slate-400">🔥 Streak Bonus</span>
                  <span className="text-emerald-300 font-mono">{eb.streakBonus}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800">
                  <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${eb.max > 0 ? (eb.streakBonus / eb.max) * 100 : 0}%` }} />
                </div>
                <p className="text-[8px] text-slate-600 mt-0.5">+1 per streak day, max {GAME_CONSTANTS.GYM_ENERGY_MAX_STREAK} (25%)</p>
              </div>
            </div>

            {/* Reset timer */}
            <div className="rounded border border-slate-800 bg-slate-900/40 px-3 py-2 text-center">
              {state.hoursUntilReset > 0 ? (
                <>
                  <p className="text-[10px] text-slate-500">Energy resets in</p>
                  <p className="text-sm font-bold text-cyan-300 font-mono">{formatHours(state.hoursUntilReset)}</p>
                </>
              ) : (
                <p className="text-[11px] text-emerald-400 font-semibold">✓ Energy reset — Full tank!</p>
              )}
            </div>
          </div>

          {/* Streak */}
          <div className="rounded-lg border border-slate-800 bg-[#0a0d11] p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Training Streak</p>
              <span className="text-sm font-black text-emerald-400">{state.gymStreak}d</span>
            </div>
            {/* Streak progress bar to max 30 */}
            <div className="h-2 rounded-full bg-slate-800 mb-1.5">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                style={{ width: `${Math.min(100, (state.gymStreak / 30) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-600">
              <span>0</span>
              <span>Max: 30d</span>
            </div>
            {state.gymStreak > 0 && (
              <p className="mt-2 text-[10px] text-emerald-400">
                ×{streakBonus.toFixed(2)} training multiplier · +{eb.streakBonus} energy
              </p>
            )}
          </div>

          {/* Combat Stats */}
          <div className="rounded-lg border border-slate-800 bg-[#0a0d11] p-3">
            <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">Combat Stats</p>
            <div className="space-y-2">
              {[
                { label: "Strength", value: state.strength, color: "text-red-400" },
                { label: "Speed", value: state.speed, color: "text-cyan-400" },
                { label: "Endurance", value: state.endurance, color: "text-amber-400" },
                { label: "Panic", value: state.panic, color: "text-purple-400" },
                { label: "Confidence", value: state.confidence, cap: state.confidenceCap, color: "text-emerald-400", note: "Battle only" },
              ].map(({ label, value, cap, color, note }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                    {label}{note ? <span className="ml-1 text-[8px] text-slate-600">({note})</span> : null}
                  </span>
                  <span className={`font-mono text-[11px] font-semibold ${color}`}>
                    {value < 1 ? value.toFixed(4) : value.toFixed(2)}{cap != null ? ` / ${cap}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT — Training + Graphs ───────────────────────────── */}
        <div className="space-y-3">
          {message && (
            <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-4 py-3 text-[12px] text-emerald-300">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-[12px] text-red-400">
              {error}
            </div>
          )}

          {/* Training Programs */}
          <div className="rounded-lg border border-slate-800 bg-[#0a0d11] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              🏋️ Training Programs
            </p>
            <div className="space-y-2">
              {state.trainingOptions.map((opt) => {
                const data = TRAINING_DATA[opt.key as keyof typeof TRAINING_DATA];
                if (!data) return null;
                const canAfford = state.gymEnergy >= opt.cost;
                const isLoading = loading === opt.key;
                const effectiveGain = data.gain * streakBonus;

                return (
                  <div
                    key={opt.key}
                    className={`rounded-lg border transition ${
                      canAfford
                        ? "border-slate-700 bg-slate-900/40 hover:border-amber-800/60 hover:bg-slate-900/60"
                        : "border-slate-800 bg-slate-950/40 opacity-50"
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg leading-none">{data.icon}</span>
                            <div>
                              <p className="text-[12px] font-semibold text-slate-200">{data.label}</p>
                              <p className="text-[10px] text-slate-500">{data.description}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-[10px]">
                            <span className={canAfford ? "text-amber-300" : "text-slate-600"}>
                              ⚡ {opt.cost} energy
                            </span>
                            <span className="text-slate-700">•</span>
                            <span className={`font-mono ${canAfford ? (STAT_TEXT_COLORS[opt.key] ?? "text-cyan-300") : "text-slate-600"}`}>
                              {opt.key === "panic_control"
                                ? `−${Math.abs(effectiveGain).toFixed(3)}`
                                : `+${effectiveGain.toFixed(data.gain < 1 ? 3 : 2)}`}
                              {state.gymStreak > 0 && ` (×${streakBonus.toFixed(2)})`}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => train(opt.key)}
                          disabled={!canAfford || !!loading}
                          className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-bold transition ${
                            canAfford
                              ? "border border-amber-700/60 bg-amber-900/30 text-amber-300 hover:bg-amber-800/40"
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

          {/* ── Gains Dashboard ─────────────────────────────────── */}
          <div className="rounded-lg border border-slate-800 bg-[#0a0d11] p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">📊 Training Gains</p>
              <div className="flex gap-1">
                {(["week", "month"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setGainView(v)}
                    className={`rounded px-2.5 py-1 text-[9px] uppercase tracking-wider transition ${
                      gainView === v
                        ? "bg-amber-900/30 border border-amber-700/50 text-amber-300"
                        : "border border-slate-700 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {v === "week" ? "7d" : "30d"}
                  </button>
                ))}
              </div>
            </div>

            {gains.sessions === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">📈</p>
                <p className="text-[11px] text-slate-600">No training data yet. Start training to see your progress.</p>
              </div>
            ) : (
              <>
                {/* Stat totals */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Object.entries(TRAINING_DATA).map(([key, data]) => {
                    const total = gains.totals[key] ?? 0;
                    return (
                      <div key={key} className="rounded-lg border border-slate-800 bg-black/30 p-2 text-center">
                        <span className="text-lg block mb-0.5">{data.icon}</span>
                        <p className={`text-[11px] font-black font-mono ${STAT_TEXT_COLORS[key]}`}>
                          {total < 1 ? total.toFixed(3) : total.toFixed(1)}
                        </p>
                        <p className="text-[8px] text-slate-600 uppercase">{data.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Activity chart */}
                <div className="mb-3">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-2">Daily Activity</p>
                  <div className="flex items-end gap-1 h-16">
                    {dayKeys.length > 0 ? dayKeys.reverse().map((day) => {
                      const dayTotal = Object.values(gains.byDay[day]).reduce((a, b) => a + b, 0);
                      const pct = Math.max(4, (dayTotal / maxDaySessions) * 100);
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-0.5" title={`${day}: ${Object.entries(gains.byDay[day]).map(([k, v]) => `${k}: ${v.toFixed(2)}`).join(", ")}`}>
                          <div className="w-full rounded-t bg-gradient-to-t from-amber-600 to-amber-400 transition-all" style={{ height: `${pct}%`, minHeight: "3px" }} />
                          <span className="text-[7px] text-slate-600 truncate w-full text-center">{day.split(" ")[1]}</span>
                        </div>
                      );
                    }) : (
                      <p className="text-[10px] text-slate-600 w-full text-center py-4">No data</p>
                    )}
                  </div>
                </div>

                {/* Session count */}
                <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/30 px-3 py-2">
                  <span className="text-[10px] text-slate-500">Total Sessions ({gainView === "week" ? "7d" : "30d"})</span>
                  <span className="text-sm font-black text-amber-300">{gains.sessions}</span>
                </div>
              </>
            )}
          </div>

          {/* ── Tips & Info ──────────────────────────────────────── */}
          <div className="rounded-lg border border-slate-800 bg-[#0a0d11] p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-slate-500">System Info</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded border border-slate-800 bg-slate-900/30 p-2">
                <span className="text-slate-500">Energy resets</span>
                <p className="text-slate-300 font-semibold">Every 24 hours</p>
              </div>
              <div className="rounded border border-slate-800 bg-slate-900/30 p-2">
                <span className="text-slate-500">Streak max</span>
                <p className="text-slate-300 font-semibold">30 days (+60% bonus)</p>
              </div>
              <div className="rounded border border-slate-800 bg-slate-900/30 p-2">
                <span className="text-slate-500">Endurance ratio</span>
                <p className="text-slate-300 font-semibold">{GAME_CONSTANTS.GYM_ENERGY_PER_ENDURANCE} energy per END</p>
              </div>
              <div className="rounded border border-slate-800 bg-slate-900/30 p-2">
                <span className="text-slate-500">Streak break</span>
                <p className="text-slate-300 font-semibold">{'>'} 48h gap</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
