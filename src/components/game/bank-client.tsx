"use client";

import { useState } from "react";

type Tab = "vault" | "transfer" | "loan" | "bond" | "wealth";

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

const QUICK_AMOUNTS = [5000, 25000, 50000, 250000, 500000];

const WEALTH_OPTIONS = [
  { days: 7,   rate: 5,   label: "7 Days",   tag: "Treasury Notes",       desc: "Government-backed short-term securities" },
  { days: 14,  rate: 10,  label: "14 Days",  tag: "Municipal Bonds",      desc: "Infrastructure & municipal development" },
  { days: 30,  rate: 18,  label: "30 Days",  tag: "Blue-Chip Real Estate", desc: "Prime commercial property fund" },
  { days: 45,  rate: 28,  label: "45 Days",  tag: "Private Credit",       desc: "Direct lending to enterprise borrowers" },
  { days: 60,  rate: 38,  label: "60 Days",  tag: "Hedge Fund LP",        desc: "Multi-strategy absolute return fund" },
  { days: 90,  rate: 50,  label: "90 Days",  tag: "Private Equity",       desc: "Leveraged buyout & growth equity" },
  { days: 180, rate: 65,  label: "180 Days", tag: "Venture Capital",      desc: "Early-stage tech & biotech portfolio" },
  { days: 365, rate: 90,  label: "365 Days", tag: "Sovereign Wealth Fund", desc: "Diversified sovereign-grade portfolio" },
];

const WEALTH_QUICK_AMOUNTS = [500, 1000, 5000, 25000, 100000, 500000];

interface WealthInvestmentData {
  id: string;
  name: string;
  amount: number;
  rate: number;
  days: number;
  createdAt: string;
  maturesAt: string;
  lastClaimedAt: string;
}

interface Props {
  initialCredits: number;
  initialCreditsBank: number;
  initialTokens: number;
  initialLoanAmount: number;
  initialLoanCreatedAt: string | null;
  initialBondAmount: number;
  initialBondRate: number;
  initialBondDays: number;
  initialBondMaturesAt: string | null;
  initialBondCreatedAt: string | null;
  initialBondLastClaimedAt: string | null;
  buyRate: number;
  sellRate: number;
  initialBankTreasury: number;
  hasVentureCard: boolean;
  initialWealthInvestments: WealthInvestmentData[];
}

