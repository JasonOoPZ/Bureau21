"use client";

import { useState } from "react";
import Image from "next/image";

/* ═══════════════════════════════════════════════
   Types — mirrored from equipment-data.ts
   ═══════════════════════════════════════════════ */
type ClearanceTier = "GRAY" | "GREEN" | "BLUE" | "AMBER" | "RED" | "VIOLET" | "BLACK" | "OMEGA";
type EquipmentSlot = "weapon" | "armor";

interface VendorItem {
  name: string;
  slot: EquipmentSlot;
  lvl: number;
  tier: ClearanceTier;
  stat: number;
  price: number;
  notes: string;
  image: string;
}

interface Props {
  weapons: VendorItem[];
  armor: VendorItem[];
  pilotLevel: number;
  initialCredits: number;
  inventoryCount: number;
}

/* ═══════════════════════════════════════════════
   Tier styling maps
   ═══════════════════════════════════════════════ */
const TIER_STYLE: Record<ClearanceTier, { text: string; border: string; bg: string; badge: string; glow: string }> = {
  GRAY:   { text: "text-slate-400",    border: "border-slate-600",    bg: "bg-slate-900/30",    badge: "bg-slate-800 text-slate-300",    glow: "" },
  GREEN:  { text: "text-emerald-400",  border: "border-emerald-800",  bg: "bg-emerald-950/20",  badge: "bg-emerald-950 text-emerald-300", glow: "shadow-emerald-900/30" },
  BLUE:   { text: "text-sky-400",      border: "border-sky-800",      bg: "bg-sky-950/20",      badge: "bg-sky-950 text-sky-300",          glow: "shadow-sky-900/30" },
  AMBER:  { text: "text-amber-400",    border: "border-amber-800",    bg: "bg-amber-950/20",    badge: "bg-amber-950 text-amber-300",      glow: "shadow-amber-900/30" },
  RED:    { text: "text-red-400",      border: "border-red-800",      bg: "bg-red-950/20",      badge: "bg-red-950 text-red-300",          glow: "shadow-red-900/30" },
  VIOLET: { text: "text-purple-400",   border: "border-purple-800",   bg: "bg-purple-950/20",   badge: "bg-purple-950 text-purple-300",    glow: "shadow-purple-900/30" },
  BLACK:  { text: "text-slate-200",    border: "border-slate-400",    bg: "bg-slate-950/40",    badge: "bg-slate-900 text-slate-100",      glow: "shadow-slate-500/20" },
  OMEGA:  { text: "text-yellow-300",   border: "border-yellow-600",   bg: "bg-yellow-950/20",   badge: "bg-yellow-900 text-yellow-200",    glow: "shadow-yellow-500/30" },
};

const TIER_RANGE: Record<ClearanceTier, string> = {
  GRAY: "1–10", GREEN: "11–20", BLUE: "21–35", AMBER: "36–50",
  RED: "51–65", VIOLET: "66–80", BLACK: "81–95", OMEGA: "96–100",
};

const TIER_DESC: Record<ClearanceTier, string> = {
  GRAY: "Recruit / Civilian", GREEN: "Field Agent", BLUE: "Tactical Ops", AMBER: "Special Operations",
  RED: "Black Ops", VIOLET: "Xenotech Division", BLACK: "Ultra-Classified", OMEGA: "Director Tier",
};

