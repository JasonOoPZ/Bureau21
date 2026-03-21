import { percentOf } from '@/lib/utils';

interface Props {
  current: number;
  max: number;
  isDead?: boolean;
}

export default function LifeForceBar({ current, max, isDead }: Props) {
  const pct = percentOf(current, max);
  const color = isDead
    ? 'bg-slate-600'
    : pct > 60
    ? 'bg-emerald-500'
    : pct > 30
    ? 'bg-amber-500'
    : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">❤️ Life Force</span>
        <span className={isDead ? 'text-slate-500' : 'text-slate-300'}>
          {isDead ? 'DEAD' : `${current}/${max}`}
        </span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: isDead ? '0%' : `${pct}%` }}
        />
      </div>
    </div>
  );
}