export function BankClient({
  initialCredits, initialCreditsBank, initialTokens,
  initialLoanAmount, initialLoanCreatedAt,
  initialBondAmount, initialBondRate, initialBondDays,
  initialBondMaturesAt, initialBondCreatedAt, initialBondLastClaimedAt,
  buyRate, sellRate, initialBankTreasury, hasVentureCard,
  initialWealthInvestments,
}: Props) {
  const [tab, setTab] = useState<Tab>("vault");
  const [credits, setCredits] = useState(initialCredits);
  const [bank, setBank] = useState(initialCreditsBank);
  const [tokens, setTokens] = useState(initialTokens);
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
  const [bondAmount, setBondAmount] = useState(initialBondAmount);
  const [bondRate, setBondRateState] = useState(initialBondRate);
  const [activeBondDays, setActiveBondDays] = useState(initialBondDays);
  const [bondMaturesAt, setBondMaturesAt] = useState(initialBondMaturesAt);
  const [bondCreatedAt, setBondCreatedAt] = useState(initialBondCreatedAt);
  const [bondLastClaimedAt, setBondLastClaimedAt] = useState(initialBondLastClaimedAt);
  const [amount, setAmount] = useState(100);
  const [transferTo, setTransferTo] = useState("");
  const [bondDays, setBondDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [bankTreasury, setBankTreasury] = useState(initialBankTreasury);
  const [wealthInvestments, setWealthInvestments] = useState<WealthInvestmentData[]>(initialWealthInvestments);
  const [wealthDays, setWealthDays] = useState(30);
  const [wealthAmount, setWealthAmount] = useState(500);

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
      if (data.bondDays != null) setActiveBondDays(data.bondDays);
      if (data.bondMaturesAt !== undefined) setBondMaturesAt(data.bondMaturesAt);
      if (data.bondCreatedAt !== undefined) setBondCreatedAt(data.bondCreatedAt);
      if (data.bondLastClaimedAt !== undefined) setBondLastClaimedAt(data.bondLastClaimedAt);
      if (data.fee != null) setBankTreasury((prev) => prev + data.fee);
      return data;
    } catch {
      setMsg({ text: "Connection error.", ok: false });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const wealthApi = async (action: string, extra: Record<string, unknown> = {}) => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/game/wealth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount: wealthAmount, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ text: data.error, ok: false }); return null; }
      setMsg({ text: data.message, ok: true });
      if (data.credits != null) setCredits(data.credits);
      if (data.creditsBank != null) setBank(data.creditsBank);
      if (data.tokens != null) setTokens(data.tokens);
      if (data.investments) setWealthInvestments(data.investments);
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
    ...(hasVentureCard ? [{ key: "wealth" as Tab, label: "Wealth", icon: "👑", color: "from-yellow-500/20 to-yellow-900/10 border-yellow-800/40" }] : []),
  ];

  const bondMatures = bondMaturesAt ? new Date(bondMaturesAt) : null;
  const bondMature = bondMatures ? bondMatures <= new Date() : false;
  const selectedBondOpt = BOND_OPTIONS.find((b) => b.days === bondDays) ?? BOND_OPTIONS[2];

  // Calculate accrued yield for active bond
  const bondCreatedDate = bondCreatedAt ? new Date(bondCreatedAt) : null;
  const bondLastClaimedDate = bondLastClaimedAt ? new Date(bondLastClaimedAt) : null;
  const now = new Date();
  let accruedYield = 0;
  let accruedDays = 0;
  if (bondAmount > 0 && activeBondDays > 0 && bondCreatedDate && bondLastClaimedDate) {
    const dailyRate = bondRate / activeBondDays;
    const totalDaysPassed = Math.min(Math.floor((now.getTime() - bondCreatedDate.getTime()) / 86400000), activeBondDays);
    const daysAlreadyClaimed = Math.floor((bondLastClaimedDate.getTime() - bondCreatedDate.getTime()) / 86400000);
    accruedDays = Math.max(0, totalDaysPassed - daysAlreadyClaimed);
    accruedYield = Math.floor(bondAmount * (dailyRate / 100) * accruedDays);
  }

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
          <div className="absolute -top-3 -right-3 text-5xl opacity-10">🪙</div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-violet-600/80 font-semibold">Sovereigns</div>
          <div className="text-2xl font-black text-violet-300 font-mono mt-1">{tokens.toLocaleString()}</div>
          <div className="text-[10px] text-violet-700 mt-0.5">SVN</div>
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
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🔒</span>
              <div>
                <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-wide">Secure Vault</h2>
                <p className="text-[11px] text-slate-400">Credits in the vault are safe from theft and death.</p>
              </div>
            </div>

            {/* Deposit section */}
            <div className="rounded-lg bg-cyan-950/20 border border-cyan-900/30 p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">⬇️</span>
                <span className="text-[10px] uppercase tracking-widest text-cyan-500 font-bold">Deposit to Vault</span>
                <span className="text-[10px] text-emerald-500 ml-auto">No fees</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_AMOUNTS.map((q) => (
                  <button key={q} onClick={() => setAmount(q)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      amount === q ? "bg-cyan-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                    }`}>
                    {q.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[10, 25, 50, 75, 100].map((pct) => (
                  <button key={pct} onClick={() => setAmount(Math.max(1, Math.floor(credits * pct / 100)))}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-900/30 text-cyan-400 hover:bg-cyan-800/40 transition">
                    {pct}%
                  </button>
                ))}
              </div>
              <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                min={1} className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2 text-sm text-center font-mono text-slate-200" />
              <button onClick={() => api("deposit")} disabled={loading || amount > credits || amount < 1}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-cyan-900/20">
                ⬇️ Deposit {amount.toLocaleString()} ₡
              </button>
            </div>

            {/* Withdraw section */}
            <div className="rounded-lg bg-amber-950/20 border border-amber-900/30 p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">⬆️</span>
                <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Withdraw to Pocket</span>
                <span className="text-[10px] text-red-400 ml-auto">2.5% fee</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_AMOUNTS.map((q) => (
                  <button key={q} onClick={() => setAmount(q)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      amount === q ? "bg-amber-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                    }`}>
                    {q.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[10, 25, 50, 75, 100].map((pct) => (
                  <button key={pct} onClick={() => setAmount(Math.max(1, Math.floor(bank * pct / 100)))}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-900/30 text-amber-400 hover:bg-amber-800/40 transition">
                    {pct}%
                  </button>
                ))}
              </div>
              <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                min={1} className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2 text-sm text-center font-mono text-slate-200" />
              {amount > 0 && (
                <div className="rounded-lg bg-black/30 border border-slate-800/40 p-2.5 flex justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Fee: </span>
                    <span className="text-red-400 font-mono font-bold">{Math.ceil(amount * 0.025).toLocaleString()} ₡</span>
                  </div>
                  <div>
                    <span className="text-slate-500">You receive: </span>
                    <span className="text-amber-300 font-mono font-bold">{(amount - Math.ceil(amount * 0.025)).toLocaleString()} ₡</span>
                  </div>
                </div>
              )}
              <button onClick={() => api("withdraw")} disabled={loading || amount > bank || amount < 1}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-amber-900/20">
                ⬆️ Withdraw {amount.toLocaleString()} ₡
              </button>
            </div>

            {/* Bank treasury */}
            <div className="rounded-lg bg-slate-900/30 border border-slate-800/30 p-3 flex items-center gap-3">
              <span className="text-xl">🏛️</span>
              <div className="flex-1">
                <div className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-semibold">Bureau Bank Treasury</div>
                <div className="text-[10px] text-slate-400">Accumulated from all pilot withdrawal fees</div>
              </div>
              <div className="text-lg font-black text-amber-400 font-mono">{bankTreasury.toLocaleString()} ₡</div>
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
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📊</span>
              <div>
                <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-wide">Investment Bonds</h2>
                <p className="text-[11px] text-slate-400">Lock credits for daily yield. Claim anytime. 1 active bond per pilot.</p>
              </div>
            </div>

            {bondAmount > 0 ? (
              <div className="space-y-3">
                {/* Active bond status */}
                <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/30 p-4 space-y-3">
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-wide text-emerald-500 font-semibold">Active Bond</div>
                    <div className="text-2xl font-black text-emerald-300 font-mono">{bondAmount.toLocaleString()} ₡</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {bondRate}% over {activeBondDays} days · {(bondRate / activeBondDays).toFixed(4)}%/day
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-black/30 border border-slate-800/30 p-2.5 text-center">
                      <div className="text-[9px] uppercase tracking-wider text-slate-500">Status</div>
                      <div className={`text-sm font-bold ${bondMature ? "text-amber-400" : "text-emerald-400"}`}>
                        {bondMature ? "🎉 Matured" : "⏳ Active"}
                      </div>
                    </div>
                    <div className="rounded-lg bg-black/30 border border-slate-800/30 p-2.5 text-center">
                      <div className="text-[9px] uppercase tracking-wider text-slate-500">Matures</div>
                      <div className="text-sm font-bold text-slate-300">
                        {bondMatures?.toLocaleDateString() ?? "—"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-black/30 border border-slate-800/30 p-2.5 text-center">
                      <div className="text-[9px] uppercase tracking-wider text-slate-500">Total Yield</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        +{Math.floor(bondAmount * bondRate / 100).toLocaleString()} ₡
                      </div>
                    </div>
                    <div className="rounded-lg bg-black/30 border border-slate-800/30 p-2.5 text-center">
                      <div className="text-[9px] uppercase tracking-wider text-slate-500">Daily Yield</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        +{Math.floor(bondAmount * (bondRate / activeBondDays) / 100).toLocaleString()} ₡
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claim yield section */}
                {!bondMature && (
                  <div className="rounded-lg bg-cyan-950/20 border border-cyan-900/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-cyan-500 font-bold">Accrued Yield</div>
                        <div className="text-[10px] text-slate-400">{accruedDays} day{accruedDays !== 1 ? "s" : ""} unclaimed</div>
                      </div>
                      <div className="text-xl font-black text-cyan-300 font-mono">
                        {accruedYield > 0 ? `+${accruedYield.toLocaleString()} ₡` : "0 ₡"}
                      </div>
                    </div>
                    <button onClick={() => api("claim_yield")} disabled={loading || accruedDays < 1}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-cyan-900/20">
                      💰 Claim {accruedYield > 0 ? `${accruedYield.toLocaleString()} ₡` : "Yield"}
                    </button>
                    <p className="text-[10px] text-slate-600 text-center">Yield accrues daily. Claim as often as you like.</p>
                  </div>
                )}

                {/* Collect matured bond */}
                {bondMature && (
                  <div className="rounded-lg bg-amber-950/20 border border-amber-900/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Bond Matured</div>
                        <div className="text-[10px] text-slate-400">Collect principal + unclaimed yield</div>
                      </div>
                      <div className="text-xl font-black text-amber-300 font-mono">
                        {(bondAmount + accruedYield).toLocaleString()} ₡
                      </div>
                    </div>
                    <button onClick={() => api("collect_bond")} disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-amber-900/20">
                      🎉 Collect Bond Payout
                    </button>
                  </div>
                )}
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
                      <div className={`text-[9px] text-slate-600 font-mono`}>
                        {(b.rate / b.days).toFixed(3)}%/day
                      </div>
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

                <div className="rounded-lg bg-black/30 border border-slate-800/40 p-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500">Daily Yield</div>
                    <div className="text-sm font-black text-emerald-400 font-mono">
                      +{Math.floor(amount * selectedBondOpt.rate / selectedBondOpt.days / 100).toLocaleString()} ₡
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Total Return</div>
                    <div className="text-sm font-black text-emerald-300 font-mono">
                      +{Math.floor(amount * selectedBondOpt.rate / 100).toLocaleString()} ₡
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Payout</div>
                    <div className="text-sm font-bold text-slate-300 font-mono">
                      {Math.floor(amount * (1 + selectedBondOpt.rate / 100)).toLocaleString()} ₡
                    </div>
                  </div>
                </div>

                <button onClick={() => api("buy_bond", { bondDays })} disabled={loading || amount > bank || amount < 100}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-emerald-900/20">
                  📊 Invest {amount.toLocaleString()} ₡ for {selectedBondOpt.label}
                  <span className="block text-[10px] opacity-70 font-normal">{selectedBondOpt.rate}% total · {(selectedBondOpt.rate / selectedBondOpt.days).toFixed(3)}%/day · Claim daily</span>
                </button>
                <p className="text-[10px] text-slate-600 text-center">Minimum 100 ₡ · Funds from vault · 1 bond per pilot · Claim yield daily</p>
              </div>
            )}
          </>
        )}

        {/* ── Wealth Management ─────────────────────────────────────── */}
        {tab === "wealth" && (() => {
          const selectedWealthOpt = WEALTH_OPTIONS.find((w) => w.days === wealthDays) ?? WEALTH_OPTIONS[2];
          return (
          <>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">👑</span>
              <div>
                <h2 className="text-sm font-bold text-yellow-300 uppercase tracking-wide">Wealth Management</h2>
                <p className="text-[11px] text-slate-400">Private UHNWI investment desk · Sovereign-denominated · Up to 5 concurrent positions.</p>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-950/10 border border-yellow-800/20 p-3 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">💳</span>
                <span className="text-[10px] uppercase tracking-widest text-yellow-600 font-bold">Centurion Venture Card Holder</span>
              </div>
              <p className="text-[10px] text-slate-500">Exclusive access to Bureau Bank&apos;s private wealth desk. Investments denominated in Sovereigns — guaranteed returns backed by Bureau reserves.</p>
            </div>

            {/* Portfolio summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-black/30 border border-yellow-800/20 p-2.5 text-center">
                <div className="text-[9px] uppercase tracking-wider text-slate-500">Active Positions</div>
                <div className="text-lg font-black text-yellow-300 font-mono">{wealthInvestments.length}/5</div>
              </div>
              <div className="rounded-lg bg-black/30 border border-yellow-800/20 p-2.5 text-center">
                <div className="text-[9px] uppercase tracking-wider text-slate-500">Total Invested</div>
                <div className="text-lg font-black text-amber-300 font-mono">
                  {wealthInvestments.reduce((s, i) => s + i.amount, 0).toLocaleString()} <span className="text-[10px] text-amber-600">SVN</span>
                </div>
              </div>
              <div className="rounded-lg bg-black/30 border border-yellow-800/20 p-2.5 text-center">
                <div className="text-[9px] uppercase tracking-wider text-slate-500">Total Return</div>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  +{wealthInvestments.reduce((s, i) => s + Math.floor(i.amount * i.rate / 100), 0).toLocaleString()} <span className="text-[10px] text-emerald-600">SVN</span>
                </div>
              </div>
            </div>

            {/* Active investments */}
            {wealthInvestments.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-yellow-600 font-bold">Active Investments</div>
                {wealthInvestments.map((inv) => {
                  const matures = new Date(inv.maturesAt);
                  const created = new Date(inv.createdAt);
                  const lastClaimed = new Date(inv.lastClaimedAt);
                  const isMatured = matures <= new Date();
                  const dailyRate = inv.rate / inv.days;
                  const totalDaysPassed = Math.min(Math.floor((Date.now() - created.getTime()) / 86400000), inv.days);
                  const daysClaimed = Math.floor((lastClaimed.getTime() - created.getTime()) / 86400000);
                  const claimableDays = Math.max(0, totalDaysPassed - daysClaimed);
                  const pendingYield = Math.floor(inv.amount * (dailyRate / 100) * claimableDays);
                  const totalYield = Math.floor(inv.amount * inv.rate / 100);
                  const progressPct = Math.min(100, Math.floor((totalDaysPassed / inv.days) * 100));

                  return (
                    <div key={inv.id} className={`rounded-xl border p-3 space-y-2 ${
                      isMatured
                        ? "border-amber-500/50 bg-gradient-to-r from-amber-950/30 to-yellow-950/20 animate-pulse"
                        : "border-yellow-900/30 bg-black/20"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-yellow-300">{inv.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {inv.amount.toLocaleString()} SVN · {inv.rate}% / {inv.days}d · {dailyRate.toFixed(3)}%/day
                          </div>
                        </div>
                        <div className={`text-[10px] font-bold uppercase tracking-wide ${isMatured ? "text-amber-400" : "text-emerald-500"}`}>
                          {isMatured ? "🎉 Matured" : `⏳ ${inv.days - totalDaysPassed}d left`}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isMatured ? "bg-amber-500" : "bg-yellow-600"}`}
                          style={{ width: `${progressPct}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Total yield: <span className="text-emerald-400 font-mono font-bold">+{totalYield.toLocaleString()} SVN</span></span>
                        {pendingYield > 0 && !isMatured && (
                          <span className="text-cyan-400 font-mono font-bold">+{pendingYield.toLocaleString()} SVN pending</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {!isMatured && (
                          <button onClick={() => wealthApi("claim_yield", { investmentId: inv.id })}
                            disabled={loading || claimableDays < 1}
                            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-800 to-cyan-700 hover:from-cyan-700 hover:to-cyan-600 text-white font-bold text-[11px] disabled:opacity-30 transition-all">
                            💰 Claim {pendingYield > 0 ? `${pendingYield.toLocaleString()} SVN` : "Yield"}
                          </button>
                        )}
                        {isMatured && (
                          <button onClick={() => wealthApi("collect_investment", { investmentId: inv.id })}
                            disabled={loading}
                            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-[11px] disabled:opacity-30 transition-all">
                            🎉 Collect {(inv.amount + Math.floor(inv.amount * (dailyRate / 100) * Math.max(0, inv.days - daysClaimed))).toLocaleString()} SVN
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* New investment */}
            {wealthInvestments.length < 5 && (
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-yellow-600 font-bold">Open New Position</div>

                {/* Investment product cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WEALTH_OPTIONS.map((w) => (
                    <button key={w.days} onClick={() => setWealthDays(w.days)}
                      className={`rounded-xl border p-2.5 text-center transition-all ${
                        wealthDays === w.days
                          ? "border-yellow-500 bg-yellow-950/40 scale-[1.03] shadow-lg shadow-yellow-900/20"
                          : "border-slate-800/50 bg-black/30 hover:border-slate-700 hover:bg-slate-900/40"
                      }`}>
                      <div className={`text-lg font-black font-mono ${
                        wealthDays === w.days ? "text-yellow-300" : "text-slate-400"
                      }`}>{w.rate}%</div>
                      <div className="text-[10px] text-slate-500">{w.label}</div>
                      <div className="text-[9px] text-slate-600 font-mono">
                        {(w.rate / w.days).toFixed(3)}%/day
                      </div>
                      <div className={`text-[8px] uppercase tracking-wider mt-0.5 font-bold leading-tight ${
                        wealthDays === w.days ? "text-yellow-500" : "text-slate-600"
                      }`}>{w.tag}</div>
                    </button>
                  ))}
                </div>

                {/* Amount selection */}
                <div className="flex gap-1.5 flex-wrap">
                  {WEALTH_QUICK_AMOUNTS.filter((q) => q <= tokens).map((q) => (
                    <button key={q} onClick={() => setWealthAmount(q)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                        wealthAmount === q ? "bg-yellow-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                      }`}>
                      {q >= 1000000 ? `${(q / 1000000).toFixed(0)}M` : q >= 1000 ? `${(q / 1000).toFixed(0)}K` : q}
                    </button>
                  ))}
                </div>
                <input type="number" value={wealthAmount}
                  onChange={(e) => setWealthAmount(Math.max(1, Number(e.target.value)))}
                  min={500} max={3000000}
                  className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2.5 text-sm text-center font-mono text-slate-200" />

                {/* Projection */}
                <div className="rounded-lg bg-black/30 border border-slate-800/40 p-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500">Daily Yield</div>
                    <div className="text-sm font-black text-yellow-400 font-mono">
                      +{Math.floor(wealthAmount * selectedWealthOpt.rate / selectedWealthOpt.days / 100).toLocaleString()} SVN
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Total Return</div>
                    <div className="text-sm font-black text-emerald-300 font-mono">
                      +{Math.floor(wealthAmount * selectedWealthOpt.rate / 100).toLocaleString()} SVN
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Payout</div>
                    <div className="text-sm font-bold text-slate-300 font-mono">
                      {Math.floor(wealthAmount * (1 + selectedWealthOpt.rate / 100)).toLocaleString()} SVN
                    </div>
                  </div>
                </div>

                <button onClick={() => wealthApi("buy_investment", { investmentDays: wealthDays })}
                  disabled={loading || wealthAmount > tokens || wealthAmount < 500 || wealthAmount > 3000000}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-700 to-amber-600 hover:from-yellow-600 hover:to-amber-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-yellow-900/20">
                  👑 Invest {wealthAmount.toLocaleString()} SVN in {selectedWealthOpt.tag}
                  <span className="block text-[10px] opacity-70 font-normal">
                    {selectedWealthOpt.rate}% over {selectedWealthOpt.days} days · Guaranteed return · Claim daily
                  </span>
                </button>
                <p className="text-[10px] text-slate-600 text-center">
                  Min 500 SVN · Max 3,000,000 SVN per issuance · Up to 5 concurrent · Funds from Sovereign balance
                </p>
              </div>
            )}

            {wealthInvestments.length >= 5 && (
              <div className="rounded-lg bg-red-950/20 border border-red-900/30 p-3 text-center">
                <div className="text-xs text-red-400 font-bold">Maximum 5 active positions reached</div>
                <div className="text-[10px] text-slate-500 mt-1">Collect a matured investment to open a new position.</div>
              </div>
            )}

            {/* Sovereign exchange */}
            <div className="border-t border-yellow-900/20 pt-4 mt-2 space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-yellow-600 font-bold">Sovereign Exchange</div>
              <div className="rounded-lg bg-slate-900/30 border border-slate-800/30 p-2.5">
                <p className="text-[10px] text-slate-500">Convert credits to Sovereigns to invest. The buy/sell spread acts as a commitment fee — long-term investments recoup the difference through yield.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-black/30 border border-yellow-800/20 p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase">Buy Rate</div>
                  <div className="text-lg font-bold text-yellow-300 font-mono">{buyRate} ₡</div>
                  <div className="text-[10px] text-slate-600">per Sovereign</div>
                </div>
                <div className="rounded-lg bg-black/30 border border-yellow-800/20 p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase">Sell Rate</div>
                  <div className="text-lg font-bold text-amber-300 font-mono">{sellRate} ₡</div>
                  <div className="text-[10px] text-slate-600">per Sovereign</div>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[1, 5, 10, 25, 50].map((q) => (
                  <button key={q} onClick={() => setAmount(q)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      amount === q ? "bg-yellow-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                    }`}>
                    {q}
                  </button>
                ))}
              </div>
              <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                min={1} className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2.5 text-sm text-center font-mono text-slate-200" />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => api("buy_tokens")} disabled={loading || credits < amount * buyRate}
                  className="py-3 rounded-xl bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-yellow-900/20">
                  🪙 Buy {amount.toLocaleString()} SVN
                  <span className="block text-[10px] opacity-70 font-normal">Cost: {(amount * buyRate).toLocaleString()} ₡</span>
                </button>
                <button onClick={() => api("sell_tokens")} disabled={loading || tokens < amount}
                  className="py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-amber-900/20">
                  💰 Sell {amount.toLocaleString()} SVN
                  <span className="block text-[10px] opacity-70 font-normal">Get: {(amount * sellRate).toLocaleString()} ₡</span>
                </button>
              </div>
            </div>
          </>
          );
        })()}
      </div>
    </div>
  );
}
