"use client";

import { useState, useEffect } from "react";

// ── Inline SVG Graphics ────────────────────────────────────────────

/* Large vault door illustration for the vault tab */
const VaultDoorGraphic = () => (
  <svg viewBox="0 0 120 120" fill="none" className="w-20 h-20 flex-shrink-0">
    <circle cx="60" cy="60" r="56" stroke="url(#vaultGrad)" strokeWidth="3" fill="#0e1a24"/>
    <circle cx="60" cy="60" r="48" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4"/>
    <circle cx="60" cy="60" r="38" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 6" opacity="0.25"/>
    <circle cx="60" cy="60" r="16" stroke="#22d3ee" strokeWidth="2.5" fill="#164e63" fillOpacity="0.3"/>
    <path d="M60 32V28M60 92V88M32 60H28M92 60H88" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <path d="M60 48V72M48 60H72" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round"/>
    <path d="M42 42l-3-3M78 42l3-3M42 78l-3 3M78 78l3 3" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <defs><linearGradient id="vaultGrad" x1="0" y1="0" x2="120" y2="120"><stop stopColor="#22d3ee" stopOpacity="0.8"/><stop offset="1" stopColor="#0891b2" stopOpacity="0.3"/></linearGradient></defs>
  </svg>
);

/* Transfer arrows graphic */
const TransferGraphic = () => (
  <svg viewBox="0 0 120 80" fill="none" className="w-20 h-14 flex-shrink-0">
    <path d="M15 28H95" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 3" opacity="0.3"/>
    <path d="M15 52H95" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 3" opacity="0.3"/>
    <path d="M20 28l75 0" stroke="url(#tfGrad1)" strokeWidth="3" strokeLinecap="round"/>
    <path d="M88 20l10 8-10 8" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#c084fc" fillOpacity="0.15"/>
    <path d="M100 52l-75 0" stroke="url(#tfGrad2)" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 44l-10 8 10 8" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#c084fc" fillOpacity="0.15"/>
    <circle cx="60" cy="40" r="10" fill="#7c3aed" fillOpacity="0.15" stroke="#a855f7" strokeWidth="1.5"/>
    <text x="60" y="44" textAnchor="middle" fill="#c084fc" fontSize="11" fontWeight="bold">₡</text>
    <defs>
      <linearGradient id="tfGrad1" x1="20" y1="28" x2="95" y2="28"><stop stopColor="#7c3aed" stopOpacity="0.2"/><stop offset="1" stopColor="#c084fc"/></linearGradient>
      <linearGradient id="tfGrad2" x1="100" y1="52" x2="25" y2="52"><stop stopColor="#7c3aed" stopOpacity="0.2"/><stop offset="1" stopColor="#c084fc"/></linearGradient>
    </defs>
  </svg>
);

/* Loan credit card graphic */
const LoanGraphic = () => (
  <svg viewBox="0 0 120 80" fill="none" className="w-20 h-14 flex-shrink-0">
    <rect x="10" y="10" width="100" height="60" rx="8" fill="url(#loanGrad)" stroke="#f97316" strokeWidth="1.5"/>
    <rect x="10" y="26" width="100" height="10" fill="#f97316" fillOpacity="0.3"/>
    <rect x="20" y="46" width="30" height="4" rx="2" fill="#fb923c" fillOpacity="0.5"/>
    <rect x="20" y="54" width="50" height="3" rx="1.5" fill="#fb923c" fillOpacity="0.3"/>
    <circle cx="90" cy="52" r="8" fill="#f97316" fillOpacity="0.15" stroke="#fb923c" strokeWidth="1"/>
    <circle cx="82" cy="52" r="8" fill="#f97316" fillOpacity="0.1" stroke="#fb923c" strokeWidth="1"/>
    <defs><linearGradient id="loanGrad" x1="10" y1="10" x2="110" y2="70"><stop stopColor="#431407"/><stop offset="1" stopColor="#1c0a00"/></linearGradient></defs>
  </svg>
);

