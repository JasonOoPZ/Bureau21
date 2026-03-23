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
  isYou: boolean;
};

interface LeaderboardProps {
  compact?: boolean;
}

export function Leaderboard({ compact = false }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/game/leaderboard")
      .then((r) => r.json())
      .then((d: { leaderboard: LeaderboardEntry[] }) => setEntries(d.leaderboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
                {!compact ? <th className="pb-2 pr-3 text-right">Kills</th> : null}
                {!compact ? <th className="pb-2 text-left hidden md:table-cell">Sector</th> : null}
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
                  <td className="py-2.5 pr-3 text-right text-amber-300">{entry.level}</td>
                  <td className="py-2.5 pr-3 text-right text-emerald-300">{entry.xp}</td>
                  <td className="py-2.5 pr-3 text-right text-cyan-200">{entry.credits}</td>
                  {!compact ? <td className="py-2.5 pr-3 text-right text-red-300">{entry.kills}</td> : null}
                  {!compact ? <td className="py-2.5 text-slate-400 hidden md:table-cell">{entry.sector}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
