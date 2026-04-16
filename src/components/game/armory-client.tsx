"use client";

import { useState } from "react";

interface CatalogItem {
  name: string;
  type: string;
  tier: number;
  bonusType: string;
  bonusAmt: number;
  price: number;
}

const TYPE_ICONS: Record<string, string> = { weapon: "⚔", shield: "🛡", engine: "⚡", armor: "🛡" };
const TIER_LABELS: Record<number, string> = { 1: "Common", 2: "Rare", 3: "Legendary" };
const TIER_COLORS: Record<number, string> = {
  1: "text-slate-300 border-slate-700",
  2: "text-cyan-300 border-cyan-900",
  3: "text-amber-300 border-amber-900",
};
const BONUS_LABELS: Record<string, string> = {
  credits: "Credit gains",
  xp: "XP gains",
  hull: "Hull protection",
  fuel: "Fuel efficiency",
};

interface Props {
  catalog: CatalogItem[];
  initialCredits: number;
  inventoryCount: number;
}

export function ArmoryClient({ catalog, initialCredits, inventoryCount }: Props) {
  const [credits, setCredits] = useState(initialCredits);
  const [invCount, setInvCount] = useState(inventoryCount);
  const [loading, setLoading] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("all");

  async function buy(item: CatalogItem) {
    if (loading) return;
    setLoading(item.name);
    setMessages((m) => ({ ...m, [item.name]: "" }));
    setErrors((e) => ({ ...e, [item.name]: "" }));

    try {
      const res = await fetch("/api/game/armory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: item.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors((e) => ({ ...e, [item.name]: data.error ?? "Purchase failed." }));
        return;
      }
      setMessages((m) => ({ ...m, [item.name]: "Purchased!" }));
      setCredits((c) => c - item.price);
      setInvCount((c) => c + 1);
    } catch {
      setErrors((e) => ({ ...e, [item.name]: "Connection error." }));
    } finally {
      setLoading(null);
    }
  }

  const filtered = filter === "all" ? catalog : catalog.filter((i) => i.type === filter);

  return (
    <div className="space-y-3">
      {/* Balance bar */}
      <div className="flex items-center justify-between rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2">
        <span className="text-[11px] text-slate-400">
          Inventory: <span className={invCount >= 20 ? "text-red-400" : "text-slate-200"}>{invCount}/20</span>
        </span>
        <span className="text-[13px] font-bold text-amber-300">{credits.toLocaleString()} Cr</span>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "weapon", "shield", "engine"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded border px-3 py-1 text-[11px] transition ${
              filter === f
                ? "border-cyan-700 bg-cyan-950/40 text-cyan-300"
                : "border-slate-800 bg-slate-900/40 text-slate-500 hover:text-slate-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Catalog grid */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const canAfford = credits >= item.price;
          const full = invCount >= 20;
          const isLoading = loading === item.name;

          return (
            <div
              key={item.name}
              className={`rounded-md border bg-[#0a0d11] p-3 ${TIER_COLORS[item.tier]?.split(" ")[1] ?? "border-slate-800"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-[12px] font-semibold ${TIER_COLORS[item.tier]?.split(" ")[0] ?? "text-slate-300"}`}>
                    {TYPE_ICONS[item.type]} {item.name}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                    {TIER_LABELS[item.tier]} {item.type}
                  </p>
                </div>
                <span className={`shrink-0 text-[12px] font-bold ${canAfford ? "text-amber-300" : "text-slate-600"}`}>
                  {item.price} Cr
                </span>
              </div>

              <p className="mt-2 text-[11px] text-slate-400">
                {BONUS_LABELS[item.bonusType]} +{item.bonusAmt}
                {item.bonusType === "hull" ? " flat" : "%"}
              </p>

              {messages[item.name] && (
                <p className="mt-1 text-[10px] text-emerald-400">{messages[item.name]}</p>
              )}
              {errors[item.name] && (
                <p className="mt-1 text-[10px] text-red-400">{errors[item.name]}</p>
              )}

              <button
                onClick={() => buy(item)}
                disabled={!canAfford || full || !!loading}
                className="mt-2 w-full rounded border border-cyan-900 bg-cyan-950/30 py-1.5 text-[11px] font-medium text-cyan-300 transition hover:bg-cyan-950/60 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isLoading ? "Buying..." : full ? "Inv Full" : !canAfford ? "Can't Afford" : "Purchase"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
