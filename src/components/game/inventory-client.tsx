"use client";

import { useState, useRef, useEffect } from "react";

interface InventoryItem {
  id: string;
  name: string;
  type: string;
  tier: number;
  bonusType: string;
  bonusAmt: number;
  equipped: boolean;
}

const TIER_COLORS: Record<number, string> = {
  1: "border-slate-600 text-slate-300",
  2: "border-cyan-800 text-cyan-300",
  3: "border-amber-700 text-amber-300",
  4: "border-yellow-500 text-yellow-200",
};

const TIER_LABELS: Record<number, string> = {
  1: "MK I",
  2: "MK II",
  3: "MK III",
  4: "Exclusive",
};

const TYPE_ICONS: Record<string, string> = {
  weapon: "⚔",
  shield: "🛡",
  engine: "⚙",
  armor: "🛡",
  special: "🃏",
};

function BonusLabel({ bonusType, bonusAmt, itemName }: { bonusType: string; bonusAmt: number; itemName?: string }) {
  // Name-specific overrides
  if (itemName === "Ring Of Power") return <span className="text-emerald-400 text-[10px]">Exclusive Perks</span>;

  const labels: Record<string, string> = {
    credits: `+${bonusAmt}% credits`,
    xp: `+${bonusAmt}% XP`,
    hull: `+${bonusAmt} hull`,
    fuel: `+${bonusAmt}% fuel eff.`,
    atk: `+${bonusAmt} ATK`,
    def: `+${bonusAmt} DEF`,
    access: "Exclusive Access",
    yield: "Max Yield",
  };
  return <span className="text-emerald-400 text-[10px]">{labels[bonusType] ?? bonusType}</span>;
}

