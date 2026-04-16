"use client";

import {
  BONUS_LABELS,
  HERO_MAX_ACTIVE,
  HERO_MAX_LEVEL,
  HERO_TEMPLATES,
  PACK_CREDIT_COST,
  PACK_FREE_COOLDOWN_HOURS,
  RARITY_DISPLAY,
  heroEffectiveBonus,
  heroXpForLevel,
  type HeroTemplate,
} from "@/lib/hero-data";
import { useCallback, useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HeroRecord {
  id: string;
  heroSlug: string;
  level: number;
  xp: number;
  active: boolean;
  createdAt: string;
  template: HeroTemplate | null;
}

interface PackResult {
  hero: HeroRecord;
  template: HeroTemplate;
  isNew: boolean;
  xpGain: number;
}

interface Props {
  initialHeroes: HeroRecord[];
  pilotCredits: number;
  freePackAvailable: boolean;
  freePackCooldownMs: number;
}

// ─── Countdown helper ────────────────────────────────────────────────────────

function useCooldownTimer(initialMs: number) {
  const [remaining, setRemaining] = useState(initialMs);

  useEffect(() => {
    if (initialMs <= 0) return; // remaining is already 0 (initialised from initialMs)
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1000) { clearInterval(id); return 0; }
        return r - 1000;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [initialMs]);

  return remaining;
}

function formatMs(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Single hero card ─────────────────────────────────────────────────────────

function HeroCard({
  record,
  onToggle,
  activeCount,
  toggling,
}: {
  record: HeroRecord;
  onToggle: (id: string, active: boolean) => void;
  activeCount: number;
  toggling: string | null;
}) {
  const template = record.template ?? HERO_TEMPLATES.find((t) => t.slug === record.heroSlug);
  if (!template) return null;

  const rd = RARITY_DISPLAY[template.rarity];
  const xpNeeded = heroXpForLevel(record.level);
  const xpPct = record.level >= HERO_MAX_LEVEL ? 100 : Math.min(100, Math.round((record.xp / xpNeeded) * 100));
  const bonusVal = heroEffectiveBonus(template, record.level);
  const bonusLabel = BONUS_LABELS[template.bonusType];
  const bonusStr =
    template.bonusType === "speed_flat"
      ? `+${bonusVal.toFixed(1)} ${bonusLabel}`
      : template.bonusType === "confidence_flat"
      ? `+${bonusVal.toFixed(0)} ${bonusLabel}`
      : `+${bonusVal.toFixed(1)}% ${bonusLabel}`;

  const canActivate = !record.active && activeCount < HERO_MAX_ACTIVE;
  const isToggling = toggling === record.id;

  return (
    <div
      className={`rounded-lg border p-3 bg-black/40 flex flex-col gap-2 transition-all ${
        record.active ? `${rd.border} shadow-sm` : "border-slate-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{template.icon}</span>
          <div>
            <p className={`font-semibold text-sm leading-tight ${rd.color}`}>{template.name}</p>
            <p className="text-xs text-slate-500">{template.soul} · {template.hull}</p>
          </div>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded ${rd.badge} shrink-0`}>
          {rd.label}
        </span>
      </div>

      {/* Level + XP */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Lvl {record.level}{record.level >= HERO_MAX_LEVEL ? " (MAX)" : ""}</span>
          <span>
            {record.level >= HERO_MAX_LEVEL ? "MAX" : `${record.xp} / ${xpNeeded} XP`}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              template.rarity === "legendary"
                ? "bg-amber-500"
                : template.rarity === "epic"
                ? "bg-purple-500"
                : template.rarity === "rare"
                ? "bg-cyan-500"
                : "bg-slate-500"
            }`}
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      {/* Bonus */}
      <p className="text-xs text-emerald-400 font-mono">{bonusStr}</p>

      {/* Toggle button */}
      <button
        onClick={() => onToggle(record.id, !record.active)}
        disabled={isToggling || (!record.active && !canActivate)}
        className={`mt-auto text-xs px-3 py-1.5 rounded border transition-colors ${
          record.active
            ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-red-900/40 hover:border-red-700 hover:text-red-300"
            : canActivate
            ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-emerald-900/40 hover:border-emerald-700 hover:text-emerald-300"
            : "opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-600"
        }`}
      >
        {isToggling ? "…" : record.active ? "Deactivate" : activeCount >= HERO_MAX_ACTIVE ? "Squad Full" : "Activate"}
      </button>
    </div>
  );
}

// ─── Pack reveal card ─────────────────────────────────────────────────────────

function PackReveal({ result, onDismiss }: { result: PackResult; onDismiss: () => void }) {
  const rd = RARITY_DISPLAY[result.template.rarity];
  const bonusVal = heroEffectiveBonus(result.template, 1);
  const bonusLabel = BONUS_LABELS[result.template.bonusType];
  const bonusStr =
    result.template.bonusType === "speed_flat"
      ? `+${bonusVal.toFixed(1)} ${bonusLabel}`
      : result.template.bonusType === "confidence_flat"
      ? `+${bonusVal.toFixed(0)} ${bonusLabel}`
      : `+${bonusVal.toFixed(1)}% ${bonusLabel}`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-2xl border-2 ${rd.border} bg-[#0a0d11] p-6 max-w-xs w-full text-center animate-fade-in shadow-2xl`}
      >
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">
          {result.isNew ? "New Mecha Acquired!" : "Duplicate — Bonus XP Awarded"}
        </p>
        <span className="text-6xl block mb-3">{result.template.icon}</span>
        <h2 className={`text-xl font-bold mb-1 ${rd.color}`}>{result.template.name}</h2>
        <p className="text-sm text-slate-400 mb-1">{result.template.soul} · {result.template.hull}</p>
        <span className={`inline-block text-xs px-2 py-0.5 rounded ${rd.badge} mb-3`}>{rd.label}</span>
        <p className="text-sm text-slate-400 italic mb-3">&ldquo;{result.template.description}&rdquo;</p>
        <p className="text-emerald-400 font-mono text-sm mb-4">
          {bonusStr} per level
        </p>
        {!result.isNew && (
          <p className="text-amber-400 text-xs mb-4">+{result.xpGain} XP added to existing mecha</p>
        )}
        <button
          onClick={onDismiss}
          className="w-full py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 hover:bg-slate-700 transition-colors text-sm"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HeroesClient({
  initialHeroes,
  pilotCredits,
  freePackAvailable,
  freePackCooldownMs,
}: Props) {
  const [heroes, setHeroes] = useState<HeroRecord[]>(initialHeroes);
  const [credits, setCredits] = useState(pilotCredits);
  const [ripLoading, setRipLoading] = useState<"free" | "credit" | null>(null);
  const [ripResult, setRipResult] = useState<PackResult | null>(null);
  const [ripError, setRipError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [packUsed, setPackUsed] = useState(!freePackAvailable);
  const cooldownMs = useCooldownTimer(packUsed ? freePackCooldownMs : 0);

  const activeHeroes = heroes.filter((h) => h.active);
  const inactiveHeroes = heroes.filter((h) => !h.active);

  const ripPack = useCallback(async (type: "free" | "credit") => {
    setRipLoading(type);
    setRipError(null);
    try {
      const res = await fetch("/api/game/heroes/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRipError(data.error ?? "Pack rip failed");
        return;
      }
      if (type === "free") setPackUsed(true);
      if (type === "credit") setCredits((c) => c - PACK_CREDIT_COST);

      const heroWithTpl: HeroRecord = { ...data.hero, template: data.template };
      setHeroes((prev) => {
        const idx = prev.findIndex((h) => h.id === data.hero.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = heroWithTpl;
          return next;
        }
        return [...prev, heroWithTpl];
      });
      setRipResult(data as PackResult);
    } catch {
      setRipError("Connection error. Try again.");
    } finally {
      setRipLoading(null);
    }
  }, []);

  const toggleActive = useCallback(async (heroId: string, active: boolean) => {
    setToggling(heroId);
    setToggleError(null);
    try {
      const res = await fetch("/api/game/heroes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroId, active }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToggleError(data.error ?? "Could not update hero");
        return;
      }
      const updated: HeroRecord = { ...data.hero, template: data.template };
      setHeroes((prev) => prev.map((h) => (h.id === heroId ? updated : h)));
    } catch {
      setToggleError("Connection error.");
    } finally {
      setToggling(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Pack Depot ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Pack Depot</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Free Pack */}
          <div className="rounded-xl border border-slate-700 bg-black/40 p-4 flex flex-col gap-3">
            <div>
              <p className="font-semibold text-slate-200 text-sm">Daily Free Pack</p>
              <p className="text-xs text-slate-500 mt-0.5">1 free pack every {PACK_FREE_COOLDOWN_HOURS}h</p>
            </div>
            {packUsed && cooldownMs > 0 ? (
              <p className="text-xs text-amber-400 font-mono">Ready in {formatMs(cooldownMs)}</p>
            ) : (
              <p className="text-xs text-emerald-400">Ready!</p>
            )}
            <button
              onClick={() => ripPack("free")}
              disabled={
                (packUsed && cooldownMs > 0) ||
                ripLoading !== null ||
                heroes.length >= 15
              }
              className="text-sm px-4 py-2 rounded-lg border border-cyan-700 bg-cyan-900/30 text-cyan-300 hover:bg-cyan-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {ripLoading === "free" ? "Opening…" : "Rip Free Pack"}
            </button>
          </div>

          {/* Credit Pack */}
          <div className="rounded-xl border border-slate-700 bg-black/40 p-4 flex flex-col gap-3">
            <div>
              <p className="font-semibold text-slate-200 text-sm">Credit Pack</p>
              <p className="text-xs text-slate-500 mt-0.5">{PACK_CREDIT_COST} cr per pull</p>
            </div>
            <p className="text-xs text-slate-400">Balance: <span className="text-amber-300">{credits} cr</span></p>
            <button
              onClick={() => ripPack("credit")}
              disabled={
                credits < PACK_CREDIT_COST ||
                ripLoading !== null ||
                heroes.length >= 15
              }
              className="text-sm px-4 py-2 rounded-lg border border-amber-700 bg-amber-900/30 text-amber-300 hover:bg-amber-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {ripLoading === "credit" ? "Opening…" : `Rip Pack (${PACK_CREDIT_COST} cr)`}
            </button>
          </div>
        </div>

        {/* Odds table */}
        <div className="mt-3 rounded-lg border border-slate-800 bg-black/20 px-4 py-3 grid grid-cols-4 gap-2 text-center text-xs">
          {(["common", "rare", "epic", "legendary"] as const).map((r) => {
            const rd = RARITY_DISPLAY[r];
            const odds = r === "common" ? "60%" : r === "rare" ? "28%" : r === "epic" ? "10%" : "2%";
            return (
              <div key={r}>
                <p className={`font-semibold ${rd.color}`}>{rd.label}</p>
                <p className="text-slate-400">{odds}</p>
              </div>
            );
          })}
        </div>

        {ripError && (
          <p className="mt-2 text-xs text-red-400">{ripError}</p>
        )}
      </section>

      {/* ── Active Battle Corps ─────────────────────────────────────── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">
          Active Battle Corps ({activeHeroes.length}/{HERO_MAX_ACTIVE})
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: HERO_MAX_ACTIVE }).map((_, i) => {
            const hero = activeHeroes[i];
            if (hero) {
              return (
                <HeroCard
                  key={hero.id}
                  record={hero}
                  onToggle={toggleActive}
                  activeCount={activeHeroes.length}
                  toggling={toggling}
                />
              );
            }
            return (
              <div
                key={i}
                className="rounded-lg border border-dashed border-slate-800 bg-black/20 p-4 flex items-center justify-center min-h-[120px]"
              >
                <span className="text-3xl text-slate-700">+</span>
              </div>
            );
          })}
        </div>
        {toggleError && (
          <p className="mt-2 text-xs text-red-400">{toggleError}</p>
        )}
      </section>

      {/* ── Full Roster ─────────────────────────────────────────────── */}
      {inactiveHeroes.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">
            Roster — Reserve ({inactiveHeroes.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inactiveHeroes.map((hero) => (
              <HeroCard
                key={hero.id}
                record={hero}
                onToggle={toggleActive}
                activeCount={activeHeroes.length}
                toggling={toggling}
              />
            ))}
          </div>
        </section>
      )}

      {heroes.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-8">
          No mechas yet — rip your first pack to recruit support!
        </p>
      )}

      {/* Pack reveal modal */}
      {ripResult && (
        <PackReveal result={ripResult} onDismiss={() => setRipResult(null)} />
      )}
    </div>
  );
}
