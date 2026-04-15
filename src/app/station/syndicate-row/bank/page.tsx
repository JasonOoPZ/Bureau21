'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Character } from '@/types/game';

const BOND_RATES: { days: number; rate: number; label: string }[] = [
  { days: 15,  rate: 0.005,  label: '15 days — 0.50%' },
  { days: 30,  rate: 0.0125, label: '30 days — 1.25%' },
  { days: 45,  rate: 0.0155, label: '45 days — 1.55%' },
  { days: 60,  rate: 0.02,   label: '60 days — 2.00%' },
  { days: 90,  rate: 0.025,  label: '90 days — 2.50%' },
  { days: 180, rate: 0.06,   label: '180 days — 6.00%' },
  { days: 365, rate: 0.18,   label: '365 days — 18.00%' },
];

type Section = 'deposit' | 'withdraw' | 'transfer' | 'loan' | 'bond';

export default function BankPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [section, setSection] = useState<Section>('deposit');
  const [amount, setAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferSearch, setTransferSearch] = useState('');
  const [transferResults, setTransferResults] = useState<{ id: string; username: string; level: number }[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; username: string } | null>(null);
  const [loanAmount, setLoanAmount] = useState('');
  const [bondAmount, setBondAmount] = useState('');
  const [bondDays, setBondDays] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const refreshCharacter = useCallback(async (charId: string) => {
    const { data } = await supabase.from('characters').select('*').eq('id', charId).single();
    if (data) setCharacter(data as Character);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      const { data } = await supabase
        .from('characters').select('*').eq('user_id', session.user.id).single();
      if (data) {
        const char = data as Character;
        setCharacter(char);
        // Auto-claim matured bond
        if (char.bond_amount > 0 && char.bond_matures_at && new Date(char.bond_matures_at) <= new Date()) {
          const resp = await fetch('/api/bank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'claim_bond' }),
          });
          if (resp.ok) {
            const d = await resp.json();
            setMessage(d.message);
            await refreshCharacter(char.id);
          }
        }
      }
    });
  }, [supabase, router, refreshCharacter]);

  async function handleAction() {
    if (!character) return;
    const n = parseInt(amount, 10);
    if ((section === 'deposit' || section === 'withdraw') && (isNaN(n) || n <= 0)) {
      setError('Enter a valid amount.'); return;
    }
    setLoading(true); setMessage(null); setError(null);

    let body: Record<string, unknown> = {};
    if (section === 'deposit')  body = { action: 'deposit', amount: n };
    if (section === 'withdraw') body = { action: 'withdraw', amount: n };
    if (section === 'transfer') {
      if (!selectedPlayer) { setError('Select a player first.'); setLoading(false); return; }
      const t = parseInt(transferTarget, 10);
      if (isNaN(t) || t <= 0) { setError('Enter a valid amount.'); setLoading(false); return; }
      body = { action: 'transfer', recipientId: selectedPlayer.id, amount: t };
    }
    if (section === 'loan') {
      const la = parseInt(loanAmount, 10);
      if (isNaN(la) || la <= 0) { setError('Enter a valid loan amount.'); setLoading(false); return; }
      body = { action: 'loan', amount: la };
    }
    if (section === 'bond') {
      const ba = parseInt(bondAmount, 10);
      if (isNaN(ba) || ba <= 0) { setError('Enter a valid bond amount.'); setLoading(false); return; }
      body = { action: 'buy_bond', amount: ba, days: bondDays };
    }

    const resp = await fetch('/api/bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) {
      setError(data.error ?? 'Transaction failed.');
    } else {
      setMessage(data.message);
      await refreshCharacter(character.id);
      setAmount(''); setLoanAmount(''); setBondAmount(''); setTransferTarget('');
      setSelectedPlayer(null); setTransferSearch(''); setTransferResults([]);
    }
    setLoading(false);
  }

  async function handleRepayLoan() {
    if (!character) return;
    setLoading(true); setMessage(null); setError(null);
    const resp = await fetch('/api/bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'repay_loan' }),
    });
    const data = await resp.json();
    if (!resp.ok) setError(data.error ?? 'Repayment failed.');
    else { setMessage(data.message); await refreshCharacter(character.id); }
    setLoading(false);
  }

  async function handlePlayerSearch(q: string) {
    setTransferSearch(q);
    if (!q.trim()) { setTransferResults([]); return; }
    const resp = await fetch(`/api/players?q=${encodeURIComponent(q)}`);
    if (resp.ok) { const d = await resp.json(); setTransferResults(d.players ?? []); }
  }

  if (!character) {
    return <div className="p-6 flex items-center justify-center"><p className="text-slate-400 animate-pulse">Loading...</p></div>;
  }

  const maxLoan = Math.floor(character.credits_bank * 0.05);
  const totalRepay = character.loan_amount > 0 ? Math.ceil(character.loan_amount * 1.069) : 0;
  const hasBond = character.bond_amount > 0;
  const bondMatured = hasBond && character.bond_matures_at ? new Date(character.bond_matures_at) <= new Date() : false;
  const bondReturn = hasBond ? Math.floor(character.bond_amount * (1 + character.bond_rate)) : 0;

  const navItems: { key: Section; label: string }[] = [
    { key: 'deposit', label: '⬇️ Deposit' },
    { key: 'withdraw', label: '⬆️ Withdraw' },
    { key: 'transfer', label: '↗️ Transfer' },
    { key: 'loan', label: '💳 Loan' },
    { key: 'bond', label: '📜 Bonds' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-lg space-y-6">
      {/* Header with SVG illustration */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-900/50 via-slate-800 to-cyan-900/30 p-4 flex items-center gap-4">
          {/* Bank SVG illustration */}
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <rect width="64" height="64" rx="8" fill="#0f2a1a"/>
            {/* Vault door */}
            <circle cx="32" cy="32" r="22" fill="#1a3a26" stroke="#10b981" strokeWidth="2"/>
            <circle cx="32" cy="32" r="16" fill="#0f2a1a" stroke="#059669" strokeWidth="1.5"/>
            <circle cx="32" cy="32" r="5" fill="#10b981"/>
            {/* Dial marks */}
            {[0,45,90,135,180,225,270,315].map((deg, i) => (
              <line key={i}
                x1={32 + 11 * Math.cos(deg * Math.PI / 180)}
                y1={32 + 11 * Math.sin(deg * Math.PI / 180)}
                x2={32 + 14 * Math.cos(deg * Math.PI / 180)}
                y2={32 + 14 * Math.sin(deg * Math.PI / 180)}
                stroke="#34d399" strokeWidth="1.5"/>
            ))}
            {/* Handle bar */}
            <rect x="29" y="8" width="6" height="10" rx="3" fill="#10b981"/>
            {/* Credit symbol */}
            <text x="32" y="35" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold">₡</text>
          </svg>
          <div>
            <h1 className="text-xl font-bold text-emerald-400">🏦 Bureau Bank</h1>
            <p className="text-slate-400 text-xs mt-0.5">Secure. Discreet. No questions asked.</p>
          </div>
        </div>
        {/* Balance */}
        <div className="grid grid-cols-2 divide-x divide-slate-700 border-t border-slate-700">
          <div className="p-3 text-center">
            <p className="text-slate-500 text-xs">On Hand</p>
            <p className="text-amber-400 font-bold text-lg">{character.credits_hand.toLocaleString()} ₡</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-slate-500 text-xs">In Bank</p>
            <p className="text-emerald-400 font-bold text-lg">{character.credits_bank.toLocaleString()} ₡</p>
          </div>
        </div>
      </div>

      {/* Section nav */}
      <div className="flex flex-wrap gap-2">
        {navItems.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setSection(key); setMessage(null); setError(null); }}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[44px] ${
              section === key
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {message && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-3 text-emerald-300 text-sm">{message}</div>
      )}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      {/* DEPOSIT / WITHDRAW */}
      {(section === 'deposit' || section === 'withdraw') && (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">
            {section === 'deposit'
              ? 'Move credits from your hand into the bank vault.'
              : 'Retrieve credits from the vault to your hand.'}
          </p>
          <input
            type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={1}
            placeholder="Amount..."
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[48px]"
          />
          <button
            onClick={handleAction} disabled={loading || !amount}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg min-h-[48px]"
          >
            {loading ? 'Processing...' : section === 'deposit' ? 'Deposit Credits' : 'Withdraw Credits'}
          </button>
        </div>
      )}

      {/* TRANSFER */}
      {section === 'transfer' && (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">Send credits to another operator by player ID or name.</p>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Search Player (Name or ID)</label>
            <input
              type="text" value={transferSearch}
              onChange={(e) => handlePlayerSearch(e.target.value)}
              placeholder="Enter player name or ID..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
            {transferResults.length > 0 && !selectedPlayer && (
              <ul className="mt-1 bg-slate-900 border border-slate-600 rounded-lg divide-y divide-slate-700">
                {transferResults.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => { setSelectedPlayer(p); setTransferSearch(p.username); setTransferResults([]); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                    >
                      <span className="font-semibold">{p.username}</span>
                      <span className="text-slate-500 ml-2 text-xs">Lv {p.level}</span>
                      <span className="text-slate-600 ml-2 text-xs font-mono">{p.id.slice(0, 8)}…</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedPlayer && (
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-cyan-400">→ {selectedPlayer.username}</span>
                <button onClick={() => { setSelectedPlayer(null); setTransferSearch(''); }} className="text-slate-500 hover:text-red-400">✕</button>
              </div>
            )}
          </div>
          <input
            type="number" value={transferTarget}
            onChange={(e) => setTransferTarget(e.target.value)} min={1}
            placeholder="Amount to transfer..."
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[48px]"
          />
          <button
            onClick={handleAction} disabled={loading || !selectedPlayer || !transferTarget}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg min-h-[48px]"
          >
            {loading ? 'Processing...' : `Transfer to ${selectedPlayer?.username ?? 'Player'}`}
          </button>
        </div>
      )}

      {/* LOAN */}
      {section === 'loan' && (
        <div className="space-y-4">
          {character.loan_amount > 0 ? (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 space-y-3">
              <p className="text-red-300 font-semibold">📋 Outstanding Loan</p>
              <p className="text-slate-300 text-sm">
                You owe <span className="text-amber-400 font-bold">{character.loan_amount.toLocaleString()} ₡</span> to the Bureau.
              </p>
              <p className="text-slate-400 text-xs">
                Total repayment (6.9% surcharge): <span className="text-red-300 font-semibold">{totalRepay.toLocaleString()} ₡</span>
              </p>
              <button
                onClick={handleRepayLoan} disabled={loading}
                className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg min-h-[48px]"
              >
                {loading ? 'Processing...' : `Repay ${totalRepay.toLocaleString()} ₡`}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-800/60 border border-slate-600 rounded-lg p-4 text-sm text-slate-300">
                <p>According to my computer, you can borrow up to{' '}
                  <span className="text-amber-400 font-bold">{maxLoan.toLocaleString()} ₡</span> credits.
                  How many would you like to borrow?
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  ⚠️ A 6.9% surcharge will be added to your loan.
                </p>
              </div>
              {maxLoan <= 0 && (
                <p className="text-slate-500 text-xs">You need credits in the bank to take a loan.</p>
              )}
              <input
                type="number" value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)} min={1} max={maxLoan}
                placeholder={`Max ${maxLoan.toLocaleString()} ₡`}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[48px]"
              />
              {loanAmount && parseInt(loanAmount) > 0 && (
                <p className="text-slate-400 text-xs">
                  Total to repay: <span className="text-amber-400">{Math.ceil(parseInt(loanAmount) * 1.069).toLocaleString()} ₡</span>
                </p>
              )}
              <button
                onClick={handleAction}
                disabled={loading || !loanAmount || parseInt(loanAmount) <= 0 || parseInt(loanAmount) > maxLoan}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-lg min-h-[48px]"
              >
                {loading ? 'Processing...' : 'Request Loan'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* BONDS */}
      {section === 'bond' && (
        <div className="space-y-4">
          {/* Jessi NPC card */}
          <div className="bg-gradient-to-br from-violet-900/40 to-slate-800 border-2 border-violet-500/60 rounded-xl overflow-hidden">
            <div className="p-4 flex items-start gap-4">
              {/* NPC Portrait SVG */}
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 rounded-lg">
                <rect width="72" height="72" fill="#1a0a2e"/>
                {/* Background glow */}
                <circle cx="36" cy="36" r="30" fill="#2d1b69" opacity="0.4"/>
                {/* Body */}
                <rect x="22" y="44" width="28" height="28" rx="4" fill="#3b1f6e"/>
                {/* Vest detail */}
                <rect x="28" y="44" width="16" height="28" rx="2" fill="#4c2a8a"/>
                {/* Credit badge on vest */}
                <circle cx="36" cy="55" r="5" fill="#7c3aed" stroke="#a78bfa" strokeWidth="1"/>
                <text x="36" y="58" textAnchor="middle" fill="#f59e0b" fontSize="5" fontWeight="bold">₡</text>
                {/* Head */}
                <ellipse cx="36" cy="30" rx="11" ry="13" fill="#c9956a"/>
                {/* Hair */}
                <ellipse cx="36" cy="20" rx="11" ry="6" fill="#2d1b00"/>
                {/* Eyes */}
                <ellipse cx="31" cy="28" rx="2" ry="2.5" fill="#1a0a2e"/>
                <ellipse cx="41" cy="28" rx="2" ry="2.5" fill="#1a0a2e"/>
                <circle cx="31.5" cy="27.5" r="0.7" fill="white"/>
                <circle cx="41.5" cy="27.5" r="0.7" fill="white"/>
                {/* Smile with gap tooth */}
                <path d="M30 34 Q33 37 36 34 Q39 37 42 34" stroke="#6b3200" strokeWidth="1.2" fill="none"/>
                {/* Missing tooth gap */}
                <rect x="35" y="34.5" width="2.5" height="2.5" fill="#c9956a"/>
                {/* Cybernetic eye enhancement */}
                <circle cx="41" cy="28" r="3" fill="none" stroke="#7c3aed" strokeWidth="0.8" opacity="0.7"/>
                {/* Credits necklace */}
                <path d="M26 41 Q36 45 46 41" stroke="#f59e0b" strokeWidth="1" fill="none"/>
              </svg>
              <div>
                <h3 className="text-violet-300 font-bold text-base">Jessi &quot;Missing Tooth&quot; Law</h3>
                <p className="text-slate-400 text-xs mt-1 italic leading-relaxed">
                  &quot;Listen, I don&apos;t ask where the credits come from. You put them in, I grow them, you collect when it matures. I deal in cash only — have it with you when you want to give it. Simple.&quot;
                </p>
              </div>
            </div>
            <div className="border-t border-violet-700/40 p-3 bg-violet-900/20">
              <p className="text-violet-300 text-xs">
                When your bond matures, I&apos;ll transfer the money directly to your bank account.
                One bond at a time — max 1,000,000 ₡.
              </p>
            </div>
          </div>

          {hasBond ? (
            <div className="bg-slate-800 border border-violet-500/40 rounded-lg p-4 space-y-2">
              <p className="text-violet-300 font-semibold text-sm">📜 Active Bond</p>
              <p className="text-slate-300 text-sm">
                <span className="text-amber-400 font-bold">{character.bond_amount.toLocaleString()} ₡</span> locked in
                at <span className="text-violet-400">{(character.bond_rate * 100).toFixed(2)}%</span>
              </p>
              <p className="text-slate-400 text-xs">
                Matures: <span className="text-slate-300">{character.bond_matures_at ? new Date(character.bond_matures_at).toLocaleDateString() : '—'}</span>
              </p>
              <p className="text-emerald-400 text-sm font-semibold">
                Return: {bondReturn.toLocaleString()} ₡ (+{((character.bond_rate) * 100).toFixed(2)}%)
              </p>
              {bondMatured && (
                <p className="text-emerald-300 text-xs animate-pulse">✅ Bond has matured — will be credited on your next visit.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Bond rates table */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div className="p-2 border-b border-slate-700">
                  <p className="text-slate-300 text-xs font-semibold">Bond Rates</p>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700">
                      <th className="text-left px-3 py-2">Duration</th>
                      <th className="text-right px-3 py-2">Rate</th>
                      <th className="text-right px-3 py-2">1,000 ₡ returns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BOND_RATES.map((r) => (
                      <tr key={r.days} className={`border-b border-slate-700/50 ${bondDays === r.days ? 'bg-violet-900/20' : ''}`}>
                        <td className="px-3 py-2 text-slate-300">{r.days} days</td>
                        <td className="px-3 py-2 text-right text-violet-400 font-semibold">{(r.rate * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2 text-right text-emerald-400">{Math.floor(1000 * (1 + r.rate)).toLocaleString()} ₡</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Bond Duration</label>
                <select
                  value={bondDays}
                  onChange={(e) => setBondDays(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3 text-slate-100 focus:outline-none focus:border-violet-500 min-h-[48px]"
                >
                  {BOND_RATES.map((r) => (
                    <option key={r.days} value={r.days}>{r.label}</option>
                  ))}
                </select>
              </div>
              <input
                type="number" value={bondAmount}
                onChange={(e) => setBondAmount(e.target.value)} min={1} max={1000000}
                placeholder="Amount (max 1,000,000 ₡)..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 min-h-[48px]"
              />
              {bondAmount && parseInt(bondAmount) > 0 && (
                <p className="text-slate-400 text-xs">
                  You&apos;ll receive{' '}
                  <span className="text-emerald-400 font-bold">
                    {Math.floor(parseInt(bondAmount) * (1 + (BOND_RATES.find(r => r.days === bondDays)?.rate ?? 0))).toLocaleString()} ₡
                  </span>{' '}
                  after {bondDays} days.
                </p>
              )}
              <button
                onClick={handleAction}
                disabled={loading || !bondAmount || parseInt(bondAmount) <= 0 || parseInt(bondAmount) > 1000000}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg min-h-[48px]"
              >
                {loading ? 'Processing...' : '📜 Purchase Bond'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

