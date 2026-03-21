import { LeaderboardEntry } from '@/types/game';

interface Props {
  entries: LeaderboardEntry[];
  category: string;
}

export default function LeaderboardTable({ entries, category }: Props) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-amber-500 font-semibold capitalize">{category} Rankings</h3>
      </div>
      {entries.length === 0 ? (
        <p className="text-slate-500 text-sm p-4">No rankings yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-slate-700">
              <th className="text-left p-3">Rank</th>
              <th className="text-left p-3">Operator</th>
              <th className="text-right p-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={entry.id}
                className={`border-b border-slate-700/50 ${
                  i < 3 ? 'bg-amber-900/10' : ''
                }`}
              >
                <td className="p-3 text-slate-400">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </td>
                <td className="p-3 text-slate-200 font-medium">
                  {entry.character?.username ?? 'Unknown'}
                </td>
                <td className="p-3 text-right text-amber-400 font-semibold">
                  {entry.score.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
