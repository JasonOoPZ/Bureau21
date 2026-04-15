import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LeaderboardEntry, LeaderboardCategory, AwardEntry, AwardCategory } from '@/types/game';
import LeaderboardTable from '@/components/LeaderboardTable';
import { getCurrentSeason } from '@/lib/constants';

const categories: LeaderboardCategory[] = ['kingpin', 'warlord', 'chemist', 'miner', 'rookie'];

const AWARD_META: Record<AwardCategory, { label: string; icon: string; unit?: string }> = {
  battle_wins:  { label: 'Battle Wins',       icon: '⚔️' },
  total_stats:  { label: 'Total Stats',        icon: '💪', unit: 'pts' },
  wealthiest:   { label: 'Wealthiest Players', icon: '💰', unit: '₡' },
  knowledge:    { label: 'Knowledge Rank',     icon: '🧠', unit: 'XP' },
  total_score:  { label: 'Total Score',        icon: '🏅', unit: 'pts' },
};

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

  // Compute award rankings from character stats
  const { data: chars } = await supabase
    .from('characters')
    .select('id, username, level, xp, strength, speed, endurance, panic, credits_hand, credits_bank')
    .eq('is_dead', false)
    .order('xp', { ascending: false })
    .limit(100);

  const allChars = chars ?? [];

  function topN(
    list: typeof allChars,
    scorer: (c: typeof allChars[0]) => number,
    n = 10
  ): AwardEntry[] {
    return [...list]
      .map((c) => ({ character_id: c.id, username: c.username, level: c.level, value: scorer(c) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, n);
  }

  // Battle wins
  const { data: battleRows } = await supabase
    .from('battles')
    .select('winner_id');
  const winsMap: Record<string, number> = {};
  (battleRows ?? []).forEach((b) => { winsMap[b.winner_id] = (winsMap[b.winner_id] ?? 0) + 1; });
  const battleWinEntries: AwardEntry[] = Object.entries(winsMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id, wins]) => {
      const c = allChars.find((x) => x.id === id);
      return { character_id: id, username: c?.username ?? 'Unknown', level: c?.level ?? 0, value: wins };
    });

  const awards: Record<AwardCategory, AwardEntry[]> = {
    battle_wins:  battleWinEntries,
    total_stats:  topN(allChars, (c) => Math.round(c.strength + c.speed + c.endurance + c.panic)),
    wealthiest:   topN(allChars, (c) => c.credits_hand + c.credits_bank),
    knowledge:    topN(allChars, (c) => c.xp),
    total_score:  topN(allChars, (c) => c.level * 1000 + c.xp + Math.floor(c.strength + c.speed + c.endurance)),
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-8">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-amber-500">🏆 Leaderboard</h1>
        <p className="text-slate-400 text-sm mt-1">Season: {season} — Resets monthly</p>
      </div>

      {/* Awards Section */}
      <div>
        <h2 className="text-lg font-bold text-cyan-400 mb-4">🎖️ Station Awards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(AWARD_META) as AwardCategory[]).map((cat) => (
            <div key={cat} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="p-3 border-b border-slate-700 flex items-center gap-2">
                <span className="text-lg">{AWARD_META[cat].icon}</span>
                <h3 className="text-amber-500 font-semibold text-sm">{AWARD_META[cat].label}</h3>
              </div>
              {awards[cat].length === 0 ? (
                <p className="text-slate-500 text-xs p-4">No data yet.</p>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {awards[cat].map((entry, i) => (
                    <div key={entry.character_id} className={`flex items-center justify-between px-3 py-2 text-sm ${i < 3 ? 'bg-amber-900/10' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 w-5 text-center text-xs">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                        <span className="text-slate-200 font-medium">{entry.username}</span>
                        <span className="text-slate-500 text-xs">Lv {entry.level}</span>
                      </div>
                      <span className="text-amber-400 font-semibold text-xs">
                        {entry.value.toLocaleString()}{AWARD_META[cat].unit ? ` ${AWARD_META[cat].unit}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Season Rankings */}
      <div>
        <h2 className="text-lg font-bold text-amber-400 mb-4">📅 Season Rankings</h2>
        <div className="space-y-6">
          {categories.map((cat) => (
            <LeaderboardTable key={cat} entries={leaderboards[cat]} category={cat} />
          ))}
        </div>
      </div>
    </div>
  );
}

