import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { pilotHasGodCard } from "@/lib/item-data";
import { UnderbellyClient } from "@/components/game/underbelly-client";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PixelBanner } from "@/components/layout/pixel-banner";

export default async function UnderbellyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const godCard = await pilotHasGodCard(session.user.id);

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

        <PixelBanner scene="underbelly" title="The Underbelly" subtitle="The station's illicit backrooms. Gamble your credits, push your luck, and walk away richer — or with nothing." />

        <UnderbellyClient initialCredits={pilot.credits} pilotLevel={pilot.level} hasGodCard={godCard} />
      </main>
    </div>
  );
}
