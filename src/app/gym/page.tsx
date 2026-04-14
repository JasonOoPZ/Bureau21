import { authOptions } from "@/auth";
import { GymConsole } from "@/components/game/gym-console";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { GAME_CONSTANTS, getConfidenceCap } from "@/lib/constants";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function GymPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Compute current motivation with passive regen
  const now = new Date();
  const minutesElapsed = Math.floor(
    (now.getTime() - pilot.lastMotivationAt.getTime()) / (1000 * 60)
  );
  const regenAmount = Math.floor(minutesElapsed / GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES);
  const currentMotivation = Math.min(
    pilot.motivation + regenAmount,
    GAME_CONSTANTS.MOTIVATION_CAP_FREE
  );

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-amber-400">Galaxy Gym</span>
          </div>

          <div className="rounded-md border border-amber-900/40 bg-[#0f0d08] p-4">
            <h1 className="text-xl font-bold uppercase tracking-widest text-amber-300">Galaxy Gym</h1>
            <p className="mt-1 text-[11px] text-slate-400">
              Spend Motivation to train your combat stats. Maintain your streak for compounding bonuses.
            </p>
          </div>

          <GymConsole
            initial={{
              motivation: currentMotivation,
              motivationCap: GAME_CONSTANTS.MOTIVATION_CAP_FREE,
              gymStreak: pilot.gymStreak,
              lastGymAt: pilot.lastGymAt?.toISOString() ?? null,
              strength: pilot.strength,
              speed: pilot.speed,
              endurance: pilot.endurance,
              panic: pilot.panic,
              confidence: pilot.confidence,
              confidenceCap: getConfidenceCap(pilot.characterSlug),
              trainingOptions: [
                { key: "strength", label: "Strength", cost: 15 },
                { key: "speed", label: "Speed", cost: 15 },
                { key: "endurance", label: "Endurance", cost: 10 },
                { key: "panic_control", label: "Panic Control", cost: 20 },
                { key: "confidence", label: "Confidence", cost: 25 },
              ],
            }}
          />
        </div>
      </main>
    </>
  );
}
