"use client";

interface Props {
  report: {
    elapsedHours: number;
    autoHarvests: number;
    autoReplants: number;
    wagesDeducted: number;
    firedStaff: string[];
    eventsOccurred: string[];
    rpEarned: number;
    cropsSummary: Record<string, number>;
    creditsDelta: number;
  };
  onClose: () => void;
}

export function WelcomeBackModal({ report, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl border border-emerald-900/60 bg-[#0c0f14] p-6 shadow-2xl shadow-emerald-900/20">
        <h2 className="text-center text-sm font-bold text-emerald-300 font-[family-name:var(--font-orbitron)]">
          Welcome Back, Pilot
        </h2>
        <p className="mt-1 text-center text-[10px] text-slate-500">
          You were away for {report.elapsedHours.toFixed(1)} hours.
        </p>

        <div className="mt-4 space-y-2">
          {report.autoHarvests > 0 && (
            <Row icon="🌾" label="Auto-harvested" value={`${report.autoHarvests} crops`} color="text-emerald-400" />
          )}
          {report.autoReplants > 0 && (
            <Row icon="🌱" label="Auto-replanted" value={`${report.autoReplants} plots`} color="text-cyan-400" />
          )}
          {report.rpEarned > 0 && (
            <Row icon="🔬" label="Research earned" value={`+${report.rpEarned} RP`} color="text-purple-400" />
          )}
          {report.wagesDeducted > 0 && (
            <Row icon="💰" label="Wages paid" value={`-${report.wagesDeducted.toLocaleString()} cr`} color="text-red-400" />
          )}
          {report.eventsOccurred.length > 0 && (
            <Row icon="⚡" label="Events occurred" value={`${report.eventsOccurred.length}`} color="text-amber-400" />
          )}
          {report.firedStaff.length > 0 && (
            <Row icon="👤" label="Staff auto-fired" value={report.firedStaff.join(", ")} color="text-red-400" />
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-emerald-700 py-2 text-[11px] font-bold text-white hover:bg-emerald-600 transition-colors"
          aria-label="Dismiss welcome back"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function Row({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-slate-800 bg-[#0a0d11] px-3 py-2">
      <span className="text-[10px] text-slate-400">
        <span className="mr-1.5">{icon}</span>{label}
      </span>
      <span className={`text-[10px] font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}
