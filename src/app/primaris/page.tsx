import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { GAME_CONSTANTS } from "@/lib/constants";
import { getOrCreatePilotState } from "@/lib/game-state";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Location {
  name: string;
  href: string;
  description: string;
  status: "live" | "planned";
}

interface District {
  name: string;
  accent: string;
  icon: string;
  locations: Location[];
}

const DISTRICTS: District[] = [
  {
    name: "Command District",
    accent: "border-cyan-900/60",
    icon: "🏛",
    locations: [
      { name: "Lobby Hub", href: "/lobby", description: "Central pilot dashboard and network relay.", status: "live" },
      { name: "Character Sheet", href: "/house", description: "Your pilot profile, stats, and battle history.", status: "live" },
      { name: "Message Boards", href: "/boards", description: "Public communications and network bulletins.", status: "live" },
      { name: "Town Hall", href: "/chat", description: "Real-time pilot comms channel.", status: "live" },
      { name: "QuickPosts", href: "/quickposts", description: "Short-burst messages to other pilots.", status: "live" },
      { name: "Update Log", href: "/updates", description: "Station-wide patch notes and changelog.", status: "live" },
    ],
  },
  {
    name: "Combat Quarter",
    accent: "border-red-900/60",
    icon: "⚔",
    locations: [
      { name: "Battle Arena", href: "/battle", description: "PVP combat against other pilots.", status: "live" },
      { name: "Galaxy Gym", href: "/gym", description: "Train strength, speed, endurance, and confidence.", status: "live" },
      { name: "The Academy", href: "/station/academy", description: "Advanced combat training modules.", status: "live" },
      { name: "Battle Support Corps", href: "/heroes", description: "Recruit and deploy hero units for battle bonuses.", status: "live" },
      { name: "Training Grounds", href: "/primaris/training-grounds", description: "Sparring matches and practice drills.", status: "live" },
    ],
  },
  {
    name: "Commerce Row",
    accent: "border-amber-900/60",
    icon: "🏪",
    locations: [
      { name: "Armory", href: "/station/armory", description: "Weapons, shields, and engines for sale.", status: "live" },
      { name: "Bazaar", href: "/station/bazaar", description: "Player-driven marketplace and loot exchange.", status: "live" },
      { name: "Bank", href: "/bank", description: "Deposit credits, earn interest, manage tokens.", status: "live" },
      { name: "Fabrication", href: "/station/fabrication", description: "Craft and upgrade equipment from salvage.", status: "live" },
      { name: "Inventory", href: "/inventory", description: "Manage your gear and equipment loadout.", status: "live" },
      { name: "Pawn Shop", href: "/primaris/pawn-shop", description: "Sell unwanted gear for quick credits.", status: "live" },
    ],
  },
  {
    name: "The Underbelly",
    accent: "border-purple-900/60",
    icon: "☠",
    locations: [
      { name: "Black Market", href: "/station/underbelly", description: "Contraband labs and high-risk deals.", status: "live" },
      { name: "Casino", href: "/primaris/casino", description: "High-stakes gambling. Credits in, credits out.", status: "live" },
      { name: "Fight Pit", href: "/primaris/fight-pit", description: "Underground bare-knuckle brawls. No rules.", status: "live" },
      { name: "Smuggler's Den", href: "/primaris/smugglers-den", description: "Move illicit cargo for massive payouts.", status: "live" },
      { name: "Info Broker", href: "/primaris/info-broker", description: "Buy intel on other pilots and syndicates.", status: "live" },
    ],
  },
  {
    name: "Industrial Sector",
    accent: "border-slate-600",
    icon: "🔧",
    locations: [
      { name: "Hydroponics Bay", href: "/station/hydroponics", description: "Grow herbs, consumables, and bio-fuel.", status: "live" },
      { name: "Docking Bay", href: "/station/docking-bay", description: "Ship upgrades, hull repair, and warp charting.", status: "live" },
      { name: "Mining Rig", href: "/primaris/mining-rig", description: "Extract ore and rare minerals from asteroids.", status: "live" },
      { name: "Refinery", href: "/primaris/refinery", description: "Process raw ore into crafting materials.", status: "live" },
      { name: "Salvage Yard", href: "/primaris/salvage-yard", description: "Scavenge derelict ships for parts.", status: "live" },
    ],
  },
  {
    name: "Frontier",
    accent: "border-emerald-900/60",
    icon: "🌌",
    locations: [
      { name: "Outer Ring", href: "/station/outer-ring", description: "Deep-space contracts and frontier scouting.", status: "live" },
      { name: "Fishing Hut", href: "/primaris/fishing-hut", description: "Cast lines into the void. Catch strange things.", status: "live" },
      { name: "Exploration Bay", href: "/primaris/exploration-bay", description: "Chart unknown sectors and discover anomalies.", status: "live" },
      { name: "Outpost", href: "/primaris/outpost", description: "Establish forward bases in remote sectors.", status: "live" },
    ],
  },
  {
    name: "Social District",
    accent: "border-pink-900/60",
    icon: "🎭",
    locations: [
      { name: "Syndicate Row", href: "/station/syndicate-row", description: "Form or join a syndicate. Guild operations.", status: "live" },
      { name: "Settings", href: "/settings", description: "Pilot preferences and account configuration.", status: "live" },
      { name: "Account", href: "/account", description: "Manage your Bureau 21 account.", status: "live" },
      { name: "Lounge", href: "/primaris/lounge", description: "Hang out, show off gear, and socialize.", status: "live" },
      { name: "Tattoo Parlor", href: "/primaris/tattoo-parlor", description: "Customize your pilot's appearance and flair.", status: "live" },
      { name: "University", href: "/primaris/university", description: "Study courses to unlock station-wide benefits.", status: "live" },
    ],
  },
];

