'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const SYMBOLS = ['🎰', '💎', '⚡', '🔥', '💀', '🪙'];

const PAYOUTS: Record<string, number> = {
  '🎰': 50,
  '💎': 20,
  '⚡': 10,
  '🔥': 5,
  '💀': 3,
  '🪙': 2,
};

export default function SlotsPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [charId, setCharId] = useState<string | null>(null);
  const [bet, setBet] = useState(50);
  const [reels, setReels] = useState<string[]>(['🎰', '💎', '⚡']);
  const [spinning, setSpinning] = useState(false);
  const [spinningReels, setSpinningReels] = useState([false, false, false]);
  const [resultLabel, setResultLabel] = useState<string | null>(null);
  const [netChange, setNetChange] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashClass, setFlashClass] = useState('');
  const router = useRouter();
  const supabase = createClient();
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      const { data } = await supabase
        .from('characters')
        .select('id, credits_hand, level')
        .eq('user_id', session.user.id)
        .single();
      if (!data || data.level < 8) { router.push('/station'); return; }
      setCredits(data.credits_hand);
      setCharId(data.id);
    });
  }, []);

  // Animate spinning reels with random symbols
  useEffect(() => {
    if (spinning) {
      tickerRef.current = setInterval(() => {
        setReels([
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ]);
      }, 80);
    } else {
      if (tickerRef.current) clearInterval(tickerRef.current);
    }
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [spinning]);

  async function spin() {
    if (spinning || credits === null || credits < bet) return;
    setError(null);
    setResultLabel(null);
    setNetChange(null);
    setFlashClass('');
    setSpinning(true);
    setSpinningReels([true, true, true]);

    const resp = await fetch('/api/casino', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'slots', bet }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      setSpinning(false);
      setSpinningReels([false, false, false]);
      setError(data.error ?? 'Spin failed.');
      return;
    }

    // Stop reels one by one with animation
    const finalReels: string[] = data.reels;
    setTimeout(() => {
      setReels([finalReels[0], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]]);
      setSpinningReels([false, true, true]);
    }, 600);
    setTimeout(() => {
      setReels([finalReels[0], finalReels[1], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]]);
      setSpinningReels([false, false, true]);
    }, 1000);
    setTimeout(() => {
      setSpinning(false);
      setSpinningReels([false, false, false]);
      setReels(finalReels);
      setResultLabel(data.label);
      setNetChange(data.net_change);
      setCredits(data.new_credits);
      setFlashClass(data.payout > 0 ? 'win-flash' : 'lose-flash');
    }, 1400);
  }

  const isJackpot = reels[0] === reels[1] && reels[1] === reels[2] && !spinning && resultLabel?.includes('JACKPOT');

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-red-900 pb-4">
        <Link href="/station/underbelly" className="text-slate-400 hover:text-slate-200 text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-red-400">🎰 Slot Machine</h1>
      </div>

      {credits !== null && (
        <div className="text-sm text-slate-400">
          Credits on hand: <span className="text-amber-400 font-bold">{credits.toLocaleString()} ₡</span>
        </div>
      )}

      {/* Reels */}
      <div className={`bg-slate-900 border-2 ${isJackpot ? 'border-amber-400' : 'border-red-900'} rounded-2xl p-6 transition-colors`}>
        <div className={`flex justify-center gap-4 mb-4 rounded-xl p-4 ${flashClass}`}>
          {reels.map((sym, i) => (
            <div
              key={i}
              className={`w-20 h-20 bg-slate-800 border-2 border-slate-600 rounded-xl flex items-center justify-center text-4xl
                ${spinningReels[i] ? 'slot-reel-spinning' : 'slot-reel-stop'}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {sym}
            </div>
          ))}
        </div>

        {isJackpot && (
          <div className="text-center text-amber-400 font-bold text-lg animate-bounce">
            ★ JACKPOT! ★
          </div>
        )}

        {/* Paytable */}
        <div className="grid grid-cols-3 gap-1 text-xs text-slate-500 mt-3 border-t border-slate-700 pt-3">
          {Object.entries(PAYOUTS).map(([sym, mult]) => (
            <div key={sym} className="flex items-center gap-1">
              <span>{sym}{sym}{sym}</span>
              <span className="text-amber-400">{mult}x</span>
            </div>
          ))}
          <div className="flex items-center gap-1 col-span-3 text-slate-600">
            <span>Two match = 1.2x</span>
          </div>
        </div>
      </div>

      {/* Result */}
      {resultLabel && (
        <div className={`rounded-lg p-3 text-sm text-center font-bold ${netChange !== null && netChange > 0 ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-300' : 'bg-red-900/20 border border-red-800 text-red-400'}`}>
          {resultLabel}
          {netChange !== null && (
            <span className="ml-2">
              {netChange > 0 ? `+${netChange.toLocaleString()}` : netChange.toLocaleString()} ₡
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

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
          className="w-full accent-red-500"
        />
        <div className="flex gap-2">
          {[50, 100, 500, 1000].map((v) => (
            <button
              key={v}
              onClick={() => setBet(Math.min(v, credits ?? v))}
              className="flex-1 py-1 text-xs bg-slate-800 border border-slate-600 rounded hover:border-red-600 text-slate-300 min-h-[40px]"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={spin}
        disabled={spinning || (credits ?? 0) < bet}
        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-colors min-h-[56px]"
      >
        {spinning ? '🎰 Spinning...' : (credits ?? 0) < bet ? 'Not enough credits' : `🎰 SPIN — ${bet.toLocaleString()} ₡`}
      </button>
    </div>
  );
}