/* ═══════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════ */
export function EquipmentVendor({ weapons, armor, pilotLevel, initialCredits, inventoryCount }: Props) {
  const [tab, setTab] = useState<EquipmentSlot>("weapon");
  const [credits, setCredits] = useState(initialCredits);
  const [invCount, setInvCount] = useState(inventoryCount);
  const [buying, setBuying] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, { text: string; ok: boolean }>>({});
  const [inspecting, setInspecting] = useState<VendorItem | null>(null);

  const items = tab === "weapon" ? weapons : armor;

  // Group by tier
  const tiers = ["GRAY", "GREEN", "BLUE"] as ClearanceTier[];
  const grouped = tiers.map((t) => ({
    tier: t,
    items: items.filter((i) => i.tier === t),
  })).filter((g) => g.items.length > 0);

  async function buy(item: VendorItem) {
    if (buying) return;
    setBuying(item.name);
    setMessages((m) => ({ ...m, [item.name]: { text: "", ok: true } }));

    try {
      const res = await fetch("/api/game/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: item.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => ({ ...m, [item.name]: { text: data.error ?? "Purchase failed.", ok: false } }));
        return;
      }
      setMessages((m) => ({ ...m, [item.name]: { text: "Purchased!", ok: true } }));
      setCredits((c) => c - item.price);
      setInvCount((c) => c + 1);
    } catch {
      setMessages((m) => ({ ...m, [item.name]: { text: "Connection error.", ok: false } }));
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* ─── Header bar ─── */}
      <div className="flex items-center justify-between rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2">
        <span className="text-[11px] text-slate-400">
          Inventory: <span className={invCount >= 20 ? "text-red-400" : "text-slate-200"}>{invCount}/20</span>
        </span>
        <span className="text-[13px] font-bold text-amber-300">{credits.toLocaleString()} Cr</span>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-2">
        {([
          { key: "weapon" as EquipmentSlot, label: "⚔ Weapons" },
          { key: "armor" as EquipmentSlot, label: "🛡 Armor" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded border px-4 py-1.5 text-[11px] font-medium transition ${
              tab === key
                ? "border-cyan-700 bg-cyan-950/40 text-cyan-300"
                : "border-slate-800 bg-slate-900/40 text-slate-500 hover:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Tier sections ─── */}
      {grouped.map(({ tier, items: tierItems }) => {
        const s = TIER_STYLE[tier];
        return (
          <div key={tier} className="space-y-2">
            {/* Tier header */}
            <div className={`flex items-center gap-3 rounded border ${s.border} ${s.bg} px-3 py-2`}>
              <span className={`text-[12px] font-bold uppercase tracking-wider ${s.text}`}>
                {tier} Clearance
              </span>
              <span className="text-[10px] text-slate-500">Lvl {TIER_RANGE[tier]}</span>
              <span className="text-[10px] text-slate-600 italic">{TIER_DESC[tier]}</span>
            </div>

            {/* Item grid */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {tierItems.map((item) => {
                const canAfford = credits >= item.price;
                const meetsLevel = pilotLevel >= item.lvl;
                const full = invCount >= 20;
                const isLoading = buying === item.name;
                const msg = messages[item.name];
                const locked = !meetsLevel;

                return (
                  <div
                    key={item.name}
                    className={`group relative rounded-md border ${s.border} bg-[#0a0d11] p-3 transition ${
                      locked ? "opacity-50" : ""
                    } ${s.glow ? `shadow-md ${s.glow}` : ""}`}
                  >
                    {/* Top row: image + name */}
                    <div className="flex items-start gap-2.5">
                      <div className={`relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded border ${s.border} bg-[#0d1117]`}>
                        <Image
                          src={`/equipment/${item.image}`}
                          alt={item.name}
                          width={42}
                          height={42}
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[12px] font-semibold leading-tight ${s.text}`}>
                          {item.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className={`rounded px-1 py-[1px] text-[9px] font-bold uppercase ${s.badge}`}>
                            {tier}
                          </span>
                          <span className="text-[10px] text-slate-500">Lvl {item.lvl}</span>
                        </div>
                      </div>
                      {/* Inspect button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setInspecting(item); }}
                        className="shrink-0 rounded border border-slate-700 bg-slate-900/50 px-1.5 py-0.5 text-[10px] text-slate-400 transition hover:border-cyan-700 hover:text-cyan-300"
                        title="Inspect"
                      >
                        ?
                      </button>
                    </div>

                    {/* Stat */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[12px] font-bold ${item.slot === "weapon" ? "text-red-400" : "text-sky-400"}`}>
                        {item.slot === "weapon" ? `⚔ ${item.stat} ATK` : `🛡 ${item.stat} DEF`}
                      </span>
                      <span className={`text-[12px] font-bold ${canAfford ? "text-amber-300" : "text-slate-600"}`}>
                        {item.price === 0 ? "Free" : `${item.price.toLocaleString()} Cr`}
                      </span>
                    </div>

                    {/* Notes preview */}
                    <p className="mt-1 text-[10px] leading-snug text-slate-500 line-clamp-2">{item.notes}</p>

                    {/* Messages */}
                    {msg && msg.text && (
                      <p className={`mt-1 text-[10px] ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
                        {msg.text}
                      </p>
                    )}

                    {/* Buy button */}
                    <button
                      onClick={() => buy(item)}
                      disabled={locked || !canAfford || full || !!buying}
                      className="mt-2 w-full rounded border border-cyan-900 bg-cyan-950/30 py-1.5 text-[11px] font-medium text-cyan-300 transition hover:bg-cyan-950/60 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {isLoading
                        ? "Buying..."
                        : locked
                        ? `Req. Lvl ${item.lvl}`
                        : full
                        ? "Inv Full"
                        : !canAfford
                        ? "Can't Afford"
                        : "Purchase"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ─── Inspect Modal ─── */}
      {inspecting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setInspecting(null)}
        >
          <div
            className="relative w-full max-w-md rounded-lg border border-slate-700 bg-[#0b0f14] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <InspectPanel item={inspecting} onClose={() => setInspecting(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Inspect Panel — full item details
   ═══════════════════════════════════════════════ */
function InspectPanel({ item, onClose }: { item: VendorItem; onClose: () => void }) {
  const s = TIER_STYLE[item.tier];

  return (
    <div className="space-y-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-3 top-3 text-slate-500 transition hover:text-slate-200"
      >
        ✕
      </button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-lg border-2 ${s.border} bg-[#0d1117] ${s.glow ? `shadow-lg ${s.glow}` : ""}`}>
          <Image
            src={`/equipment/${item.image}`}
            alt={item.name}
            width={64}
            height={64}
            className="object-contain"
          />
        </div>
        <div>
          <h3 className={`text-lg font-bold ${s.text}`}>{item.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${s.badge}`}>
              {item.tier} Clearance
            </span>
            <span className="text-[11px] text-slate-400">
              {item.slot === "weapon" ? "Weapon" : "Armor"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatBox
          label={item.slot === "weapon" ? "ATK Power" : "DEF Rating"}
          value={item.stat.toString()}
          color={item.slot === "weapon" ? "text-red-400" : "text-sky-400"}
          icon={item.slot === "weapon" ? "⚔" : "🛡"}
        />
        <StatBox
          label="Level Required"
          value={item.lvl.toString()}
          color="text-amber-300"
          icon="★"
        />
        <StatBox
          label="Price"
          value={item.price === 0 ? "Free" : `${item.price.toLocaleString()} Cr`}
          color="text-amber-300"
          icon="◈"
        />
        <StatBox
          label="Clearance"
          value={`${item.tier} (${TIER_RANGE[item.tier]})`}
          color={s.text}
          icon="◆"
        />
      </div>

      {/* Description */}
      <div className="rounded border border-slate-800 bg-[#080b10] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Intel Report</p>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-300">{item.notes}</p>
      </div>

      {/* Clearance info */}
      <div className={`rounded border ${s.border} ${s.bg} px-3 py-2`}>
        <p className="text-[10px] text-slate-500">
          <span className={`font-semibold ${s.text}`}>{item.tier}</span> clearance ·{" "}
          {TIER_DESC[item.tier]} · Level range {TIER_RANGE[item.tier]}
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div className="rounded border border-slate-800 bg-[#080b10] px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">{label}</p>
      <p className={`mt-0.5 text-[14px] font-bold ${color}`}>
        {icon} {value}
      </p>
    </div>
  );
}
