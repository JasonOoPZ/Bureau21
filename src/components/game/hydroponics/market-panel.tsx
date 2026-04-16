"use client";

import { CROPS, QUALITY_TIERS } from "@/lib/hydroponics/config";
import type { HydroponicsGameState } from "@/lib/hydroponics/types";
import { getSellPrice, inventoryKey, inventoryTotal, getInventoryCap } from "@/lib/hydroponics/engine";
import { useState } from "react";

interface Props {
  state: HydroponicsGameState;
  credits: number;
  onSell: (cropId: string, tier: number, amount: number) => void;
  onClose: () => void;
}

/** Mini sparkline rendered as inline SVG */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="inline-block" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function TrendArrow({ data }: { data: number[] }) {
  if (data.length < 2) return <span className="text-slate-500">—</span>;
  const recent = data[data.length - 1];
  const prev = data[data.length - 2];
  if (recent > prev) return <span className="text-emerald-400">▲</span>;
  if (recent < prev) return <span className="text-red-400">▼</span>;
  return <span className="text-slate-500">━</span>;
}

export function MarketPanel({ state, credits, onSell, onClose }: Props) {
  const [sellAmounts, setSellAmounts] = useState<Record<string, number>>({});
  const maxTierOwned = Math.max(...state.properties.map((p) => {
    return parseInt(p.id.replace("p", "")) || 1;
  }));

  const unlockedCrops = CROPS.filter((c) => c.unlockTier <= maxTierOwned);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-amber-300">Market</h3>
          <p className="text-[9px] text-slate-500">Prices update every 15 minutes. Buy low, sell high.</p>
        </div>
        <button onClick={onClose} className="text-[10px] text-slate-500 hover:text-white" aria-label="Close market">✕</button>
      </div>

      <div className="space-y-2">
        {unlockedCrops.map((crop) => {
          const price = state.marketPrices[crop.id] ?? crop.basePrice;
          const history = state.marketHistory[crop.id] ?? [];
          const high24 = history.length > 0 ? Math.max(...history) : price;
          const low24 = history.length > 0 ? Math.min(...history) : price;

          // Inventory for this crop across all tiers
          const tiers = QUALITY_TIERS.filter((q) => {
            const key = inventoryKey(crop.id, q.tier);
            return (state.inventory[key] ?? 0) > 0;
          });

          return (
            <div key={crop.id} className="rounded-lg border border-slate-800 bg-[#0a0d11] p-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">{crop.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-200">{crop.name}</span>
                    <TrendArrow data={history} />
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-slate-500">
                    <span>Now: <span className="text-amber-400 font-mono">{price.toFixed(0)} cr</span></span>
                    <span>Hi: <span className="text-emerald-400 font-mono">{high24.toFixed(0)}</span></span>
                    <span>Lo: <span className="text-red-400 font-mono">{low24.toFixed(0)}</span></span>
                  </div>
                </div>
                <Sparkline data={history} color="#34d399" />
              </div>

              {/* Sell controls per quality tier */}
              {tiers.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-slate-800 pt-2">
                  {tiers.map((q) => {
                    const key = inventoryKey(crop.id, q.tier);
                    const have = state.inventory[key] ?? 0;
                    const sellKey = `${crop.id}:${q.tier}`;
                    const amt = sellAmounts[sellKey] ?? 0;
                    const unitPrice = getSellPrice(crop.id, q.tier, state.marketPrices, state.activeEvents);

                    return (
                      <div key={q.tier} className="flex items-center gap-2 text-[9px]">
                        <span className={`w-16 ${q.color} font-semibold`}>{q.name}</span>
                        <span className="text-slate-500 w-8 text-right font-mono">{have}</span>
                        <span className="text-slate-600">@</span>
                        <span className="text-amber-400 font-mono w-12">{unitPrice} cr</span>
                        <input
                          type="number"
                          min={0}
                          max={have}
                          value={amt}
                          onChange={(e) => setSellAmounts((prev) => ({ ...prev, [sellKey]: Math.min(have, Math.max(0, parseInt(e.target.value) || 0)) }))}
                          className="w-14 rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-white border border-slate-700 text-center"
                          aria-label={`Amount of ${q.name} ${crop.name} to sell`}
                        />
                        <button
                          onClick={() => { onSell(crop.id, q.tier, amt); setSellAmounts((prev) => ({ ...prev, [sellKey]: 0 })); }}
                          disabled={amt <= 0}
                          className="rounded bg-amber-700/60 px-2 py-0.5 text-[9px] font-semibold text-amber-200 hover:bg-amber-600/60 disabled:opacity-30 transition-colors"
                          aria-label={`Sell ${amt} ${q.name} ${crop.name}`}
                        >
                          Sell
                        </button>
                        <button
                          onClick={() => { onSell(crop.id, q.tier, have); setSellAmounts((prev) => ({ ...prev, [sellKey]: 0 })); }}
                          disabled={have <= 0}
                          className="text-[8px] text-slate-500 hover:text-amber-400"
                          aria-label={`Sell all ${q.name} ${crop.name}`}
                        >
                          All
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inventory summary */}
      <div className="rounded border border-slate-800 bg-[#080a0d] p-2 text-[9px] text-slate-500">
        Inventory: {inventoryTotal(state.inventory)} / {getInventoryCap(state.techUnlocked)} units
      </div>
    </div>
  );
}
