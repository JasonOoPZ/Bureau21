"use client";

import { useState } from "react";

interface BotTemplate {
  name: string;
  slug: string;
  description: string;
  diffMult: number;
  levelReq: number;
  xpReward: number;
  creditReward: number;
}

interface BattleOutcome {
  winner: "player" | "bot";
  xpGained: number;
  creditsGained: number;
  totalRounds: number;
  logText: string;
  playerLfAfter: number;
}

interface BattleResult {
  outcome: BattleOutcome;
  state: { lifeForce: number; credits: number; xp: number; level: number };
}

const BOTS: BotTemplate[] = [
  {
    name: "Voidborn Sentinel",
    slug: "voidborn-sentinel",
    description: "An ancient automated guardian from a derelict deep-space platform.",
    diffMult: 3.2,
    levelReq: 15,
    xpReward: 420,
    creditReward: 350,
  },
  {
    name: "Apex Marauder",
    slug: "apex-marauder",
    description: "An elite outer-ring raider with hardened exo-armor and plasma cannons.",
    diffMult: 4.0,
    levelReq: 18,
    xpReward: 580,
    creditReward: 480,
  },
  {
    name: "Void Titan",
    slug: "void-titan",
    description: "A legendary war machine rumored to have survived three sector wars.",
    diffMult: 5.0,
    levelReq: 22,
    xpReward: 800,
    creditReward: 650,
  },
];

const DIFF_LABEL = (m: number) =>
  m >= 5 ? { label: "LEGENDARY", cls: "bg-amber-900/60 text-amber-300 border-amber-700" }
  : m >= 4 ? { label: "EXTREME", cls: "bg-red-900/60 text-red-300 border-red-700" }
  : { label: "HARD", cls: "bg-orange-900/60 text-orange-300 border-orange-700" };

interface Props {
  pilotLevel: number;
  pilotLf: number;
  pilotCredits: number;
  hasGodCard?: boolean;
}

