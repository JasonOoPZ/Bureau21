import { authOptions } from "@/auth";
import { Leaderboard } from "@/components/game/leaderboard";
import { PilotConsole } from "@/components/game/pilot-console";
import { StarterCharacterPortrait } from "@/components/game/starter-character-portrait";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { sideRailLinks } from "@/lib/navigation";
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
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-md border border-slate-800 bg-black/50 p-1">
                  <StarterCharacterPortrait slug={pilotState.characterSlug} size="md" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-cyan-200 underline">{pilotState.callsign}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-slate-500">{starterCharacter.title}</p>
                  <p className="mt-2 text-[11px] text-slate-300">Level: {pilotState.level}</p>
                  <p className="text-[11px] text-slate-300">Credits: {pilotState.credits}</p>
                  <p className="text-[11px] text-slate-300">Fuel: {pilotState.fuel}</p>
                  <p className="text-[11px] text-slate-300">Hull: {pilotState.hull}%</p>
                  <p className="text-[11px] text-slate-300">Sector: {pilotState.currentSector}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-cyan-300">Role: {session.user.role}</p>
                </div>
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
                  className="flex items-center justify-between border-b border-slate-900 px-1 py-1 text-[12px] text-slate-300 transition hover:text-cyan-300 last:border-b-0"
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

            <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Town Hall</p>
                <span className="text-[11px] text-slate-400">[full chat]</span>
              </div>
              <div className="space-y-1 text-[12px] text-slate-300">
                <p><span className="text-cyan-300">Q7</span>: Sectors are alive again.</p>
                <p><span className="text-cyan-300">RiftEcho</span>: Patrol XP feels great.</p>
                <p><span className="text-cyan-300">Miner01</span>: Rare engine drop confirmed.</p>
                <p><span className="text-cyan-300">Gatekeeper</span>: Admin systems online.</p>
              </div>
            </section>

            <Leaderboard compact />
          </aside>
        </div>
      </main>
    </>
  );
}
