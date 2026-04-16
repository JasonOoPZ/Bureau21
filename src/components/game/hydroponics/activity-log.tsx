"use client";

import type { EventLogEntry } from "@/lib/hydroponics/types";
import { useState } from "react";

interface Props {
  log: EventLogEntry[];
}

export function ActivityLog({ log }: Props) {
  const [expanded, setExpanded] = useState(false);
  const recent = log.slice(-20).reverse();

  return (
    <div className="rounded-lg border border-slate-800 bg-[#080a0d]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-[10px]"
        aria-expanded={expanded}
        aria-label="Toggle activity log"
      >
        <span className="text-slate-500 uppercase tracking-[0.15em]">Activity Log</span>
        <span className="text-slate-600">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-800 max-h-48 overflow-y-auto scrollbar-thin">
          {recent.length === 0 ? (
            <p className="px-3 py-4 text-[9px] text-slate-600 text-center">No activity yet</p>
          ) : (
            recent.map((entry, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 border-b border-slate-800/50 px-3 py-1.5 last:border-0
                  ${entry.type === "harvest" ? "text-emerald-500/80" : ""}
                  ${entry.type === "event" ? "text-amber-500/80" : ""}
                  ${entry.type === "sale" ? "text-amber-400/80" : ""}
                  ${entry.type === "purchase" ? "text-cyan-500/80" : ""}
                  ${entry.type === "staff" ? "text-blue-400/80" : ""}
                  ${entry.type === "tech" ? "text-purple-400/80" : ""}
                  ${entry.type === "info" ? "text-slate-500" : ""}
                `}
              >
                <span className="text-xs flex-shrink-0">{entry.icon}</span>
                <p className="text-[9px] leading-snug flex-1">{entry.message}</p>
                <span className="text-[8px] text-slate-700 flex-shrink-0 tabular-nums font-mono">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
