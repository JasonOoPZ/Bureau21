'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Character } from '@/types/game';

const herbs = [
  {
    name: 'Green Herb',
    rarity: 'common',
    chance: 0.6,
    icon: '🌿',
    heal: 50,
    color: 'text-emerald-400',
  },
  {
    name: 'Red Herb',
    rarity: 'uncommon',
    chance: 0.3,
    icon: '🌹',
    heal: 100,
    color: 'text-red-400',
  },
  {
    name: 'Golden Herb',
    rarity: 'rare',
    chance: 0.09,
    icon: '✨',
    heal: 200,
    color: 'text-yellow-400',
  },
  {
    name: 'Blue Herb',
    rarity: 'legendary',
    chance: 0.01,
    icon: '💙',
    heal: 200,
    revive: true,
    color: 'text-blue-400',
  },
];

export default function HydroponicsPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
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

  async function handlePick() {
    if (!character) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const resp = await fetch('/api/herbs', { method: 'POST' });
    const data = await resp.json();

    if (!resp.ok) {
      setError(data.error ?? 'Failed to pick herb.');
    } else {
      setResult(data.message ?? `Found: ${data.herb_name}`);
      const { data: updated } = await supabase
        .from('characters')
        .select('*')
        .eq('id', character.id)
        .single();
      if (updated) setCharacter(updated as Character);
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
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-emerald-400">🌿 Hydroponics Bay</h1>
        <p className="text-slate-400 text-sm mt-1">
          Pick alien herbs to heal, revive, or sell.
        </p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
        <h2 className="text-slate-300 font-semibold text-sm">Herb Drop Rates</h2>
        <div className="grid grid-cols-2 gap-2">
          {herbs.map((h) => (
            <div key={h.name} className="flex items-center gap-2 text-sm">
              <span>{h.icon}</span>
              <div>
                <span className={`font-medium ${h.color}`}>{h.name}</span>
                <span className="text-slate-500 text-xs ml-1">({(h.chance * 100).toFixed(0)}%)</span>
                <p className="text-slate-500 text-xs">
                  {h.revive ? 'Revive + 200 LF' : `+${h.heal} LF`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {result && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-3 text-emerald-300 text-sm">
          {result}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handlePick}
        disabled={loading || character.motivation < 5}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-lg transition-colors min-h-[48px] text-lg"
      >
        {loading ? 'Searching...' : character.motivation < 5 ? '⚡ Not enough motivation' : '🌿 Pick Herbs (5 motivation)'}
      </button>
    </div>
  );
}
