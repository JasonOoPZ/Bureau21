"use client";

import { QUALITY_TIERS, CROPS } from "@/lib/hydroponics/config";
import { inventoryKey, inventoryTotal, getInventoryCap } from "@/lib/hydroponics/engine";
import type { Inventory } from "@/lib/hydroponics/types";
import { useState } from "react";

interface Props {
  inventory: Inventory;
  techUnlocked: string[];
}

export function InventoryStrip({ inventory, techUnlocked }: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = inventoryTotal(inventory);
  const cap = getInventoryCap(techUnlocked);
  const pct = Math.min(100, (total / cap) * 100);

  // Group inventory by crop
  const entries = Object.entries(inventory).filter(([, v]) => v > 0);
  const byCrop: Record<string, { tier: number; amount: number }[]> = {};
  for (const [key, amount] of entries) {
    const [cropId, tierStr] = key.split(":");
    const tier = parseInt(tierStr);
    if (!byCrop[cropId]) byCrop[cropId] = [];
    byCrop[cropId].push({ tier, amount });
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-[#080a0d]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-[10px]"
        aria-expanded={expanded}
        aria-label="Toggle inventory"
      >
        <span className="text-slate-500 uppercase tracking-[0.15em]">Inventory</span>
        <div className="flex items-center gap-2">
          <div className="h-1 w-20 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-600"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono text-slate-400">{total}/{cap}</span>
          <span className="text-slate-600">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-800 px-3 py-2 space-y-1.5">
          {Object.keys(byCrop).length === 0 ? (
            <p className="text-[9px] text-slate-600 text-center py-2">Inventory empty</p>
          ) : (
            Object.entries(byCrop).map(([cropId, tiers]) => {
              const crop = CROPS.find((c) => c.id === cropId);
              return (
                <div key={cropId} className="flex items-center gap-2 text-[9px]">
                  <span>{crop?.icon}</span>
                  <span className="text-slate-300 w-20 truncate">{crop?.name}</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {tiers.sort((a, b) => b.tier - a.tier).map((t) => {
                      const q = QUALITY_TIERS.find((x) => x.tier === t.tier);
                      return (
                        <span key={t.tier} className={`${q?.color ?? "text-slate-400"} font-mono`}>
                          {q?.name?.[0]}{t.tier}×{t.amount}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
