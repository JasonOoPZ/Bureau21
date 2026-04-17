"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface PilotPreview {
  callsign: string;
  level: number;
  xp: number;
  kills: number;
  sector: string;
  characterSlug: string;
  bounty: number;
  strength: number;
  role: string;
  isOnline: boolean;
}

interface Props {
  userId: string;
  children: React.ReactNode;
  className?: string;
}

// Simple in-memory cache so repeated hovers don't re-fetch
const cache = new Map<string, { data: PilotPreview; ts: number }>();
const CACHE_TTL = 30_000;

export function PilotHoverCard({ userId, children, className }: Props) {
  const [preview, setPreview] = useState<PilotPreview | null>(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<"below" | "above">("below");
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchPreview = useCallback(async () => {
    const cached = cache.get(userId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setPreview(cached.data);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/game/pilot-preview?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data: PilotPreview = await res.json();
        cache.set(userId, { data, ts: Date.now() });
        setPreview(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [userId]);

  const handleEnter = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Decide if card should appear above or below
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPos(rect.bottom + 200 > window.innerHeight ? "above" : "below");
      }
      setShow(true);
      fetchPreview();
    }, 300);
  };

  const handleLeave = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), 200);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const ROLE_COLORS: Record<string, string> = {
    admin: "text-red-400",
    mod: "text-purple-400",
    user: "text-slate-500",
  };

  return (
    <span className="relative inline-block">
      <Link
        ref={triggerRef}
        href={`/pilot/${userId}`}
        className={className ?? "text-cyan-500 hover:text-cyan-300 hover:underline"}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </Link>

      {show && (
        <div
          ref={cardRef}
          onMouseEnter={() => clearTimeout(timerRef.current)}
          onMouseLeave={handleLeave}
          className={`absolute z-50 w-64 rounded-xl border border-slate-700/60 bg-[#0c0f14] shadow-2xl shadow-black/60 p-3 space-y-2 animate-in fade-in duration-150 ${
            pos === "below" ? "top-full mt-1.5 left-0" : "bottom-full mb-1.5 left-0"
          }`}
        >
          {loading && !preview ? (
            <div className="py-4 text-center text-xs text-slate-500">Loading...</div>
          ) : preview ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className={`w-2 h-2 rounded-full ${preview.isOnline ? "bg-green-500" : "bg-slate-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-slate-100 truncate">{preview.callsign}</div>
                  <div className="text-[9px] uppercase tracking-widest text-slate-500">
                    Lvl {preview.level} · <span className={ROLE_COLORS[preview.role] ?? "text-slate-500"}>{preview.role}</span>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-md bg-black/40 border border-slate-800/40 p-1.5 text-center">
                  <div className="text-[8px] uppercase text-slate-500">XP</div>
                  <div className="text-[11px] font-bold text-emerald-400 font-mono">{preview.xp.toLocaleString()}</div>
                </div>
                <div className="rounded-md bg-black/40 border border-slate-800/40 p-1.5 text-center">
                  <div className="text-[8px] uppercase text-slate-500">Kills</div>
                  <div className="text-[11px] font-bold text-red-400 font-mono">{preview.kills}</div>
                </div>
                <div className="rounded-md bg-black/40 border border-slate-800/40 p-1.5 text-center">
                  <div className="text-[8px] uppercase text-slate-500">STR</div>
                  <div className="text-[11px] font-bold text-amber-400 font-mono">{preview.strength}</div>
                </div>
              </div>

              {/* Extra info */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">📍 {preview.sector}</span>
                {preview.bounty > 0 && (
                  <span className="text-red-400 font-bold">🎯 {preview.bounty.toLocaleString()} ₡</span>
                )}
              </div>

              {/* View profile link */}
              <Link
                href={`/pilot/${userId}`}
                className="block w-full text-center rounded-lg bg-cyan-950/30 border border-cyan-900/30 py-1.5 text-[10px] text-cyan-400 font-bold uppercase tracking-wider hover:bg-cyan-900/30 transition"
              >
                View Full Profile →
              </Link>
            </>
          ) : (
            <div className="py-4 text-center text-xs text-red-400">Pilot not found</div>
          )}
        </div>
      )}
    </span>
  );
}
