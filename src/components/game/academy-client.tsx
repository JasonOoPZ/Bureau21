"use client";

import { useState } from "react";
import { calculateATK, calculateDEF } from "@/lib/constants";

interface Props {
  pilotStrength: number;
  pilotSplit: number;
  pilotWeaponBonus: number;
  pilotArmorBonus: number;
  pilotLevel: number;
}

const STAT_CARDS = [
  {
    stat: "Strength",
    icon: "⚡",
    color: "amber",
    description:
      "Your raw combat power. Higher Strength increases both ATK and DEF before the split is applied. Grows through Gym training.",
    tip: "Strength is the foundation of all combat. Train daily to maximise it.",
  },
  {
    stat: "ATK / DEF Split",
    icon: "⚔️",
    color: "cyan",
    description:
      "Controls how your Strength is distributed between offence (ATK) and defence (DEF). 70/30 split means 70% goes to ATK and 30% to DEF.",
    tip: "Adjust your split in the Settings section of the Station. Higher ATK wins faster; higher DEF lets you survive longer.",
  },
  {
    stat: "Speed",
    icon: "💨",
    color: "violet",
    description:
      "Determines who strikes first in a battle round. Higher Speed pilots land the first blow and interrupt opponent combos.",
    tip: "Speed is critical in close fights. A faster pilot with equal ATK will statistically win more often.",
  },
  {
    stat: "Confidence",
    icon: "🔥",
    color: "emerald",
    description:
      "Boosts ATK and damage output during battle. Confidence grows by winning fights and shrinks from losses. Caps at 75.",
    tip: "Chain victories to stack Confidence before challenging tough opponents.",
  },
  {
    stat: "Panic",
    icon: "💀",
    color: "red",
    description:
      "Reduces your effective DEF during combat. Accumulates from being critically hit or losing consecutive battles.",
    tip: "Rest, recover, and avoid battles when Panic is high. A panicked pilot takes significantly more damage.",
  },
  {
    stat: "Life Force",
    icon: "❤️",
    color: "rose",
    description:
      "Your combat HP. Reaching 0 means defeat. Restores slowly over time, via Hydroponics harvests, or Blue Herb consumables.",
    tip: "Never enter a hard fight below 50% Life Force — opponent crits can end a battle in two hits.",
  },
];

const BATTLE_TIPS = [
  { icon: "🎯", title: "Know your target", body: "Check an opponent's level requirement before fighting. Enemies 3+ levels above you deal proportionally more damage." },
  { icon: "📈", title: "Win streaks matter", body: "Back-to-back victories compound your Confidence bonus, making each subsequent fight easier. Chain easy targets first." },
  { icon: "🛡️", title: "Gear fills the gap", body: "Even a Tier 1 weapon or shield provides a flat ATK/DEF bonus that can flip a borderline fight in your favour." },
  { icon: "⏱️", title: "Timing your heals", body: "Life Force restores 1 point every 2 minutes passively. Use Hydroponics harvests to accelerate recovery before important fights." },
  { icon: "🔄", title: "Split is situational", body: "Use a high ATK split (70+) against fragile targets for fast kills. Flip to higher DEF (40 ATK / 60 DEF) when tanking strong bosses." },
];

const COLOR_MAP: Record<string, string> = {
  amber: "border-amber-800/50 bg-amber-900/10 text-amber-300",
  cyan: "border-cyan-800/50 bg-cyan-900/10 text-cyan-300",
  violet: "border-violet-800/50 bg-violet-900/10 text-violet-300",
  emerald: "border-emerald-800/50 bg-emerald-900/10 text-emerald-300",
  red: "border-red-800/50 bg-red-900/10 text-red-400",
  rose: "border-rose-800/50 bg-rose-900/10 text-rose-400",
};

