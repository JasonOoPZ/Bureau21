"use client";

import { useState } from "react";

type Tab = "vault" | "transfer" | "loan" | "bond" | "tokens";

const BOND_OPTIONS = [
  { days: 7,   rate: 1,     label: "7 Days",   tag: "Starter" },
  { days: 14,  rate: 2.25,  label: "14 Days",  tag: "Short" },
  { days: 30,  rate: 5,     label: "30 Days",  tag: "Standard" },
  { days: 45,  rate: 7.5,   label: "45 Days",  tag: "Extended" },
  { days: 60,  rate: 11,    label: "60 Days",  tag: "Premium" },
  { days: 90,  rate: 15,    label: "90 Days",  tag: "Elite" },
  { days: 180, rate: 20,    label: "180 Days", tag: "Veteran" },
  { days: 365, rate: 25,    label: "365 Days", tag: "Legendary" },
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

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
  const [bondDays, setBondDays] = useState(30);
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

  const tabs: { key: Tab; label: string; icon: string; color: string }[] = [
    { key: "vault",    label: "Vault",    icon: "🔒", color: "from-cyan-500/20 to-cyan-900/10 border-cyan-800/40" },
    { key: "transfer", label: "Transfer", icon: "⚡", color: "from-purple-500/20 to-purple-900/10 border-purple-800/40" },
    { key: "loan",     label: "Loans",    icon: "💳", color: "from-orange-500/20 to-orange-900/10 border-orange-800/40" },
    { key: "bond",     label: "Bonds",    icon: "📊", color: "from-emerald-500/20 to-emerald-900/10 border-emerald-800/40" },
    { key: "tokens",   label: "Tokens",   icon: "💎", color: "from-violet-500/20 to-violet-900/10 border-violet-800/40" },
  ];

  const bondMatures = bondMaturesAt ? new Date(bondMaturesAt) : null;
  const bondMature = bondMatures ? bondMatures <= new Date() : false;
  const selectedBondOpt = BOND_OPTIONS.find((b) => b.days === bondDays) ?? BOND_OPTIONS[2];
  const activeTab = tabs.find((t) => t.key === tab)!;

  return (
    <div className="space-y-4">
      {/* ── Hero Balance Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="relative overflow-hidden rounded-xl border border-amber-800/30 bg-gradient-to-br from-amber-950/40 via-[#0f0d08] to-[#0a0d11] p-4">
          <div className="absolute -top-3 -right-3 text-5xl opacity-10">💰</div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-amber-600/80 font-semibold">On Hand</div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-1">{credits.toLocaleString()}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">₡ credits</div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-cyan-800/30 bg-gradient-to-br from-cyan-950/40 via-[#080d0f] to-[#0a0d11] p-4">
          <div className="absolute -top-3 -right-3 text-5xl opacity-10">🏦</div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-cyan-600/80 font-semibold">In Vault</div>
          <div className="text-2xl font-black text-cyan-300 font-mono mt-1">{bank.toLocaleString()}</div>
          <div className="text-[10px] text-cyan-700 mt-0.5">₡ secured</div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-violet-800/30 bg-gradient-to-br from-violet-950/40 via-[#0d080f] to-[#0a0d11] p-4">
          <div className="absolute -top-3 -right-3 text-5xl opacity-10">💎</div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-violet-600/80 font-semibold">Tokens</div>
          <div className="text-2xl font-black text-violet-300 font-mono mt-1">{tokens}</div>
          <div className="text-[10px] text-violet-700 mt-0.5">B21 tokens</div>
        </div>
      </div>

      {/* Status banners */}
      {loanAmount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-2.5">
          <span className="text-lg">⚠️</span>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-red-500 font-semibold">Outstanding Debt</div>
            <div className="text-sm font-bold text-red-300">{loanAmount.toLocaleString()} ₡</div>
          </div>
        </div>
      )}
      {bondAmount > 0 && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 ${
          bondMature
            ? "border-green-500/60 bg-green-950/30 animate-pulse"
            : "border-emerald-900/40 bg-emerald-950/20"
        }`}>
          <span className="text-lg">{bondMature ? "🎉" : "📈"}</span>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wide text-emerald-500 font-semibold">
              {bondMature ? "Bond Matured!" : "Active Investment"}
            </div>
            <div className="text-sm font-bold text-emerald-300">
              {bondAmount.toLocaleString()} ₡ at {bondRate}%
              {!bondMature && bondMatures && (
                <span className="text-xs text-slate-500 font-normal ml-2">matures {bondMatures.toLocaleDateString()}</span>
              )}
            </div>
          </div>
          {bondMature && (
            <button onClick={() => api("collect_bond")} disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-xs disabled:opacity-30 transition whitespace-nowrap">
              Collect {Math.floor(bondAmount * (1 + bondRate / 100)).toLocaleString()} ₡
            </button>
          )}
        </div>
      )}

      {/* ── Tab Navigation ─────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-1.5">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setMsg(null); }}
            className={`relative rounded-xl border py-3 text-center transition-all duration-200 ${
              tab === t.key
                ? `bg-gradient-to-b ${t.color} border-opacity-100 scale-[1.02] shadow-lg`
                : "bg-[#0a0d11] border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/50"
            }`}>
            <div className="text-xl mb-0.5">{t.icon}</div>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${
              tab === t.key ? "text-slate-200" : "text-slate-500"
            }`}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Messages */}
      {msg && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs ${
          msg.ok
            ? "border-emerald-800 bg-emerald-950/20 text-emerald-300"
            : "border-red-900/40 bg-red-950/20 text-red-400"
        }`}>
          <span>{msg.ok ? "✅" : "❌"}</span>
          {msg.text}
        </div>
      )}

      {/* ── Tab Content ────────────────────────────────────────────── */}
      <div className={`rounded-xl border bg-gradient-to-b ${activeTab.color} p-5 space-y-4`}>

        {/* ── Vault ─────────────────────────────────────────────────── */}
        {tab === "vault" && (
          <>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🔒</span>
              <div>
                <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-wide">Secure Vault</h2>
                <p className="text-[11px] text-slate-400">Credits in the vault are safe from theft and death.</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {QUICK_AMOUNTS.map((q) => (
                <button key={q} onClick={() => setAmount(q)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    amount === q ? "bg-cyan-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                  }`}>
                  {q.toLocaleString()}
                </button>
              ))}
              <button onClick={() => setAmount(credits)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/60 text-amber-400 hover:bg-slate-700 transition">
                MAX
              </button>
            </div>
            <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              min={1} className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2.5 text-sm text-center font-mono text-slate-200" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => api("deposit")} disabled={loading || amount > credits}
                className="relative overflow-hidden group py-3 rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-cyan-900/20">
                <span className="relative z-10">⬇️ Deposit</span>
              </button>
              <button onClick={() => api("withdraw")} disabled={loading || amount > bank}
                className="py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-amber-900/20">
                ⬆️ Withdraw
              </button>
            </div>
          </>
        )}

        {/* ── Transfer ──────────────────────────────────────────────── */}
        {tab === "transfer" && (
          <>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">⚡</span>
              <div>
                <h2 className="text-sm font-bold text-purple-300 uppercase tracking-wide">Instant Transfer</h2>
                <p className="text-[11px] text-slate-400">Send credits to any pilot instantly. No fees.</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🎯</span>
                <input type="text" placeholder="Recipient callsign..." value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full rounded-lg bg-black/40 border border-slate-700/50 pl-9 pr-4 py-2.5 text-sm text-slate-200" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_AMOUNTS.map((q) => (
                  <button key={q} onClick={() => setAmount(q)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      amount === q ? "bg-purple-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                    }`}>
                    {q.toLocaleString()}
                  </button>
                ))}
              </div>
              <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                min={1} className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2.5 text-sm text-center font-mono text-slate-200" />
              <button onClick={() => api("transfer", { recipientCallsign: transferTo })}
                disabled={loading || amount > credits || !transferTo.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-purple-900/20">
                ⚡ Send {amount.toLocaleString()} ₡ to {transferTo || "..."}
              </button>
            </div>
          </>
        )}

        {/* ── Loan ──────────────────────────────────────────────────── */}
        {tab === "loan" && (
          <>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">💳</span>
              <div>
                <h2 className="text-sm font-bold text-orange-300 uppercase tracking-wide">Emergency Loans</h2>
                <p className="text-[11px] text-slate-400">Borrow up to 5% of your vault balance. 6.9% surcharge.</p>
              </div>
            </div>
            {loanAmount > 0 ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-red-950/30 border border-red-900/30 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-red-500 font-semibold">Amount Owed</div>
                  <div className="text-2xl font-black text-red-300 font-mono">{loanAmount.toLocaleString()} ₡</div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {QUICK_AMOUNTS.filter((q) => q <= loanAmount).map((q) => (
                    <button key={q} onClick={() => setAmount(q)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        amount === q ? "bg-red-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                      }`}>
                      {q.toLocaleString()}
                    </button>
                  ))}
                  <button onClick={() => setAmount(Math.min(loanAmount, credits))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/60 text-red-400 hover:bg-slate-700 transition">
                    PAY ALL
                  </button>
                </div>
                <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                  min={1} className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2.5 text-sm text-center font-mono text-slate-200" />
                <button onClick={() => api("repay_loan")} disabled={loading || amount > credits}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-red-900/20">
                  💳 Repay {Math.min(amount, loanAmount).toLocaleString()} ₡
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-slate-900/40 border border-slate-800/50 p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Available to borrow</span>
                    <span className="text-lg font-black text-orange-300 font-mono">
                      {Math.max(0, Math.floor(bank * 0.05)).toLocaleString()} ₡
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">5% of vault balance · 6.9% surcharge applied</div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {QUICK_AMOUNTS.filter((q) => q <= Math.floor(bank * 0.05)).map((q) => (
                    <button key={q} onClick={() => setAmount(q)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        amount === q ? "bg-orange-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                      }`}>
                      {q.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                  min={1} className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2.5 text-sm text-center font-mono text-slate-200" />
                <button onClick={() => api("take_loan")} disabled={loading || amount < 1 || bank < 20}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-700 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-orange-900/20">
                  💳 Borrow {amount.toLocaleString()} ₡
                  <span className="block text-[10px] opacity-70 font-normal">You will owe {Math.ceil(amount * 1.069).toLocaleString()} ₡</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Bond ──────────────────────────────────────────────────── */}
        {tab === "bond" && (
          <>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">📊</span>
              <div>
                <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-wide">Investment Bonds</h2>
                <p className="text-[11px] text-slate-400">Lock credits for guaranteed returns. Longer terms = higher yields.</p>
              </div>
            </div>
            {bondAmount > 0 && !bondMature ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/30 p-4 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-emerald-500 font-semibold">Invested</div>
                  <div className="text-2xl font-black text-emerald-300 font-mono">{bondAmount.toLocaleString()} ₡</div>
                  <div className="text-xs text-slate-400 mt-1">at {bondRate}% · matures {bondMatures?.toLocaleDateString()}</div>
                  <div className="text-xs text-emerald-400 mt-1 font-mono">
                    Payout: {Math.floor(bondAmount * (1 + bondRate / 100)).toLocaleString()} ₡
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 text-center">Cannot withdraw before maturity date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Bond rate cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BOND_OPTIONS.map((b) => (
                    <button key={b.days} onClick={() => setBondDays(b.days)}
                      className={`rounded-xl border p-2.5 text-center transition-all ${
                        bondDays === b.days
                          ? "border-emerald-500 bg-emerald-950/40 scale-[1.03] shadow-lg shadow-emerald-900/20"
                          : "border-slate-800/50 bg-black/30 hover:border-slate-700 hover:bg-slate-900/40"
                      }`}>
                      <div className={`text-lg font-black font-mono ${
                        bondDays === b.days ? "text-emerald-300" : "text-slate-400"
                      }`}>{b.rate}%</div>
                      <div className="text-[10px] text-slate-500">{b.label}</div>
                      <div className={`text-[8px] uppercase tracking-wider mt-0.5 font-bold ${
                        bondDays === b.days ? "text-emerald-500" : "text-slate-600"
                      }`}>{b.tag}</div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {QUICK_AMOUNTS.filter((q) => q >= 100 && q <= bank).map((q) => (
                    <button key={q} onClick={() => setAmount(q)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        amount === q ? "bg-emerald-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                      }`}>
                      {q.toLocaleString()}
                    </button>
                  ))}
                  {bank >= 100 && (
                    <button onClick={() => setAmount(bank)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/60 text-emerald-400 hover:bg-slate-700 transition">
                      ALL IN
                    </button>
                  )}
                </div>
                <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                  min={1} className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2.5 text-sm text-center font-mono text-slate-200" />

                <div className="rounded-lg bg-black/30 border border-slate-800/40 p-3 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-slate-500">Projected Return</div>
                    <div className="text-lg font-black text-emerald-300 font-mono">
                      +{Math.floor(amount * selectedBondOpt.rate / 100).toLocaleString()} ₡
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Total Payout</div>
                    <div className="text-lg font-bold text-slate-300 font-mono">
                      {Math.floor(amount * (1 + selectedBondOpt.rate / 100)).toLocaleString()} ₡
                    </div>
                  </div>
                </div>

                <button onClick={() => api("buy_bond", { bondDays })} disabled={loading || amount > bank || amount < 100}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-emerald-900/20">
                  📊 Invest {amount.toLocaleString()} ₡ for {selectedBondOpt.label}
                  <span className="block text-[10px] opacity-70 font-normal">Earn {selectedBondOpt.rate}% return</span>
                </button>
                <p className="text-[10px] text-slate-600 text-center">Minimum 100 ₡ · Funds from vault balance · Cannot withdraw early</p>
              </div>
            )}
          </>
        )}

        {/* ── Tokens ────────────────────────────────────────────────── */}
        {tab === "tokens" && (
          <>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">💎</span>
              <div>
                <h2 className="text-sm font-bold text-violet-300 uppercase tracking-wide">Token Exchange</h2>
                <p className="text-[11px] text-slate-400">Trade B21 tokens for credits and back.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-black/30 border border-slate-800/40 p-3 text-center">
                <div className="text-[10px] text-slate-500 uppercase">Buy Rate</div>
                <div className="text-lg font-bold text-violet-300 font-mono">{buyRate} ₡</div>
                <div className="text-[10px] text-slate-600">per token</div>
              </div>
              <div className="rounded-lg bg-black/30 border border-slate-800/40 p-3 text-center">
                <div className="text-[10px] text-slate-500 uppercase">Sell Rate</div>
                <div className="text-lg font-bold text-amber-300 font-mono">{sellRate} ₡</div>
                <div className="text-[10px] text-slate-600">per token</div>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[1, 5, 10, 25, 50].map((q) => (
                <button key={q} onClick={() => setAmount(q)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    amount === q ? "bg-violet-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                  }`}>
                  {q}
                </button>
              ))}
            </div>
            <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              min={1} className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2.5 text-sm text-center font-mono text-slate-200" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => api("buy_tokens")} disabled={loading || credits < amount * buyRate}
                className="py-3 rounded-xl bg-gradient-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-violet-900/20">
                💎 Buy {amount}
                <span className="block text-[10px] opacity-70 font-normal">Cost: {(amount * buyRate).toLocaleString()} ₡</span>
              </button>
              <button onClick={() => api("sell_tokens")} disabled={loading || tokens < amount}
                className="py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-amber-900/20">
                💰 Sell {amount}
                <span className="block text-[10px] opacity-70 font-normal">Get: {(amount * sellRate).toLocaleString()} ₡</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
