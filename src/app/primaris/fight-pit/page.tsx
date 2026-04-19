import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { FightPitClient } from "@/components/game/fight-pit-client";
import { GAME_CONSTANTS } from "@/lib/constants";
import { getOrCreatePilotState } from "@/lib/game-state";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

export default async function FightPitPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const now = new Date();
  const minutesElapsed = Math.floor((now.getTime() - pilot.lastMotivationAt.getTime()) / (1000 * 60));
  const regenAmount = Math.floor(minutesElapsed / GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES);
  const currentMotivation = Math.min(pilot.motivation + regenAmount, GAME_CONSTANTS.MOTIVATION_CAP_FREE);

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/primaris" className="text-[11px] text-slate-500 hover:text-cyan-300">← Primaris</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-red-400">Fight Pit</span>
          </div>
          <PixelBanner scene="fight-pit" title="Fight Pit" subtitle="Underground bare-knuckle brawls. No rules." />
          <FightPitClient
            motivation={currentMotivation}
            lifeForce={pilot.lifeForce}
            credits={pilot.credits}
            level={pilot.level}
          />
        </div>
      </main>
    </>
  );
}
