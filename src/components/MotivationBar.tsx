import { percentOf } from '@/lib/utils';

interface Props {
  current: number;
  max: number;
}

export default function MotivationBar({ current, max }: Props) {
  const pct = percentOf(current, max);
  const color =
    pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">⚡ Motivation</span>
        <span className="text-slate-300">
          {current}/{max}
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
