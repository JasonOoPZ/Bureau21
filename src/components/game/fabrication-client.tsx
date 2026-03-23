"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Recipe {
  tier: number;
  oreCost: number;
  label: string;
}

interface FabState {
  ore: number;
  mineReady: boolean;
  cooldownRemaining: number;
  cooldownMinutes: number;
  level: number;
  credits: number;
  recipes: Recipe[];
}

interface FabResult {
  action: "mine" | "craft";
  oreGain?: number;
  ore: number;
  item?: { name: string; type: string; tier: number };
  oreCost?: number;
  message: string;
}

const TIER_COLORS: Record<number, string> = {
  1: "text-slate-300 border-slate-600",
  2: "text-blue-300 border-blue-800",
  3: "text-amber-300 border-amber-800",
};

const TIER_LABELS: Record<number, string> = { 1: "Common", 2: "Rare", 3: "Legendary" };

export function FabricationClient() {
  const [state, setState] = useState<FabState | null>(null);
  const [loading, setLoading] = useState(true);
  const [mining, setMining] = useState(false);
  const [crafting, setCrafting] = useState(false);
  const [result, setResult] = useState<FabResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadState = useCallback(async () => {
    try {
      const res = await fetch("/api/game/fabrication");
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

  useEffect(() => { loadState(); }, [loadState]);

  useEffect(() => {
    if (countdown <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setState((s) => s ? { ...s, mineReady: true, cooldownRemaining: 0 } : s);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [countdown]);

  const mine = async () => {
    setError(null);
    setResult(null);
    setMining(true);
    try {
      const res = await fetch("/api/game/fabrication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mine" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      await loadState();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Mining failed.");
    } finally {
      setMining(false);
    }
  };

  const craft = async (tier: number) => {
    setError(null);
    setResult(null);
    setCrafting(true);
    try {
      const res = await fetch("/api/game/fabrication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "craft", tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      await loadState();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Crafting failed.");
    } finally {
      setCrafting(false);
    }
  };

  const fmtCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500">Initialising drill systems…</div>;
  }
  if (!state) {
    return <div className="rounded-xl border border-red-900/40 bg-red-900/10 p-4 text-red-400">{error ?? "Could not load Fabrication."}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4 text-center">
          <div className="text-2xl font-bold text-amber-300">{state.credits.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Credits</div>
        </div>
        <div className="rounded-xl border border-orange-900/40 bg-orange-900/10 p-4 text-center">
          <div className="text-2xl font-bold text-orange-300">{state.ore}</div>
          <div className="text-xs text-slate-500 mt-1">Ore</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4 text-center">
          <div className="text-2xl font-bold text-cyan-300">{state.level}</div>
          <div className="text-xs text-slate-500 mt-1">Level</div>
        </div>
      </div>

      {/* Mining */}
      <div className="rounded-xl border border-orange-900/30 bg-[#130d06] p-6">
        <h2 className="mb-1 font-[family-name:var(--font-orbitron)] text-base font-bold text-orange-300">
          Asteroid Mining Drill
        </h2>
        <p className="mb-5 text-xs text-slate-500">
          Deploy the drill for {state.cooldownMinutes} minutes to extract ore. Yields 3–8 ore per run.
        </p>

        {state.mineReady ? (
          <button
            onClick={mine}
            disabled={mining}
            className="w-full rounded-lg bg-orange-700 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            {mining ? "Mining…" : "⛏ Deploy Drill"}
          </button>
        ) : (
          <div className="text-center">
            <p className="mb-2 text-xs text-slate-500 uppercase tracking-widest">Drill returns in</p>
            <div className="font-[family-name:var(--font-orbitron)] text-4xl font-black text-orange-300 tabular-nums">
              {fmtCountdown(countdown)}
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-orange-600 transition-all"
                style={{ width: `${Math.max(0, 100 - (countdown / (state.cooldownMinutes * 60)) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Crafting */}
      <div className="rounded-xl border border-slate-700 bg-[#0b0f14] p-6">
        <h2 className="mb-1 font-[family-name:var(--font-orbitron)] text-base font-bold text-slate-100">
          Item Fabrication
        </h2>
        <p className="mb-5 text-xs text-slate-500">
          Spend ore to craft equipment. Higher tiers cost more but yield stronger gear.
        </p>
        <div className="space-y-3">
          {state.recipes.map((r) => {
            const canAfford = state.ore >= r.oreCost;
            return (
              <div
                key={r.tier}
                className={`flex items-center justify-between rounded-xl border p-4 ${TIER_COLORS[r.tier]} bg-slate-900/40`}
              >
                <div>
                  <div className="text-sm font-semibold">{r.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {TIER_LABELS[r.tier]} · Costs {r.oreCost} ore · Random weapon, shield, or engine
                  </div>
                </div>
                <button
                  onClick={() => craft(r.tier)}
                  disabled={crafting || !canAfford}
                  className={`ml-4 shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition-colors
                    ${canAfford
                      ? r.tier === 3 ? "bg-amber-700 text-white hover:bg-amber-600" :
                        r.tier === 2 ? "bg-blue-700 text-white hover:bg-blue-600" :
                        "bg-slate-700 text-white hover:bg-slate-600"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed"}`}
                >
                  {crafting ? "…" : `Craft (${r.oreCost} ore)`}
                </button>
              </div>
            );
          })}
        </div>
        {state.ore === 0 && (
          <p className="mt-3 text-xs text-slate-500 text-center">
            Mine ore with the drill to unlock crafting.
          </p>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl border p-4 ${result.action === "craft" ? "border-violet-800/50 bg-violet-900/10" : "border-orange-800/50 bg-orange-900/10"}`}>
          <p className={`text-sm font-semibold ${result.action === "craft" ? "text-violet-300" : "text-orange-300"}`}>
            {result.message}
          </p>
          {result.item && (
            <p className="mt-1 text-xs text-slate-400">
              Item: <span className="text-slate-200">{result.item.name}</span> · {result.item.type} · {TIER_LABELS[result.item.tier]}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-900/10 p-3 text-sm text-red-400">{error}</div>
      )}

      {/* Info */}
      <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Fabrication Notes</h3>
        <ul className="space-y-2 text-xs text-slate-400">
          <li className="flex gap-2"><span className="text-orange-400">▸</span> Each mining run yields 3–8 ore. The drill has a {state.cooldownMinutes}-minute cooling period.</li>
          <li className="flex gap-2"><span className="text-orange-400">▸</span> Crafted items are added directly to your Inventory and can be equipped from there.</li>
          <li className="flex gap-2"><span className="text-orange-400">▸</span> Tier 3 items are Legendary and offer the highest stat bonuses in the game.</li>
          <li className="flex gap-2"><span className="text-orange-400">▸</span> Item type (weapon, shield, engine) is randomised within the chosen tier.</li>
        </ul>
      </div>
    </div>
  );
}
