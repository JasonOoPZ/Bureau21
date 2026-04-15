'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  rank: string;
}

type BJStatus = 'idle' | 'playing' | 'done';

const RED_SUITS = new Set(['♥', '♦']);

function CardView({ card, hidden, index }: { card?: Card; hidden?: boolean; index: number }) {
  if (hidden || !card) {
    return (
      <div
        className="card-deal w-14 h-20 rounded-lg border-2 border-slate-500 bg-slate-700 flex items-center justify-center text-2xl select-none"
        style={{ animationDelay: `${index * 0.15}s` }}
      >
        🂠
      </div>
    );
  }
  const isRed = RED_SUITS.has(card.suit);
  return (
    <div
      className={`card-deal w-14 h-20 rounded-lg border-2 border-slate-400 bg-slate-100 flex flex-col justify-between p-1 select-none
        ${isRed ? 'text-red-600' : 'text-slate-900'}`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="text-xs font-bold leading-none">{card.rank}{card.suit}</div>
      <div className="text-xl font-bold text-center">{card.suit}</div>
      <div className="text-xs font-bold leading-none text-right">{card.rank}{card.suit}</div>
    </div>
  );
}

function Hand({ cards, hidden, label, value }: { cards: Card[]; hidden?: boolean; label: string; value?: number }) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-2">
        {label}
        {value !== undefined && (
          <span className={`ml-2 font-bold ${value > 21 ? 'text-red-400' : value === 21 ? 'text-amber-400' : 'text-slate-200'}`}>
            {value > 21 ? 'BUST!' : value}
          </span>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {cards.map((card, i) =>
          hidden && i === 1
            ? <CardView key={i} hidden index={i} />
            : <CardView key={i} card={card} index={i} />
        )}
      </div>
    </div>
  );
}

const OUTCOME_MSGS: Record<string, string> = {
  blackjack: '🃏 BLACKJACK! — 2.5x',
  win: '✅ You win! — 2x',
  push: '🤝 Push — bet returned',
  bust: '💥 Bust! — you lose',
  lose: '❌ Dealer wins',
  dealer_bust: '🎉 Dealer busts! — 2x',
  dealer_blackjack: '🃏 Dealer Blackjack — you lose',
};

export default function BlackjackPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [bet, setBet] = useState(200);
  const [status, setStatus] = useState<BJStatus>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerUpcard, setDealerUpcard] = useState<Card | null>(null);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerValue, setPlayerValue] = useState(0);
  const [dealerValue, setDealerValue] = useState(0);
  const [canDouble, setCanDouble] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [netChange, setNetChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  async function bjAction(action: 'deal' | 'hit' | 'stand' | 'double', opts?: { bet?: number; token?: string }) {
    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = { action };
    if (action === 'deal') body.bet = opts?.bet ?? bet;
    else body.token = opts?.token ?? token;

    const resp = await fetch('/api/casino/blackjack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    setLoading(false);

    if (!resp.ok) {
      setError(data.error ?? 'Action failed.');
      return;
    }

    if (action === 'deal') {
      setToken(data.token);
      setPlayerHand(data.playerHand);
      setDealerUpcard(data.dealerUpcard);
      setDealerHand([data.dealerUpcard, { suit: '♠', rank: '?' }]);
      setPlayerValue(data.playerValue);
      setDealerValue(0);
      setStatus(data.isBlackjack ? 'done' : 'playing');
      setCanDouble(credits !== null && credits - bet >= bet);
      setOutcome(data.isBlackjack ? 'blackjack' : null);
      if (data.isBlackjack) {
        // Auto-stand on blackjack
        await bjAction('stand', { token: data.token });
      }
    } else if (action === 'hit' && data.status === 'playing') {
      setToken(data.token);
      setPlayerHand(data.playerHand);
      setPlayerValue(data.playerValue);
      setCanDouble(false);
    } else {
      // Terminal state (bust, stand, double)
      setStatus('done');
      setPlayerHand(data.playerHand ?? playerHand);
      setDealerHand(data.dealerHand ?? dealerHand);
      setPlayerValue(data.playerValue ?? playerValue);
      setDealerValue(data.dealerValue ?? 0);
      setOutcome(data.outcome);
      setNetChange(data.net_change);
      setCredits(data.new_credits);
      setToken(null);
    }
  }

  function reset() {
    setStatus('idle');
    setToken(null);
    setPlayerHand([]);
    setDealerHand([]);
    setDealerUpcard(null);
    setPlayerValue(0);
    setDealerValue(0);
    setOutcome(null);
    setNetChange(null);
    setError(null);
  }

  const isPlaying = status === 'playing';
  const isDone = status === 'done';

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-red-900 pb-4">
        <Link href="/station/underbelly" className="text-slate-400 hover:text-slate-200 text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-red-400">🃏 Blackjack</h1>
      </div>

      {credits !== null && (
        <div className="text-sm text-slate-400">
          Credits on hand: <span className="text-amber-400 font-bold">{credits.toLocaleString()} ₡</span>
        </div>
      )}

      {/* Table */}
      <div className={`bg-emerald-950 border-2 rounded-2xl p-6 space-y-6 min-h-[320px]
        ${isDone && outcome && ['win','blackjack','dealer_bust'].includes(outcome) ? 'border-emerald-500' : ''}
        ${isDone && outcome && ['bust','lose','dealer_blackjack'].includes(outcome) ? 'border-red-600' : ''}
        ${!isDone ? 'border-emerald-900' : ''}`}
      >
        {/* Dealer hand */}
        {(isPlaying || isDone) && (
          <Hand
            cards={dealerHand}
            hidden={isPlaying}
            label="Dealer"
            value={isDone ? dealerValue : undefined}
          />
        )}

        {/* Divider */}
        {(isPlaying || isDone) && <hr className="border-emerald-800" />}

        {/* Player hand */}
        {(isPlaying || isDone) && (
          <Hand
            cards={playerHand}
            label="You"
            value={playerValue}
          />
        )}

        {status === 'idle' && (
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
            Place your bet to deal
          </div>
        )}
      </div>

      {/* Outcome */}
      {isDone && outcome && (
        <div className={`rounded-lg p-3 text-sm text-center font-bold ${
          ['win','blackjack','dealer_bust'].includes(outcome)
            ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-300'
            : outcome === 'push'
            ? 'bg-slate-700 border border-slate-500 text-slate-200'
            : 'bg-red-900/20 border border-red-800 text-red-400'
        }`}>
          {OUTCOME_MSGS[outcome] ?? outcome}
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

      {/* Bet Controls — only when idle */}
      {status === 'idle' && (
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
            className="w-full accent-emerald-500"
          />
          <div className="flex gap-2">
            {[100, 250, 500, 1000].map((v) => (
              <button
                key={v}
                onClick={() => setBet(Math.min(v, credits ?? v))}
                className="flex-1 py-1 text-xs bg-slate-800 border border-slate-600 rounded hover:border-emerald-600 text-slate-300 min-h-[40px]"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {status === 'idle' && (
        <button
          onClick={() => bjAction('deal')}
          disabled={loading || (credits ?? 0) < bet}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-colors min-h-[56px]"
        >
          {loading ? 'Dealing...' : `🃏 DEAL — ${bet.toLocaleString()} ₡`}
        </button>
      )}

      {status === 'playing' && (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => bjAction('hit')}
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors min-h-[48px]"
          >
            Hit
          </button>
          <button
            onClick={() => bjAction('stand')}
            disabled={loading}
            className="bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors min-h-[48px]"
          >
            Stand
          </button>
          <button
            onClick={() => bjAction('double')}
            disabled={loading || !canDouble}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white font-bold py-3 rounded-xl transition-colors min-h-[48px]"
          >
            2x
          </button>
        </div>
      )}

      {status === 'done' && (
        <button
          onClick={reset}
          className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl text-lg transition-colors min-h-[56px]"
        >
          Deal Again
        </button>
      )}

      <div className="text-xs text-slate-600 text-center">
        Blackjack pays 2.5x · Dealer stands on 17 · Double on first two cards
      </div>
    </div>
  );
}
