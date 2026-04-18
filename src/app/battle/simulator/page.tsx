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

          {/* ── Simulator Banner ── */}
          <div className="relative overflow-hidden rounded-xl border border-amber-900/40 bg-gradient-to-r from-[#0f0d08] via-[#11100a] to-[#0f0d08]">
            <div className="absolute inset-0 opacity-[0.06]" style={{ background: "repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(245,158,11,0.1) 30px, rgba(245,158,11,0.1) 31px)" }} />
            <div className="relative flex items-center gap-4 p-5">
              {/* Target Practice / Hologram SVG */}
              <div className="shrink-0">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                  <rect x="8" y="8" width="32" height="32" rx="2" stroke="#f59e0b" strokeWidth="1" opacity="0.3" strokeDasharray="3 2" />
                  <rect x="14" y="14" width="20" height="20" rx="1" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
                  <circle cx="24" cy="24" r="8" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />
                  <circle cx="24" cy="24" r="3" stroke="#fbbf24" strokeWidth="1" opacity="0.7" />
                  <circle cx="24" cy="24" r="1" fill="#f59e0b" opacity="0.9" />
                  <line x1="24" y1="8" x2="24" y2="16" stroke="#f59e0b" strokeWidth="0.5" opacity="0.4" />
                  <line x1="24" y1="32" x2="24" y2="40" stroke="#f59e0b" strokeWidth="0.5" opacity="0.4" />
                  <line x1="8" y1="24" x2="16" y2="24" stroke="#f59e0b" strokeWidth="0.5" opacity="0.4" />
                  <line x1="32" y1="24" x2="40" y2="24" stroke="#f59e0b" strokeWidth="0.5" opacity="0.4" />
                  <path d="M12 12 L18 18" stroke="#fbbf24" strokeWidth="0.5" opacity="0.25" />
                  <path d="M36 12 L30 18" stroke="#fbbf24" strokeWidth="0.5" opacity="0.25" />
                  <path d="M12 36 L18 30" stroke="#fbbf24" strokeWidth="0.5" opacity="0.25" />
                  <path d="M36 36 L30 30" stroke="#fbbf24" strokeWidth="0.5" opacity="0.25" />
                  <text x="24" y="46" textAnchor="middle" fill="#f59e0b" fontSize="4" opacity="0.4" fontFamily="monospace">SIM</text>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-wider text-amber-300">Combat Simulator</h1>
                <p className="text-[11px] text-slate-500">Holographic Training & Tactical Drill Chamber</p>
              </div>
              <div className="ml-auto hidden sm:block text-right">
                <div className="text-[10px] uppercase tracking-widest text-slate-600">Sector</div>
                <div className="text-sm font-bold text-amber-400">Training Bay</div>
              </div>
            </div>
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
