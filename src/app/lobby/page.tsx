import { authOptions } from "@/auth";
import { Leaderboard } from "@/components/game/leaderboard";
import { PilotConsole } from "@/components/game/pilot-console";
import { StarterCharacterPortrait } from "@/components/game/starter-character-portrait";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { sideRailLinks } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";
import { getStarterCharacter } from "@/lib/starter-characters";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const sectors = [
  { name: "Fringe Expanse", status: "Online", color: "cyan" },
  { name: "Void Corridor", status: "Restricted", color: "amber" },
  { name: "The Meridian Rift", status: "Unstable", color: "red" },
  { name: "Bastion Hub", status: "Online", color: "cyan" },
  { name: "Null Station", status: "Online", color: "cyan" },
  { name: "Deep Archive", status: "Coming Soon", color: "slate" },
];

export default async function LobbyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  const isAdmin = session.user.role === "admin";
  const pilotState = await getOrCreatePilotState(session.user.id, session.user.name);
  if (pilotState.appearanceNeedsSetup) {
    redirect("/onboarding/appearance");
  }
  const starterCharacter = getStarterCharacter(pilotState.characterSlug);

  const recentChats = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { author: { select: { id: true, name: true } } },
  });

  const now = new Date();
  const gameTime = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-2 py-3 sm:px-4">
        <div className="mx-auto grid w-full max-w-7xl gap-3 lg:grid-cols-[220px_minmax(0,1fr)_250px]">
          <aside className="space-y-3">
            <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 overflow-hidden rounded-md border border-slate-800 bg-black/50 p-1">
                  <StarterCharacterPortrait slug={pilotState.characterSlug} size="sm" />
                </div>
                <p className="text-[11px] font-semibold text-cyan-200 underline">{pilotState.callsign}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-slate-500">{starterCharacter.title}</p>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{starterCharacter.summary}</p>
              <Link
                href="/house"
                className="mt-2 block w-full rounded border border-cyan-900/50 bg-cyan-950/20 py-1.5 text-center text-[11px] text-cyan-400 hover:bg-cyan-950/40 transition"
              >
                View Character Sheet →
              </Link>
            </section>

            <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-2">
              {sideRailLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between border-b border-slate-900 px-2 py-1.5 text-[12px] transition-all duration-150 hover:scale-[1.02] hover:bg-cyan-950/30 hover:text-cyan-300 hover:shadow-[0_0_6px_rgba(34,211,238,0.1)] last:border-b-0 ${
                    item.label === "Primaris Core" ? "font-black text-cyan-300" : "text-slate-300"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`text-[9px] uppercase ${item.status === "live" ? "text-emerald-300" : "text-slate-500"}`}>
                    {item.status === "live" ? "live" : "mapped"}
                  </span>
                </Link>
              ))}
              {isAdmin ? (
                <Link href="/admin" className="mt-2 block rounded bg-amber-500/10 px-2 py-1 text-[12px] text-amber-300">
                  Admin Console
                </Link>
              ) : null}
            </section>
          </aside>

          <section className="space-y-3">
            <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-3">
              <h1 className="font-display text-3xl uppercase text-slate-100">Welcome To Bureau 21</h1>
              <p className="mt-2 text-sm text-slate-300">
                Sector relay is online. Your pilot, inventory, contracts, and command progression are now synced to the Fringe Network.
              </p>
            </div>

            <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Latest Network Dispatch</p>
              <p className="text-sm text-slate-200">
                Pilot operations are stable. New mining contracts and patrol routes are active in the Meridian corridor. Boards and direct comms are now active across Bureau 21.
              </p>
            </div>

            <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Sector Status</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {sectors.map((sector) => {
                  const isLive = sector.status === "Online";
                  const isLocked = sector.status === "Restricted";
                  const isSoon = sector.status === "Coming Soon";

                  return (
                    <div
                      key={sector.name}
                      className={`rounded border px-2 py-2 text-sm ${
                        isLive
                          ? "border-emerald-700 bg-emerald-950/20"
                          : isLocked
                          ? "border-amber-700 bg-amber-950/20"
                          : isSoon
                          ? "border-slate-700 bg-slate-900/20"
                          : "border-red-700 bg-red-950/20"
                      }`}
                    >
                      <p className="text-slate-100">{sector.name}</p>
                      <p className={`text-[11px] uppercase ${isLive ? "text-emerald-300" : isLocked ? "text-amber-300" : isSoon ? "text-slate-500" : "text-red-300"}`}>
                        {sector.status}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <PilotConsole />
          </section>

          <aside className="space-y-3">
            <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Game Time</p>
              <p className="mt-1 text-sm text-cyan-300">{gameTime}</p>
            </section>

            <Link href="/chat" className="block rounded-md border border-slate-800 bg-[#0a0d11] p-3 transition hover:border-cyan-900/50 hover:bg-[#0b1015]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.15em] text-slate-500">Town Hall</span>
                <span className="text-[11px] text-cyan-600">[open chat →]</span>
              </div>
              <div className="space-y-1 text-[12px] text-slate-300">
                {recentChats.length === 0 ? (
                  <p className="text-[11px] text-slate-600">No messages yet. Be the first to speak.</p>
                ) : (
                  recentChats.reverse().map((m) => (
                    <p key={m.id} className="truncate">
                      <span className="text-cyan-300">{m.author.name ?? "Unknown"}</span>: {m.body}
                    </p>
                  ))
                )}
              </div>
            </Link>

            <Leaderboard compact />
          </aside>
        </div>
      </main>
    </>
  );
}
