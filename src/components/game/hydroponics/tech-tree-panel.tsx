"use client";

import { TECH_TREE } from "@/lib/hydroponics/config";
import { canUnlockTech } from "@/lib/hydroponics/engine";
import type { HydroponicsGameState } from "@/lib/hydroponics/types";

interface Props {
  state: HydroponicsGameState;
  onUnlock: (techId: string) => void;
  onClose: () => void;
}

const BRANCH_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  agronomy: { border: "border-emerald-800/60", bg: "bg-emerald-950/20", text: "text-emerald-400" },
  genetics: { border: "border-purple-800/60", bg: "bg-purple-950/20", text: "text-purple-400" },
  logistics: { border: "border-amber-800/60", bg: "bg-amber-950/20", text: "text-amber-400" },
  security: { border: "border-blue-800/60", bg: "bg-blue-950/20", text: "text-blue-400" },
};

export function TechTreePanel({ state, onUnlock, onClose }: Props) {
  const unlocked = new Set(state.techUnlocked);
  const branches = [...new Set(TECH_TREE.map((t) => t.branch))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-purple-300">Tech Tree</h3>
          <p className="text-[9px] text-slate-500">
            Research Points: <span className="text-purple-400 font-mono">{state.researchPoints}</span>
            &nbsp;· {unlocked.size}/{TECH_TREE.length} unlocked
          </p>
        </div>
        <button onClick={onClose} className="text-[10px] text-slate-500 hover:text-white" aria-label="Close tech tree">✕</button>
      </div>

      {branches.map((branch) => {
        const nodes = TECH_TREE.filter((t) => t.branch === branch);
        const colors = BRANCH_COLORS[branch] ?? BRANCH_COLORS.agronomy;

        return (
          <div key={branch} className="space-y-1.5">
            <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${colors.text}`}>
              {branch}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {nodes.map((tech) => {
                const isUnlocked = unlocked.has(tech.id);
                const canBuy = canUnlockTech(tech.id, state.techUnlocked, state.researchPoints);

                return (
                  <div
                    key={tech.id}
                    className={`
                      relative flex-shrink-0 w-36 rounded-lg border p-2.5 transition-all
                      ${isUnlocked ? `${colors.border} ${colors.bg}` : ""}
                      ${!isUnlocked && canBuy ? "border-dashed border-slate-600 bg-[#0a0d11] hover:border-slate-500" : ""}
                      ${!isUnlocked && !canBuy ? "border-slate-800/30 bg-[#080808] opacity-50" : ""}
                    `}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-600">{tech.rpCost} RP</span>
                      <p className="text-[10px] font-semibold text-slate-200 leading-tight">{tech.name}</p>
                    </div>
                    <p className="mt-1 text-[8px] text-slate-500 leading-snug">{tech.description}</p>
                    {isUnlocked ? (
                      <span className="mt-1.5 inline-block text-[8px] font-bold text-emerald-500">✓ Unlocked</span>
                    ) : (
                      <button
                        onClick={() => onUnlock(tech.id)}
                        disabled={!canBuy}
                        className="mt-1.5 rounded bg-purple-800/50 px-2 py-0.5 text-[8px] font-semibold text-purple-200 hover:bg-purple-700/50 disabled:opacity-30 transition-colors"
                        aria-label={`Research ${tech.name} for ${tech.rpCost} RP`}
                      >
                        {tech.rpCost} RP
                      </button>
                    )}

                    {/* Connector line */}
                    {tech.requires && (
                      <div className="absolute -left-2 top-1/2 h-px w-2 bg-slate-700" aria-hidden="true" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
