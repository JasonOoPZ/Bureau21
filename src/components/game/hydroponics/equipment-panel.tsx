"use client";

import { EQUIPMENT, PROPERTIES } from "@/lib/hydroponics/config";
import { getEquipmentCost, getEquipmentEffect } from "@/lib/hydroponics/engine";
import type { OwnedProperty } from "@/lib/hydroponics/types";

interface Props {
  property: OwnedProperty;
  credits: number;
  onUpgrade: (propertyId: string, equipmentId: string) => void;
}

export function EquipmentPanel({ property, credits, onUpgrade }: Props) {
  const propDef = PROPERTIES.find((p) => p.id === property.id);

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
        Equipment — {propDef?.name}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {EQUIPMENT.map((eq) => {
          const currentLevel = property.equipment[eq.id] ?? 0;
          const maxLevel = eq.maxLevel;
          const isMaxed = currentLevel >= maxLevel;
          const propTier = propDef?.tier ?? 1;
          const nextCost = !isMaxed ? getEquipmentCost(eq.id, currentLevel, propTier) : 0;
          const canAfford = credits >= nextCost;
          const currentEffectVal = currentLevel > 0 ? getEquipmentEffect(eq.id, currentLevel) : 0;

          return (
            <div key={eq.id} className="rounded-lg border border-slate-800 bg-[#0a0d11] p-3">
              <div className="flex items-center gap-2">
                <span className="text-base">{eq.icon}</span>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-slate-200">{eq.name}</p>
                  <p className="text-[8px] text-slate-500">Level {currentLevel}/{maxLevel}</p>
                </div>
              </div>

              {/* Level indicators */}
              <div className="mt-2 flex gap-1">
                {Array.from({ length: maxLevel }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${i < currentLevel ? "bg-emerald-500" : "bg-slate-800"}`}
                  />
                ))}
              </div>

              {/* Current bonus */}
              {currentEffectVal > 0 && (
                <p className="mt-1.5 text-[8px] text-emerald-500">
                  {eq.effect}: +{Math.round(currentEffectVal * 100)}%
                </p>
              )}

              {/* Upgrade button */}
              {isMaxed ? (
                <p className="mt-1.5 text-[8px] text-amber-500 font-semibold">MAXED</p>
              ) : (
                <button
                  onClick={() => onUpgrade(property.id, eq.id)}
                  disabled={!canAfford}
                  className="mt-1.5 rounded bg-slate-700/60 px-2.5 py-0.5 text-[9px] font-semibold text-slate-300 hover:bg-slate-600/60 disabled:opacity-30 transition-colors"
                  aria-label={`Upgrade ${eq.name} to level ${currentLevel + 1} for ${nextCost} credits`}
                >
                  Upgrade — {nextCost.toLocaleString()} cr
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