/* Bond chart graphic */
const BondGraphic = () => (
  <svg viewBox="0 0 120 80" fill="none" className="w-20 h-14 flex-shrink-0">
    <path d="M15 65V20M15 65H110" stroke="#10b981" strokeWidth="1" opacity="0.3"/>
    <path d="M15 60l15-5 15 3 15-12 15-8 15-15 15-3" stroke="url(#bondGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 60l15-5 15 3 15-12 15-8 15-15 15-3V65H15Z" fill="url(#bondFill)" opacity="0.15"/>
    <circle cx="105" cy="20" r="5" fill="#10b981" fillOpacity="0.2" stroke="#34d399" strokeWidth="1.5"/>
    <circle cx="105" cy="20" r="2" fill="#34d399"/>
    {[25, 40, 55, 70, 85].map((x) => (
      <line key={x} x1={x} y1="65" x2={x} y2="62" stroke="#10b981" strokeWidth="0.5" opacity="0.3"/>
    ))}
    <defs>
      <linearGradient id="bondGrad" x1="15" y1="60" x2="105" y2="20"><stop stopColor="#059669"/><stop offset="1" stopColor="#34d399"/></linearGradient>
      <linearGradient id="bondFill" x1="60" y1="20" x2="60" y2="65"><stop stopColor="#34d399"/><stop offset="1" stopColor="#10b981" stopOpacity="0"/></linearGradient>
    </defs>
  </svg>
);

/* Wealth crown graphic */
const WealthGraphic = () => (
  <svg viewBox="0 0 120 80" fill="none" className="w-20 h-14 flex-shrink-0">
    <path d="M25 55l10-30 15 15 10-20 10 20 15-15 10 30z" fill="url(#crownGrad)" stroke="#eab308" strokeWidth="1.5" strokeLinejoin="round"/>
    <rect x="22" y="55" width="76" height="8" rx="2" fill="url(#crownBase)" stroke="#eab308" strokeWidth="1"/>
    <circle cx="60" cy="38" r="4" fill="#fde047" fillOpacity="0.4" stroke="#eab308" strokeWidth="1"/>
    <circle cx="40" cy="43" r="2.5" fill="#fde047" fillOpacity="0.3"/>
    <circle cx="80" cy="43" r="2.5" fill="#fde047" fillOpacity="0.3"/>
    <defs>
      <linearGradient id="crownGrad" x1="60" y1="25" x2="60" y2="55"><stop stopColor="#854d0e" stopOpacity="0.6"/><stop offset="1" stopColor="#422006" stopOpacity="0.3"/></linearGradient>
      <linearGradient id="crownBase" x1="22" y1="55" x2="98" y2="63"><stop stopColor="#854d0e"/><stop offset="1" stopColor="#713f12"/></linearGradient>
    </defs>
  </svg>
);

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
  { days: 7,   rate: 2,    label: "7 Days",   tag: "Treasury Notes",       desc: "Government-backed short-term securities" },
  { days: 14,  rate: 5,    label: "14 Days",  tag: "Municipal Bonds",      desc: "Infrastructure & municipal development" },
  { days: 30,  rate: 13,   label: "30 Days",  tag: "Blue-Chip Real Estate", desc: "Prime commercial property fund" },
  { days: 45,  rate: 22,   label: "45 Days",  tag: "Private Credit",       desc: "Direct lending to enterprise borrowers" },
  { days: 60,  rate: 33,   label: "60 Days",  tag: "Hedge Fund LP",        desc: "Multi-strategy absolute return fund" },
  { days: 90,  rate: 55,   label: "90 Days",  tag: "Private Equity",       desc: "Leveraged buyout & growth equity" },
  { days: 180, rate: 125,  label: "180 Days", tag: "Venture Capital",      desc: "Early-stage tech & biotech portfolio" },
  { days: 365, rate: 275,  label: "365 Days", tag: "Sovereign Wealth Fund", desc: "Diversified sovereign-grade portfolio" },
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
  hasLimitlessCard: boolean;
  initialWealthInvestments: WealthInvestmentData[];
}

