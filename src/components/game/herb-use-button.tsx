"use client";

import { useState } from "react";
import { GAME_CONSTANTS } from "@/lib/constants";

interface Props {
  initialHerbs: number;
  initialLf: number;
  maxLf: number;
}

export function HerbUseButton({ initialHerbs, initialLf, maxLf }: Props) {
  const [herbs, setHerbs] = useState(initialHerbs);
  const [lf, setLf] = useState(initialLf);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUse = herbs > 0 && lf < maxLf;

  async function useHerb() {
    setLoading(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "use_herb" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to use herb.");
        return;
      }
      if (data.state) {
        setLf(data.state.lifeForce);
        setHerbs(data.state.herbs ?? 0);
      }
      setMsg(data.message ?? "Blue Herb consumed.");
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-emerald-900/40 bg-[#081410] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-600">
          Consumables
        </p>
        <span className="text-[10px] text-slate-500">
          Life Force: <span className="text-rose-400 font-semibold">{lf} / {maxLf}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-lg">🌿</span>
          <div>
            <p className="text-[11px] font-semibold text-emerald-300">Blue Herb</p>
            <p className="text-[10px] text-slate-500">
              Restores {GAME_CONSTANTS.BLUE_HERB_REVIVE_LF} Life Force · {herbs} available
            </p>
          </div>
        </div>

        <button
          onClick={useHerb}
          disabled={!canUse || loading}
          className={`rounded border px-3 py-1.5 text-[11px] font-medium transition ${
            canUse
              ? "border-emerald-700 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50"
              : "border-slate-800 bg-slate-900/20 text-slate-600 cursor-not-allowed"
          }`}
        >
          {loading ? "..." : herbs === 0 ? "No Herbs" : lf >= maxLf ? "LF Full" : "Use Herb"}
        </button>
      </div>

      {msg && (
        <p className="mt-2 text-[10px] text-emerald-400">{msg}</p>
      )}
      {error && (
        <p className="mt-2 text-[10px] text-red-400">{error}</p>
      )}

      <p className="mt-2 text-[10px] text-slate-600">
        Grow Blue Herbs at the{" "}
        <a href="/station/hydroponics" className="text-emerald-700 hover:text-emerald-400 underline">
          Hydroponics Bay
        </a>
        .
      </p>
    </div>
  );
}
