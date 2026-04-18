import { authOptions } from "@/auth";
import { SimulatorClient } from "@/components/game/simulator-client";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { GAME_CONSTANTS } from "@/lib/constants";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

/** Reset daily training count if a new HKT day has started */
function resolveSimReset(trainsToday: number, lastTrainAt: Date | null): number {
  if (!lastTrainAt) return 0;
  const now = new Date();
  const hktNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const hktLast = new Date(lastTrainAt.getTime() + 8 * 60 * 60 * 1000);
  const nowDay = `${hktNow.getUTCFullYear()}-${hktNow.getUTCMonth()}-${hktNow.getUTCDate()}`;
  const lastDay = `${hktLast.getUTCFullYear()}-${hktLast.getUTCMonth()}-${hktLast.getUTCDate()}`;
  if (nowDay !== lastDay) return 0;
  return trainsToday;
}

export default async function SimulatorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const trainsToday = resolveSimReset(pilot.simTrainsToday, pilot.lastSimTrainAt);
  const trainsRemaining = Math.max(0, GAME_CONSTANTS.BATTLE_VILLAGE_TRAINS_PER_DAY - trainsToday);

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/battle" className="text-[11px] text-slate-500 hover:text-cyan-300">← Combat Arena</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-amber-400">Combat Simulator</span>
          </div>

          <div className="rounded-md border border-amber-900/40 bg-[#0f0d0a] px-4 py-3 text-center">
            <h1 className="text-lg font-bold uppercase tracking-[0.2em] text-amber-300">Combat Simulator</h1>
          </div>

          <SimulatorClient
            initial={{
              trainsRemaining,
              maxTrains: GAME_CONSTANTS.BATTLE_VILLAGE_TRAINS_PER_DAY,
              creditReward: Math.floor(pilot.level * GAME_CONSTANTS.SIM_CREDIT_MULTIPLIER),
              xpReward: Math.floor(pilot.level * GAME_CONSTANTS.SIM_XP_MULTIPLIER),
              levelChance: GAME_CONSTANTS.SIM_LEVEL_CHANCE,
              level: pilot.level,
              xp: pilot.xp,
              credits: pilot.credits,
            }}
          />
        </div>
      </main>
    </>
  );
}
