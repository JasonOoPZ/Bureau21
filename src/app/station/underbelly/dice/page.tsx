'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const DICE_FACES: Record<number, string[][]> = {
  1: [['', '', ''], ['', '●', ''], ['', '', '']],
  2: [['●', '', ''], ['', '', ''], ['', '', '●']],
  3: [['●', '', ''], ['', '●', ''], ['', '', '●']],
  4: [['●', '', '●'], ['', '', ''], ['●', '', '●']],
  5: [['●', '', '●'], ['', '●', ''], ['●', '', '●']],
  6: [['●', '', '●'], ['●', '', '●'], ['●', '', '●']],
};

function DieFace({ value, rolling }: { value: number; rolling: boolean }) {
  const face = DICE_FACES[value] ?? DICE_FACES[1];
  return (
    <div
      className={`w-20 h-20 bg-slate-100 rounded-xl border-4 border-slate-300 grid grid-rows-3 p-2 gap-0.5
        ${rolling ? 'dice-roll' : ''}`}
    >
      {face.map((row, r) => (
        <div key={r} className="flex justify-between items-center px-1">
          {row.map((dot, c) => (
            <span key={c} className={`text-slate-900 text-xs ${dot ? 'opacity-100' : 'opacity-0'}`}>
              {dot}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function DicePage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [bet, setBet] = useState(100);
  const [choice, setChoice] = useState<'over' | 'under' | 'seven'>('over');
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [rolling, setRolling] = useState(false);
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

  async function roll() {
    if (rolling || credits === null || credits < bet) return;
    setError(null);
    setResult(null);
    setFlashClass('');
    setRolling(true);

    // Animate dice randomly while waiting
    const interval = setInterval(() => {
      setDice([
        (Math.floor(Math.random() * 6) + 1) as 1,
        (Math.floor(Math.random() * 6) + 1) as 1,
      ]);
    }, 100);

    const resp = await fetch('/api/casino', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'dice', bet, choice }),
    });
    const data = await resp.json();

    clearInterval(interval);

    setTimeout(() => {
      setRolling(false);
      if (!resp.ok) {
        setError(data.error ?? 'Roll failed.');
        return;
      }
      setDice(data.dice);
      setResult({ label: data.label, payout: data.payout, net_change: data.net_change });
      setCredits(data.new_credits);
      setFlashClass(data.payout > 0 ? 'win-flash' : 'lose-flash');
    }, 700);
  }

  const CHOICES = [
    { key: 'under' as const, label: '< 7', desc: 'Under 7', odds: '1.9x', prob: '41.7%' },
    { key: 'seven' as const, label: '= 7', desc: 'Exactly 7', odds: '4x', prob: '16.7%' },
    { key: 'over' as const, label: '> 7', desc: 'Over 7', odds: '1.9x', prob: '41.7%' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-red-900 pb-4">
        <Link href="/station/underbelly" className="text-slate-400 hover:text-slate-200 text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-red-400">🎲 Dice Pit</h1>
      </div>

      {credits !== null && (
        <div className="text-sm text-slate-400">
          Credits on hand: <span className="text-amber-400 font-bold">{credits.toLocaleString()} ₡</span>
        </div>
      )}

      {/* Dice Display */}
      <div className={`bg-slate-900 border border-red-900 rounded-2xl p-8 flex flex-col items-center gap-6 ${flashClass}`}>
        <div className="flex gap-6 items-center">
          <DieFace value={dice[0]} rolling={rolling} />
          <span className="text-slate-400 text-3xl font-bold">+</span>
          <DieFace value={dice[1]} rolling={rolling} />
        </div>
        <div className="text-4xl font-bold text-slate-100">
          {dice[0] + dice[1]}
        </div>
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

      {/* Bet Choice */}
      <div className="grid grid-cols-3 gap-3">
        {CHOICES.map((c) => (
          <button
            key={c.key}
            onClick={() => setChoice(c.key)}
            className={`p-3 rounded-xl border-2 text-center transition-colors min-h-[80px] ${
              choice === c.key ? 'border-red-500 bg-red-900/30' : 'border-slate-600 bg-slate-800 hover:border-slate-500'
            }`}
          >
            <div className="text-xl font-bold text-slate-100">{c.label}</div>
            <div className="text-xs text-slate-400 mt-1">{c.desc}</div>
            <div className="text-xs text-amber-400 font-bold mt-1">{c.odds}</div>
            <div className="text-xs text-slate-500">{c.prob}</div>
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
          className="w-full accent-red-500"
        />
        <div className="flex gap-2">
          {[100, 250, 500, 1000].map((v) => (
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
        onClick={roll}
        disabled={rolling || (credits ?? 0) < bet}
        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-colors min-h-[56px]"
      >
        {rolling ? '🎲 Rolling...' : (credits ?? 0) < bet ? 'Not enough credits' : `🎲 ROLL — ${bet.toLocaleString()} ₡`}
      </button>
    </div>
  );
}
