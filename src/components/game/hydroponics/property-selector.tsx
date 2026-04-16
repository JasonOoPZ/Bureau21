"use client";

import { PROPERTIES, type PropertyDef } from "@/lib/hydroponics/config";
import type { OwnedProperty } from "@/lib/hydroponics/types";

interface Props {
  owned: OwnedProperty[];
  selectedId: string;
  credits: number;
  onSelect: (id: string) => void;
  onBuy: (id: string) => void;
}

function typeIcon(type: PropertyDef["type"]) {
  if (type === "indoor") return "🏢";
  if (type === "outdoor") return "🌳";
  return "🔄";
}

export function PropertySelector({ owned, selectedId, credits, onSelect, onBuy }: Props) {
  const ownedIds = new Set(owned.map((p) => p.id));
  const maxTier = owned.reduce((m, p) => {
    const d = PROPERTIES.find((x) => x.id === p.id);
    return Math.max(m, d?.tier ?? 0);
  }, 0);

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Properties ({owned.length}/15)</p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {PROPERTIES.map((p) => {
          const isOwned = ownedIds.has(p.id);
          const isSelected = p.id === selectedId;
          const canUnlock = !isOwned && p.unlockTier <= maxTier;
          const canAfford = credits >= p.cost;

          return (
            <button
              key={p.id}
              onClick={() => isOwned ? onSelect(p.id) : (canUnlock && canAfford ? onBuy(p.id) : undefined)}
              disabled={!isOwned && (!canUnlock || !canAfford)}
              className={`
                relative flex-shrink-0 w-40 rounded-lg border p-3 text-left transition-all
                ${isSelected ? "border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/30" : ""}
                ${isOwned && !isSelected ? "border-slate-700 bg-[#0a0d11] hover:border-emerald-700" : ""}
                ${!isOwned && canUnlock ? "border-dashed border-amber-800/60 bg-[#0d0b08] hover:border-amber-600" : ""}
                ${!isOwned && !canUnlock ? "border-slate-800/40 bg-[#080808] opacity-40 cursor-not-allowed" : ""}
              `}
              aria-label={isOwned ? `Select ${p.name}` : `Purchase ${p.name}`}
            >
              {/* Tier badge */}
              <span className={`
                absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold
                ${isOwned ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-400"}
              `}>
                {p.tier}
              </span>

              <span className="text-lg">{typeIcon(p.type)}</span>
              <p className="mt-1 text-[11px] font-semibold text-slate-200 leading-tight truncate">{p.name}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{p.plotCount} plots · {p.type}</p>

              {isOwned ? (
                <div className="mt-1.5 flex gap-1">
                  {p.growthBonus > 0 && <span className="rounded bg-cyan-900/40 px-1 py-0.5 text-[8px] text-cyan-400">+{Math.round(p.growthBonus * 100)}% SPD</span>}
                  {p.qualityBonus > 0 && <span className="rounded bg-purple-900/40 px-1 py-0.5 text-[8px] text-purple-400">+{Math.round(p.qualityBonus * 100)}% QTY</span>}
                </div>
              ) : (
                <div className="mt-1.5">
                  {p.cost > 0 ? (
                    <span className={`text-[10px] font-mono ${canAfford ? "text-amber-400" : "text-red-500"}`}>
                      {p.cost.toLocaleString()} cr
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400">FREE</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
