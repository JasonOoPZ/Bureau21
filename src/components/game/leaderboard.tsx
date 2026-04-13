"use client";

import { useEffect, useState } from "react";

type LeaderboardEntry = {
  rank: number;
  callsign: string;
  level: number;
  xp: number;
  credits: number;
  kills: number;
  sector: string;
  characterSlug: string;
  isYou: boolean;
};

type Category = "overall" | "pvp" | "wealth" | "xp";

const CATEGORIES: { key: Category; label: string; color: string; activeColor: string }[] = [
  { key: "overall", label: "Overall", color: "text-slate-400", activeColor: "bg-cyan-500/20 text-cyan-200" },
  { key: "pvp",     label: "PVP Kills", color: "text-slate-400", activeColor: "bg-red-500/20 text-red-200" },
  { key: "wealth",  label: "Wealth", color: "text-slate-400", activeColor: "bg-amber-500/20 text-amber-200" },
  { key: "xp",      label: "Experience", color: "text-slate-400", activeColor: "bg-emerald-500/20 text-emerald-200" },
];

// Highlight column based on category
const HIGHLIGHT: Record<Category, string> = {
  overall: "level",
  pvp: "kills",
  wealth: "credits",
  xp: "xp",
};

interface LeaderboardProps {
  compact?: boolean;
}

export function Leaderboard({ compact = false }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [category, setCategory] = useState<Category>("overall");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/game/leaderboard?category=${category}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => { if (!cancelled && d) setEntries(d.leaderboard); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category]);

  function switchCategory(cat: Category) {
    if (cat !== category) {
      setLoading(true);
      setCategory(cat);
    }
  }

  const hl = HIGHLIGHT[category];

  return (
    <section className={`border border-slate-800 bg-[#0a0d11] ${compact ? "rounded-md p-3" : "rounded-2xl p-6"}`}>
      <div className={compact ? "mb-2" : "mb-4"}>
        <p className={`uppercase text-cyan-300/80 ${compact ? "text-[10px] tracking-[0.12em]" : "text-xs tracking-[0.3em]"}`}>
          Galactic Ranking
        </p>
        <h2 className={`font-display uppercase text-slate-100 ${compact ? "mt-0.5 text-lg" : "mt-1 text-2xl"}`}>
          Commander Board
        </h2>
      </div>

      {/* Category tabs */}
      {!compact && (
        <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-slate-800 bg-black/40 p-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => switchCategory(cat.key)}
              className={`rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] transition ${
                category === cat.key ? cat.activeColor : `${cat.color} hover:text-slate-200`
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-400">Loading rankings...</p>
      ) : entries.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">No pilots registered yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className={compact ? "w-full text-xs" : "w-full text-sm"}>
            <thead>
              <tr className={`border-b border-slate-800 uppercase text-slate-500 ${compact ? "text-[9px] tracking-[0.08em]" : "text-[10px] tracking-[0.2em]"}`}>
                <th className="pb-2 pr-3 text-left">#</th>
                <th className="pb-2 pr-3 text-left">Callsign</th>
                <th className="pb-2 pr-3 text-right">Lvl</th>
                <th className="pb-2 pr-3 text-right">XP</th>
                <th className="pb-2 pr-3 text-right">Credits</th>
                {!compact && <th className="pb-2 pr-3 text-right">Kills</th>}
                {!compact && <th className="pb-2 text-left hidden md:table-cell">Sector</th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.rank}
                  className={`border-b border-slate-800/40 transition ${
                    entry.isYou ? "bg-cyan-500/5" : "hover:bg-slate-900/40"
                  }`}
                >
                  <td className="py-2.5 pr-3">
                    {entry.rank === 1 ? (
                      <span className="text-amber-300 font-bold">⚑ 1</span>
                    ) : entry.rank === 2 ? (
                      <span className="text-slate-300 font-bold">2</span>
                    ) : entry.rank === 3 ? (
                      <span className="text-orange-400 font-bold">3</span>
                    ) : (
                      <span className="text-slate-500">{entry.rank}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className={entry.isYou ? "text-cyan-300 font-semibold" : "text-slate-200"}>
                      {entry.callsign}
                    </span>
                    {entry.isYou && (
                      <span className="ml-1.5 rounded border border-cyan-500/40 px-1 py-0.5 text-[9px] uppercase tracking-[0.1em] text-cyan-400">
                        You
                      </span>
                    )}
                  </td>
                  <td className={`py-2.5 pr-3 text-right ${hl === "level" ? "text-cyan-300 font-semibold" : "text-amber-300"}`}>{entry.level}</td>
                  <td className={`py-2.5 pr-3 text-right ${hl === "xp" ? "text-emerald-300 font-semibold" : "text-emerald-300/70"}`}>{entry.xp.toLocaleString()}</td>
                  <td className={`py-2.5 pr-3 text-right ${hl === "credits" ? "text-amber-300 font-semibold" : "text-cyan-200/70"}`}>{entry.credits.toLocaleString()}</td>
                  {!compact && <td className={`py-2.5 pr-3 text-right ${hl === "kills" ? "text-red-300 font-semibold" : "text-red-300/70"}`}>{entry.kills}</td>}
                  {!compact && <td className="py-2.5 text-slate-400 hidden md:table-cell">{entry.sector}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