export function InventoryClient({
  initialItems,
  slotMax,
  pilotCallsign,
  pilotId,
}: {
  initialItems: InventoryItem[];
  slotMax: number;
  pilotCallsign?: string;
  pilotId?: string;
}) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [filter, setFilter] = useState<"all" | "weapon" | "armor" | "shield" | "engine" | "special">("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState<InventoryItem | null>(null);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEquip = async (item: InventoryItem, equip: boolean) => {
    setLoading(item.id);
    const res = await fetch("/api/game/inventory/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, equip }),
    });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error ?? "Failed.");
    } else {
      setItems(data.inventory);
      flash(equip ? `${item.name} equipped.` : `${item.name} unequipped.`);
    }
    setLoading(null);
  };

  const handleDiscard = async (item: InventoryItem) => {
    if (!confirm(`Discard ${item.name}? This cannot be undone.`)) return;
    setLoading(item.id);
    const res = await fetch(`/api/game/inventory/${item.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error ?? "Failed.");
    } else {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      flash(`${item.name} discarded.`);
    }
    setLoading(null);
  };

  const visible = filter === "all" ? items : items.filter((i) => i.type === filter);
  const equipped = items.filter((i) => i.equipped);

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400">
            Slots: <span className="font-bold text-cyan-300">{items.length}/{slotMax}</span>
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-[11px] text-slate-400">
            Equipped: <span className="font-bold text-emerald-300">{equipped.length}</span>
          </span>
        </div>
        {msg && (
          <span className="text-[11px] rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-cyan-300">
            {msg}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1">
        {(["all", "weapon", "armor", "shield", "engine", "special"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded border px-3 py-1 text-[10px] uppercase tracking-wider transition ${
              filter === f
                ? "border-cyan-700 bg-cyan-900/20 text-cyan-300"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}
          >
            {f === "all" ? "All" : `${TYPE_ICONS[f]} ${f}`}
          </button>
        ))}
      </div>

      {/* Equipped loadout summary */}
      {equipped.length > 0 && (
        <div className="rounded-md border border-emerald-900/50 bg-emerald-950/10 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-emerald-600">Active Loadout</p>
          <div className="flex flex-wrap gap-2">
            {equipped.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-1.5 rounded border border-emerald-800/60 bg-emerald-900/20 px-2 py-1"
              >
                <span className="text-sm">{TYPE_ICONS[item.type]}</span>
                <span className="text-[11px] text-emerald-200">{item.name}</span>
                <BonusLabel bonusType={item.bonusType} bonusAmt={item.bonusAmt} itemName={item.name} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Item grid */}
      {visible.length === 0 ? (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-8 text-center">
          <p className="text-[11px] text-slate-600">
            {items.length === 0
              ? "Your inventory is empty. Complete field ops or buy from the Armory."
              : "No items match this filter."}
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => {
            const tierClass = TIER_COLORS[item.tier] ?? "border-slate-600 text-slate-300";
            const busy = loading === item.id;

            return (
              <div
                key={item.id}
                className={`relative rounded-md border bg-[#0a0d11] p-3 transition ${tierClass} ${
                  item.equipped ? "ring-1 ring-emerald-700/50" : ""
                }`}
              >
                {item.equipped && (
                  <span className="absolute right-2 top-2 rounded border border-emerald-800/60 bg-emerald-900/40 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-emerald-400">
                    Equipped
                  </span>
                )}

                {item.type === "special" && !item.equipped && (
                  <button
                    onClick={() => setInspecting(item)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-yellow-600/50 bg-yellow-900/30 text-[10px] font-bold text-yellow-400 transition hover:border-yellow-400 hover:bg-yellow-800/40"
                    title="View details"
                  >
                    ?
                  </button>
                )}

                <div className="flex items-start gap-2 pr-12">
                  <span className="mt-0.5 text-lg">{TYPE_ICONS[item.type] ?? "?"}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold leading-tight">{item.name}</p>
                    <p className="text-[10px] capitalize text-slate-500">
                      {item.type} · {TIER_LABELS[item.tier] ?? `T${item.tier}`}
                    </p>
                    <BonusLabel bonusType={item.bonusType} bonusAmt={item.bonusAmt} itemName={item.name} />
                  </div>
                </div>

                <div className="mt-3 flex gap-1.5">
                  {item.type === "special" ? (
                    <button
                      onClick={() => setInspecting(item)}
                      className="flex-1 rounded border border-yellow-700/50 bg-yellow-900/20 py-1 text-[10px] text-yellow-400 hover:border-yellow-500 transition"
                    >
                      🔍 Inspect
                    </button>
                  ) : item.equipped ? (
                    <button
                      onClick={() => handleEquip(item, false)}
                      disabled={busy}
                      className="flex-1 rounded border border-slate-700 bg-slate-900/60 py-1 text-[10px] text-slate-300 hover:border-slate-500 disabled:opacity-50 transition"
                    >
                      {busy ? "…" : "Unequip"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEquip(item, true)}
                      disabled={busy}
                      className="flex-1 rounded border border-cyan-800/60 bg-cyan-900/20 py-1 text-[10px] text-cyan-300 hover:border-cyan-600 disabled:opacity-50 transition"
                    >
                      {busy ? "…" : "Equip"}
                    </button>
                  )}
                  {item.type !== "special" && (
                    <button
                      onClick={() => handleDiscard(item)}
                      disabled={busy || item.equipped}
                      title={item.equipped ? "Unequip before discarding" : "Discard item"}
                      className="rounded border border-red-900/40 bg-red-950/20 px-2 py-1 text-[10px] text-red-500 hover:border-red-700 disabled:cursor-not-allowed disabled:opacity-30 transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {items.length >= slotMax && (
        <p className="text-center text-[10px] text-amber-500">
          Inventory full ({slotMax}/{slotMax}). Discard items to make room.
        </p>
      )}

      {/* Special Item Detail Overlay */}
      {inspecting && (
        <SpecialItemOverlay
          item={inspecting}
          pilotCallsign={pilotCallsign}
          pilotId={pilotId}
          onClose={() => setInspecting(null)}
        />
      )}
    </div>
  );
}

/* ── Special Item Detail Overlay ─────────────────────────────────────── */

const SPECIAL_ITEM_INFO: Record<string, { description: string; icon: string }> = {
  "Centurion Venture Card": {
    description: "An exclusive black-and-gold membership card granting access to the Bureau Bank's private Wealth Management suite. Issued to select pilots of distinguished financial standing. This card is non-transferable and bound to the holder's identity.",
    icon: "💳",
  },
  "God Card": {
    description: "A mythic obsidian card pulsing with unstable energy. Bypasses all level and stat requirements for equipment and grants unrestricted access to every sector and facility aboard the station. Rumored to be forged in the core of a collapsed star.",
    icon: "🃏",
  },
  "Nexus Limitless Yield": {
    description: "A radiant crystalline data-shard humming with quantum resonance. Removes the maximum SVN cap on all Wealth Management investments, allowing unlimited position sizes. Issued by the Bureau's inner council.",
    icon: "♾️",
  },
  "Ring Of Power": {
    description: "A single band of dark metal etched with shifting glyphs. The holder may equip any weapon, armor, or ship regardless of level, clearance, or stat requirements. There is only one.",
    icon: "💍",
  },
};

function SpecialItemOverlay({
  item,
  pilotCallsign,
  pilotId,
  onClose,
}: {
  item: InventoryItem;
  pilotCallsign?: string;
  pilotId?: string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const info = SPECIAL_ITEM_INFO[item.name];
  const maskedId = pilotId ? pilotId.slice(0, 6) + "••••" + pilotId.slice(-4) : "——";
  const isGodCard = item.name === "God Card";
  const borderColor = isGodCard ? "border-purple-700/40" : "border-yellow-700/40";
  const glowColor = isGodCard ? "rgba(168,85,247,0.08)" : "rgba(234,179,8,0.08)";
  const glowColor2 = isGodCard ? "rgba(168,85,247,0.04)" : "rgba(234,179,8,0.04)";
  const stripGradient = isGodCard
    ? "from-transparent via-purple-500 to-transparent"
    : "from-transparent via-yellow-500 to-transparent";
  const accentText = isGodCard ? "text-purple-300" : "text-yellow-300";
  const accentDim = isGodCard ? "text-purple-600" : "text-yellow-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-yellow-700/40 bg-[#0a0e14] shadow-2xl"
        style={{ boxShadow: `0 0 80px ${glowColor}, 0 0 30px ${glowColor2}` }}
      >
        {/* Top glow strip */}
        <div className={`h-1 bg-gradient-to-r ${stripGradient}`} />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-sm text-slate-400 transition hover:border-red-500 hover:text-red-300"
        >
          ✕
        </button>

        <div className="p-6">
          {/* Card visual */}
          <div className="mb-5 flex justify-center">
            <div className={`relative w-72 h-44 rounded-2xl overflow-hidden border-2 ${isGodCard ? "border-purple-600/50" : "border-yellow-600/50"} shadow-xl`} style={{ background: isGodCard ? "linear-gradient(135deg, #0c0010 0%, #1a0828 30%, #0c0010 60%, #1a0828 100%)" : "linear-gradient(135deg, #0c0c0c 0%, #1a1508 30%, #0c0c0c 60%, #1a1508 100%)" }}>
              {/* Accent lines */}
              <div className="absolute inset-0 opacity-20" style={{ background: `repeating-linear-gradient(45deg, transparent, transparent 20px, ${isGodCard ? "rgba(168,85,247,0.1)" : "rgba(234,179,8,0.1)"} 20px, ${isGodCard ? "rgba(168,85,247,0.1)" : "rgba(234,179,8,0.1)"} 21px)` }} />
              {/* Top bar */}
              <div className={`absolute top-0 left-0 right-0 h-8 ${isGodCard ? "bg-gradient-to-r from-purple-700/30 via-purple-500/20 to-purple-700/30" : "bg-gradient-to-r from-yellow-700/30 via-yellow-500/20 to-yellow-700/30"} flex items-center px-4`}>
                <span className={`text-[8px] uppercase tracking-[0.3em] ${isGodCard ? "text-purple-500/80" : "text-yellow-500/80"} font-bold`}>{isGodCard ? "Bureau 21 · Mythic Access" : "Bureau 21 · Private Banking"}</span>
              </div>
              {/* Card content */}
              <div className="absolute inset-0 flex flex-col justify-center items-center pt-4">
                <span className="text-4xl mb-1">{info?.icon ?? "💳"}</span>
                <div className={`text-[10px] uppercase tracking-[0.25em] ${isGodCard ? "text-purple-500" : "text-yellow-500"} font-bold`}>{item.name}</div>
              </div>
              {/* Bottom details */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-2.5 pt-1 bg-gradient-to-t from-black/60">
                <div className="flex justify-between items-end">
                  <div>
                    <div className={`text-[8px] uppercase tracking-wider ${isGodCard ? "text-purple-600/60" : "text-yellow-600/60"}`}>Cardholder</div>
                    <div className={`text-[11px] font-bold ${accentText} font-mono`}>{pilotCallsign ?? "——"}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[8px] uppercase tracking-wider ${isGodCard ? "text-purple-600/60" : "text-yellow-600/60"}`}>Pilot ID</div>
                    <div className={`text-[9px] font-mono ${isGodCard ? "text-purple-400/80" : "text-yellow-400/80"}`}>{maskedId}</div>
                  </div>
                </div>
              </div>
              {/* Holographic sheen */}
              <div className={`absolute inset-0 bg-gradient-to-br ${isGodCard ? "from-purple-500/5 via-transparent to-purple-500/5" : "from-yellow-500/5 via-transparent to-yellow-500/5"} pointer-events-none`} />
            </div>
          </div>

          {/* Item info */}
          <div className="mb-4 text-center">
            <h3 className={`text-lg font-black uppercase tracking-wide ${accentText}`}>
              {item.name}
            </h3>
            <p className={`mt-0.5 text-[10px] uppercase tracking-[0.2em] ${accentDim}`}>
              {TIER_LABELS[item.tier] ?? "Special"} · {item.type}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-slate-400 text-center mb-4">
            {info?.description ?? "A unique item."}
          </p>

          {/* Cardholder details */}
          <div className={`rounded-xl border ${isGodCard ? "border-purple-800/30 bg-purple-950/10" : "border-yellow-800/30 bg-yellow-950/10"} p-4 space-y-2`}>
            <div className={`text-[9px] uppercase tracking-[0.15em] ${accentDim} font-semibold text-center mb-2`}>Cardholder Information</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider text-slate-500">Callsign</div>
                <div className={`text-sm font-bold ${accentText}`}>{pilotCallsign ?? "——"}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider text-slate-500">Pilot ID</div>
                <div className="text-xs font-mono text-slate-400">{maskedId}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className={`inline-flex items-center gap-1.5 rounded-lg border ${isGodCard ? "border-purple-800/30 bg-purple-950/20" : "border-emerald-800/30 bg-emerald-950/20"} px-3 py-1.5`}>
              <span className="text-xs">{isGodCard ? "⚡" : "✅"}</span>
              <span className={`text-[10px] ${isGodCard ? "text-purple-400" : "text-emerald-400"} font-semibold`}>{isGodCard ? "All Level & Area Restrictions Bypassed" : "Wealth Management Access Granted"}</span>
            </div>
          </div>
        </div>

        {/* Bottom glow strip */}
        <div className={`h-1 bg-gradient-to-r ${stripGradient}`} />
      </div>
    </div>
  );
}
