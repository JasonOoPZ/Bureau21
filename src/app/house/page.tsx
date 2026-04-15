import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StatsPanel from '@/components/StatsPanel';
import LifeForceBar from '@/components/LifeForceBar';
import MotivationBar from '@/components/MotivationBar';
import KillFeed from '@/components/KillFeed';
import { Character } from '@/types/game';
import { xpForLevel } from '@/lib/constants';

export default async function HousePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!character) redirect('/signup');

  const char = character as Character;
  const xpNeeded = xpForLevel(char.level + 1);
  const xpProgress = Math.round((char.xp / xpNeeded) * 100);

  const onboardingMessages: Record<number, string> = {
    0: "Welcome to Bureau 21, Operator. Your quarters are sparse but functional. Start at the Gym to train your stats.",
    1: "Good. Now head to the Battle Arena and test yourself against another operator.",
    2: "Nice work. Visit Hydroponics in the Station to pick some herbs.",
    3: "You're getting the hang of it. Deposit your credits at the Bank in Syndicate Row.",
    4: "The full station is yours. Watch your back out there.",
    5: "You've completed onboarding. Good luck, Operator. Bureau 21 shows no mercy.",
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-amber-500">🏠 Operator Quarters</h1>
        <p className="text-slate-400 text-sm mt-1">Your personal hub on Bureau 21</p>
        <p className="text-slate-500 text-xs mt-1 font-mono">
          Player ID: <span className="text-slate-400 select-all">{char.id}</span>
        </p>
      </div>

      {char.onboarding_step < 6 && (
        <div className="bg-cyan-900/30 border border-cyan-600 rounded-lg p-4">
          <p className="text-cyan-300 text-sm font-semibold mb-1">
            📡 Station Broadcast — Step {char.onboarding_step + 1}/6
          </p>
          <p className="text-cyan-200 text-sm">
            {onboardingMessages[char.onboarding_step] ?? "You're fully operational."}
          </p>
        </div>
      )}

      {char.is_dead && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-center">
          <p className="text-red-300 text-lg font-bold">💀 YOU ARE DEAD</p>
          <p className="text-red-400 text-sm mt-1">
            Wait for the midday or daily reset, or use a Blue Herb to revive.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <LifeForceBar
            current={char.life_force}
            max={char.max_life_force}
            isDead={char.is_dead}
          />
          <MotivationBar current={char.motivation} max={char.max_motivation} />

          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">XP Progress (Lv {char.level})</span>
              <span className="text-slate-300">
                {char.xp.toLocaleString()} / {xpNeeded.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Credits (Hand)</p>
              <p className="text-amber-400 font-bold">{char.credits_hand.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Credits (Bank)</p>
              <p className="text-emerald-400 font-bold">{char.credits_bank.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Tokens</p>
              <p className="text-cyan-400 font-bold">{char.tokens}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Gym Streak</p>
              <p className="text-orange-400 font-bold">🔥 {char.gym_streak} days</p>
            </div>
          </div>
        </div>

        <StatsPanel character={char} />
      </div>

      <KillFeed />
    </div>
  );
}
