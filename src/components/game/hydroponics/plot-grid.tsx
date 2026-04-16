"use client";

import { CROPS, PROPERTIES, QUALITY_TIERS } from "@/lib/hydroponics/config";
import type { PlotState, OwnedProperty, HydroponicsGameState } from "@/lib/hydroponics/types";
import { useState } from "react";

interface Props {
  property: OwnedProperty;
  state: HydroponicsGameState;
  now: number;
  unlockedCrops: string[];
  onPlant: (plotId: string, cropId: string) => void;
  onHarvest: (plotId: string) => void;
  onHarvestAll: () => void;
  onReplantAll: () => void;
}

function progressPct(plot: PlotState, now: number): number {
  if (!plot.plantedAt || !plot.growthMs) return 0;
  return Math.min(100, ((now - plot.plantedAt) / plot.growthMs) * 100);
}

function isReady(plot: PlotState, now: number): boolean {
  if (!plot.plantedAt || !plot.growthMs) return false;
  return now - plot.plantedAt >= plot.growthMs && !plot.harvested;
}

function timeLeft(plot: PlotState, now: number): string {
  if (!plot.plantedAt || !plot.growthMs) return "";
  const remaining = Math.max(0, (plot.plantedAt + plot.growthMs) - now);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  if (mins > 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PlotGrid({ property, state, now, unlockedCrops, onPlant, onHarvest, onHarvestAll, onReplantAll }: Props) {
  const [openPlotId, setOpenPlotId] = useState<string | null>(null);
  const propDef = PROPERTIES.find((p) => p.id === property.id);
  const readyCount = property.plots.filter((p) => isReady(p, now)).length;
  const emptyCount = property.plots.filter((p) => !p.cropId).length;

  return (
    <div className="space-y-3">
      {/* Bulk actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mr-auto">
          {propDef?.name} — {property.plots.length} Plots
        </p>
        {readyCount > 0 && (
          <button
            onClick={onHarvestAll}
            className="rounded bg-emerald-700/80 px-3 py-1 text-[10px] font-semibold text-emerald-100 hover:bg-emerald-600 transition-colors"
            aria-label="Harvest all ready plots"
          >
            Harvest All Ready ({readyCount})
          </button>
        )}
        {emptyCount > 0 && (
          <button
            onClick={onReplantAll}
            className="rounded bg-cyan-800/60 px-3 py-1 text-[10px] font-semibold text-cyan-200 hover:bg-cyan-700 transition-colors"
            aria-label="Replant all empty plots"
          >
            Replant All Empty ({emptyCount})
          </button>
        )}
      </div>

      {/* Plot grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {property.plots.map((plot) => {
          const crop = CROPS.find((c) => c.id === plot.cropId);
          const ready = isReady(plot, now);
          const pct = progressPct(plot, now);
          const qualityDef = QUALITY_TIERS.find((q) => q.tier === (plot.qualityTier ?? 1));
          const isEmpty = !plot.cropId;

          return (
            <div
              key={plot.id}
              className={`
                relative rounded-lg border p-2.5 transition-all
                ${ready ? "border-emerald-600 bg-emerald-950/20 shadow-md shadow-emerald-900/30 animate-pulse" : ""}
                ${!isEmpty && !ready ? "border-slate-700 bg-[#0a0d11]" : ""}
                ${isEmpty ? "border-dashed border-slate-700/60 bg-[#080a0d]" : ""}
              `}
            >
              {/* Plot type badge */}
              <span className="absolute top-1 right-1 text-[8px] text-slate-600">
                {plot.plotType === "indoor" ? "🏢" : "🌳"}
              </span>

              {isEmpty ? (
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <span className="text-2xl opacity-30">🌱</span>
                  <button
                    onClick={() => setOpenPlotId(openPlotId === plot.id ? null : plot.id)}
                    className="rounded bg-emerald-800/50 px-2.5 py-1 text-[9px] font-semibold text-emerald-300 hover:bg-emerald-700/60 transition-colors"
                    aria-label="Choose crop to plant"
                  >
                    Plant
                  </button>

                  {/* Crop selector dropdown */}
                  {openPlotId === plot.id && (
                    <div className="absolute top-full left-0 z-20 mt-1 w-44 rounded-lg border border-slate-700 bg-[#0c0f14] p-1.5 shadow-xl">
                      {unlockedCrops.map((cid) => {
                        const c = CROPS.find((x) => x.id === cid)!;
                        return (
                          <button
                            key={cid}
                            onClick={() => { onPlant(plot.id, cid); setOpenPlotId(null); }}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-slate-800 transition-colors"
                            aria-label={`Plant ${c.name}`}
                          >
                            <span className="text-sm">{c.icon}</span>
                            <div>
                              <p className="text-[10px] font-semibold text-slate-200">{c.name}</p>
                              <p className="text-[8px] text-slate-500">{c.baseGrowthMinutes}m · {c.seedCost} cr</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl">{crop?.icon ?? "🌿"}</span>
                  <p className="text-[9px] font-semibold text-slate-300 truncate w-full text-center">{crop?.name}</p>

                  {/* Quality prediction */}
                  {qualityDef && (
                    <span className={`text-[8px] font-semibold ${qualityDef.color}`}>{qualityDef.name}</span>
                  )}

                  {ready ? (
                    <button
                      onClick={() => onHarvest(plot.id)}
                      className="mt-1 rounded bg-emerald-600 px-3 py-1 text-[9px] font-bold text-white hover:bg-emerald-500 transition-colors"
                      aria-label={`Harvest ${crop?.name}`}
                    >
                      Harvest
                    </button>
                  ) : (
                    <div className="w-full mt-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-center text-[8px] text-slate-500 font-mono tabular-nums">
                        {timeLeft(plot, now)}
                      </p>
                    </div>
                  )}

                  {/* Yield info */}
                  <p className="text-[8px] text-slate-600">×{plot.yieldAmount}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
