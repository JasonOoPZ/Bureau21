import { authOptions } from "@/auth";
import { BattleHub } from "@/components/game/battle-hub";
import { StatAllocator } from "@/components/game/stat-allocator";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { hpPerPoint } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

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
          <PixelBanner scene="battle" title="Combat Arena" subtitle="Tactical Engagement & Target Acquisition Hub" />

          {/* Stat Allocation */}
          {pilot.unspentPoints > 0 && (
            <StatAllocator
              unspentPoints={pilot.unspentPoints}
              level={pilot.level}
              hpPerPoint={hpPerPoint(pilot.level)}
            />
          )}

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
