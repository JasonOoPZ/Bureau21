'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import MotivationBar from '@/components/MotivationBar';
import { Character, WorkoutType } from '@/types/game';
import { GAME } from '@/lib/constants';

const workouts: { type: WorkoutType; label: string; icon: string; desc: string }[] = [
  { type: 'strength', label: 'Strength', icon: '💪', desc: 'Increases ATK and DEF power' },
  { type: 'speed', label: 'Speed', icon: '⚡', desc: 'Determines who attacks first' },
  { type: 'endurance', label: 'Endurance', icon: '🛡', desc: 'Chance to rest and skip damage' },
  { type: 'panic', label: 'Panic', icon: '😱', desc: 'Chance to deal massive burst damage' },
];

export default function GymPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutType>('strength');
  const [difficulty, setDifficulty] = useState(3);
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

  async function handleWorkout() {
    if (!character) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const resp = await fetch('/api/gym', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workout_type: selectedWorkout, difficulty }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      setError(data.error ?? 'Workout failed.');
    } else {
      setResult(
        `✅ ${data.stat_name} +${data.gain_amount.toFixed(4)} → ${data.new_value.toFixed(4)} | Motivation: ${data.motivation_remaining} | Streak: 🔥${data.streak}`
      );
      const { data: updated } = await supabase
        .from('characters')
        .select('*')
        .eq('id', character.id)
        .single();
      if (updated) setCharacter(updated as Character);
    }

    setLoading(false);
  }

  const motivationCost = 5 + difficulty * 2;

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
        <h1 className="text-2xl font-bold text-amber-500">💪 Galaxy Gym</h1>
        <p className="text-slate-400 text-sm mt-1">Train hard. Rise through the ranks.</p>
      </div>

      <MotivationBar current={character.motivation} max={character.max_motivation} />

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Gym Streak</span>
          <span className="text-orange-400 font-bold">🔥 {character.gym_streak} days</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Streak Bonus</span>
          <span className="text-emerald-400">+{(character.gym_streak * GAME.STREAK_BONUS * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div>
        <h2 className="text-slate-300 font-semibold mb-3">Select Workout</h2>
        <div className="grid grid-cols-2 gap-3">
          {workouts.map((w) => (
            <button
              key={w.type}
              onClick={() => setSelectedWorkout(w.type)}
              className={`p-4 rounded-lg border-2 text-left transition-colors min-h-[80px] ${
                selectedWorkout === w.type
                  ? 'border-amber-500 bg-amber-900/20'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <div className="text-xl mb-1">{w.icon}</div>
              <div className="text-slate-200 font-semibold text-sm">{w.label}</div>
              <div className="text-slate-400 text-xs mt-1">{w.desc}</div>
              <div className="text-cyan-400 text-xs mt-1 font-mono">
                {character[w.type].toFixed(4)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-slate-300 font-semibold mb-3">
          Difficulty: <span className="text-amber-400">{difficulty}</span>{' '}
          <span className="text-slate-400 text-sm font-normal">(Cost: {motivationCost} motivation)</span>
        </h2>
        <input
          type="range"
          min={1}
          max={5}
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>1 — Easy</span>
          <span>5 — Brutal</span>
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
        onClick={handleWorkout}
        disabled={loading || character.motivation < motivationCost || character.is_dead}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold py-4 rounded-lg transition-colors min-h-[48px] text-lg"
      >
        {loading
          ? 'Training...'
          : character.is_dead
          ? '💀 Dead — Cannot Train'
          : character.motivation < motivationCost
          ? `⚡ Not enough motivation (need ${motivationCost})`
          : `Train ${workouts.find((w) => w.type === selectedWorkout)?.label}`}
      </button>
    </div>
  );
}
