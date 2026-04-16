'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function CoinFlipPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [bet, setBet] = useState(100);
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [coinResult, setCoinResult] = useState<'heads' | 'tails'>('heads');
  const [flipping, setFlipping] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ label: string; payout: number; net_change: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashClass, setFlashClass] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      const { data } = await supabase
        .from('characters')
        .select('credits_hand, level')
        .eq('user_id', session.user.id)
        .single();
      if (!data || data.level < 8) { router.push('/station'); return; }
      setCredits(data.credits_hand);
    });
  }, []);

  async function flip() {
    if (flipping || credits === null || credits < bet) return;
    setError(null);
    setResult(null);
    setFlashClass('');
    setShowResult(false);
    setFlipping(true);

    const resp = await fetch('/api/casino', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'coinflip', bet, choice }),
    });
    const data = await resp.json();

    setTimeout(() => {
      setFlipping(false);
      if (!resp.ok) {
        setError(data.error ?? 'Flip failed.');
        return;
      }
      setCoinResult(data.result);
      setShowResult(true);
      setResult({ label: data.label, payout: data.payout, net_change: data.net_change });
      setCredits(data.new_credits);
      setFlashClass(data.payout > 0 ? 'win-flash' : 'lose-flash');
    }, 950);
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-red-900 pb-4">
        <Link href="/station/underbelly" className="text-slate-400 hover:text-slate-200 text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-red-400">🪙 Coin Flip</h1>
      </div>

      {credits !== null && (
        <div className="text-sm text-slate-400">
          Credits on hand: <span className="text-amber-400 font-bold">{credits.toLocaleString()} ₡</span>
        </div>
      )}

      {/* Coin Display */}
      <div className={`bg-slate-900 border border-red-900 rounded-2xl p-10 flex flex-col items-center gap-6 ${flashClass}`}>
        <div
          className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-5xl select-none
            ${flipping ? 'coin-flipping' : ''}
            ${showResult
              ? coinResult === 'heads'
                ? 'bg-amber-500 border-amber-300'
                : 'bg-slate-600 border-slate-400'
              : 'bg-amber-500 border-amber-300'
            }`}
        >
          {showResult ? (coinResult === 'heads' ? '🌟' : '💀') : '🌟'}
        </div>
        {showResult && (
          <div className="text-2xl font-bold text-slate-100 uppercase tracking-widest">
            {coinResult}
          </div>
        )}
        {flipping && (
          <div className="text-slate-400 text-sm animate-pulse">Flipping...</div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-lg p-3 text-sm text-center font-bold ${result.payout > 0 ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-300' : 'bg-red-900/20 border border-red-800 text-red-400'}`}>
          {result.label}
          <span className="ml-2">{result.net_change > 0 ? `+${result.net_change.toLocaleString()}` : result.net_change.toLocaleString()} ₡</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Heads / Tails Choice */}
      <div className="grid grid-cols-2 gap-4">
        {(['heads', 'tails'] as const).map((side) => (
          <button
            key={side}
            onClick={() => setChoice(side)}
            className={`p-5 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors min-h-[100px] ${
              choice === side ? 'border-amber-500 bg-amber-900/20' : 'border-slate-600 bg-slate-800 hover:border-slate-500'
            }`}
          >
            <div className="text-4xl">{side === 'heads' ? '🌟' : '💀'}</div>
            <div className="text-slate-200 font-bold capitalize">{side}</div>
            <div className="text-xs text-amber-400">1.95x payout</div>
          </button>
        ))}
      </div>

      {/* Bet Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Bet Amount</span>
          <span className="text-amber-400 font-bold font-mono">{bet.toLocaleString()} ₡</span>
        </div>
        <input
          type="range"
          min={10}
          max={Math.min(10000, credits ?? 10000)}
          step={10}
          value={bet}
          onChange={(e) => setBet(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
        <div className="flex gap-2">
          {[50, 100, 500, 1000].map((v) => (
            <button
              key={v}
              onClick={() => setBet(Math.min(v, credits ?? v))}
              className="flex-1 py-1 text-xs bg-slate-800 border border-slate-600 rounded hover:border-amber-600 text-slate-300 min-h-[40px]"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={flip}
        disabled={flipping || (credits ?? 0) < bet}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold py-4 rounded-xl text-lg transition-colors min-h-[56px]"
      >
        {flipping ? '🪙 Flipping...' : (credits ?? 0) < bet ? 'Not enough credits' : `🪙 FLIP ${choice.toUpperCase()} — ${bet.toLocaleString()} ₡`}
      </button>
    </div>
  );
}
