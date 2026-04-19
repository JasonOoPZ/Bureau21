import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

interface PatchNote {
  version: string;
  date: string;
  tag: "live" | "hotfix" | "balance" | "content";
  entries: string[];
}

const PATCH_NOTES: PatchNote[] = [
  {
    version: "0.6.0",
    date: "2026-03-21",
    tag: "live",
    entries: [
      "Station overview — district hub with progressive unlock rules.",
      "Full Inventory page with equip/unequip/discard UI.",
      "Syndicate Row — create and join guilds, treasury display.",
      "QuickPosts — private pilot-to-pilot messaging with inbox and sent views.",
      "Account page — identity, stats snapshot, and quick navigation.",
      "This updates & changelog page.",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-03-20",
    tag: "content",
    entries: [
      "Community Boards — post threads by category (general, trading, help, events).",
      "Live Chat — real-time channel with 10-second polling, per-user color coding.",
      "Bazaar — personal inventory preview and live network item drop feed.",
      "Navigation updated: all built routes promoted from 'planned' to 'live'.",
      "Lobby: 'View Character Sheet' shortcut added to left rail.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-03-19",
    tag: "content",
    entries: [
      "Battle Arena — turn-based combat with 5 NPC bots (Scrap Drone → Syndicate Hunter).",
      "Gym — 5 training types with motivation cost, daily regen, and streak bonuses.",
      "Bank — credit/Sovereign exchange at defined buy/sell rates.",
      "Armory — item shop with T1/T2/T3 catalog and credit deduction.",
      "House (Character Sheet) — full pilot portrait, stat bars, loadout, and battle history.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-03-18",
    tag: "balance",
    entries: [
      "PilotState: added combat stats (strength, speed, endurance, panic, confidence, LF, atkSplit).",
      "PilotState: added gym fields (gymStreak, lastGymAt, motivation, lastMotivationAt).",
      "PilotState: added economy fields (Sovereigns).",
      "BattleLog model added. Combat results now persisted to database.",
      "Battle engine: ATK/DEF formula, crit system (7%), equipment bonuses.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-03-15",
    tag: "live",
    entries: [
      "PilotConsole game loop with 6 actions: patrol, repair, mine, scan, refuel, jump.",
      "InventoryItem system: 14 base item templates across weapon/shield/engine types.",
      "Item drops on patrol/scan/mine. Equip slots enforced: one per type.",
      "Mission system: 3 active missions, auto-refresh on complete.",
      "Leaderboard: pilot rankings by level, XP, and credits.",
      "Lobby with live pilot state in left rail.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-03-10",
    tag: "live",
    entries: [
      "Project scaffolded: Next.js 15, TypeScript, Tailwind CSS, Prisma + SQLite.",
      "NextAuth v4: Credentials + Google OAuth providers.",
      "User and PilotState models. Initial route map from Bureau21 planning docs.",
      "TopBar, SectionShell, and base layout components.",
    ],
  },
];

const TAG_STYLES: Record<string, string> = {
  live: "border-emerald-700/60 bg-emerald-900/20 text-emerald-300",
  hotfix: "border-red-700/60 bg-red-900/20 text-red-300",
  balance: "border-amber-700/60 bg-amber-900/20 text-amber-300",
  content: "border-cyan-700/60 bg-cyan-900/20 text-cyan-300",
};

export default async function UpdatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Updates</span>
          </div>

          {/* Header */}
          <PixelBanner scene="station" title="Patch Notes" subtitle="Bureau 21 development changelog. All builds, balance changes, and content drops." />

          {/* Notes */}
          <div className="space-y-2">
            {PATCH_NOTES.map((note) => (
              <div key={note.version} className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[15px] font-bold text-slate-100">v{note.version}</span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-widest ${
                      TAG_STYLES[note.tag] ?? TAG_STYLES.live
                    }`}
                  >
                    {note.tag}
                  </span>
                  <span className="ml-auto text-[10px] text-slate-600">{note.date}</span>
                </div>
                <ul className="space-y-1">
                  {note.entries.map((entry, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-slate-400">
                      <span className="mt-0.5 shrink-0 text-slate-600">·</span>
                      {entry}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
