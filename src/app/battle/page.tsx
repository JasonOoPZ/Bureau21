import { authOptions } from "@/auth";
import { BattleHub } from "@/components/game/battle-hub";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BattlePage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const params = await searchParams;
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const recentLogs = await prisma.battleLog.findMany({
    where: { pilotId: pilot.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      opponentName: true,
      result: true,
      xpGained: true,
      creditsGained: true,
      roundsCount: true,
      createdAt: true,
    },
  });

  // Watchlist count — model available after prisma generate
  let watchlistCount = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wlResult = await (prisma as any).watchlist?.count({ where: { pilotId: pilot.id } });
    if (typeof wlResult === "number") watchlistCount = wlResult;
  } catch { /* watchlist table may not exist yet */ }

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-red-400">Combat Arena</span>
          </div>

          {/* ── Combat Arena Banner ── */}
          <div className="relative overflow-hidden rounded-xl border border-red-900/40 bg-gradient-to-r from-[#0f0808] via-[#110a0a] to-[#0f0808]">
            <div className="absolute inset-0 opacity-[0.06]" style={{ background: "repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(239,68,68,0.12) 40px, rgba(239,68,68,0.12) 41px)" }} />
            <div className="relative flex items-center gap-4 p-5">
              {/* Crosshairs SVG */}
              <div className="shrink-0">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                  <circle cx="24" cy="24" r="18" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                  <circle cx="24" cy="24" r="10" stroke="#f87171" strokeWidth="1" opacity="0.6" />
                  <circle cx="24" cy="24" r="3" fill="#ef4444" opacity="0.8" />
                  <line x1="24" y1="2" x2="24" y2="14" stroke="#ef4444" strokeWidth="1" opacity="0.5" />
                  <line x1="24" y1="34" x2="24" y2="46" stroke="#ef4444" strokeWidth="1" opacity="0.5" />
                  <line x1="2" y1="24" x2="14" y2="24" stroke="#ef4444" strokeWidth="1" opacity="0.5" />
                  <line x1="34" y1="24" x2="46" y2="24" stroke="#ef4444" strokeWidth="1" opacity="0.5" />
                  <path d="M10 10 L16 16" stroke="#f87171" strokeWidth="0.5" opacity="0.3" />
                  <path d="M38 10 L32 16" stroke="#f87171" strokeWidth="0.5" opacity="0.3" />
                  <path d="M10 38 L16 32" stroke="#f87171" strokeWidth="0.5" opacity="0.3" />
                  <path d="M38 38 L32 32" stroke="#f87171" strokeWidth="0.5" opacity="0.3" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-wider text-red-300">Combat Arena</h1>
                <p className="text-[11px] text-slate-500">Tactical Engagement & Target Acquisition Hub</p>
              </div>
              <div className="ml-auto hidden sm:block text-right">
                <div className="text-[10px] uppercase tracking-widest text-slate-600">Sector</div>
                <div className="text-sm font-bold text-red-400">War Room</div>
              </div>
            </div>
          </div>

          <BattleHub
            initialLogs={recentLogs.map((l) => ({ id: l.id, opponentName: l.opponentName, result: l.result, xpGained: l.xpGained, creditsGained: l.creditsGained, roundsCount: l.roundsCount, createdAt: l.createdAt.toISOString() }))}
            pilotLevel={pilot.level}
            watchlistCount={watchlistCount}
            initialTarget={params.target ?? ""}
          />
        </div>
      </main>
    </>
  );
}
