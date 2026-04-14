"use client";

import { useState } from "react";

interface InventoryItem {
  id: string;
  name: string;
  type: string;
  tier: number;
  bonusType: string;
  bonusAmt: number;
}

interface Props { credits: number; items: InventoryItem[]; }

export function PawnShopClient({ credits: initCredits, items: initItems }: Props) {
  const [credits, setCredits] = useState(initCredits);
  const [items, setItems] = useState(initItems);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const tierValues: Record<number, number> = { 1: 50, 2: 200, 3: 750 };
  const tierLabel: Record<number, string> = { 1: "Common", 2: "Rare", 3: "Legendary" };
  const tierColor: Record<number, string> = { 1: "text-slate-300", 2: "text-purple-300", 3: "text-amber-300" };

  const sell = async (itemId: string) => {
    setLoading(itemId);
    setMessage(null);
    try {
      const res = await fetch("/api/game/pawn-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error); return; }
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setCredits(data.credits);
      setMessage(`Sold ${data.sold} for ${data.creditsGained} credits.`);
    } catch { setMessage("Network error."); }
    finally { setLoading(null); }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] text-slate-400">
          The Pawn Shop buys your unwanted, unequipped gear for quick credits.
          No questions asked, no returns. Prices are non-negotiable.
        </p>
        <p className="mt-2 text-[11px] text-slate-300">
          Credits: <span className="font-bold text-amber-300">{credits.toLocaleString()}</span>
        </p>
      </div>

      {message && (
        <div className="rounded-md border border-cyan-900/40 bg-cyan-950/20 px-4 py-2 text-[11px] text-cyan-300">
          {message}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 text-[12px] text-slate-500">
          No unequipped items to sell. Acquire gear from the Salvage Yard, Fabrication, or combat.
        </div>
      ) : (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11]">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2 text-right">Value</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                  <td className="px-3 py-1.5">
                    <span className={`font-semibold ${tierColor[item.tier]}`}>{item.name}</span>
                    <span className="ml-1 text-[10px] text-slate-500">({tierLabel[item.tier]})</span>
                  </td>
                  <td className="px-3 py-1.5 capitalize text-slate-400">{item.type}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-amber-300">{tierValues[item.tier] ?? 50} cr</td>
                  <td className="px-3 py-1.5 text-right">
                    <button
                      onClick={() => sell(item.id)}
                      disabled={loading === item.id}
                      className="rounded border border-red-800 bg-red-950/30 px-2 py-0.5 text-[10px] text-red-300 transition hover:bg-red-900/30 disabled:opacity-50"
                    >
                      {loading === item.id ? "..." : "Sell"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
