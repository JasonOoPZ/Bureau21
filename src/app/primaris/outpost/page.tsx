import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { OutpostClient } from "@/components/game/outpost-client";
import { getOrCreatePilotState } from "@/lib/game-state";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OutpostPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  let canClaim = true;
  let hoursLeft = 0;
  if (pilot.lastOutpostClaim) {
    const hoursSince = (Date.now() - new Date(pilot.lastOutpostClaim).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      canClaim = false;
      hoursLeft = Math.ceil(24 - hoursSince);
    }
  }

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/primaris" className="text-[11px] text-slate-500 hover:text-cyan-300">← Primaris</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-emerald-300">Outpost</span>
          </div>
          <div className="rounded-md border border-emerald-900/30 bg-[#0b0f14] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300">Frontier</p>
            <h1 className="mt-1 text-2xl font-bold uppercase tracking-[0.2em] text-emerald-200">Outpost</h1>
          </div>
          <OutpostClient credits={pilot.credits} level={pilot.level} canClaim={canClaim} hoursLeft={hoursLeft} />
        </div>
      </main>
    </>
  );
}
