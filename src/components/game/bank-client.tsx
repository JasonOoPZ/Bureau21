"use client";

import { useState } from "react";

interface Props {
  initialCredits: number;
  initialTokens: number;
  buyRate: number;
  sellRate: number;
  tokensPerDay: number;
}

export function BankClient({
  initialCredits,
  initialTokens,
  buyRate,
  sellRate,
  tokensPerDay,
}: Props) {
  const [credits, setCredits] = useState(initialCredits);
  const [tokens, setTokens] = useState(initialTokens);
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function doExchange(action: "buy_tokens" | "sell_tokens") {
    if (loading || amount < 1) return;
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/game/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Transaction failed.");
        return;
      }
      setMessage(data.message);
      setCredits(data.credits);
      setTokens(data.tokens);
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  }

  const buyCost = amount * buyRate;
  const sellGain = amount * sellRate;
  const canBuy = credits >= buyCost;
  const canSell = tokens >= amount;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* Balances */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">
          Balances
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded border border-amber-900/40 bg-amber-950/20 px-3 py-3">
            <span className="text-[11px] uppercase tracking-wide text-amber-600">Credits</span>
            <span className="text-2xl font-bold text-amber-300">{credits.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between rounded border border-purple-900/40 bg-purple-950/20 px-3 py-3">
            <span className="text-[11px] uppercase tracking-wide text-purple-500">Tokens</span>
            <span className="text-2xl font-bold text-purple-300">{tokens}</span>
          </div>
        </div>

        <div className="mt-3 space-y-1 border-t border-slate-800 pt-3 text-[11px] text-slate-500">
          <div className="flex justify-between">
            <span>Buy rate</span>
            <span className="text-slate-300">{buyRate} credits / token</span>
          </div>
          <div className="flex justify-between">
            <span>Sell rate</span>
            <span className="text-slate-300">{sellRate} credits / token</span>
          </div>
          <div className="flex justify-between">
            <span>Daily tokens</span>
            <span className="text-slate-300">{tokensPerDay} / day</span>
          </div>
        </div>
      </div>

      {/* Exchange */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">
          Token Exchange
        </p>

        {message && (
          <p className="mb-3 rounded border border-emerald-800 bg-emerald-950/20 px-3 py-2 text-[12px] text-emerald-300">
            {message}
          </p>
        )}
        {error && (
          <p className="mb-3 rounded border border-red-900/40 bg-red-950/20 px-3 py-2 text-[12px] text-red-400">
            {error}
          </p>
        )}

        <div className="mb-3">
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
            Amount
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-600 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => doExchange("buy_tokens")}
            disabled={!canBuy || loading}
            className="rounded border border-purple-800 bg-purple-950/30 px-3 py-2 text-[12px] font-medium text-purple-300 transition hover:bg-purple-950/60 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span className="block">Buy {amount} Tokens</span>
            <span className={`text-[10px] ${canBuy ? "text-amber-400" : "text-red-500"}`}>
              Cost: {buyCost} credits
            </span>
          </button>

          <button
            onClick={() => doExchange("sell_tokens")}
            disabled={!canSell || loading}
            className="rounded border border-amber-800 bg-amber-950/30 px-3 py-2 text-[12px] font-medium text-amber-300 transition hover:bg-amber-950/60 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span className="block">Sell {amount} Tokens</span>
            <span className={`text-[10px] ${canSell ? "text-emerald-400" : "text-red-500"}`}>
              Gain: {sellGain} credits
            </span>
          </button>
        </div>

        <p className="mt-3 text-[10px] text-slate-600">
          Note: Tokens are premium currency. Buy low, sell high — the exchange spread funds the network.
        </p>
      </div>
    </div>
  );
}
