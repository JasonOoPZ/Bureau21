"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  unspentPoints: number;
  level: number;
  hpPerPoint: number;
}

const STATS = [
  { key: "hp", label: "Life Force (HP)", gain: (hp: number) => `+${hp} per point`, color: "text-emerald-400" },
  { key: "strength", label: "Strength", gain: () => "+1.0 per point", color: "text-red-400" },
  { key: "speed", label: "Speed", gain: () => "+1.0 per point", color: "text-cyan-400" },
  { key: "endurance", label: "Endurance", gain: () => "+0.5 per point", color: "text-amber-400" },
  { key: "panic", label: "Panic", gain: () => "+0.5 per point", color: "text-purple-400" },
  { key: "confidence", label: "Confidence", gain: () => "+0.25 per point", color: "text-yellow-400" },
] as const;

export function StatAllocator({ unspentPoints, level, hpPerPoint: hpp }: Props) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(unspentPoints);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (remaining <= 0) return null;

  async function allocate(stat: string, points: number) {
    if (loading) return;
    setLoading(stat);
    setMessage(null);
    try {
      const res = await fetch("/api/game/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stat, points }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Failed.");
        return;
      }
      setRemaining(data.remaining);
      setMessage(`Allocated: ${data.gain}`);
      router.refresh();
    } catch {
      setMessage("Connection error.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="rounded-md border border-cyan-900/40 bg-[#0a0f14] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-400">
          ⬆ Stat Allocation
        </p>
        <span className="rounded-full bg-cyan-900/30 border border-cyan-700/40 px-3 py-0.5 text-[11px] font-bold text-cyan-300 font-mono">
          {remaining} pts
        </span>
      </div>

      <p className="text-[10px] text-slate-500">
        You have unspent allocation points. Assign them to improve your stats.
      </p>

      <div className="grid grid-cols-1 gap-1.5">
        {STATS.map((s) => (
          <div
            key={s.key}
            className="flex items-center justify-between rounded border border-slate-800 bg-black/40 px-3 py-2"
          >
            <div>
              <span className={`text-[11px] font-semibold ${s.color}`}>{s.label}</span>
              <span className="ml-2 text-[10px] text-slate-600">
                {s.key === "hp" ? s.gain(hpp) : s.gain()}
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 5].filter((n) => n <= remaining).map((n) => (
                <button
                  key={n}
                  onClick={() => allocate(s.key, n)}
                  disabled={!!loading}
                  className="rounded bg-slate-800 hover:bg-slate-700 border border-slate-700/50 px-2.5 py-1 text-[10px] font-bold text-slate-300 transition disabled:opacity-30"
                >
                  {loading === s.key ? "..." : `+${n}`}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {message && (
        <p className="text-[10px] text-cyan-300 text-center">{message}</p>
      )}
    </section>
  );
}