export function BankClient({
  initialCredits, initialCreditsBank, initialTokens,
  initialLoanAmount, initialLoanCreatedAt,
  initialBondAmount, initialBondRate, initialBondDays,
  initialBondMaturesAt, initialBondCreatedAt, initialBondLastClaimedAt,
  buyRate, sellRate, initialBankTreasury, hasVentureCard, hasLimitlessCard: initialHasLimitlessCard,
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
  const [hasLimitlessCard, setHasLimitlessCard] = useState(initialHasLimitlessCard);

  // Verify limitless card status on mount (in case SSR prop was stale)
  useEffect(() => {
    fetch("/api/game/wealth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check_status" }),
    })
      .then((r) => r.json())
      .then((d) => { if (typeof d.hasLimitlessCard === "boolean") setHasLimitlessCard(d.hasLimitlessCard); })
      .catch(() => {});
  }, []);

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
      if (typeof data.hasLimitlessCard === "boolean") setHasLimitlessCard(data.hasLimitlessCard);
      return data;
    } catch {
      setMsg({ text: "Connection error.", ok: false });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const tabDefs: { key: Tab; label: string; icon: string; color: string; accent: string }[] = [
    { key: "vault",    label: "Vault",    icon: "🔒", color: "from-cyan-500/20 to-cyan-900/10 border-cyan-800/40", accent: "bg-cyan-400" },
    { key: "transfer", label: "Transfer", icon: "⚡", color: "from-purple-500/20 to-purple-900/10 border-purple-800/40", accent: "bg-purple-400" },
    { key: "loan",     label: "Loans",    icon: "💳", color: "from-orange-500/20 to-orange-900/10 border-orange-800/40", accent: "bg-orange-400" },
    { key: "bond",     label: "Bonds",    icon: "📊", color: "from-emerald-500/20 to-emerald-900/10 border-emerald-800/40", accent: "bg-emerald-400" },
    ...(hasVentureCard ? [{ key: "wealth" as Tab, label: "Wealth", icon: "👑", color: "from-yellow-500/20 to-yellow-900/10 border-yellow-800/40", accent: "bg-yellow-400" }] : []),
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
    // Yield accrues at midnight UTC — first yield the day AFTER creation
    const accrualStart = Math.floor(bondCreatedDate.getTime() / 86_400_000) + 1;
    const nowDay = Math.floor(now.getTime() / 86_400_000);
    const claimedDay = Math.max(Math.floor(bondLastClaimedDate.getTime() / 86_400_000), accrualStart - 1);
    const totalDaysPassed = Math.min(Math.max(0, nowDay - accrualStart + 1), activeBondDays);
    const daysClaimed = Math.max(0, claimedDay - accrualStart + 1);
    accruedDays = Math.max(0, totalDaysPassed - daysClaimed);
    accruedYield = Math.floor(bondAmount * (dailyRate / 100) * accruedDays);
  }

  const activeTab = tabDefs.find((t) => t.key === tab)!;

  return (
    <div className="space-y-4">
      {/* ── Hero Balance Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="relative overflow-hidden rounded-xl border border-amber-700/40 bg-gradient-to-br from-amber-950/60 to-[#0a0d11] p-4">
          <svg className="absolute -right-3 -bottom-3 w-16 h-16 text-amber-500 opacity-20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M14.5 9.5A3 3 0 0012 8.5c-1.7 0-3 1.3-3 3s1.3 3 3 3a3 3 0 002.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 6.5v1M12 16.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div className="text-[9px] uppercase tracking-[0.2em] text-amber-500 font-semibold">On Hand</div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-1">{credits.toLocaleString()}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">₡ credits</div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-cyan-700/40 bg-gradient-to-br from-cyan-950/60 to-[#0a0d11] p-4">
          <svg className="absolute -right-2 -bottom-2 w-16 h-16 text-cyan-400 opacity-20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="10" y="10" width="4" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="12" cy="12" r="0.8" fill="currentColor"/>
          </svg>
          <div className="text-[9px] uppercase tracking-[0.2em] text-cyan-500 font-semibold">In Vault</div>
          <div className="text-2xl font-black text-cyan-300 font-mono mt-1">{bank.toLocaleString()}</div>
          <div className="text-[10px] text-cyan-600 mt-0.5">₡ secured</div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-violet-700/40 bg-gradient-to-br from-violet-950/60 to-[#0a0d11] p-4">
          <svg className="absolute -right-2 -bottom-2 w-16 h-16 text-violet-400 opacity-20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l2.5 6.5H22l-6 4.5 2.5 7L12 16l-6.5 4 2.5-7-6-4.5h7.5L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <div className="text-[9px] uppercase tracking-[0.2em] text-violet-500 font-semibold">Sovereigns</div>
          <div className="text-2xl font-black text-violet-300 font-mono mt-1">{tokens.toLocaleString()}</div>
          <div className="text-[10px] text-violet-600 mt-0.5">SVN</div>
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
      <div className={`grid gap-1.5 ${tabDefs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {tabDefs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setMsg(null); }}
            className={`relative rounded-xl border py-3 text-center transition-all duration-200 overflow-hidden ${
              tab === t.key
                ? `bg-gradient-to-b ${t.color} border-opacity-100 scale-[1.02] shadow-lg`
                : "bg-[#0a0d11] border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/50"
            }`}>
            <div className="text-xl mb-0.5">{t.icon}</div>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${
              tab === t.key ? "text-slate-200" : "text-slate-500"
            }`}>{t.label}</div>
            {tab === t.key && <div className={`absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full ${t.accent} bank-glow-line`}/>}
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
            <div className="flex items-center gap-4 mb-3 p-3 rounded-xl bg-cyan-950/30 border border-cyan-900/20">
              <VaultDoorGraphic />
              <div>
                <h2 className="text-base font-black text-cyan-300 uppercase tracking-wide">Secure Vault</h2>
                <p className="text-[11px] text-slate-400 mt-1">Credits stored in the vault are protected from theft, death penalties, and combat losses.</p>
                <div className="flex gap-3 mt-2">
                  <div className="text-[10px]"><span className="text-slate-500">Balance: </span><span className="text-cyan-300 font-mono font-bold">{bank.toLocaleString()} ₡</span></div>
                  <div className="text-[10px]"><span className="text-slate-500">Withdraw fee: </span><span className="text-red-400 font-mono">2.5%</span></div>
                </div>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      amount === q ? "bg-cyan-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                    }`}>
                    {q.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[10, 25, 50, 75, 100].map((pct) => (
                  <button key={pct} onClick={() => setAmount(Math.max(1, Math.floor(credits * pct / 100)))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-900/30 text-cyan-400 hover:bg-cyan-800/40 transition">
                    {pct}%
                  </button>
                ))}
              </div>
              <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                min={1} className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2.5 text-sm text-center font-mono text-slate-200" />
              <button onClick={() => api("deposit")} disabled={loading || amount > credits || amount < 1}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-cyan-900/20">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      amount === q ? "bg-amber-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                    }`}>
                    {q.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[10, 25, 50, 75, 100].map((pct) => (
                  <button key={pct} onClick={() => setAmount(Math.max(1, Math.floor(bank * pct / 100)))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-900/30 text-amber-400 hover:bg-amber-800/40 transition">
                    {pct}%
                  </button>
                ))}
              </div>
              <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                min={1} className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2.5 text-sm text-center font-mono text-slate-200" />
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-amber-900/20">
                ⬆️ Withdraw {amount.toLocaleString()} ₡
              </button>
            </div>

            {/* ── Sovereign Exchange (Credits ↔ SVN) ── */}
            <div className="rounded-lg bg-violet-950/20 border border-violet-900/30 p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">🪙</span>
                <span className="text-[10px] uppercase tracking-widest text-violet-400 font-bold">Sovereign Exchange</span>
                <span className="text-[10px] text-slate-500 ml-auto">Buy {buyRate}₡ · Sell {sellRate}₡</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-black/30 border border-violet-800/20 p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase">Your Credits</div>
                  <div className="text-lg font-black text-amber-300 font-mono">{credits.toLocaleString()} ₡</div>
                </div>
                <div className="rounded-lg bg-black/30 border border-violet-800/20 p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase">Your Sovereigns</div>
                  <div className="text-lg font-black text-violet-300 font-mono">{tokens.toLocaleString()} SVN</div>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[10, 50, 100, 500, 1000, 5000].map((q) => (
                  <button key={q} onClick={() => setAmount(q)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      amount === q ? "bg-violet-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                    }`}>
                    {q >= 1000 ? `${(q / 1000)}K` : q}
                  </button>
                ))}
              </div>
              <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                min={1} className="w-full rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2.5 text-sm text-center font-mono text-slate-200" />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => api("buy_tokens")} disabled={loading || credits < amount * buyRate}
                  className="py-3 rounded-xl bg-gradient-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-violet-900/20">
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
            <div className="flex items-center gap-4 mb-3 p-3 rounded-xl bg-purple-950/30 border border-purple-900/20">
              <TransferGraphic />
              <div>
                <h2 className="text-base font-black text-purple-300 uppercase tracking-wide">Instant Transfer</h2>
                <p className="text-[11px] text-slate-400 mt-1">Send credits to any pilot instantly. No fees.</p>
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
            <div className="flex items-center gap-4 mb-3 p-3 rounded-xl bg-orange-950/30 border border-orange-900/20">
              <LoanGraphic />
              <div>
                <h2 className="text-base font-black text-orange-300 uppercase tracking-wide">Emergency Loans</h2>
                <p className="text-[11px] text-slate-400 mt-1">Borrow up to 5% of your vault balance. 6.9% surcharge.</p>
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
            <div className="flex items-center gap-4 mb-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/20">
              <BondGraphic />
              <div>
                <h2 className="text-base font-black text-emerald-300 uppercase tracking-wide">Investment Bonds</h2>
                <p className="text-[11px] text-slate-400 mt-1">Lock credits for daily yield. Claim anytime. 1 active bond per pilot.</p>
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
                    <div className="flex gap-2">
                      <button onClick={() => api("claim_yield")} disabled={loading || accruedDays < 1}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-cyan-900/20">
                        💰 Claim {accruedYield > 0 ? `${accruedYield.toLocaleString()} ₡` : "Yield"}
                      </button>
                      <button onClick={() => { if (confirm(`Early bond withdrawal?\n\nYou'll receive ${(bondAmount - Math.floor(bondAmount * 0.15)).toLocaleString()} ₡ back.\n15% penalty: −${Math.floor(bondAmount * 0.15).toLocaleString()} ₡\n\nAll unclaimed yield is forfeited.`)) api("early_withdraw_bond"); }}
                        disabled={loading}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-900/80 to-red-800/80 hover:from-red-800 hover:to-red-700 text-red-200 font-bold text-[11px] disabled:opacity-30 transition-all">
                        ⚠️ Withdraw
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600 text-center">Yield accrues daily. Early withdrawal: 15% penalty on principal.</p>
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
            <div className="flex items-center gap-4 mb-3 p-3 rounded-xl bg-yellow-950/30 border border-yellow-900/20">
              <WealthGraphic />
              <div>
                <h2 className="text-base font-black text-yellow-300 uppercase tracking-wide">Wealth Management</h2>
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

            {hasLimitlessCard && (
              <div className="rounded-lg bg-blue-950/20 border-2 border-blue-500/60 p-3 flex items-center gap-3">
                <span className="text-lg">♾️</span>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Nexus Limitless Yield</div>
                  <div className="text-[10px] text-slate-500">Maximum SVN per position cap waived — invest without limits.</div>
                </div>
              </div>
            )}

            {/* ── Quick SVN Exchange ── */}
            <div className="rounded-xl bg-gradient-to-r from-yellow-950/40 to-amber-950/30 border border-yellow-700/40 p-4 space-y-3">
              {/* Balance display */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-black/40 border border-violet-700/30 p-3 text-center">
                  <div className="text-[9px] uppercase tracking-widest text-violet-500 font-semibold">Your Sovereigns</div>
                  <div className="text-2xl font-black text-violet-300 font-mono mt-1">{tokens.toLocaleString()}</div>
                  <div className="text-[10px] text-violet-600">SVN</div>
                </div>
                <div className="rounded-lg bg-black/40 border border-amber-700/30 p-3 text-center">
                  <div className="text-[9px] uppercase tracking-widest text-amber-500 font-semibold">Credits On Hand</div>
                  <div className="text-2xl font-black text-amber-300 font-mono mt-1">{credits.toLocaleString()}</div>
                  <div className="text-[10px] text-amber-600">₡ · buys up to {Math.floor(credits / buyRate).toLocaleString()} SVN</div>
                </div>
              </div>

              <div className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold">Buy SVN</div>

              {/* Fixed amount buttons */}
              <div className="flex gap-1.5 flex-wrap">
                {[500, 1000, 5000, 25000, 100000, 500000, 1000000].map((q) => (
                  <button key={q} onClick={() => setAmount(q)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      amount === q ? "bg-yellow-600 text-white" : "bg-black/40 text-slate-400 hover:bg-slate-700 border border-slate-800/50"
                    }`}>
                    {q >= 1000000 ? `${(q / 1000000)}M` : q >= 1000 ? `${(q / 1000).toLocaleString()}K` : q}
                  </button>
                ))}
              </div>

              {/* Percentage of credits on hand */}
              <div className="flex gap-1.5 flex-wrap">
                {[10, 25, 50, 75, 100].map((pct) => {
                  const svnFromPct = Math.max(1, Math.floor((credits * pct / 100) / buyRate));
                  return (
                    <button key={pct} onClick={() => setAmount(svnFromPct)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        amount === svnFromPct ? "bg-yellow-600 text-white" : "bg-yellow-900/30 text-yellow-400 hover:bg-yellow-800/40 border border-yellow-800/30"
                      }`}>
                      {pct}% ₡ → {svnFromPct.toLocaleString()} SVN
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                  min={1} placeholder="SVN amount..."
                  className="flex-1 rounded-lg bg-black/40 border border-slate-700/50 px-4 py-2.5 text-sm text-center font-mono text-slate-200" />
                <button onClick={() => api("buy_tokens")} disabled={loading || credits < amount * buyRate}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-yellow-900/30 whitespace-nowrap">
                  🪙 Buy {amount.toLocaleString()} SVN
                </button>
              </div>

              <div className="rounded-lg bg-black/30 border border-slate-800/40 p-2.5 flex justify-between text-[10px]">
                <span className="text-slate-500">Rate: <span className="text-yellow-400 font-mono font-bold">{buyRate} ₡</span>/SVN</span>
                <span className="text-slate-500">Cost: <span className="text-amber-300 font-mono font-bold">{(amount * buyRate).toLocaleString()} ₡</span></span>
                <span className="text-slate-500">Remaining: <span className="text-amber-300 font-mono font-bold">{Math.max(0, credits - amount * buyRate).toLocaleString()} ₡</span></span>
              </div>

              {/* Sell option */}
              <div className="flex items-center gap-2 pt-1 border-t border-yellow-900/20">
                <button onClick={() => api("sell_tokens")} disabled={loading || tokens < amount}
                  className="px-4 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-amber-400 font-bold text-[11px] disabled:opacity-30 transition border border-slate-700/40">
                  💰 Sell {amount.toLocaleString()} SVN → {(amount * sellRate).toLocaleString()} ₡
                </button>
                <span className="text-[10px] text-slate-600">Sell rate: {sellRate} ₡/SVN</span>
              </div>
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
                  // Yield accrues at midnight UTC — first yield available the day AFTER creation
                  const accrualStart = Math.floor(created.getTime() / 86_400_000) + 1;
                  const nowDay = Math.floor(Date.now() / 86_400_000);
                  const claimedDay = Math.max(Math.floor(lastClaimed.getTime() / 86_400_000), accrualStart - 1);
                  const totalDaysPassed = Math.min(Math.max(0, nowDay - accrualStart + 1), inv.days);
                  const daysClaimed = Math.max(0, claimedDay - accrualStart + 1);
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
                        {!isMatured && (
                          <button onClick={() => { if (confirm(`Early withdrawal from ${inv.name}?\n\nYou'll receive ${(inv.amount - Math.floor(inv.amount * 0.15)).toLocaleString()} SVN back.\n15% penalty: −${Math.floor(inv.amount * 0.15).toLocaleString()} SVN`)) wealthApi("early_withdraw", { investmentId: inv.id }); }}
                            disabled={loading}
                            className="py-2 px-3 rounded-lg bg-gradient-to-r from-red-900/80 to-red-800/80 hover:from-red-800 hover:to-red-700 text-red-200 font-bold text-[11px] disabled:opacity-30 transition-all">
                            ⚠️ Withdraw
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

                {/* No duplicates warning */}
                <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3 flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5">⚠️</span>
                  <div>
                    <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">One Position Per Type</div>
                    <div className="text-[11px] text-amber-200/70 mt-0.5">
                      Only <span className="font-bold text-white">1 investment per tier</span> is allowed. Duplicates are blocked.
                      Greyed-out tiers are already active in your portfolio. Yield accrues daily at <span className="font-bold text-cyan-300">midnight UTC</span>.
                    </div>
                  </div>
                </div>

                {/* Investment product cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WEALTH_OPTIONS.map((w) => {
                    const alreadyOwned = wealthInvestments.some((inv) => inv.days === w.days);
                    return (
                    <button key={w.days} onClick={() => !alreadyOwned && setWealthDays(w.days)}
                      disabled={alreadyOwned}
                      className={`rounded-xl border p-2.5 text-center transition-all ${
                        alreadyOwned
                          ? "border-slate-800/30 bg-black/20 opacity-40 cursor-not-allowed"
                          : wealthDays === w.days
                          ? "border-yellow-500 bg-yellow-950/40 scale-[1.03] shadow-lg shadow-yellow-900/20"
                          : "border-slate-800/50 bg-black/30 hover:border-slate-700 hover:bg-slate-900/40"
                      }`}>
                      <div className={`text-lg font-black font-mono ${
                        alreadyOwned ? "text-slate-600" : wealthDays === w.days ? "text-yellow-300" : "text-slate-400"
                      }`}>{w.rate}%</div>
                      <div className="text-[10px] text-slate-500">{alreadyOwned ? "Active" : w.label}</div>
                      <div className="text-[9px] text-slate-600 font-mono">
                        {(w.rate / w.days).toFixed(3)}%/day
                      </div>
                      <div className={`text-[8px] uppercase tracking-wider mt-0.5 font-bold leading-tight ${
                        alreadyOwned ? "text-slate-700" : wealthDays === w.days ? "text-yellow-500" : "text-slate-600"
                      }`}>{w.tag}</div>
                    </button>
                    );
                  })}
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
                  min={500} {...(!hasLimitlessCard ? { max: 3000000 } : {})}
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
                  disabled={loading || wealthAmount > tokens || wealthAmount < 500 || (!hasLimitlessCard && wealthAmount > 3000000) || wealthInvestments.some((inv) => inv.days === wealthDays)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-700 to-amber-600 hover:from-yellow-600 hover:to-amber-500 text-white font-bold text-sm disabled:opacity-30 transition-all shadow-lg shadow-yellow-900/20">
                  👑 Invest {wealthAmount.toLocaleString()} SVN in {selectedWealthOpt.tag}
                  <span className="block text-[10px] opacity-70 font-normal">
                    {selectedWealthOpt.rate}% over {selectedWealthOpt.days} days · Guaranteed return · Claim daily
                  </span>
                </button>
                <p className="text-[10px] text-slate-600 text-center">
                  Min 500 SVN · {hasLimitlessCard ? 'No max limit' : 'Max 3,000,000 SVN per issuance'} · 1 per type · Up to 5 concurrent · Funds from Sovereign balance
                </p>
              </div>
            )}

            {wealthInvestments.length >= 5 && (
              <div className="rounded-lg bg-red-950/20 border border-red-900/30 p-3 text-center">
                <div className="text-xs text-red-400 font-bold">Maximum 5 active positions reached</div>
                <div className="text-[10px] text-slate-500 mt-1">Collect a matured investment to open a new position.</div>
              </div>
            )}
          </>
          );
        })()}
      </div>
    </div>
  );
}
