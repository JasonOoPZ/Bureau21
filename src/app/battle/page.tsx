'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import BattleLog from '@/components/BattleLog';
import LifeForceBar from '@/components/LifeForceBar';
import { Character } from '@/types/game';
import { isProtected } from '@/lib/constants';

export default function BattlePage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [targets, setTargets] = useState<Character[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
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
      if (data) {
        setCharacter(data as Character);
        loadTargets(data.id, data.level);
      }
    });
  }, [supabase, router]);

  async function loadTargets(myId: string, myLevel: number) {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .neq('id', myId)
      .eq('is_dead', false)
      .gte('level', Math.max(1, myLevel - 5))
      .lte('level', myLevel + 5)
      .limit(10);
    if (data) {
      const eligible = (data as Character[]).filter(
        (c) => !isProtected(c.age_days, c.level)
      );
      setTargets(eligible);
    }
  }

  async function handleBattle() {
    if (!character || !selectedTarget) return;
    setLoading(true);
    setError(null);
    setBattleLog([]);

    const resp = await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defender_id: selectedTarget }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      setError(data.error ?? 'Battle failed.');
    } else {
      setBattleLog(data.log_entries ?? []);
      const { data: updated } = await supabase
        .from('characters')
        .select('*')
        .eq('id', character.id)
        .single();
      if (updated) {
        setCharacter(updated as Character);
        loadTargets(updated.id, updated.level);
      }
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
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-amber-500">⚔️ Battle Arena</h1>
        <p className="text-slate-400 text-sm mt-1">
          Fight operators within 5 levels of you.
        </p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
        <h2 className="text-slate-300 font-semibold">Your Status</h2>
        <LifeForceBar
          current={character.life_force}
          max={character.max_life_force}
          isDead={character.is_dead}
        />
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center">
            <p className="text-slate-400 text-xs">Level</p>
            <p className="text-amber-400 font-bold">{character.level}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs">Credits (Hand)</p>
            <p className="text-amber-400 font-bold">{character.credits_hand.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs">ATK Split</p>
            <p className="text-amber-400 font-bold">{character.atk_def_split}%</p>
          </div>
        </div>
      </div>

      {character.is_dead ? (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-center">
          <p className="text-red-300 font-bold">💀 You are dead. Cannot battle.</p>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-slate-300 font-semibold mb-3">
              Select Target ({targets.length} available)
            </h2>
            {targets.length === 0 ? (
              <p className="text-slate-500 text-sm bg-slate-800 rounded-lg p-4 border border-slate-700">
                No eligible targets. Try logging in later as more operators join.
              </p>
            ) : (
              <div className="space-y-2">
                {targets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTarget(t.id)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors min-h-[48px] ${
                      selectedTarget === t.id
                        ? 'border-amber-500 bg-amber-900/20'
                        : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-slate-200 font-semibold">{t.username}</span>
                      <span className="text-slate-400 text-sm">Lv {t.level}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400 mt-1">
                      <span>❤️ {t.life_force}/{t.max_life_force}</span>
                      <span>💰 {t.credits_hand.toLocaleString()} credits</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleBattle}
            disabled={loading || !selectedTarget}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-lg transition-colors min-h-[48px] text-lg"
          >
            {loading ? '⚔️ Battling...' : '⚔️ Attack!'}
          </button>
        </>
      )}

      {battleLog.length > 0 && <BattleLog entries={battleLog} />}
    </div>
  );
}