export function AcademyClient({ pilotStrength, pilotSplit, pilotWeaponBonus, pilotArmorBonus, pilotLevel }: Props) {
  const [split, setSplit] = useState(pilotSplit);
  const [strength, setStrength] = useState(Math.round(pilotStrength * 10) / 10);
  const [weaponBonus, setWeaponBonus] = useState(pilotWeaponBonus);
  const [armorBonus, setArmorBonus] = useState(pilotArmorBonus);

  const atk = calculateATK(strength, split, weaponBonus);
  const def = calculateDEF(strength, split, armorBonus);
  const total = atk + def;
  const atkPct = total > 0 ? Math.round((atk / total) * 100) : 50;

  return (
    <div className="space-y-8">
      {/* ── Interactive Calculator ───────────────────────────────── */}
      <section className="rounded-xl border border-cyan-900/40 bg-[#0b1825] p-6">
        <h2 className="mb-1 font-[family-name:var(--font-orbitron)] text-lg font-bold text-cyan-300">
          ATK / DEF Split Calculator
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Adjust the sliders to see how your combat stats change. Your current values are pre-loaded.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Strength */}
          <div>
            <label className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Strength</span>
              <span className="text-amber-300">{strength.toFixed(1)}</span>
            </label>
            <input
              type="range" min={1} max={50} step={0.1}
              value={strength}
              onChange={(e) => setStrength(parseFloat(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          {/* Split */}
          <div>
            <label className="mb-1 flex justify-between text-xs text-slate-400">
              <span>ATK Split</span>
              <span className="text-cyan-300">{split}% ATK / {100 - split}% DEF</span>
            </label>
            <input
              type="range" min={10} max={90} step={5}
              value={split}
              onChange={(e) => setSplit(parseInt(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Weapon bonus */}
          <div>
            <label className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Weapon Bonus (flat ATK)</span>
              <span className="text-violet-300">+{weaponBonus}</span>
            </label>
            <input
              type="range" min={0} max={20}
              value={weaponBonus}
              onChange={(e) => setWeaponBonus(parseInt(e.target.value))}
              className="w-full accent-violet-400"
            />
          </div>

          {/* Armor bonus */}
          <div>
            <label className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Armor Bonus (flat DEF)</span>
              <span className="text-emerald-300">+{armorBonus}</span>
            </label>
            <input
              type="range" min={0} max={20}
              value={armorBonus}
              onChange={(e) => setArmorBonus(parseInt(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>
        </div>

        {/* Result bar */}
        <div className="mt-6 rounded-lg border border-slate-700 bg-[#080c10] p-4">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold">
            <span className="text-red-400">ATK {atk}</span>
            <span className="text-slate-400 text-xs">Total Power: {total}</span>
            <span className="text-blue-400">DEF {def}</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
              style={{ width: `${atkPct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>← More Defence</span>
            <span>More Offence →</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded-lg border border-red-900/40 bg-red-900/10 px-3 py-2">
            <div className="text-lg font-bold text-red-400">{atk}</div>
            <div className="text-xs text-slate-400">Attack</div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 px-3 py-2">
            <div className="text-lg font-bold text-slate-200">{total}</div>
            <div className="text-xs text-slate-400">Total Power</div>
          </div>
          <div className="rounded-lg border border-blue-900/40 bg-blue-900/10 px-3 py-2">
            <div className="text-lg font-bold text-blue-400">{def}</div>
            <div className="text-xs text-slate-400">Defence</div>
          </div>
        </div>

        {pilotLevel < 5 && (
          <p className="mt-4 rounded-md border border-amber-900/40 bg-amber-900/10 px-3 py-2 text-xs text-amber-300">
            Tip: At your current level, focus on Strength training first — even a 1.0 increase in Strength is worth more than tweaking the split.
          </p>
        )}
      </section>

      {/* ── Stat Reference Cards ─────────────────────────────────── */}
      <section>
        <h2 className="mb-4 font-[family-name:var(--font-orbitron)] text-lg font-bold text-slate-100">
          Stat Guide
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAT_CARDS.map((card) => (
            <div key={card.stat} className={`rounded-xl border p-4 ${COLOR_MAP[card.color]}`}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{card.icon}</span>
                <span className="font-[family-name:var(--font-orbitron)] text-sm font-semibold">{card.stat}</span>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-slate-300">{card.description}</p>
              <p className="border-t border-slate-700 pt-2 text-xs italic text-slate-400">
                {card.tip}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Battle Strategy Tips ─────────────────────────────────── */}
      <section>
        <h2 className="mb-4 font-[family-name:var(--font-orbitron)] text-lg font-bold text-slate-100">
          Combat Strategy
        </h2>
        <div className="space-y-3">
          {BATTLE_TIPS.map((tip) => (
            <div key={tip.title} className="flex gap-4 rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3">
              <span className="mt-0.5 text-2xl">{tip.icon}</span>
              <div>
                <div className="mb-1 text-sm font-semibold text-slate-100">{tip.title}</div>
                <div className="text-xs leading-relaxed text-slate-400">{tip.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
