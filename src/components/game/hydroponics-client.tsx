"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HydroState {
  plots: number;
  ready: boolean;
  cooldownRemaining: number;
  cooldownMinutes: number;
  credits: number;
  lifeForce: number;
  herbs: number;
}

interface HarvestResult {
  creditGain: number;
  lfRestore: number;
  herbGain: number;
  herbs: number;
  message: string;
}

const PLOT_ICONS = ["🌿", "🌱", "🍃"];

export function HydroponicsClient() {
  const [state, setState] = useState<HydroState | null>(null);
  const [loading, setLoading] = useState(true);
  const [harvesting, setHarvesting] = useState(false);
  const [lastResult, setLastResult] = useState<HarvestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadState = useCallback(async () => {
    try {
      const res = await fetch("/api/game/hydroponics");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState(data);
      setCountdown(data.cooldownRemaining * 60);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Tick down the countdown every second
  useEffect(() => {
    if (countdown <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setState((s) => s ? { ...s, ready: true, cooldownRemaining: 0 } : s);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [countdown]);

  const harvest = async () => {
    setError(null);
    setLastResult(null);
    setHarvesting(true);
    try {
      const res = await fetch("/api/game/hydroponics", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLastResult(data);
      await loadState();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Harvest failed.");
    } finally {
      setHarvesting(false);
    }
  };

  const fmtCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading plots…
      </div>
    );
  }

  if (!state) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-900/10 p-4 text-red-400">
        {error ?? "Could not load Hydroponics Bay."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4 text-center">
          <div className="text-2xl font-bold text-amber-300">{state.credits.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Credits</div>
        </div>
        <div className="rounded-xl border border-rose-900/40 bg-rose-900/10 p-4 text-center">
          <div className="text-2xl font-bold text-rose-400">{state.lifeForce}</div>
          <div className="text-xs text-slate-500 mt-1">Life Force</div>
        </div>
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-900/10 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{state.herbs}</div>
          <div className="text-xs text-slate-500 mt-1">Blue Herbs</div>
        </div>
      </div>

      {/* Plots */}
      <div className="rounded-xl border border-emerald-900/30 bg-[#081410] p-6">
        <h2 className="mb-1 font-[family-name:var(--font-orbitron)] text-base font-bold text-emerald-300">
          Growing Plots
        </h2>
        <p className="mb-6 text-xs text-slate-500">
          All {state.plots} plots share a single {state.cooldownMinutes}-minute harvest cooldown.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {PLOT_ICONS.map((icon, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-2 rounded-xl border p-5 transition-all ${
                state.ready
                  ? "border-emerald-700/60 bg-emerald-900/20 shadow-lg shadow-emerald-900/20"
                  : "border-slate-700 bg-slate-800/30"
              }`}
            >
              <span className={`text-4xl ${!state.ready ? "grayscale opacity-50" : ""}`}>{icon}</span>
              <span className="text-xs text-slate-400">Plot {i + 1}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  state.ready
                    ? "bg-emerald-800/60 text-emerald-300"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {state.ready ? "Ready" : "Growing"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cooldown / Harvest */}
      <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-6">
        {state.ready ? (
          <div className="text-center">
            <p className="mb-4 text-sm text-emerald-300 font-semibold">All plots are ready to harvest!</p>
            <p className="mb-6 text-xs text-slate-400">
              Yields: +20–50 credits · +10 Life Force · 40% chance of a Blue Herb
            </p>
            <button
              onClick={harvest}
              disabled={harvesting}
              className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-60 transition-colors"
            >
              {harvesting ? "Harvesting…" : "Harvest All Plots"}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-2 text-xs text-slate-500 uppercase tracking-widest">Time until ready</p>
            <div className="font-[family-name:var(--font-orbitron)] text-4xl font-black text-cyan-300 tabular-nums">
              {fmtCountdown(countdown)}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Plots are growing. Return when the timer reaches 00:00.
            </p>

            {/* Progress bar */}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{
                  width: `${Math.max(0, 100 - (countdown / (state.cooldownMinutes * 60)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Last result */}
      {lastResult && (
        <div className="rounded-xl border border-emerald-800/50 bg-emerald-900/10 p-4">
          <p className="text-sm font-semibold text-emerald-300">{lastResult.message}</p>
          <div className="mt-2 flex gap-4 text-xs text-slate-400">
            <span>+{lastResult.creditGain} credits</span>
            <span>+{lastResult.lfRestore} LF</span>
            {lastResult.herbGain > 0 && <span className="text-cyan-300">+1 Blue Herb</span>}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-900/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">About Hydroponics Bay</h3>
        <ul className="space-y-2 text-xs text-slate-400">
          <li className="flex gap-2">
            <span className="text-emerald-400">▸</span>
            Harvest every {state.cooldownMinutes} minutes for credits and Life Force.
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-400">▸</span>
            Each harvest has a 40% chance to drop a <span className="text-cyan-300">Blue Herb</span> — a rare revival consumable.
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-400">▸</span>
            Blue Herbs can be used from your inventory to restore a large amount of Life Force.
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-400">▸</span>
            Don&apos;t let plots sit idle — consistent harvesting compounds over your station career.
          </li>
        </ul>
      </div>
    </div>
  );
}
