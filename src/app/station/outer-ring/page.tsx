import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { pilotHasGodCard } from "@/lib/item-data";
import { OuterRingClient } from "@/components/game/outer-ring-client";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PixelBanner } from "@/components/layout/pixel-banner";

export default async function OuterRingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const godCard = await pilotHasGodCard(session.user.id);

  return (
    <div className="min-h-screen bg-[#0a0d11] text-slate-100">
      <TopBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/lobby" className="hover:text-cyan-300 transition-colors">← Hub</Link>
          <span>/</span>
          <Link href="/station" className="hover:text-cyan-400 transition-colors">← Station</Link>
          <span>/</span>
          <span className="text-slate-300">Outer Ring</span>
        </div>

        <PixelBanner scene="outer-ring" title="Outer Ring" subtitle="The station's most dangerous frontier. Ancient war machines and legendary threats await.">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-400">Level <span className="text-cyan-300 font-semibold">{pilot.level}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">LF <span className="text-rose-400 font-semibold">{pilot.lifeForce}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Credits <span className="text-amber-300 font-semibold">{pilot.credits.toLocaleString()}</span></span>
          </div>
        </PixelBanner>

        <OuterRingClient
          pilotLevel={pilot.level}
          pilotLf={pilot.lifeForce}
          pilotCredits={pilot.credits}
          hasGodCard={godCard}
        />
      </main>
    </div>
  );
}
