'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Character } from '@/types/game';

export default function BankPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      const { data } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (data) setCharacter(data as Character);
    });
  }, [supabase, router]);

  async function handleTransaction() {
    if (!character || !amount) return;
    const n = parseInt(amount, 10);
    if (isNaN(n) || n <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setLoading(true);
    setMessage(null);
    setError(null);

    const resp = await fetch('/api/bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, amount: n }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      setError(data.error ?? 'Transaction failed.');
    } else {
      setMessage(data.message);
      const { data: updated } = await supabase
        .from('characters')
        .select('*')
        .eq('id', character.id)
        .single();
      if (updated) setCharacter(updated as Character);
      setAmount('');
    }

    setLoading(false);
  }

  if (!character) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-md space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-emerald-400">🏦 Bureau Bank</h1>
        <p className="text-slate-400 text-sm mt-1">
          Credits in the bank cannot be stolen in battle.
        </p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-slate-400 text-xs mb-1">On Hand</p>
          <p className="text-amber-400 font-bold text-xl">
            {character.credits_hand.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-xs mb-1">In Bank</p>
          <p className="text-emerald-400 font-bold text-xl">
            {character.credits_bank.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['deposit', 'withdraw'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[48px] ${
              action === a
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {a === 'deposit' ? '⬇️ Deposit' : '⬆️ Withdraw'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-slate-300 text-sm mb-1">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={1}
          placeholder="Enter credits..."
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[48px]"
        />
      </div>

      {message && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-3 text-emerald-300 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleTransaction}
        disabled={loading || !amount}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors min-h-[48px]"
      >
        {loading ? 'Processing...' : action === 'deposit' ? 'Deposit Credits' : 'Withdraw Credits'}
      </button>
    </div>
  );
}
