import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const GAMES = [
  {
    href: "/primaris/casino/crash",
    icon: "🚀",
    name: "Crash",
    tagline: "Ride the rocket. Cash out before it explodes.",
    badge: "DEGEN",
    badgeColor: "bg-red-600",
    odds: "Up to 100x",
  },
  {
    href: "/primaris/casino/slots",
    icon: "🎰",
    name: "Slots",
    tagline: "Three reels. One jackpot. Pure chaos.",
    badge: "JACKPOT",
    badgeColor: "bg-amber-600",
    odds: "Up to 50x",
  },
  {
    href: "/primaris/casino/blackjack",
    icon: "🃏",
    name: "Blackjack",
    tagline: "Beat the dealer. Skill meets fortune.",
    badge: "SKILL",
    badgeColor: "bg-emerald-700",
    odds: "2.5x BJ",
  },
  {
    href: "/primaris/casino/dice",
    icon: "🎲",
    name: "Dice Pit",
    tagline: "Roll over, under, or hit the magic seven.",
    badge: "FAST",
    badgeColor: "bg-cyan-700",
    odds: "Up to 4x",
  },
  {
    href: "/primaris/casino/coin-flip",
    icon: "🪙",
    name: "Coin Flip",
    tagline: "Double or nothing. No strategy needed.",
    badge: "SIMPLE",
    badgeColor: "bg-slate-600",
    odds: "1.95x",
  },
];

export default async function CasinoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/primaris" className="text-[11px] text-slate-500 hover:text-cyan-300">← Primaris</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-red-400">Casino</span>
          </div>

          <div className="rounded-md border border-red-900 bg-[#0b0f14] p-5">
            <h1 className="text-2xl font-bold text-red-400">🕵️ The Underbelly — Casino</h1>
            <p className="text-slate-400 text-sm mt-1">
              No corp oversight. No limits. All credits. Enter at your own risk.
            </p>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
              <span>💳 Credits:</span>
              <span className="text-amber-400 font-bold font-mono">{pilot.credits.toLocaleString()} ₡</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAMES.map((game) => (
              <Link
                key={game.href}
                href={game.href}
                className="bg-[#0a0d11] border border-slate-700 hover:border-red-700 rounded-xl p-5 flex gap-4 items-start transition-all group"
              >
                <div className="text-4xl">{game.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-100 font-bold group-hover:text-red-300 transition-colors">
                      {game.name}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold text-white ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{game.tagline}</p>
                  <div className="mt-2 text-amber-400 text-xs font-bold">{game.odds}</div>
                </div>
                <div className="text-slate-600 group-hover:text-red-500 text-xl transition-colors">→</div>
              </Link>
            ))}
          </div>

          <div className="bg-red-900/10 border border-red-900/40 rounded-lg p-4 text-xs text-slate-500 space-y-1">
            <p>⚠️ <span className="text-red-400 font-semibold">House Warning:</span> The Underbelly takes a cut on every game. Credits lost here are gone for good.</p>
            <p>All games use your credits directly.</p>
          </div>
        </div>
      </main>
    </>
  );
}
