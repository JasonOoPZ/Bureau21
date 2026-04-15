'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Character, WorkoutType } from '@/types/game';
import { GAME } from '@/lib/constants';
import { calcMaxGymEnergy } from '@/lib/gym-engine';

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
        `✅ ${data.stat_name} +${data.gain_amount.toFixed(4)} → ${data.new_value.toFixed(4)} | Energy: ${data.energy_remaining}/${data.max_energy} | Streak: 🔥${data.streak}`
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

  if (!character) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const energyUsed = character.gym_energy_date === today ? character.gym_energy_used : 0;
  const maxEnergy = calcMaxGymEnergy(character.gym_streak, character.endurance);
  const energyRemaining = maxEnergy - energyUsed;
  const energyPct = Math.round((energyRemaining / maxEnergy) * 100);

  // Breakdown shown in tooltip/detail
  const streakDays = Math.min(character.gym_streak, GAME.GYM_STREAK_CAP);
  const streakReps = GAME.GYM_BASE_REPS + streakDays * GAME.GYM_STREAK_REPS;
  const endReps = Math.floor(Math.log2(1 + character.endurance) * GAME.GYM_END_SCALE);

  const canTrain = energyRemaining >= difficulty && !character.is_dead;

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-amber-500">💪 Galaxy Gym</h1>
        <p className="text-slate-400 text-sm mt-1">Train hard. Rise through the ranks.</p>
      </div>

      {/* Daily Energy Bar */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-300 font-semibold text-sm">Daily Gym Energy</span>
          <span className="text-cyan-400 font-bold font-mono">
            {energyRemaining} / {maxEnergy}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div
            className="bg-cyan-500 h-3 rounded-full transition-all"
            style={{ width: `${energyPct}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div>
            <span className="text-orange-400">🔥 Streak bonus</span>{' '}
            <span className="text-slate-300">{streakReps} reps</span>
          </div>
          <div>
            <span className="text-emerald-400">🛡 Endurance bonus</span>{' '}
            <span className="text-slate-300">{endReps} reps</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">Energy resets daily. Each workout costs reps equal to difficulty.</p>
      </div>

      {/* Streak Info */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Gym Streak</span>
          <span className="text-orange-400 font-bold">🔥 {character.gym_streak} days</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Streak Bonus</span>
          <span className="text-emerald-400">+{(character.gym_streak * GAME.STREAK_BONUS * 100).toFixed(0)}% gain</span>
        </div>
      </div>

      {/* Workout Selection */}
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

      {/* Difficulty Slider */}
      <div>
        <h2 className="text-slate-300 font-semibold mb-3">
          Difficulty: <span className="text-amber-400">{difficulty}</span>{' '}
          <span className="text-slate-400 text-sm font-normal">(Cost: {difficulty} energy)</span>
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
        disabled={loading || !canTrain}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold py-4 rounded-lg transition-colors min-h-[48px] text-lg"
      >
        {loading
          ? 'Training...'
          : character.is_dead
          ? '💀 Dead — Cannot Train'
          : energyRemaining < difficulty
          ? `⚡ Not enough energy (need ${difficulty}, have ${energyRemaining})`
          : `Train ${workouts.find((w) => w.type === selectedWorkout)?.label}`}
      </button>
    </div>
  );
}
