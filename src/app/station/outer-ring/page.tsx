import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { pilotHasGodCard } from "@/lib/item-data";
import { OuterRingClient } from "@/components/game/outer-ring-client";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

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

        <div className="mb-8 rounded-xl border border-red-900/40 bg-[#0f0808] p-6">
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-red-500">
            Late-Game Combat Zone
          </div>
          <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-black text-slate-100">
            Outer Ring
          </h1>
          <p className="mt-2 text-slate-400">
            The station&apos;s most dangerous frontier. Ancient war machines, elite marauders, and legendary threats await pilots strong enough to enter.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span className="text-slate-400">Level <span className="text-cyan-300 font-semibold">{pilot.level}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">LF <span className="text-rose-400 font-semibold">{pilot.lifeForce}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Credits <span className="text-amber-300 font-semibold">{pilot.credits.toLocaleString()}</span></span>
          </div>
        </div>

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
