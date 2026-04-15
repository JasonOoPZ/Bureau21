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
  color: string;
  locations: Location[];
}

const DISTRICTS: District[] = [
  {
    name: "Command District:",
    color: "text-cyan-400",
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
    name: "Combat Quarter:",
    color: "text-red-400",
    locations: [
      { name: "Battle Arena", href: "/battle", description: "PVP combat against other pilots.", status: "live" },
      { name: "Galaxy Gym", href: "/gym", description: "Train strength, speed, endurance, and confidence.", status: "live" },
      { name: "The Academy", href: "/station/academy", description: "Advanced combat training modules.", status: "live" },
      { name: "Battle Support Corps", href: "/heroes", description: "Recruit and deploy hero units for battle bonuses.", status: "live" },
      { name: "Training Grounds", href: "/primaris/training-grounds", description: "Sparring matches and practice drills.", status: "live" },
    ],
  },
  {
    name: "Commerce Row:",
    color: "text-amber-400",
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
    name: "The Underbelly:",
    color: "text-purple-400",
    locations: [
      { name: "Black Market", href: "/station/underbelly", description: "Contraband labs and high-risk deals.", status: "live" },
      { name: "Casino", href: "/primaris/casino", description: "High-stakes gambling. Credits in, credits out.", status: "live" },
      { name: "Fight Pit", href: "/primaris/fight-pit", description: "Underground bare-knuckle brawls. No rules.", status: "live" },
      { name: "Smuggler's Den", href: "/primaris/smugglers-den", description: "Move illicit cargo for massive payouts.", status: "live" },
      { name: "Info Broker", href: "/primaris/info-broker", description: "Buy intel on other pilots and syndicates.", status: "live" },
    ],
  },
  {
    name: "Industrial Sector:",
    color: "text-slate-400",
    locations: [
      { name: "Hydroponics Bay", href: "/station/hydroponics", description: "Grow herbs, consumables, and bio-fuel.", status: "live" },
      { name: "Docking Bay", href: "/station/docking-bay", description: "Ship upgrades, hull repair, and warp charting.", status: "live" },
      { name: "Mining Rig", href: "/primaris/mining-rig", description: "Extract ore and rare minerals from asteroids.", status: "live" },
      { name: "Refinery", href: "/primaris/refinery", description: "Process raw ore into crafting materials.", status: "live" },
      { name: "Salvage Yard", href: "/primaris/salvage-yard", description: "Scavenge derelict ships for parts.", status: "live" },
    ],
  },
  {
    name: "Frontier:",
    color: "text-emerald-400",
    locations: [
      { name: "Outer Ring", href: "/station/outer-ring", description: "Deep-space contracts and frontier scouting.", status: "live" },
      { name: "Fishing Hut", href: "/primaris/fishing-hut", description: "Cast lines into the void. Catch strange things.", status: "live" },
      { name: "Exploration Bay", href: "/primaris/exploration-bay", description: "Chart unknown sectors and discover anomalies.", status: "live" },
      { name: "Outpost", href: "/primaris/outpost", description: "Establish forward bases in remote sectors.", status: "live" },
    ],
  },
  {
    name: "Social District:",
    color: "text-pink-400",
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
        <div className="mx-auto max-w-6xl">
          {/* Banner */}
          <div className="relative mb-4 h-48 w-full overflow-hidden rounded-md border border-slate-800 bg-[#060a0f] sm:h-56">
            {/* CSS sci-fi station scene */}
            <div className="absolute inset-0">
              {/* Sky / stars */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#050810] via-[#0a1020] to-[#0d1418]" />
              {/* Distant nebula glow */}
              <div className="absolute left-1/4 top-4 h-20 w-40 rounded-full bg-purple-900/20 blur-3xl" />
              <div className="absolute right-1/3 top-8 h-16 w-32 rounded-full bg-cyan-900/15 blur-3xl" />
              {/* Stars */}
              <div className="absolute left-[10%] top-[15%] h-[2px] w-[2px] rounded-full bg-white/70" />
              <div className="absolute left-[25%] top-[8%] h-[1px] w-[1px] rounded-full bg-white/50" />
              <div className="absolute left-[40%] top-[20%] h-[2px] w-[2px] rounded-full bg-cyan-300/60" />
              <div className="absolute left-[55%] top-[5%] h-[1px] w-[1px] rounded-full bg-white/40" />
              <div className="absolute left-[70%] top-[12%] h-[2px] w-[2px] rounded-full bg-white/60" />
              <div className="absolute left-[85%] top-[18%] h-[1px] w-[1px] rounded-full bg-purple-300/50" />
              <div className="absolute left-[15%] top-[25%] h-[1px] w-[1px] rounded-full bg-white/30" />
              <div className="absolute left-[60%] top-[22%] h-[1px] w-[1px] rounded-full bg-white/50" />
              <div className="absolute left-[92%] top-[7%] h-[2px] w-[2px] rounded-full bg-cyan-200/40" />
              {/* Station structures */}
              <div className="absolute bottom-0 left-[5%] h-32 w-16 bg-gradient-to-t from-slate-800 to-slate-900 opacity-80" />
              <div className="absolute bottom-0 left-[5%] h-36 w-3 bg-gradient-to-t from-slate-700 to-slate-900 opacity-60" />
              <div className="absolute bottom-0 left-[12%] h-24 w-20 bg-gradient-to-t from-slate-800 to-slate-900/80 opacity-70" />
              <div className="absolute bottom-0 left-[22%] h-28 w-12 bg-gradient-to-t from-slate-800 to-slate-900 opacity-80" />
              <div className="absolute bottom-0 left-[30%] h-20 w-40 bg-gradient-to-t from-slate-800 to-[#0d1418] opacity-60" />
              <div className="absolute bottom-0 right-[5%] h-36 w-14 bg-gradient-to-t from-slate-800 to-slate-900 opacity-80" />
              <div className="absolute bottom-0 right-[15%] h-28 w-18 bg-gradient-to-t from-slate-800 to-slate-900/80 opacity-70" />
              <div className="absolute bottom-0 right-[25%] h-22 w-24 bg-gradient-to-t from-slate-800 to-[#0d1418] opacity-60" />
              {/* Central dome */}
              <div className="absolute bottom-0 left-1/2 h-40 w-48 -translate-x-1/2 rounded-t-full bg-gradient-to-t from-slate-700/50 to-slate-900/30 opacity-80" />
              <div className="absolute bottom-0 left-1/2 h-20 w-60 -translate-x-1/2 bg-gradient-to-t from-slate-700 to-slate-800/50 opacity-60" />
              {/* Glowing windows */}
              <div className="absolute bottom-10 left-[8%] h-1 w-3 bg-cyan-400/60" />
              <div className="absolute bottom-14 left-[9%] h-1 w-2 bg-cyan-500/40" />
              <div className="absolute bottom-6 left-[24%] h-1 w-4 bg-amber-400/50" />
              <div className="absolute bottom-8 right-[8%] h-1 w-3 bg-cyan-400/50" />
              <div className="absolute bottom-16 right-[10%] h-1 w-2 bg-purple-400/40" />
              <div className="absolute bottom-4 left-1/2 h-1 w-6 -translate-x-1/2 bg-cyan-300/40" />
              <div className="absolute bottom-8 left-[46%] h-1 w-3 bg-amber-300/30" />
              <div className="absolute bottom-12 left-[52%] h-1 w-2 bg-cyan-400/30" />
              {/* Ground line */}
              <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-800/30 to-transparent" />
              {/* Station name overlay */}
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-500/40">Primaris Core · Bureau 21</p>
              </div>
            </div>
          </div>

          {/* Intro text */}
          <div className="mb-4 text-[12px] leading-relaxed text-slate-400">
            <p>
              Here it is — Primaris Core in all its questionable glory. Clicking on a link will take you
              to that location (obviously). Hovering your cursor over a link will pop up a description
              of what&apos;s there.
            </p>
          </div>

          {/* Time of day */}
          <p className="mb-5 text-[12px] text-slate-500">
            <span className="font-bold italic text-slate-300">It is currently:</span>{" "}
            <span className="text-slate-300">{timeOfDay}</span>
          </p>

          {/* Districts — multi-column flowing layout */}
          <div className="columns-2 gap-x-8 sm:columns-3 lg:columns-4" style={{ columnFill: "balance" }}>
            {DISTRICTS.map((district) => (
              <div key={district.name} className="mb-4 break-inside-avoid">
                <p className={`text-[13px] font-bold italic ${district.color}`}>
                  {district.name}
                </p>
                <div className="mt-0.5 flex flex-col">
                  {district.locations.map((loc) => {
                    const isLive = loc.status === "live";
                    return isLive ? (
                      <Link
                        key={loc.name}
                        href={loc.href}
                        className="text-[12px] leading-relaxed text-cyan-300 transition-colors hover:text-white"
                        title={loc.description}
                      >
                        {loc.name}
                      </Link>
                    ) : (
                      <span
                        key={loc.name}
                        className="text-[12px] leading-relaxed text-slate-600"
                        title={loc.description}
                      >
                        {loc.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
