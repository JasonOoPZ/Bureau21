import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LeaderboardEntry, LeaderboardCategory } from '@/types/game';
import LeaderboardTable from '@/components/LeaderboardTable';
import { getCurrentSeason } from '@/lib/constants';

const categories: LeaderboardCategory[] = ['kingpin', 'warlord', 'chemist', 'miner', 'rookie'];

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const season = getCurrentSeason();

  const leaderboards: Record<LeaderboardCategory, LeaderboardEntry[]> = {
    kingpin: [],
    warlord: [],
    chemist: [],
    miner: [],
    rookie: [],
  };

  for (const cat of categories) {
    const { data } = await supabase
      .from('leaderboards')
      .select('*, character:characters(username, level)')
      .eq('season', season)
      .eq('category', cat)
      .order('score', { ascending: false })
      .limit(20);
    if (data) leaderboards[cat] = data as LeaderboardEntry[];
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-amber-500">🏆 Leaderboard</h1>
        <p className="text-slate-400 text-sm mt-1">Season: {season} — Resets monthly</p>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <LeaderboardTable key={cat} entries={leaderboards[cat]} category={cat} />
        ))}
      </div>
    </div>
  );
}
