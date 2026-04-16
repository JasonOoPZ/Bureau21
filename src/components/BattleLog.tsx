interface Props {
  entries: string[];
}

export default function BattleLog({ entries }: Props) {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-3 max-h-80 overflow-y-auto">
      <h3 className="text-amber-500 font-semibold text-sm mb-2">Battle Log</h3>
      {entries.length === 0 ? (
        <p className="text-slate-500 text-sm">No battle activity yet.</p>
      ) : (
        <div className="space-y-1">
          {entries.map((entry, i) => (
            <p key={i} className="text-slate-300 text-xs font-mono leading-relaxed">
              {entry}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