export function OuterRingClient({ pilotLevel, pilotLf, pilotCredits, hasGodCard }: Props) {
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [fighting, setFighting] = useState(false);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lf, setLf] = useState(pilotLf);
  const [credits, setCredits] = useState(pilotCredits);
  const [level, setLevel] = useState(pilotLevel);
  const [log, setLog] = useState<string[]>([]);

  const UNLOCK_LEVEL = 15;

  const fight = async () => {
    if (!selectedBot || fighting) return;
    setError(null);
    setResult(null);
    setFighting(true);
    try {
      const res = await fetch("/api/game/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botSlug: selectedBot }),
      });
      const data: BattleResult = await res.json();
      if (!res.ok) throw new Error((data as unknown as { error: string }).error);
      setResult(data);
      setLf(data.state.lifeForce);
      setCredits(data.state.credits);
      setLevel(data.state.level);
      setLog((prev) => [
        `${data.outcome.winner === "player" ? "✓" : "✗"} vs ${BOTS.find((b) => b.slug === selectedBot)?.name} — ${data.outcome.winner === "player" ? `+${data.outcome.creditsGained} cr / +${data.outcome.xpGained} XP` : "defeat"}`,
        ...prev,
      ].slice(0, 8));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Battle failed.");
    } finally {
      setFighting(false);
    }
  };

  if (!hasGodCard && level < UNLOCK_LEVEL) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-700 bg-[#0b0f14] p-8 text-center">
          <div className="mb-3 text-5xl">🔒</div>
          <h3 className="mb-2 font-[family-name:var(--font-orbitron)] text-xl font-bold text-slate-300">
            District Sealed
          </h3>
          <p className="text-sm text-slate-400">
            The Outer Ring is accessible at Level {UNLOCK_LEVEL}. You are Level {level}.
          </p>
          <div className="mt-4 h-2 w-64 mx-auto overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-red-600"
              style={{ width: `${Math.min(100, (level / UNLOCK_LEVEL) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">{level} / {UNLOCK_LEVEL} levels</p>
        </div>
        <div className="rounded-xl border border-red-900/30 bg-red-900/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-red-400">What Awaits</h3>
          <ul className="space-y-1 text-xs text-slate-400">
            {BOTS.map((b) => (
              <li key={b.slug} className="flex justify-between">
                <span>{b.name} <span className="text-slate-600">(Lv {b.levelReq}+)</span></span>
                <span className="text-amber-400">+{b.creditReward} cr / +{b.xpReward} XP</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pilot status */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4 text-center">
          <div className="text-xl font-bold text-amber-300">{credits.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Credits</div>
        </div>
        <div className="rounded-xl border border-rose-900/40 bg-rose-900/10 p-4 text-center">
          <div className="text-xl font-bold text-rose-400">{lf}</div>
          <div className="text-xs text-slate-500 mt-1">Life Force</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4 text-center">
          <div className="text-xl font-bold text-cyan-300">{level}</div>
          <div className="text-xs text-slate-500 mt-1">Level</div>
        </div>
      </div>

      {/* Warning */}
      <div className="rounded-xl border border-red-900/50 bg-red-900/10 p-4">
        <div className="flex gap-3 items-start">
          <span className="text-2xl shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-300">Extreme Danger Zone</p>
            <p className="text-xs text-slate-400 mt-1">
              Outer Ring enemies are significantly stronger than anything inside the station. One loss can drain your Life Force to critical levels. Ensure your equipment is equipped and your LF is above 50%.
            </p>
          </div>
        </div>
      </div>

      {/* Target selection */}
      <div className="rounded-xl border border-red-900/30 bg-[#0f0808] p-6">
        <h2 className="mb-1 font-[family-name:var(--font-orbitron)] text-base font-bold text-red-400">
          Outer Ring Targets
        </h2>
        <p className="mb-5 text-xs text-slate-500">Select a target and engage. No withdrawal once committed.</p>

        <div className="space-y-3">
          {BOTS.map((bot) => {
            const diff = DIFF_LABEL(bot.diffMult);
            const unlocked = hasGodCard || level >= bot.levelReq;
            return (
              <button
                key={bot.slug}
                onClick={() => unlocked && setSelectedBot(bot.slug)}
                disabled={!unlocked}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  !unlocked
                    ? "border-slate-800 bg-slate-800/20 opacity-40 cursor-not-allowed"
                    : selectedBot === bot.slug
                    ? "border-red-600 bg-red-900/20"
                    : "border-slate-700 bg-[#0b0f14] hover:border-red-900"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-slate-100">{bot.name}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${diff.cls}`}>
                        {diff.label}
                      </span>
                      {!unlocked && (
                        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                          Lv {bot.levelReq}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{bot.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-amber-300">+{bot.creditReward} cr</div>
                    <div className="text-xs text-violet-400">+{bot.xpReward} XP</div>
                    <div className="text-xs text-slate-500 mt-0.5">×{bot.diffMult} diff</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Engage */}
      <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-5">
        <button
          onClick={fight}
          disabled={fighting || !selectedBot || lf <= 0}
          className="w-full rounded-lg bg-red-700 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
        >
          {fighting ? "Engaging…" : lf <= 0 ? "No Life Force — recover first" : "Engage Target"}
        </button>
        {lf < 20 && lf > 0 && (
          <p className="mt-2 text-center text-xs text-red-400">
            Warning: Low Life Force. Visit Hydroponics Bay to recover before fighting.
          </p>
        )}
      </div>

      {/* Battle result */}
      {result && (
        <div className={`rounded-xl border p-5 ${result.outcome.winner === "player" ? "border-emerald-800/50 bg-emerald-900/10" : "border-red-800/50 bg-red-900/10"}`}>
          <div className={`mb-2 font-[family-name:var(--font-orbitron)] text-lg font-black ${result.outcome.winner === "player" ? "text-emerald-300" : "text-red-400"}`}>
            {result.outcome.winner === "player" ? "VICTORY" : "DEFEAT"}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div className="space-y-1">
              <div className="text-xs text-slate-500">XP Gained</div>
              <div className="font-bold text-violet-300">+{result.outcome.xpGained}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-500">Credits Gained</div>
              <div className="font-bold text-amber-300">+{result.outcome.creditsGained}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-500">Rounds</div>
              <div className="font-bold text-slate-200">{result.outcome.totalRounds}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-500">Life Force After</div>
              <div className={`font-bold ${result.outcome.playerLfAfter < 10 ? "text-red-400" : "text-rose-300"}`}>
                {result.outcome.playerLfAfter}
              </div>
            </div>
          </div>
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer hover:text-slate-300 transition-colors">Show battle log</summary>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-slate-400 leading-relaxed border border-slate-800 rounded-lg p-3 bg-slate-900/60">
              {result.outcome.logText}
            </pre>
          </details>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-900/10 p-3 text-sm text-red-400">{error}</div>
      )}

      {/* History */}
      {log.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">Recent Engagements</h3>
          <div className="space-y-1">
            {log.map((entry, i) => (
              <div key={i} className="text-xs text-slate-500 font-mono">{entry}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
