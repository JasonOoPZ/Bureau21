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
    name: "Crash",
    tagline: "Ride the rocket. Cash out before it explodes.",
    badge: "DEGEN",
    badgeColor: "bg-red-600",
    odds: "Up to 100x",
    iconColor: "#ef4444",
  },
  {
    href: "/primaris/casino/slots",
    name: "Slots",
    tagline: "Three reels. One jackpot. Pure chaos.",
    badge: "JACKPOT",
    badgeColor: "bg-amber-600",
    odds: "Up to 50x",
    iconColor: "#f59e0b",
  },
  {
    href: "/primaris/casino/blackjack",
    name: "Blackjack",
    tagline: "Beat the dealer. Skill meets fortune.",
    badge: "SKILL",
    badgeColor: "bg-emerald-700",
    odds: "2.5x BJ",
    iconColor: "#10b981",
  },
  {
    href: "/primaris/casino/dice",
    name: "Dice Pit",
    tagline: "Roll over, under, or hit the magic seven.",
    badge: "FAST",
    badgeColor: "bg-cyan-700",
    odds: "Up to 4x",
    iconColor: "#22d3ee",
  },
  {
    href: "/primaris/casino/coin-flip",
    name: "Coin Flip",
    tagline: "Double or nothing. No strategy needed.",
    badge: "SIMPLE",
    badgeColor: "bg-slate-600",
    odds: "1.95x",
    iconColor: "#eab308",
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

          {/* ── Hero Banner ──────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-xl border border-red-900/60 bg-gradient-to-r from-[#12080a] via-[#140a0c] to-[#12080a]">
            {/* Background grid lines */}
            <div className="absolute inset-0 opacity-[0.04]" style={{ background: "repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(239,68,68,0.15) 40px, rgba(239,68,68,0.15) 41px), repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(239,68,68,0.08) 40px, rgba(239,68,68,0.08) 41px)" }} />
            {/* Diagonal hazard stripes */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ background: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(245,158,11,0.12) 20px, rgba(245,158,11,0.12) 21px)" }} />
            {/* Roulette Wheel SVG */}
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-32 h-32 opacity-[0.07]" viewBox="0 0 128 128" fill="none">
              <circle cx="64" cy="64" r="60" stroke="#ef4444" strokeWidth="2" />
              <circle cx="64" cy="64" r="50" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="8 6" />
              <circle cx="64" cy="64" r="38" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 8" />
              <circle cx="64" cy="64" r="24" stroke="#ef4444" strokeWidth="1" />
              <circle cx="64" cy="64" r="10" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1.5" />
              <circle cx="64" cy="64" r="4" fill="#ef4444" fillOpacity="0.4" />
              {/* Spokes */}
              <line x1="64" y1="4" x2="64" y2="26" stroke="#ef4444" strokeWidth="0.8" opacity="0.4" />
              <line x1="64" y1="102" x2="64" y2="124" stroke="#ef4444" strokeWidth="0.8" opacity="0.4" />
              <line x1="4" y1="64" x2="26" y2="64" stroke="#ef4444" strokeWidth="0.8" opacity="0.4" />
              <line x1="102" y1="64" x2="124" y2="64" stroke="#ef4444" strokeWidth="0.8" opacity="0.4" />
              <line x1="21" y1="21" x2="36" y2="36" stroke="#ef4444" strokeWidth="0.6" opacity="0.3" />
              <line x1="107" y1="21" x2="92" y2="36" stroke="#ef4444" strokeWidth="0.6" opacity="0.3" />
              <line x1="21" y1="107" x2="36" y2="92" stroke="#ef4444" strokeWidth="0.6" opacity="0.3" />
              <line x1="107" y1="107" x2="92" y2="92" stroke="#ef4444" strokeWidth="0.6" opacity="0.3" />
              {/* Pips around the edge */}
              <circle cx="64" cy="8" r="2" fill="#ef4444" opacity="0.3" />
              <circle cx="64" cy="120" r="2" fill="#10b981" opacity="0.3" />
              <circle cx="8" cy="64" r="2" fill="#ef4444" opacity="0.3" />
              <circle cx="120" cy="64" r="2" fill="#10b981" opacity="0.3" />
              <circle cx="24" cy="24" r="1.5" fill="#f59e0b" opacity="0.25" />
              <circle cx="104" cy="24" r="1.5" fill="#ef4444" opacity="0.25" />
              <circle cx="24" cy="104" r="1.5" fill="#ef4444" opacity="0.25" />
              <circle cx="104" cy="104" r="1.5" fill="#f59e0b" opacity="0.25" />
            </svg>
            {/* Left-side card fan */}
            <svg className="absolute left-3 bottom-2 w-16 h-16 opacity-[0.06]" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="12" width="24" height="36" rx="3" stroke="#f59e0b" strokeWidth="1" transform="rotate(-15 20 30)" />
              <rect x="18" y="10" width="24" height="36" rx="3" stroke="#ef4444" strokeWidth="1" transform="rotate(0 30 28)" />
              <rect x="28" y="12" width="24" height="36" rx="3" stroke="#f59e0b" strokeWidth="1" transform="rotate(15 40 30)" />
              <text x="30" y="33" textAnchor="middle" fill="#ef4444" fontSize="14" fontWeight="bold" opacity="0.5">A</text>
            </svg>
            <div className="relative flex items-center gap-4 p-5">
              {/* Casino chip SVG icon */}
              <div className="shrink-0">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="opacity-90">
                  <circle cx="26" cy="26" r="22" fill="url(#chipGrad)" stroke="#ef4444" strokeWidth="2" />
                  <circle cx="26" cy="26" r="17" stroke="#fca5a5" strokeWidth="1" strokeDasharray="5 3" opacity="0.5" />
                  <circle cx="26" cy="26" r="11" stroke="#ef4444" strokeWidth="1.5" opacity="0.7" />
                  <circle cx="26" cy="26" r="6" fill="#ef4444" fillOpacity="0.2" stroke="#fca5a5" strokeWidth="1" />
                  <text x="26" y="30" textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="bold">₡</text>
                  {/* Chip edge notches */}
                  <rect x="24.5" y="2" width="3" height="5" rx="1" fill="#ef4444" opacity="0.5" />
                  <rect x="24.5" y="45" width="3" height="5" rx="1" fill="#ef4444" opacity="0.5" />
                  <rect x="2" y="24.5" width="5" height="3" rx="1" fill="#ef4444" opacity="0.5" />
                  <rect x="45" y="24.5" width="5" height="3" rx="1" fill="#ef4444" opacity="0.5" />
                  <rect x="8" y="8" width="4" height="2.5" rx="1" fill="#ef4444" opacity="0.35" transform="rotate(45 10 9.25)" />
                  <rect x="40" y="8" width="4" height="2.5" rx="1" fill="#ef4444" opacity="0.35" transform="rotate(-45 42 9.25)" />
                  <rect x="8" y="41.5" width="4" height="2.5" rx="1" fill="#ef4444" opacity="0.35" transform="rotate(-45 10 42.75)" />
                  <rect x="40" y="41.5" width="4" height="2.5" rx="1" fill="#ef4444" opacity="0.35" transform="rotate(45 42 42.75)" />
                  <defs>
                    <radialGradient id="chipGrad" cx="50%" cy="40%" r="55%">
                      <stop offset="0%" stopColor="#450a0a" />
                      <stop offset="100%" stopColor="#1c0505" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-[0.15em] text-red-300">The Underbelly</h1>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  No corp oversight. No limits. All credits. Enter at your own risk.
                </p>
              </div>
              <div className="ml-auto hidden sm:block text-right">
                <div className="text-[10px] uppercase tracking-widest text-slate-600">Credits</div>
                <div className="text-lg font-black text-amber-400 font-mono">{pilot.credits.toLocaleString()} ₡</div>
              </div>
            </div>
            {/* Bottom circuit line decoration */}
            <svg className="absolute bottom-0 left-0 w-full h-3 opacity-[0.08]" viewBox="0 0 400 12" preserveAspectRatio="none">
              <path d="M0 6h50l3-3h20l3 3h30l3-4h15l3 4h40l3-3h30l3 3h197" stroke="#ef4444" strokeWidth="0.7" fill="none" />
            </svg>
          </div>

          {/* Credits display for mobile */}
          <div className="sm:hidden rounded-md border border-amber-900/30 bg-[#0b0f14] px-4 py-2.5 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-slate-600">Credits</span>
            <span className="text-lg font-black text-amber-400 font-mono">{pilot.credits.toLocaleString()} ₡</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAMES.map((game) => (
              <Link
                key={game.href}
                href={game.href}
                className="relative overflow-hidden bg-[#0a0d11] border border-slate-700 hover:border-red-700 rounded-xl p-5 flex gap-4 items-start transition-all group"
              >
                {/* Subtle corner glow */}
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle, ${game.iconColor}15 0%, transparent 70%)` }} />
                <div className="shrink-0">
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="opacity-80 group-hover:opacity-100 transition-opacity">
                    <circle cx="22" cy="22" r="20" stroke={game.iconColor} strokeWidth="1" opacity="0.2" />
                    <circle cx="22" cy="22" r="14" stroke={game.iconColor} strokeWidth="0.7" strokeDasharray="3 4" opacity="0.25" />
                    <circle cx="22" cy="22" r="7" fill={game.iconColor} fillOpacity="0.1" stroke={game.iconColor} strokeWidth="1" opacity="0.6" />
                    <circle cx="22" cy="22" r="2.5" fill={game.iconColor} opacity="0.5" />
                  </svg>
                </div>
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
          <div className="relative overflow-hidden rounded-xl border border-red-900/60 bg-gradient-to-b from-[#100a0c] to-[#0b0f14] p-5 space-y-4">
            {/* Background vault pattern */}
            <svg className="absolute top-2 right-3 w-20 h-20 opacity-[0.04]" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="#ef4444" strokeWidth="1.5" />
              <circle cx="40" cy="40" r="28" stroke="#ef4444" strokeWidth="1" strokeDasharray="5 4" />
              <circle cx="40" cy="40" r="18" stroke="#ef4444" strokeWidth="0.8" />
              <circle cx="40" cy="40" r="8" fill="#ef4444" fillOpacity="0.15" />
              <line x1="40" y1="4" x2="40" y2="20" stroke="#ef4444" strokeWidth="0.5" />
              <line x1="40" y1="60" x2="40" y2="76" stroke="#ef4444" strokeWidth="0.5" />
              <line x1="4" y1="40" x2="20" y2="40" stroke="#ef4444" strokeWidth="0.5" />
              <line x1="60" y1="40" x2="76" y2="40" stroke="#ef4444" strokeWidth="0.5" />
            </svg>
            <div className="flex items-center gap-3">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="opacity-70">
                <path d="M14 2L4 8v6c0 6.6 4.3 12.8 10 14 5.7-1.2 10-7.4 10-14V8L14 2z" stroke="#ef4444" strokeWidth="1.2" fill="#ef4444" fillOpacity="0.06" />
                <rect x="11" y="11" width="6" height="7" rx="1" stroke="#fca5a5" strokeWidth="1" />
                <circle cx="14" cy="14" r="1" fill="#fca5a5" />
              </svg>
              <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">The Underbelly — House Ledger</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative overflow-hidden rounded-lg border border-amber-900/40 bg-gradient-to-br from-amber-950/30 to-black/40 p-4 text-center">
                <svg className="absolute -right-2 -bottom-2 w-12 h-12 opacity-[0.08]" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4l4 10h10l-8 6 3 10-9-6-9 6 3-10-8-6h10z" fill="#f59e0b" />
                </svg>
                <p className="text-[10px] text-amber-500/70 uppercase tracking-wider font-semibold">Casino Revenue</p>
                <p className="text-xl font-black text-amber-400 font-mono mt-1">{casinoRevenue.toLocaleString()} ₡</p>
                <p className="text-[9px] text-slate-600 mt-0.5">All-time house earnings</p>
              </div>
              <div className="relative overflow-hidden rounded-lg border border-red-900/40 bg-gradient-to-br from-red-950/30 to-black/40 p-4 text-center">
                <svg className="absolute -right-1 -bottom-1 w-10 h-10 opacity-[0.08]" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="16" stroke="#ef4444" strokeWidth="2" />
                  <circle cx="20" cy="20" r="10" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" />
                  <circle cx="20" cy="20" r="4" fill="#ef4444" />
                </svg>
                <p className="text-[10px] text-red-500/70 uppercase tracking-wider font-semibold">High Roller</p>
                {highRoller ? (
                  <>
                    <p className="text-base font-black text-red-300 mt-1">{nameMap[highRoller] ?? "Unknown"}</p>
                    <p className="text-[10px] text-slate-600 font-mono">{pilotAgg[highRoller].wagered.toLocaleString()} ₡ wagered</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-600 mt-2">No bets yet</p>
                )}
              </div>
              <div className="relative overflow-hidden rounded-lg border border-purple-900/40 bg-gradient-to-br from-purple-950/30 to-black/40 p-4 text-center">
                <svg className="absolute -right-1 -bottom-1 w-10 h-10 opacity-[0.08]" viewBox="0 0 40 40" fill="none">
                  <path d="M20 4v32M4 20h32" stroke="#a855f7" strokeWidth="2" />
                  <path d="M10 10l20 20M30 10l-20 20" stroke="#a855f7" strokeWidth="1" opacity="0.5" />
                </svg>
                <p className="text-[10px] text-purple-500/70 uppercase tracking-wider font-semibold">Biggest Loser</p>
                {biggestLoser && pilotAgg[biggestLoser].net < 0 ? (
                  <>
                    <p className="text-base font-black text-purple-300 mt-1">{nameMap[biggestLoser] ?? "Unknown"}</p>
                    <p className="text-[10px] text-slate-600 font-mono">{Math.abs(pilotAgg[biggestLoser].net).toLocaleString()} ₡ lost</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-600 mt-2">No losses yet</p>
                )}
              </div>
            </div>
            {/* Bottom line */}
            <div className="flex items-center gap-2 justify-center">
              <svg width="60" height="4" viewBox="0 0 60 4" className="opacity-20"><line x1="0" y1="2" x2="60" y2="2" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2 3" /></svg>
              <p className="text-[9px] text-slate-600 italic">All figures public. The house always keeps score.</p>
              <svg width="60" height="4" viewBox="0 0 60 4" className="opacity-20"><line x1="0" y1="2" x2="60" y2="2" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2 3" /></svg>
            </div>
          </div>

          {/* ── Personal Stats ─────────────────────────────────────── */}
          {stats && (
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-b from-[#0c0e12] to-[#0b0f14] p-5 space-y-3">
              {/* Background chart decoration */}
              <svg className="absolute right-3 top-3 w-16 h-16 opacity-[0.04]" viewBox="0 0 64 64" fill="none">
                <path d="M8 56V12M8 56H60" stroke="#94a3b8" strokeWidth="1" />
                <path d="M8 48l10-4 10 2 10-12 10-6 10-10" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 48l10-4 10 2 10-12 10-6 10-10V56H8Z" fill="#22d3ee" opacity="0.15" />
              </svg>
              <div className="flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-60">
                  <rect x="3" y="12" width="4" height="9" rx="1" fill="#64748b" />
                  <rect x="10" y="7" width="4" height="14" rx="1" fill="#94a3b8" />
                  <rect x="17" y="3" width="4" height="18" rx="1" fill="#cbd5e1" />
                </svg>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Your Record</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border border-slate-800 bg-black/40 p-2.5 text-center">
                  <p className="text-[10px] text-slate-500">Total Bets</p>
                  <p className="text-sm font-bold text-slate-200 font-mono">{stats.totalBets}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-black/40 p-2.5 text-center">
                  <p className="text-[10px] text-slate-500">Wins / Losses</p>
                  <p className="text-sm font-mono">
                    <span className="text-emerald-400 font-bold">{stats.wins}</span>
                    <span className="text-slate-600"> / </span>
                    <span className="text-red-400 font-bold">{stats.losses}</span>
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-black/40 p-2.5 text-center">
                  <p className="text-[10px] text-slate-500">Net P&L</p>
                  <p className={`text-sm font-bold font-mono ${stats.totalNet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {stats.totalNet >= 0 ? "+" : ""}{stats.totalNet.toLocaleString()} ₡
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-black/40 p-2.5 text-center">
                  <p className="text-[10px] text-slate-500">Avg Bet</p>
                  <p className="text-sm font-bold text-amber-400 font-mono">{stats.averageBet.toLocaleString()} ₡</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500">
                <span>Total Wagered: <span className="text-slate-300 font-mono">{stats.totalWagered.toLocaleString()} ₡</span></span>
                <span className="text-slate-700">|</span>
                <span>Favorite Game: <span className="text-red-300">{GAME_LABELS[stats.favoriteGame] ?? stats.favoriteGame}</span></span>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
