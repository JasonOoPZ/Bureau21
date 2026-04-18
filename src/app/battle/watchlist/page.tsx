import { authOptions } from "@/auth";
import { WatchlistClient } from "@/components/game/watchlist-client";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function WatchlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const entries = await prisma.watchlist.findMany({
    where: { pilotId: pilot.id },
    include: {
      targetPilot: {
        select: {
          id: true,
          userId: true,
          callsign: true,
          level: true,
          characterSlug: true,
          gender: true,
          currentSector: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-4xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/battle" className="text-[11px] text-slate-500 hover:text-cyan-300">← Combat Arena</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-red-400">Watchlist</span>
          </div>

          <div className="rounded-md border border-red-900/40 bg-[#0f0a0a] px-4 py-3 text-center">
            <h1 className="text-lg font-bold uppercase tracking-[0.2em] text-red-300">Watchlist</h1>
          </div>

          <WatchlistClient
            initialEntries={entries.map((e) => ({
              id: e.id,
              blockComms: e.blockComms,
              notes: e.notes,
              targetPilot: e.targetPilot,
            }))}
          />
        </div>
      </main>
    </>
  );
}
