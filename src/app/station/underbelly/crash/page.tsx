'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Phase = 'idle' | 'flying' | 'crashed' | 'cashed';

const GROWTH_RATE = 0.08; // seconds to tick
const TICK_MS = 50;

export default function CrashPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [bet, setBet] = useState(200);
  const [phase, setPhase] = useState<Phase>('idle');
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [result, setResult] = useState<{ won: boolean; payout: number; net_change: number; crash_point: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ crash: number; won: boolean }[]>([]);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
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

  // Multiplier growth: 1x → exponential
  function calcMultiplier(elapsed: number): number {
    return Math.floor((Math.pow(1.0 + GROWTH_RATE, elapsed / 1000)) * 100) / 100;
  }

  async function startGame() {
    if (phase === 'flying' || credits === null || credits < bet) return;
    setError(null);
    setResult(null);
    setMultiplier(1.0);
    setCrashPoint(null);

    const resp = await fetch('/api/casino/crash/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      setError(data.error ?? 'Failed to start game.');
      return;
    }

    setCredits(data.new_credits);
    setToken(data.token);
    setPhase('flying');
    startTimeRef.current = Date.now();

    tickerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const m = calcMultiplier(elapsed);
      setMultiplier(m);
    }, TICK_MS);
  }

  const cashout = useCallback(async () => {
    if (phase !== 'flying' || !token) return;
    const currentMult = calcMultiplier(Date.now() - startTimeRef.current);

    if (tickerRef.current) clearInterval(tickerRef.current);

    const resp = await fetch('/api/casino/crash/cashout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, cashout_multiplier: currentMult }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      setError(data.error ?? 'Cashout failed.');
      setPhase('idle');
      return;
    }

    setResult({
      won: data.won,
      payout: data.payout,
      net_change: data.net_change,
      crash_point: data.crash_point,
    });
    setCrashPoint(data.crash_point);
    setCredits(data.new_credits);
    setMultiplier(data.won ? currentMult : data.crash_point);
    setPhase(data.won ? 'cashed' : 'crashed');
    setToken(null);
    setHistory((h) => [{ crash: data.crash_point, won: data.won }, ...h.slice(0, 9)]);
  }, [phase, token]);

  // Auto-crash check — server decides, but we simulate client-side crash visual
  // We check if current multiplier exceeds a reasonable max and auto-cashout
  useEffect(() => {
    if (phase !== 'flying') return;
    // Safety: auto-cashout at 100x (server may crash earlier)
    if (multiplier >= 100) {
      cashout();
    }
  }, [multiplier, phase, cashout]);

  useEffect(() => {
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, []);

  const multColor =
    multiplier < 1.5 ? 'text-slate-300' :
    multiplier < 2 ? 'text-emerald-400' :
    multiplier < 5 ? 'text-cyan-400' :
    multiplier < 10 ? 'text-amber-400' : 'text-red-400';

  const rocketY = Math.min(80, (multiplier - 1) * 15);

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3 border-b border-red-900 pb-4">
        <Link href="/station/underbelly" className="text-slate-400 hover:text-slate-200 text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-red-400">🚀 Crash</h1>
      </div>

      {credits !== null && (
        <div className="text-sm text-slate-400">
          Credits on hand: <span className="text-amber-400 font-bold">{credits.toLocaleString()} ₡</span>
        </div>
      )}

      {/* Crash Display */}
      <div className={`bg-slate-900 border border-red-900 rounded-2xl overflow-hidden h-48 relative flex flex-col items-center justify-center
        ${phase === 'crashed' ? 'crash-explode border-red-500' : ''}
        ${phase === 'cashed' ? 'border-emerald-500' : ''}`}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute w-full border-t border-slate-400" style={{ top: `${(i + 1) * 20}%` }} />
          ))}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute h-full border-l border-slate-400" style={{ left: `${(i + 1) * 20}%` }} />
          ))}
        </div>

        {/* Rocket */}
        <div
          className="absolute text-4xl transition-all duration-75"
          style={{ bottom: `${20 + rocketY}%`, transform: phase === 'crashed' ? 'rotate(45deg) scale(0.5)' : 'rotate(-45deg)' }}
        >
          {phase === 'crashed' ? '💥' : '🚀'}
        </div>

        {/* Multiplier */}
        <div className={`text-6xl font-bold font-mono z-10 ${multColor} ${phase === 'flying' ? 'number-tick' : ''}`}
          key={Math.floor(multiplier * 10)}
        >
          {multiplier.toFixed(2)}x
        </div>

        {phase === 'crashed' && (
          <div className="text-red-400 text-sm font-bold mt-2">CRASHED @ {crashPoint?.toFixed(2)}x</div>
        )}
        {phase === 'cashed' && (
          <div className="text-emerald-400 text-sm font-bold mt-2">CASHED OUT! 🎉</div>
        )}
        {phase === 'idle' && (
          <div className="text-slate-500 text-sm mt-2">Place your bet and launch</div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-lg p-3 text-sm text-center font-bold ${result.won ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-300' : 'bg-red-900/20 border border-red-800 text-red-400'}`}>
          {result.won
            ? `✅ Cashed out at ${multiplier.toFixed(2)}x — +${result.payout.toLocaleString()} ₡`
            : `💥 Crashed at ${result.crash_point.toFixed(2)}x — ${result.net_change.toLocaleString()} ₡`}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Crash History */}
      {history.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {history.map((h, i) => (
            <span
              key={i}
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                h.crash < 1.5 ? 'bg-red-900/50 text-red-400' :
                h.crash < 3 ? 'bg-slate-700 text-slate-300' :
                h.crash < 10 ? 'bg-cyan-900/50 text-cyan-400' :
                'bg-amber-900/50 text-amber-400'
              }`}
            >
              {h.crash.toFixed(2)}x
            </span>
          ))}
        </div>
      )}

      {/* Bet Control */}
      {phase === 'idle' && (
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
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={phase === 'idle' || phase === 'crashed' || phase === 'cashed' ? startGame : undefined}
          disabled={phase === 'flying' || (credits ?? 0) < bet}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-colors min-h-[56px]"
        >
          {phase === 'idle' ? `🚀 LAUNCH — ${bet.toLocaleString()} ₡` :
           phase === 'flying' ? '🚀 Flying...' : '🚀 Play Again'}
        </button>
        <button
          onClick={cashout}
          disabled={phase !== 'flying'}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-bold py-4 rounded-xl text-lg transition-colors min-h-[56px]"
        >
          {phase === 'flying' ? `💰 CASH OUT (${multiplier.toFixed(2)}x)` : '💰 Cash Out'}
        </button>
      </div>

      <p className="text-xs text-slate-600 text-center">
        Provably fair. House edge 4%. 48% of rounds reach 2x.
      </p>
    </div>
  );
}
