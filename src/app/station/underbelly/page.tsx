import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { UnderbellyClient } from "@/components/game/underbelly-client";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function UnderbellyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  return (
    <div className="min-h-screen bg-[#0a0d11] text-slate-100">
      <TopBar session={session} />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/lobby" className="hover:text-cyan-300 transition-colors">← Hub</Link>
          <span>/</span>
          <Link href="/station" className="hover:text-cyan-400 transition-colors">← Station</Link>
          <span>/</span>
          <span className="text-slate-300">Underbelly</span>
        </div>

        <div className="mb-8 rounded-xl border border-purple-900/40 bg-[#0d0816] p-6">
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-purple-500">
            High-Risk District
          </div>
          <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-black text-slate-100">
            The Underbelly
          </h1>
          <p className="mt-2 text-slate-400">
            The station&apos;s illicit backrooms. Gamble your credits, push your luck, and walk away richer — or with nothing.
          </p>
        </div>

        <UnderbellyClient initialCredits={pilot.credits} pilotLevel={pilot.level} />
      </main>
    </div>
  );
}
