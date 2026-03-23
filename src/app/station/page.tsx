import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { GAME_CONSTANTS } from "@/lib/constants";
import { getOrCreatePilotState } from "@/lib/game-state";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

interface District {
  name: string;
  href: string;
  description: string;
  icon: string;
  unlockDay: number | null;
  status: "live" | "planned";
  accent: string;
}

const DISTRICTS: District[] = [
  {
    name: "Armory",
    href: "/station/armory",
    description: "Purchase weapons, shields, and engines. Every tier boosts your field performance.",
    icon: "⚔",
    unlockDay: null,
    status: "live",
    accent: "border-slate-600 hover:border-cyan-700",
  },
  {
    name: "Bazaar",
    href: "/station/bazaar",
    description: "The network marketplace. Browse loot in circulation and manage your own haul.",
    icon: "🏪",
    unlockDay: GAME_CONSTANTS.UNLOCK_BAZAAR_DAY,
    status: "live",
    accent: "border-amber-900/60 hover:border-amber-700",
  },
  {
    name: "Syndicate Row",
    href: "/station/syndicate-row",
    description: "Form or join a syndicate. Share treasury, earn guild bonuses, and recruit allies.",
    icon: "⬡",
    unlockDay: GAME_CONSTANTS.UNLOCK_SYNDICATE_ROW_DAY,
    status: "live",
    accent: "border-purple-900/60 hover:border-purple-700",
  },
  {
    name: "Underbelly",
    href: "/station/underbelly",
    description: "Black-market deals, contraband labs, and high-risk high-reward economics.",
    icon: "☠",
    unlockDay: GAME_CONSTANTS.UNLOCK_UNDERBELLY_DAY,
    status: "planned",
    accent: "border-red-900/60 hover:border-red-800",
  },
  {
    name: "The Academy",
    href: "/station/academy",
    description: "Advanced training modules and theory sessions to boost combat readiness.",
    icon: "📡",
    unlockDay: null,
    status: "planned",
    accent: "border-emerald-900/60 hover:border-emerald-700",
  },
  {
    name: "Fabrication",
    href: "/station/fabrication",
    description: "Craft and upgrade equipment using salvage materials from field operations.",
    icon: "🔧",
    unlockDay: GAME_CONSTANTS.UNLOCK_FULL_STATION_DAY,
    status: "planned",
    accent: "border-slate-700 hover:border-slate-500",
  },
  {
    name: "Hydroponics Bay",
    href: "/station/hydroponics",
    description: "Grow supplies, Blue Herbs, and consumables for revival and buff effects.",
    icon: "🌿",
    unlockDay: null,
    status: "planned",
    accent: "border-emerald-900/40 hover:border-emerald-800",
  },
  {
    name: "Docking Bay",
    href: "/station/docking-bay",
    description: "Ship upgrades, hull augments, and long-range warp charting.",
    icon: "🚀",
    unlockDay: null,
    status: "planned",
    accent: "border-cyan-900/40 hover:border-cyan-800",
  },
  {
    name: "Outer Ring",
    href: "/station/outer-ring",
    description: "Frontier contracts, deep-space scouting, and access to restricted sectors.",
    icon: "🌌",
    unlockDay: GAME_CONSTANTS.UNLOCK_FULL_STATION_DAY,
    status: "planned",
    accent: "border-slate-800 hover:border-slate-600",
  },
];

export default async function StationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const currentTime = new Date();
  const accountAgeDays = Math.floor(
    (currentTime.getTime() - new Date(pilot.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-5xl space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Station</span>
          </div>

          {/* Header + pilot context */}
          <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold uppercase tracking-widest text-slate-100">Null Station</h1>
                <p className="mt-1 text-[11px] text-slate-400">
                  The main trading and operations hub. Districts unlock as your account ages and your level rises.
                </p>
              </div>
              <div className="shrink-0 text-right text-[11px]">
                <p className="text-slate-500">Account age</p>
                <p className="font-bold text-cyan-300">{accountAgeDays}d</p>
                <p className="mt-1 text-slate-500">Pilot level</p>
                <p className="font-bold text-cyan-300">{pilot.level}</p>
              </div>
            </div>
          </div>

          {/* District grid */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DISTRICTS.map((d) => {
              const locked = d.unlockDay !== null && accountAgeDays < d.unlockDay;
              const isPlanned = d.status === "planned";

              return (
                <div
                  key={d.name}
                  className={`relative rounded-md border bg-[#0a0d11] transition ${
                    locked || isPlanned
                      ? "border-slate-800 opacity-60"
                      : d.accent
                  }`}
                >
                  {locked && (
                    <div className="absolute right-2 top-2 rounded border border-amber-900/40 bg-amber-950/30 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-amber-500">
                      Day {d.unlockDay}+
                    </div>
                  )}
                  {isPlanned && !locked && (
                    <div className="absolute right-2 top-2 rounded border border-slate-700 bg-slate-900/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-slate-500">
                      Soon
                    </div>
                  )}
                  {locked || isPlanned ? (
                    <div className="p-4">
                      <p className="text-lg">{d.icon}</p>
                      <p className="mt-1 text-[13px] font-semibold text-slate-500">{d.name}</p>
                      <p className="mt-1 text-[11px] text-slate-600">{d.description}</p>
                    </div>
                  ) : (
                    <Link href={d.href} className="block p-4">
                      <p className="text-lg">{d.icon}</p>
                      <p className="mt-1 text-[13px] font-semibold text-slate-200">{d.name}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{d.description}</p>
                      <p className="mt-2 text-[10px] text-cyan-600">Enter →</p>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Unlock schedule */}
          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-slate-500">District Unlock Schedule</p>
            <div className="grid gap-1 text-[11px] sm:grid-cols-2">
              {[
                { label: "Armory · Armory", day: "Day 1 (always open)" },
                { label: "Bazaar · Syndicate Row", day: `Day ${GAME_CONSTANTS.UNLOCK_BAZAAR_DAY}` },
                { label: "Underbelly", day: `Day ${GAME_CONSTANTS.UNLOCK_UNDERBELLY_DAY}` },
                { label: "Full Station Access", day: `Day ${GAME_CONSTANTS.UNLOCK_FULL_STATION_DAY}` },
              ].map(({ label, day }) => (
                <div key={label} className="flex justify-between rounded border border-slate-800/60 bg-slate-900/30 px-2 py-1">
                  <span className="text-slate-400">{label}</span>
                  <span className={accountAgeDays >= parseInt(day) ? "text-emerald-400" : "text-amber-500"}>{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
