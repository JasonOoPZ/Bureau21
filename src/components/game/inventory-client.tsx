"use client";

import { useState } from "react";

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
};

const TIER_LABELS: Record<number, string> = {
  1: "MK I",
  2: "MK II",
  3: "MK III",
};

const TYPE_ICONS: Record<string, string> = {
  weapon: "⚔",
  shield: "🛡",
  engine: "⚙",
};

function BonusLabel({ bonusType, bonusAmt }: { bonusType: string; bonusAmt: number }) {
  const labels: Record<string, string> = {
    credits: `+${bonusAmt}% credits`,
    xp: `+${bonusAmt}% XP`,
    hull: `+${bonusAmt} hull`,
    fuel: `+${bonusAmt}% fuel eff.`,
  };
  return <span className="text-emerald-400 text-[10px]">{labels[bonusType] ?? bonusType}</span>;
}

export function InventoryClient({
  initialItems,
  slotMax,
}: {
  initialItems: InventoryItem[];
  slotMax: number;
}) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [filter, setFilter] = useState<"all" | "weapon" | "shield" | "engine">("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

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
        {(["all", "weapon", "shield", "engine"] as const).map((f) => (
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
                <BonusLabel bonusType={item.bonusType} bonusAmt={item.bonusAmt} />
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

                <div className="flex items-start gap-2 pr-12">
                  <span className="mt-0.5 text-lg">{TYPE_ICONS[item.type] ?? "?"}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold leading-tight">{item.name}</p>
                    <p className="text-[10px] capitalize text-slate-500">
                      {item.type} · {TIER_LABELS[item.tier] ?? `T${item.tier}`}
                    </p>
                    <BonusLabel bonusType={item.bonusType} bonusAmt={item.bonusAmt} />
                  </div>
                </div>

                <div className="mt-3 flex gap-1.5">
                  {item.equipped ? (
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
                  <button
                    onClick={() => handleDiscard(item)}
                    disabled={busy || item.equipped}
                    title={item.equipped ? "Unequip before discarding" : "Discard item"}
                    className="rounded border border-red-900/40 bg-red-950/20 px-2 py-1 text-[10px] text-red-500 hover:border-red-700 disabled:cursor-not-allowed disabled:opacity-30 transition"
                  >
                    ✕
                  </button>
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
    </div>
  );
}
