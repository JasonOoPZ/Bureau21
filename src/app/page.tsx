import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-5xl font-bold text-amber-500 mb-4 tracking-widest">BUREAU 21</h1>
      <p className="text-cyan-400 text-lg mb-2">Free Port · Deep Space</p>
      <p className="text-slate-400 max-w-md mb-8 text-sm leading-relaxed">
        A decommissioned deep-space research facility. No law. No corp. Just
        reputation, power, and credits. Will you rise to the top?
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-colors min-h-[48px] flex items-center"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold rounded-lg transition-colors min-h-[48px] flex items-center border border-slate-600"
        >
          Create Operator
        </Link>
      </div>
      <div className="mt-12 grid grid-cols-3 gap-6 text-center max-w-lg">
        {[
          { icon: '💪', title: 'Train', desc: 'Build strength, speed & endurance' },
          { icon: '⚔️', title: 'Battle', desc: 'Fight rivals for XP and credits' },
          { icon: '🏆', title: 'Dominate', desc: 'Climb monthly leaderboards' },
        ].map((f) => (
          <div key={f.title} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl mb-2">{f.icon}</div>
            <div className="text-slate-200 font-semibold text-sm">{f.title}</div>
            <div className="text-slate-400 text-xs mt-1">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
