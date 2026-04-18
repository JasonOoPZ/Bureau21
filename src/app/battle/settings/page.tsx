import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BattleSettingsClient } from "@/components/game/battle-settings-client";

export default async function BattleSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/battle" className="text-[11px] text-slate-500 hover:text-cyan-300">← Combat Arena</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Combat Settings</span>
          </div>

          <div className="rounded-md border border-slate-700 bg-[#0b0f14] px-4 py-3 text-center">
            <h1 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-100">Combat Settings</h1>
          </div>

          <BattleSettingsClient
            initial={{
              autoHerbs: pilot.autoHerbs,
              hideBattleLogs: pilot.hideBattleLogs,
              battleCooldown: pilot.battleCooldown,
              combatStimUse: pilot.combatStimUse,
              atkSplit: pilot.atkSplit,
              herbs: pilot.herbs,
            }}
          />
        </div>
      </main>
    </>
  );
}
