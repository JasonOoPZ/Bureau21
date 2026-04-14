import { authOptions } from "@/auth";
import { BattleConsole } from "@/components/game/battle-console";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { GAME_CONSTANTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BattlePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Fetch PVP targets: other players who are past newbie protection
  const targets = await prisma.pilotState.findMany({
    where: {
      userId: { not: session.user.id },
      level: { gte: GAME_CONSTANTS.NEWBIE_PROTECTION_LEVEL },
    },
    select: {
      id: true,
      userId: true,
      callsign: true,
      level: true,
      characterSlug: true,
    },
    orderBy: { level: "asc" },
    take: 50,
  });

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

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-red-400">Battle Arena</span>
          </div>

          <div className="rounded-md border border-red-900/40 bg-[#0f0a0a] p-4">
            <h1 className="text-xl font-bold uppercase tracking-widest text-red-300">PVP Arena</h1>
            <p className="mt-1 text-[11px] text-slate-400">
              Challenge other pilots. Win to gain XP, credits, and kills. Confidence shifts with outcomes.
            </p>
          </div>

          <BattleConsole
            initialTargets={targets}
            initialPilot={{
              level: pilot.level,
              lifeForce: pilot.lifeForce,
              strength: pilot.strength,
              speed: pilot.speed,
              confidence: pilot.confidence,
              atkSplit: pilot.atkSplit,
            }}
            initialLogs={recentLogs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))}
          />
        </div>
      </main>
    </>
  );
}
