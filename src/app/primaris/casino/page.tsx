import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
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

  // Fetch casino stats
  const bets = await prisma.casinoBet.findMany({
    where: { pilotId: pilot.id },
    select: { game: true, bet: true, net: true },
  });

  const stats = (() => {
    if (bets.length === 0) return null;
    let wins = 0, losses = 0, totalWagered = 0, totalNet = 0;
    const gameCounts: Record<string, number> = {};
    for (const b of bets) {
      if (b.net > 0) wins++;
      else if (b.net < 0) losses++;
      totalWagered += b.bet;
      totalNet += b.net;
      gameCounts[b.game] = (gameCounts[b.game] ?? 0) + 1;
    }
    const favoriteGame = Object.entries(gameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { totalBets: bets.length, wins, losses, totalWagered, totalNet, averageBet: Math.round(totalWagered / bets.length), favoriteGame };
  })();

  const GAME_LABELS: Record<string, string> = {
    slots: "Slots", dice: "Dice Pit", coinflip: "Coin Flip", blackjack: "Blackjack", crash: "Crash",
  };

  // ── Public leaderboard data ────────────────────────────────────────
  const allBets = await prisma.casinoBet.findMany({
    select: { pilotId: true, bet: true, net: true },
  });

  // Aggregate per pilot
  const pilotAgg: Record<string, { wagered: number; net: number }> = {};
  let casinoRevenue = 0;
  for (const b of allBets) {
    const p = (pilotAgg[b.pilotId] ??= { wagered: 0, net: 0 });
    p.wagered += b.bet;
    p.net += b.net;
    casinoRevenue -= b.net; // house earns the inverse of player net
  }

  const pilotIds = Object.keys(pilotAgg);
  const pilotNames = pilotIds.length > 0
    ? await prisma.pilotState.findMany({
        where: { id: { in: pilotIds } },
        select: { id: true, callsign: true },
      })
    : [];
  const nameMap = Object.fromEntries(pilotNames.map((p) => [p.id, p.callsign]));

  // High roller = most total wagered
  const highRoller = pilotIds.length > 0
    ? pilotIds.reduce((a, b) => pilotAgg[a].wagered >= pilotAgg[b].wagered ? a : b)
    : null;

  // Biggest loser = most negative net
  const biggestLoser = pilotIds.length > 0
    ? pilotIds.reduce((a, b) => pilotAgg[a].net <= pilotAgg[b].net ? a : b)
    : null;

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

          {/* ── Public Leaderboard ─────────────────────────────────── */}
          <div className="rounded-md border border-red-900/60 bg-[#0b0f14] p-5 space-y-3">
            <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">🏛 The Underbelly — House Ledger</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded border border-amber-900/40 bg-black/40 p-3 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Casino Revenue</p>
                <p className="text-lg font-bold text-amber-400 font-mono">{casinoRevenue.toLocaleString()} ₡</p>
              </div>
              <div className="rounded border border-red-900/40 bg-black/40 p-3 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">High Roller</p>
                {highRoller ? (
                  <>
                    <p className="text-sm font-bold text-red-300">{nameMap[highRoller] ?? "Unknown"}</p>
                    <p className="text-[10px] text-slate-600 font-mono">{pilotAgg[highRoller].wagered.toLocaleString()} ₡ wagered</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-600">No bets yet</p>
                )}
              </div>
              <div className="rounded border border-purple-900/40 bg-black/40 p-3 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Biggest Loser</p>
                {biggestLoser && pilotAgg[biggestLoser].net < 0 ? (
                  <>
                    <p className="text-sm font-bold text-purple-300">{nameMap[biggestLoser] ?? "Unknown"}</p>
                    <p className="text-[10px] text-slate-600 font-mono">{Math.abs(pilotAgg[biggestLoser].net).toLocaleString()} ₡ lost</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-600">No losses yet</p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-600 text-center italic">All figures public. The house always keeps score.</p>
          </div>

          {/* ── Personal Stats ─────────────────────────────────────── */}
          {stats && (
            <div className="rounded-md border border-slate-800 bg-[#0b0f14] p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">📊 Your Record</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded border border-slate-800 bg-black/40 p-2.5 text-center">
                  <p className="text-[10px] text-slate-500">Total Bets</p>
                  <p className="text-sm font-bold text-slate-200 font-mono">{stats.totalBets}</p>
                </div>
                <div className="rounded border border-slate-800 bg-black/40 p-2.5 text-center">
                  <p className="text-[10px] text-slate-500">Wins / Losses</p>
                  <p className="text-sm font-mono">
                    <span className="text-emerald-400 font-bold">{stats.wins}</span>
                    <span className="text-slate-600"> / </span>
                    <span className="text-red-400 font-bold">{stats.losses}</span>
                  </p>
                </div>
                <div className="rounded border border-slate-800 bg-black/40 p-2.5 text-center">
                  <p className="text-[10px] text-slate-500">Net P&L</p>
                  <p className={`text-sm font-bold font-mono ${stats.totalNet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {stats.totalNet >= 0 ? "+" : ""}{stats.totalNet.toLocaleString()} ₡
                  </p>
                </div>
                <div className="rounded border border-slate-800 bg-black/40 p-2.5 text-center">
                  <p className="text-[10px] text-slate-500">Avg Bet</p>
                  <p className="text-sm font-bold text-amber-400 font-mono">{stats.averageBet.toLocaleString()} ₡</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500">
                <span>Total Wagered: <span className="text-slate-300 font-mono">{stats.totalWagered.toLocaleString()} ₡</span></span>
                <span>Favorite Game: <span className="text-red-300">{GAME_LABELS[stats.favoriteGame] ?? stats.favoriteGame}</span></span>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
