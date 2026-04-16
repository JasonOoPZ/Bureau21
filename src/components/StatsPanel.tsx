import { Character } from '@/types/game';
import { calcATK, calcDEF } from '@/lib/constants';
import { formatStat, alignmentLabel, alignmentColor } from '@/lib/utils';

interface Props {
  character: Character;
}

export default function StatsPanel({ character }: Props) {
  const atk = calcATK(character.strength, character.atk_def_split, 0);
  const def = calcDEF(character.strength, character.atk_def_split, 0);

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-3 border border-slate-700">
      <div className="flex items-center justify-between">
        <h2 className="text-amber-500 font-bold text-lg">{character.username}</h2>
        <span className="text-slate-400 text-sm">Lv {character.level}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <StatRow label="Strength" value={formatStat(character.strength)} />
        <StatRow label="Speed" value={formatStat(character.speed)} />
        <StatRow label="Endurance" value={formatStat(character.endurance)} />
        <StatRow label="Panic" value={formatStat(character.panic)} />
        <StatRow label="ATK" value={String(atk)} highlight />
        <StatRow label="DEF" value={String(def)} highlight />
        <StatRow label="ATK/DEF Split" value={`${character.atk_def_split}/${100 - character.atk_def_split}`} />
        <StatRow label="Age (days)" value={String(character.age_days)} />
      </div>

      <div className="text-sm">
        <span className="text-slate-400">Alignment: </span>
        <span className={alignmentColor(character.alignment)}>
          {alignmentLabel(character.alignment)} ({character.alignment > 0 ? '+' : ''}{character.alignment})
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <StatRow label="Credits" value={character.credits_hand.toLocaleString()} />
        <StatRow label="Bank" value={character.credits_bank.toLocaleString()} />
        <StatRow label="Tokens" value={String(character.tokens)} />
        <StatRow label="XP" value={character.xp.toLocaleString()} />
      </div>

      {character.is_newbie && (
        <div className="text-xs text-cyan-400 bg-cyan-900/30 rounded px-2 py-1">
          🛡 Newbie Protection Active
        </div>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}:</span>
      <span className={highlight ? 'text-amber-400 font-semibold' : 'text-slate-200'}>
        {value}
      </span>
    </div>
  );
}
