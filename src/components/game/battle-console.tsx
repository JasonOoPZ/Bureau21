"use client";

import { useState } from "react";
import type { BotTemplate, BattleOutcome } from "@/lib/battle-engine";

interface PilotInfo {
  level: number;
  lifeForce: number;
  strength: number;
  speed: number;
  confidence: number;
  atkSplit: number;
}

interface Props {
  initialBots: BotTemplate[];
  initialPilot: PilotInfo;
  initialLogs: Array<{
    id: string;
    opponentName: string;
    result: string;
    xpGained: number;
    creditsGained: number;
    roundsCount: number;
    createdAt: string;
  }>;
}

// Helper to estimate difficulty (0-3 scale)
function difficultyRating(botLevel: number, playerLevel: number): number {
  const diff = botLevel - playerLevel;
  if (diff < -2) return 0; // Easy
  if (diff < 0) return 1; // Medium
  if (diff < 2) return 2; // Hard
  return 3; // Extreme
}

const DIFFICULTY_COLORS = {
  0: { label: "Easy", color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-800" },
  1: { label: "Fair", color: "text-cyan-400", bg: "bg-cyan-950/20", border: "border-cyan-800" },
  2: { label: "Hard", color: "text-amber-400", bg: "bg-amber-950/20", border: "border-amber-800" },
  3: { label: "Extreme", color: "text-red-400", bg: "bg-red-950/20", border: "border-red-800" },
};

export function BattleConsole({ initialBots, initialPilot, initialLogs }: Props) {
  const [bots] = useState<BotTemplate[]>(initialBots);
  const [pilot, setPilot] = useState<PilotInfo>(initialPilot);
  const [logs, setLogs] = useState(initialLogs);
  const [selected, setSelected] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<BattleOutcome | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxLF = Math.max(15, pilot.level * 5);

  async function fight() {
    if (!selected || loading) return;
    setLoading(true);
    setError(null);
    setOutcome(null);

    try {
      const res = await fetch("/api/game/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botSlug: selected }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Battle failed.");
        return;
      }

      setOutcome(data.outcome as BattleOutcome);
      if (data.state) {
        setPilot({
          level: data.state.level,
          lifeForce: data.state.lifeForce,
          strength: data.state.strength,
          speed: data.state.speed,
          confidence: data.state.confidence,
          atkSplit: data.state.atkSplit,
        });
      }

      // Prepend new log entry from outcome
      if (data.outcome) {
        setLogs((prev) => [
          {
            id: Date.now().toString(),
            opponentName: bots.find((b) => b.slug === selected)?.name ?? selected,
            result: data.outcome.winner === "player" ? "win" : "loss",
            xpGained: data.outcome.xpGained,
            creditsGained: data.outcome.creditsGained,
            roundsCount: data.outcome.totalRounds,
            createdAt: new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ]);
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectedBot = bots.find((b) => b.slug === selected);

  return (
    <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* LEFT — Pilot + Opponents */}
      <div className="space-y-3">
        {/* Pilot stats */}
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
          <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">Your Combat Status</p>
          <div className="space-y-2.5">
            {/* Life Force */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Life Force</span>
                <span className="text-slate-200">{pilot.lifeForce} / {maxLF}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-800">
                <div
                  className={`h-2 rounded-full transition-all ${
                    pilot.lifeForce < maxLF * 0.25
                      ? "bg-red-500"
                      : pilot.lifeForce < maxLF * 0.5
                      ? "bg-orange-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, (pilot.lifeForce / maxLF) * 100)}%` }}
                />
              </div>
             </div>
            
            {/* Core stats grid */}
            <div className="grid grid-cols-2 gap-1">
              <div className="flex justify-between rounded border border-slate-800 bg-slate-900/50 px-2 py-1">
                <span className="text-[10px] text-slate-500">LVL</span>
                <span className="text-[11px] font-semibold text-cyan-300">{pilot.level}</span>
              </div>
              <div className="flex justify-between rounded border border-slate-800 bg-slate-900/50 px-2 py-1">
                <span className="text-[10px] text-slate-500">CONF</span>
                <span className="text-[11px] font-semibold text-cyan-300">{pilot.confidence}</span>
              </div>
              <div className="flex justify-between rounded border border-slate-800 bg-slate-900/50 px-2 py-1">
                <span className="text-[10px] text-slate-500">STR</span>
                <span className="text-[11px] font-semibold text-cyan-300">{pilot.strength.toFixed(1)}</span>
              </div>
              <div className="flex justify-between rounded border border-slate-800 bg-slate-900/50 px-2 py-1">
                <span className="text-[10px] text-slate-500">SPD</span>
                <span className="text-[11px] font-semibold text-cyan-300">{pilot.speed.toFixed(1)}</span>
              </div>
            </div>

            {/* ATK/DEF Split */}
            <div className="rounded border border-slate-700 bg-slate-900/30 p-2">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-slate-500">Attack Split</span>
                <span className="text-cyan-300 font-mono">{pilot.atkSplit}% ATK</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="bg-red-500 transition-all"
                  style={{ width: `${pilot.atkSplit}%` }}
                />
                <div
                  className="bg-emerald-500 transition-all"
                  style={{ width: `${100 - pilot.atkSplit}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                <span>Offense</span>
                <span>Defense</span>
              </div>
            </div>
          </div>
        </div>

        {/* Opponent list */}
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-slate-500">Available Targets</p>
          {bots.length === 0 && (
            <p className="text-[11px] text-slate-600">No targets available at your level yet.</p>
          )}
          {bots.map((bot) => {
            const difficulty = difficultyRating(bot.levelReq, pilot.level);
            const diffInfo = DIFFICULTY_COLORS[difficulty as 0 | 1 | 2 | 3];
            return (
              <button
                key={bot.slug}
                onClick={() => {
                  setSelected(bot.slug);
                  setOutcome(null);
                  setError(null);
                }}
                className={`mb-1 w-full rounded border px-3 py-2 text-left transition ${
                  selected === bot.slug
                    ? "border-cyan-600 bg-cyan-950/30"
                    : "border-slate-800 bg-slate-900/30 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-slate-200">{bot.name}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${diffInfo.color} ${diffInfo.bg} border ${diffInfo.border}`}>
                    {diffInfo.label}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500">{bot.description}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-600">Lv {bot.levelReq}+</span>
                  <div className="flex gap-2">
                    <span className="text-emerald-600">+{bot.xpReward} XP</span>
                    <span className="text-amber-600">+{bot.creditReward} ₹</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Fight button */}
        <button
          onClick={fight}
          disabled={!selected || loading}
          className="w-full rounded-md border border-red-800 bg-red-950/40 py-2.5 text-sm font-semibold uppercase tracking-widest text-red-300 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Fighting..." : selectedBot ? `Attack ${selectedBot.name}` : "Select Target"}
        </button>

        {error && (
          <p className="rounded border border-red-900/40 bg-red-950/20 px-3 py-2 text-[11px] text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* RIGHT — Battle log + history */}
      <div className="space-y-3">
        {/* Battle outcome */}
        {outcome ? (
          <div
            className={`rounded-md border p-4 space-y-3 ${
              outcome.winner === "player"
                ? "border-emerald-800 bg-emerald-950/20"
                : "border-red-800 bg-red-950/20"
            }`}
          >
            <div>
              <p
                className={`mb-2 text-sm font-bold uppercase tracking-widest ${
                  outcome.winner === "player" ? "text-emerald-300" : "text-red-400"
                }`}
              >
                {outcome.winner === "player" ? "⚡ VICTORY" : "✗ DEFEATED"}
              </p>
            </div>

            {/* Outcome Stats */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded border border-slate-700/40 bg-black/40 p-2">
                <span className="text-slate-500">Rounds</span>
                <p className="text-emerald-300 font-semibold">{outcome.totalRounds}</p>
              </div>
              <div className="rounded border border-slate-700/40 bg-black/40 p-2">
                <span className="text-slate-500">Experience</span>
                <p className="text-emerald-300 font-semibold">+{outcome.xpGained} XP</p>
              </div>
              {outcome.creditsGained > 0 && (
                <div className="rounded border border-slate-700/40 bg-black/40 p-2">
                  <span className="text-slate-500">Credits</span>
                  <p className="text-amber-400 font-semibold">+{outcome.creditsGained}</p>
                </div>
              )}
              <div className="rounded border border-slate-700/40 bg-black/40 p-2">
                <span className="text-slate-500">Confidence</span>
                <p className={outcome.confidenceDelta > 0 ? "text-cyan-300 font-semibold" : "text-red-400 font-semibold"}>
                  {outcome.confidenceDelta > 0 ? "+" : ""}{outcome.confidenceDelta}
                </p>
              </div>
            </div>

            {/* Battle log */}
            <div>
              <p className="text-[10px] text-slate-500 mb-1">Battle Log</p>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-slate-800 bg-black/80 p-2 font-mono text-[9px] leading-relaxed text-slate-300">
                {outcome.logText}
              </pre>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-6 text-center">
            <p className="text-[11px] text-slate-600">
              Select a target on the left to begin combat.
            </p>
          </div>
        )}

        {/* Battle history */}
        {logs.length > 0 ? (
          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-slate-500">
              Recent Battles
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded border border-slate-800/60 bg-slate-900/30 px-2 py-1.5 text-[10px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold uppercase px-1.5 ${
                        log.result === "win" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {log.result}
                    </span>
                    <span className="text-slate-300">vs {log.opponentName}</span>
                  </div>
                  <div className="text-slate-500">
                    +{log.xpGained} XP · {log.roundsCount}r
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
            <p className="text-[10px] text-slate-600">No battles yet. Start fighting to build your legend.</p>
          </div>
        )}
      </div>
    </div>
  );
}
