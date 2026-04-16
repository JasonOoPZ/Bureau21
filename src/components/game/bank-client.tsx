"use client";

import { useState } from "react";

type Tab = "vault" | "transfer" | "loan" | "bond" | "tokens";

const BOND_OPTIONS = [
  { days: 1, rate: 0.5, label: "1 Day — 0.5%" },
  { days: 3, rate: 2, label: "3 Days — 2%" },
  { days: 7, rate: 5, label: "7 Days — 5%" },
  { days: 14, rate: 8, label: "14 Days — 8%" },
  { days: 30, rate: 12, label: "30 Days — 12%" },
  { days: 60, rate: 15, label: "60 Days — 15%" },
  { days: 90, rate: 18, label: "90 Days — 18%" },
];

interface Props {
  initialCredits: number;
  initialCreditsBank: number;
  initialTokens: number;
  initialLoanAmount: number;
  initialLoanCreatedAt: string | null;
  initialBondAmount: number;
  initialBondRate: number;
  initialBondMaturesAt: string | null;
  buyRate: number;
  sellRate: number;
}

export function BankClient({
  initialCredits, initialCreditsBank, initialTokens,
  initialLoanAmount, initialLoanCreatedAt,
  initialBondAmount, initialBondRate, initialBondMaturesAt,
  buyRate, sellRate,
}: Props) {
  const [tab, setTab] = useState<Tab>("vault");
  const [credits, setCredits] = useState(initialCredits);
  const [bank, setBank] = useState(initialCreditsBank);
  const [tokens, setTokens] = useState(initialTokens);
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
  const [bondAmount, setBondAmount] = useState(initialBondAmount);
  const [bondRate, setBondRateState] = useState(initialBondRate);
  const [bondMaturesAt, setBondMaturesAt] = useState(initialBondMaturesAt);
  const [amount, setAmount] = useState(100);
  const [transferTo, setTransferTo] = useState("");
  const [bondDays, setBondDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const api = async (action: string, extra: Record<string, unknown> = {}) => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/game/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ text: data.error, ok: false }); return null; }
      setMsg({ text: data.message, ok: true });
      if (data.credits != null) setCredits(data.credits);
      if (data.creditsBank != null) setBank(data.creditsBank);
      if (data.tokens != null) setTokens(data.tokens);
      if (data.loanAmount != null) setLoanAmount(data.loanAmount);
      if (data.bondAmount != null) setBondAmount(data.bondAmount);
      if (data.bondRate != null) setBondRateState(data.bondRate);
      if (data.bondMaturesAt !== undefined) setBondMaturesAt(data.bondMaturesAt);
      return data;
    } catch {
      setMsg({ text: "Connection error.", ok: false });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "vault", label: "Vault", icon: "🏦" },
    { key: "transfer", label: "Transfer", icon: "💸" },
    { key: "loan", label: "Loan", icon: "📝" },
    { key: "bond", label: "Bond", icon: "📈" },
    { key: "tokens", label: "Tokens", icon: "🪙" },
  ];

  const bondMatures = bondMaturesAt ? new Date(bondMaturesAt) : null;
  const bondMature = bondMatures ? bondMatures <= new Date() : false;
  const selectedBondOpt = BOND_OPTIONS.find((b) => b.days === bondDays) ?? BOND_OPTIONS[2];

  return (
    <div className="space-y-3">
      {/* Balances Bar */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-amber-600">On Hand</div>
            <div className="text-xl font-bold text-amber-300 font-mono">{credits.toLocaleString()} ₡</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-cyan-600">In Bank</div>
            <div className="text-xl font-bold text-cyan-300 font-mono">{bank.toLocaleString()} ₡</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-purple-500">Tokens</div>
            <div className="text-xl font-bold text-purple-300 font-mono">{tokens}</div>
          </div>
        </div>
        {loanAmount > 0 && (
          <div className="mt-2 text-xs text-red-400 text-center">
            Outstanding loan: <span className="font-bold">{loanAmount.toLocaleString()} ₡</span>
          </div>
        )}
        {bondAmount > 0 && (
          <div className="mt-1 text-xs text-green-400 text-center">
            Bond: <span className="font-bold">{bondAmount.toLocaleString()} ₡</span> at {bondRate}%
            {bondMature ? " — MATURED! Collect below." : bondMatures ? ` — matures ${bondMatures.toLocaleDateString()}` : ""}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-md border border-slate-800 bg-[#0a0d11] p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setMsg(null); }}
            className={`flex-1 rounded py-2 text-xs font-bold transition ${tab === t.key ? "bg-amber-900/40 text-amber-300" : "text-slate-500 hover:text-slate-300"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {msg && (
        <div className={`rounded-md border px-3 py-2 text-xs ${msg.ok ? "border-emerald-800 bg-emerald-950/20 text-emerald-300" : "border-red-900/40 bg-red-950/20 text-red-400"}`}>
          {msg.text}
        </div>
      )}

      {/* Tab Content */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 space-y-3">
        {/* ── Vault ─────────────────────────────────────────────────── */}
        {tab === "vault" && (
          <>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Deposit & Withdraw</p>
            <p className="text-xs text-slate-500">Credits in the bank are safe from theft and death. Move them freely.</p>
            <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              min={1} className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-center" />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => api("deposit")} disabled={loading || amount > credits}
                className="py-2 rounded bg-cyan-800 hover:bg-cyan-700 text-white font-bold text-sm disabled:opacity-30 transition">
                Deposit {amount.toLocaleString()} ₡
              </button>
              <button onClick={() => api("withdraw")} disabled={loading || amount > bank}
                className="py-2 rounded bg-amber-800 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-30 transition">
                Withdraw {amount.toLocaleString()} ₡
              </button>
            </div>
          </>
        )}

        {/* ── Transfer ──────────────────────────────────────────────── */}
        {tab === "transfer" && (
          <>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Transfer Credits</p>
            <p className="text-xs text-slate-500">Send credits from your hand to another pilot. Enter their callsign.</p>
            <input type="text" placeholder="Recipient callsign" value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm" />
            <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              min={1} className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-center" />
            <button onClick={() => api("transfer", { recipientCallsign: transferTo })}
              disabled={loading || amount > credits || !transferTo.trim()}
              className="w-full py-2 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm disabled:opacity-30 transition">
              Send {amount.toLocaleString()} ₡ to {transferTo || "..."}
            </button>
          </>
        )}

        {/* ── Loan ──────────────────────────────────────────────────── */}
        {tab === "loan" && (
          <>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Emergency Loan</p>
            {loanAmount > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-red-400">
                  You owe <span className="font-bold">{loanAmount.toLocaleString()} ₡</span>. Pay it off before taking a new loan.
                </p>
                <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                  min={1} className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-center" />
                <button onClick={() => api("repay_loan")} disabled={loading || amount > credits}
                  className="w-full py-2 rounded bg-red-700 hover:bg-red-600 text-white font-bold text-sm disabled:opacity-30 transition">
                  Repay {Math.min(amount, loanAmount).toLocaleString()} ₡
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Borrow up to <span className="font-bold text-slate-300">{Math.max(0, Math.floor(bank * 0.05)).toLocaleString()} ₡</span> (5% of bank balance). 6.9% surcharge applied instantly.
                </p>
                <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                  min={1} className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-center" />
                <button onClick={() => api("take_loan")} disabled={loading || amount < 1 || bank < 20}
                  className="w-full py-2 rounded bg-orange-700 hover:bg-orange-600 text-white font-bold text-sm disabled:opacity-30 transition">
                  Borrow {amount.toLocaleString()} ₡ (owe {Math.ceil(amount * 1.069).toLocaleString()} ₡)
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Bond ──────────────────────────────────────────────────── */}
        {tab === "bond" && (
          <>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Investment Bond</p>
            {bondAmount > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-green-400">
                  Active bond: <span className="font-bold">{bondAmount.toLocaleString()} ₡</span> at {bondRate}%
                </p>
                {bondMature ? (
                  <button onClick={() => api("collect_bond")} disabled={loading}
                    className="w-full py-2 rounded bg-green-700 hover:bg-green-600 text-white font-bold text-sm disabled:opacity-30 transition">
                    Collect Bond ({Math.floor(bondAmount * (1 + bondRate / 100)).toLocaleString()} ₡)
                  </button>
                ) : (
                  <p className="text-xs text-slate-500">
                    Matures {bondMatures?.toLocaleDateString()}. Cannot withdraw early.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Lock credits from your bank into a time-locked bond. Longer = higher return.
                </p>
                <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                  min={1} className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-center" />
                <select value={bondDays} onChange={(e) => setBondDays(Number(e.target.value))}
                  className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm">
                  {BOND_OPTIONS.map((b) => (
                    <option key={b.days} value={b.days}>{b.label}</option>
                  ))}
                </select>
                <button onClick={() => api("buy_bond", { bondDays })} disabled={loading || amount > bank || amount < 100}
                  className="w-full py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm disabled:opacity-30 transition">
                  Invest {amount.toLocaleString()} ₡ — earn {Math.floor(amount * selectedBondOpt.rate / 100).toLocaleString()} ₡
                </button>
                <p className="text-[10px] text-slate-600">Minimum investment: 100 ₡. Funds come from your bank balance.</p>
              </div>
            )}
          </>
        )}

        {/* ── Tokens ────────────────────────────────────────────────── */}
        {tab === "tokens" && (
          <>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Token Exchange</p>
            <div className="text-xs text-slate-500 space-y-0.5 mb-2">
              <div>Buy: {buyRate} credits/token | Sell: {sellRate} credits/token</div>
            </div>
            <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              min={1} className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-center" />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => api("buy_tokens")} disabled={loading || credits < amount * buyRate}
                className="py-2 rounded bg-purple-800 hover:bg-purple-700 text-white font-bold text-sm disabled:opacity-30 transition">
                Buy {amount} Tokens<br /><span className="text-xs opacity-70">({(amount * buyRate).toLocaleString()} ₡)</span>
              </button>
              <button onClick={() => api("sell_tokens")} disabled={loading || tokens < amount}
                className="py-2 rounded bg-amber-800 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-30 transition">
                Sell {amount} Tokens<br /><span className="text-xs opacity-70">(+{(amount * sellRate).toLocaleString()} ₡)</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
