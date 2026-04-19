import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { RefineryClient } from "@/components/game/refinery-client";
import { getOrCreatePilotState } from "@/lib/game-state";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

export default async function RefineryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/primaris" className="text-[11px] text-slate-500 hover:text-cyan-300">← Primaris</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-slate-300">Refinery</span>
          </div>
          <PixelBanner scene="refinery" title="Refinery" subtitle="Process raw ore into crafting materials." />
          <RefineryClient credits={pilot.credits} ore={pilot.ore} />
        </div>
      </main>
    </>
  );
}