export default async function PrimarisPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(pilot.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const hour = new Date().getHours();
  const timeOfDay =
    hour < 6 ? "Night Cycle" : hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";

  const totalLive = DISTRICTS.reduce((s, d) => s + d.locations.filter((l) => l.status === "live").length, 0);
  const totalPlanned = DISTRICTS.reduce((s, d) => s + d.locations.filter((l) => l.status === "planned").length, 0);

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-6xl space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Primaris</span>
          </div>

          {/* Header */}
          <div className="rounded-md border border-cyan-900/30 bg-[#0b0f14] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-[0.2em] text-cyan-200">
                  Primaris Core
                </h1>
                <p className="mt-1 text-[12px] text-slate-400">
                  The central hub of Bureau 21. Every district, outpost, and facility accessible from one location.
                  Hover or tap a destination to see what awaits.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  It is currently: <span className="text-cyan-300">{timeOfDay}</span>
                </p>
              </div>
              <div className="shrink-0 text-right text-[11px]">
                <p className="text-slate-500">Locations active</p>
                <p className="font-bold text-emerald-300">{totalLive}</p>
                <p className="mt-1 text-slate-500">Under construction</p>
                <p className="font-bold text-amber-400">{totalPlanned}</p>
              </div>
            </div>
          </div>

          {/* District grid */}
          <div className="space-y-4">
            {DISTRICTS.map((district) => (
              <section key={district.name} className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">{district.icon}</span>
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.15em] text-slate-300 underline decoration-slate-700 underline-offset-4">
                    {district.name}:
                  </h2>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  {district.locations.map((loc) => {
                    const isLive = loc.status === "live";
                    return isLive ? (
                      <Link
                        key={loc.name}
                        href={loc.href}
                        className="text-[12px] text-cyan-400 transition hover:text-cyan-200 hover:underline"
                        title={loc.description}
                      >
                        {loc.name}
                      </Link>
                    ) : (
                      <span
                        key={loc.name}
                        className="cursor-default text-[12px] text-slate-600"
                        title={loc.description}
                      >
                        {loc.name}
                      </span>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
