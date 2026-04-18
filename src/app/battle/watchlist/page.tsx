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

          {/* ── Watchlist Banner ── */}
          <div className="relative overflow-hidden rounded-xl border border-cyan-900/40 bg-gradient-to-r from-[#080c0f] via-[#0a0e12] to-[#080c0f]">
            <div className="absolute inset-0 opacity-[0.06]" style={{ background: "repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(34,211,238,0.1) 60px, rgba(34,211,238,0.1) 61px)" }} />
            <div className="relative flex items-center gap-4 p-5">
              {/* Surveillance Eye SVG */}
              <div className="shrink-0">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                  <ellipse cx="24" cy="24" rx="20" ry="12" stroke="#22d3ee" strokeWidth="1.5" opacity="0.4" />
                  <ellipse cx="24" cy="24" rx="14" ry="8" stroke="#22d3ee" strokeWidth="1" opacity="0.3" />
                  <circle cx="24" cy="24" r="6" stroke="#06b6d4" strokeWidth="1.5" opacity="0.7" />
                  <circle cx="24" cy="24" r="2.5" fill="#22d3ee" opacity="0.9" />
                  <line x1="4" y1="24" x2="10" y2="24" stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" />
                  <line x1="38" y1="24" x2="44" y2="24" stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" />
                  <path d="M8 16 Q24 8 40 16" stroke="#06b6d4" strokeWidth="0.5" opacity="0.2" fill="none" />
                  <path d="M8 32 Q24 40 40 32" stroke="#06b6d4" strokeWidth="0.5" opacity="0.2" fill="none" />
                  <circle cx="24" cy="24" r="0.8" fill="white" opacity="0.9" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-wider text-cyan-300">Watchlist</h1>
                <p className="text-[11px] text-slate-500">Surveillance & Target Tracking Database</p>
              </div>
              <div className="ml-auto hidden sm:block text-right">
                <div className="text-[10px] uppercase tracking-widest text-slate-600">Status</div>
                <div className="text-sm font-bold text-cyan-400">Active</div>
              </div>
            </div>
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
