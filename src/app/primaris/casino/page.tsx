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

          {/* ── Hero Banner ── Pixel-Art Casino Cityscape ────────── */}
          <div className="relative overflow-hidden rounded-xl border border-purple-900/60">
            <svg viewBox="0 0 640 220" className="w-full h-auto block" shapeRendering="crispEdges">
              <defs>
                <linearGradient id="pxSky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#08010f"/>
                  <stop offset="45%" stopColor="#150830"/>
                  <stop offset="75%" stopColor="#2a1050"/>
                  <stop offset="100%" stopColor="#180828"/>
                </linearGradient>
                <clipPath id="sunClip2">
                  <circle cx="320" cy="148" r="68"/>
                </clipPath>
                <linearGradient id="groundGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff2d7b" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#ff2d7b" stopOpacity="0"/>
                </linearGradient>
              </defs>

              {/* Sky */}
              <rect width="640" height="220" fill="url(#pxSky)"/>

              {/* Stars */}
              <g>
                <rect x="45" y="10" width="2" height="2" fill="#fff" opacity="0.6"/>
                <rect x="92" y="25" width="2" height="2" fill="#ff6b9d" opacity="0.5"/>
                <rect x="148" y="6" width="2" height="2" fill="#fff" opacity="0.7"/>
                <rect x="195" y="38" width="1" height="1" fill="#c084fc" opacity="0.5"/>
                <rect x="265" y="14" width="2" height="2" fill="#fff" opacity="0.5"/>
                <rect x="358" y="22" width="1" height="1" fill="#ff6b9d" opacity="0.4"/>
                <rect x="405" y="8" width="2" height="2" fill="#c084fc" opacity="0.6"/>
                <rect x="462" y="28" width="2" height="2" fill="#fff" opacity="0.5"/>
                <rect x="510" y="12" width="1" height="1" fill="#fff" opacity="0.6"/>
                <rect x="555" y="32" width="2" height="2" fill="#ff6b9d" opacity="0.4"/>
                <rect x="588" y="6" width="2" height="2" fill="#fff" opacity="0.7"/>
                <rect x="625" y="18" width="1" height="1" fill="#c084fc" opacity="0.4"/>
                <rect x="30" y="45" width="1" height="1" fill="#c084fc" opacity="0.3"/>
                <rect x="490" y="48" width="1" height="1" fill="#c084fc" opacity="0.3"/>
                {/* Cross sparkle stars */}
                <rect x="330" y="3" width="6" height="1" fill="#fff" opacity="0.9"/>
                <rect x="332" y="1" width="1" height="6" fill="#fff" opacity="0.9"/>
                <rect x="148" y="4" width="4" height="1" fill="#fff" opacity="0.6"/>
                <rect x="149" y="3" width="1" height="4" fill="#fff" opacity="0.6"/>
              </g>

              {/* Synthwave Sun — striped */}
              <g clipPath="url(#sunClip2)">
                <rect x="252" y="80" width="136" height="9" fill="#ff1a6d" opacity="0.95"/>
                <rect x="252" y="93" width="136" height="8" fill="#ff3580" opacity="0.9"/>
                <rect x="252" y="105" width="136" height="7" fill="#ff5494" opacity="0.85"/>
                <rect x="252" y="116" width="136" height="6" fill="#ff73a8" opacity="0.8"/>
                <rect x="252" y="126" width="136" height="5" fill="#ff8fba" opacity="0.72"/>
                <rect x="252" y="135" width="136" height="5" fill="#ffaacc" opacity="0.65"/>
                <rect x="252" y="144" width="136" height="4" fill="#ffc2db" opacity="0.55"/>
                <rect x="252" y="152" width="136" height="4" fill="#ffd4e6" opacity="0.45"/>
                <rect x="252" y="160" width="136" height="3" fill="#ffe4ef" opacity="0.38"/>
                <rect x="252" y="167" width="136" height="3" fill="#fff0f5" opacity="0.3"/>
                <rect x="252" y="174" width="136" height="3" fill="#fff5fa" opacity="0.22"/>
                <rect x="252" y="181" width="136" height="4" fill="#fff8fc" opacity="0.15"/>
              </g>

              {/* Atmospheric haze */}
              <rect x="0" y="132" width="640" height="2" fill="#3d1565" opacity="0.35"/>
              <rect x="80" y="142" width="220" height="2" fill="#3d1565" opacity="0.3"/>
              <rect x="380" y="139" width="200" height="2" fill="#3d1565" opacity="0.25"/>
              <rect x="0" y="155" width="150" height="2" fill="#3d1565" opacity="0.2"/>
              <rect x="500" y="152" width="140" height="2" fill="#3d1565" opacity="0.2"/>

              {/* ═══ BUILDINGS — back layer ════════════════════════ */}
              <g fill="#1a0838">
                <rect x="58" y="100" width="36" height="120"/>
                <rect x="158" y="95" width="32" height="125"/>
                <rect x="248" y="88" width="26" height="132"/>
                <rect x="362" y="95" width="30" height="125"/>
                <rect x="443" y="100" width="32" height="120"/>
                <rect x="558" y="105" width="26" height="115"/>
              </g>

              {/* ═══ BUILDINGS — mid layer ═════════════════════════ */}
              <g fill="#130628">
                {/* Far left cluster */}
                <rect x="0" y="128" width="50" height="92"/>
                <rect x="28" y="112" width="36" height="108"/>
                <rect x="68" y="106" width="30" height="114"/>
                {/* Left-centre */}
                <rect x="102" y="88" width="34" height="132"/>
                <rect x="138" y="110" width="26" height="110"/>
                <rect x="168" y="96" width="36" height="124"/>
                {/* Centre (in front of sun) */}
                <rect x="208" y="82" width="30" height="138"/>
                <rect x="240" y="92" width="32" height="128"/>
                <rect x="274" y="78" width="26" height="142"/>
                <rect x="302" y="88" width="34" height="132"/>
                <rect x="338" y="82" width="30" height="138"/>
                <rect x="370" y="94" width="26" height="126"/>
                <rect x="398" y="86" width="32" height="134"/>
                {/* Right cluster */}
                <rect x="434" y="98" width="34" height="122"/>
                <rect x="470" y="90" width="28" height="130"/>
                <rect x="500" y="104" width="32" height="116"/>
                <rect x="534" y="96" width="36" height="124"/>
                <rect x="574" y="110" width="28" height="110"/>
                <rect x="604" y="118" width="36" height="102"/>
              </g>

              {/* ═══ BUILDINGS — foreground spires ═════════════════ */}
              <g fill="#0a0418">
                <rect x="0" y="142" width="42" height="78"/>
                <rect x="96" y="102" width="14" height="118"/>
                <rect x="193" y="96" width="18" height="124"/>
                <rect x="283" y="74" width="16" height="146"/>
                <rect x="348" y="90" width="14" height="130"/>
                <rect x="478" y="96" width="16" height="124"/>
                <rect x="598" y="132" width="42" height="88"/>
              </g>

              {/* Antennas & rooftop details */}
              <g fill="#0a0418">
                <rect x="101" y="88" width="2" height="14"/>
                <rect x="200" y="82" width="2" height="14"/>
                <rect x="289" y="58" width="3" height="16"/>
                <rect x="290" y="54" width="1" height="4"/>
                <rect x="354" y="78" width="2" height="12"/>
                <rect x="484" y="84" width="2" height="12"/>
                <rect x="214" y="80" width="8" height="2"/>
                <rect x="306" y="86" width="10" height="2"/>
                <rect x="438" y="96" width="8" height="2"/>
                <rect x="538" y="94" width="6" height="2"/>
              </g>

              {/* ═══ WINDOWS ═════════════════════════════════════ */}
              <g>
                {/* Left buildings */}
                <rect x="8" y="148" width="3" height="3" fill="#7b2fff" opacity="0.7"/>
                <rect x="16" y="148" width="3" height="3" fill="#ff2d7b" opacity="0.5"/>
                <rect x="24" y="155" width="3" height="3" fill="#7b2fff" opacity="0.6"/>
                <rect x="8" y="162" width="3" height="3" fill="#ff2d7b" opacity="0.4"/>
                <rect x="16" y="162" width="3" height="3" fill="#00e5ff" opacity="0.5"/>
                <rect x="32" y="132" width="3" height="3" fill="#ff2d7b" opacity="0.6"/>
                <rect x="40" y="120" width="3" height="3" fill="#7b2fff" opacity="0.7"/>
                <rect x="48" y="126" width="3" height="3" fill="#00e5ff" opacity="0.5"/>
                <rect x="36" y="145" width="3" height="3" fill="#7b2fff" opacity="0.5"/>
                <rect x="48" y="140" width="3" height="3" fill="#ff2d7b" opacity="0.6"/>
                <rect x="74" y="114" width="3" height="3" fill="#00e5ff" opacity="0.6"/>
                <rect x="82" y="120" width="3" height="3" fill="#7b2fff" opacity="0.5"/>
                <rect x="74" y="126" width="3" height="3" fill="#ff2d7b" opacity="0.5"/>
                <rect x="82" y="134" width="3" height="3" fill="#00e5ff" opacity="0.4"/>
                {/* Tall tower windows */}
                <rect x="112" y="96" width="3" height="3" fill="#ff2d7b" opacity="0.7"/>
                <rect x="120" y="102" width="3" height="3" fill="#7b2fff" opacity="0.6"/>
                <rect x="112" y="110" width="3" height="3" fill="#00e5ff" opacity="0.6"/>
                <rect x="120" y="118" width="3" height="3" fill="#ff2d7b" opacity="0.5"/>
                <rect x="112" y="128" width="3" height="3" fill="#7b2fff" opacity="0.4"/>
                <rect x="120" y="135" width="3" height="3" fill="#00e5ff" opacity="0.5"/>
                <rect x="112" y="142" width="3" height="3" fill="#ff2d7b" opacity="0.6"/>
                <rect x="145" y="118" width="3" height="3" fill="#7b2fff" opacity="0.6"/>
                <rect x="152" y="128" width="3" height="3" fill="#ff2d7b" opacity="0.5"/>
                <rect x="175" y="104" width="3" height="3" fill="#00e5ff" opacity="0.6"/>
                <rect x="183" y="110" width="3" height="3" fill="#7b2fff" opacity="0.5"/>
                <rect x="175" y="120" width="3" height="3" fill="#ff2d7b" opacity="0.5"/>
                <rect x="183" y="130" width="3" height="3" fill="#00e5ff" opacity="0.4"/>
                <rect x="175" y="140" width="3" height="3" fill="#7b2fff" opacity="0.5"/>
                {/* Centre cluster (against sun) */}
                <rect x="216" y="92" width="3" height="3" fill="#ff2d7b" opacity="0.8"/>
                <rect x="224" y="100" width="3" height="3" fill="#00e5ff" opacity="0.7"/>
                <rect x="216" y="110" width="3" height="3" fill="#7b2fff" opacity="0.6"/>
                <rect x="248" y="102" width="3" height="3" fill="#ff2d7b" opacity="0.7"/>
                <rect x="256" y="110" width="3" height="3" fill="#00e5ff" opacity="0.6"/>
                <rect x="248" y="120" width="3" height="3" fill="#7b2fff" opacity="0.5"/>
                <rect x="310" y="98" width="3" height="3" fill="#ff2d7b" opacity="0.7"/>
                <rect x="318" y="108" width="3" height="3" fill="#00e5ff" opacity="0.6"/>
                <rect x="310" y="118" width="3" height="3" fill="#7b2fff" opacity="0.5"/>
                <rect x="344" y="92" width="3" height="3" fill="#ff2d7b" opacity="0.7"/>
                <rect x="352" y="102" width="3" height="3" fill="#00e5ff" opacity="0.6"/>
                <rect x="344" y="114" width="3" height="3" fill="#7b2fff" opacity="0.5"/>
                {/* Right side */}
                <rect x="378" y="102" width="3" height="3" fill="#ff2d7b" opacity="0.6"/>
                <rect x="386" y="112" width="3" height="3" fill="#00e5ff" opacity="0.5"/>
                <rect x="406" y="94" width="3" height="3" fill="#7b2fff" opacity="0.7"/>
                <rect x="414" y="104" width="3" height="3" fill="#ff2d7b" opacity="0.6"/>
                <rect x="406" y="114" width="3" height="3" fill="#00e5ff" opacity="0.5"/>
                <rect x="414" y="124" width="3" height="3" fill="#7b2fff" opacity="0.5"/>
                <rect x="442" y="108" width="3" height="3" fill="#ff2d7b" opacity="0.6"/>
                <rect x="450" y="118" width="3" height="3" fill="#00e5ff" opacity="0.5"/>
                <rect x="442" y="128" width="3" height="3" fill="#7b2fff" opacity="0.5"/>
                <rect x="476" y="100" width="3" height="3" fill="#ff2d7b" opacity="0.7"/>
                <rect x="484" y="110" width="3" height="3" fill="#00e5ff" opacity="0.5"/>
                <rect x="508" y="112" width="3" height="3" fill="#ff2d7b" opacity="0.6"/>
                <rect x="516" y="122" width="3" height="3" fill="#00e5ff" opacity="0.5"/>
                <rect x="540" y="104" width="3" height="3" fill="#7b2fff" opacity="0.6"/>
                <rect x="548" y="114" width="3" height="3" fill="#ff2d7b" opacity="0.5"/>
                <rect x="540" y="124" width="3" height="3" fill="#00e5ff" opacity="0.5"/>
                <rect x="580" y="118" width="3" height="3" fill="#ff2d7b" opacity="0.6"/>
                <rect x="588" y="128" width="3" height="3" fill="#7b2fff" opacity="0.5"/>
                <rect x="612" y="124" width="3" height="3" fill="#00e5ff" opacity="0.5"/>
                <rect x="620" y="138" width="3" height="3" fill="#ff2d7b" opacity="0.5"/>
              </g>

              {/* ═══ NEON SIGNS ══════════════════════════════════ */}
              {/* "CASINO" — left side */}
              <rect x="30" y="115" width="32" height="11" fill="#ff2d7b" opacity="0.12"/>
              <rect x="30" y="115" width="32" height="11" stroke="#ff2d7b" strokeWidth="1" fill="none" opacity="0.6"/>
              <text x="46" y="124" textAnchor="middle" fill="#ff2d7b" fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.9" shapeRendering="auto">CASINO</text>

              {/* "21" — centre-left */}
              <rect x="213" y="84" width="16" height="9" fill="#00e5ff" opacity="0.1"/>
              <rect x="213" y="84" width="16" height="9" stroke="#00e5ff" strokeWidth="1" fill="none" opacity="0.5"/>
              <text x="221" y="91" textAnchor="middle" fill="#00e5ff" fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.8" shapeRendering="auto">21</text>

              {/* "SLOTS" — right side */}
              <rect x="498" y="106" width="28" height="11" fill="#f59e0b" opacity="0.1"/>
              <rect x="498" y="106" width="28" height="11" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.5"/>
              <text x="512" y="115" textAnchor="middle" fill="#f59e0b" fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.85" shapeRendering="auto">SLOTS</text>

              {/* Heart suit — far left */}
              <rect x="4" y="132" width="11" height="11" fill="#ff2d7b" opacity="0.08"/>
              <rect x="4" y="132" width="11" height="11" stroke="#ff2d7b" strokeWidth="1" fill="none" opacity="0.4"/>
              <text x="9" y="141" textAnchor="middle" fill="#ff2d7b" fontSize="8" opacity="0.7" shapeRendering="auto">♥</text>

              {/* Spade suit */}
              <rect x="438" y="97" width="10" height="8" fill="#c084fc" opacity="0.08"/>
              <text x="443" y="104" textAnchor="middle" fill="#c084fc" fontSize="7" opacity="0.6" shapeRendering="auto">♠</text>

              {/* "DICE" — far right */}
              <rect x="606" y="120" width="24" height="9" fill="#00e5ff" opacity="0.08"/>
              <rect x="606" y="120" width="24" height="9" stroke="#00e5ff" strokeWidth="1" fill="none" opacity="0.4"/>
              <text x="618" y="127" textAnchor="middle" fill="#00e5ff" fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.75" shapeRendering="auto">DICE</text>

              {/* Equaliser bars — left (like reference) */}
              <g opacity="0.35">
                <rect x="6" y="146" width="2" height="4" fill="#ff2d7b"/>
                <rect x="10" y="144" width="2" height="6" fill="#ff2d7b"/>
                <rect x="14" y="142" width="2" height="8" fill="#ff2d7b"/>
                <rect x="18" y="145" width="2" height="5" fill="#ff2d7b"/>
                <rect x="22" y="143" width="2" height="7" fill="#ff2d7b"/>
                <rect x="26" y="146" width="2" height="4" fill="#ff2d7b"/>
              </g>

              {/* Chevron arrows — right building (like reference) */}
              <g opacity="0.3" shapeRendering="auto">
                <path d="M585 142l4-4 4 4" stroke="#f59e0b" strokeWidth="1.5" fill="none"/>
                <path d="M585 148l4-4 4 4" stroke="#f59e0b" strokeWidth="1.5" fill="none"/>
                <path d="M585 154l4-4 4 4" stroke="#f59e0b" strokeWidth="1.5" fill="none"/>
              </g>

              {/* ═══ GROUND GLOW + STOREFRONTS ═══════════════════ */}
              <rect x="0" y="192" width="640" height="28" fill="url(#groundGlow)"/>
              <rect x="0" y="192" width="640" height="2" fill="#2a1050" opacity="0.5"/>

              {/* Lit storefronts at street level */}
              <g opacity="0.5">
                <rect x="10" y="180" width="22" height="10" fill="#ff2d7b" opacity="0.07"/>
                <rect x="10" y="180" width="22" height="10" stroke="#ff2d7b" strokeWidth="0.5" fill="none" opacity="0.3"/>
                <rect x="50" y="178" width="16" height="12" fill="#7b2fff" opacity="0.07"/>
                <rect x="50" y="178" width="16" height="12" stroke="#7b2fff" strokeWidth="0.5" fill="none" opacity="0.25"/>
                <rect x="130" y="180" width="18" height="10" fill="#00e5ff" opacity="0.06"/>
                <rect x="130" y="180" width="18" height="10" stroke="#00e5ff" strokeWidth="0.5" fill="none" opacity="0.2"/>
                <rect x="418" y="178" width="22" height="12" fill="#ff2d7b" opacity="0.07"/>
                <rect x="418" y="178" width="22" height="12" stroke="#ff2d7b" strokeWidth="0.5" fill="none" opacity="0.3"/>
                <rect x="558" y="180" width="24" height="10" fill="#f59e0b" opacity="0.06"/>
                <rect x="558" y="180" width="24" height="10" stroke="#f59e0b" strokeWidth="0.5" fill="none" opacity="0.2"/>
              </g>

              {/* ═══ RAILING ═════════════════════════════════════ */}
              <g>
                {/* Top rail */}
                <rect x="0" y="194" width="640" height="3" fill="#0a0418"/>
                <rect x="0" y="194" width="640" height="1" fill="#2a1050" opacity="0.4"/>
                {/* Posts */}
                <rect x="0" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="40" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="80" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="120" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="160" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="200" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="240" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="280" y="194" width="3" height="26" fill="#0a0418"/>
                {/* Gap where figure stands */}
                <rect x="355" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="395" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="435" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="475" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="515" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="555" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="595" y="194" width="3" height="26" fill="#0a0418"/>
                <rect x="637" y="194" width="3" height="26" fill="#0a0418"/>
                {/* Bottom rail */}
                <rect x="0" y="216" width="640" height="4" fill="#0a0418"/>
                {/* Panels between posts — translucent grid */}
                <g opacity="0.2">
                  <rect x="3" y="197" width="37" height="19" fill="#0a0418" opacity="0.6"/>
                  <rect x="43" y="197" width="37" height="19" fill="#0a0418" opacity="0.5"/>
                  <rect x="83" y="197" width="37" height="19" fill="#0a0418" opacity="0.6"/>
                  <rect x="123" y="197" width="37" height="19" fill="#0a0418" opacity="0.5"/>
                  <rect x="163" y="197" width="37" height="19" fill="#0a0418" opacity="0.6"/>
                  <rect x="203" y="197" width="37" height="19" fill="#0a0418" opacity="0.5"/>
                  <rect x="243" y="197" width="37" height="19" fill="#0a0418" opacity="0.6"/>
                  <rect x="283" y="197" width="37" height="19" fill="#0a0418" opacity="0.3"/>
                  <rect x="358" y="197" width="37" height="19" fill="#0a0418" opacity="0.5"/>
                  <rect x="398" y="197" width="37" height="19" fill="#0a0418" opacity="0.6"/>
                  <rect x="438" y="197" width="37" height="19" fill="#0a0418" opacity="0.5"/>
                  <rect x="478" y="197" width="37" height="19" fill="#0a0418" opacity="0.6"/>
                  <rect x="518" y="197" width="37" height="19" fill="#0a0418" opacity="0.5"/>
                  <rect x="558" y="197" width="37" height="19" fill="#0a0418" opacity="0.6"/>
                  <rect x="598" y="197" width="37" height="19" fill="#0a0418" opacity="0.5"/>
                </g>
                {/* Reflected neon colour on railing panels */}
                <g opacity="0.15">
                  <rect x="4" y="200" width="12" height="3" fill="#ff2d7b"/>
                  <rect x="52" y="202" width="8" height="2" fill="#7b2fff"/>
                  <rect x="132" y="200" width="10" height="3" fill="#00e5ff"/>
                  <rect x="252" y="201" width="6" height="2" fill="#ff2d7b"/>
                  <rect x="368" y="200" width="8" height="3" fill="#f59e0b"/>
                  <rect x="442" y="202" width="10" height="2" fill="#7b2fff"/>
                  <rect x="522" y="200" width="12" height="3" fill="#ff2d7b"/>
                  <rect x="602" y="201" width="8" height="2" fill="#00e5ff"/>
                </g>
              </g>

              {/* ═══ FIGURE SILHOUETTE ═══════════════════════════ */}
              <g>
                {/* Head */}
                <rect x="316" y="170" width="8" height="8" fill="#0d0520"/>
                <rect x="318" y="168" width="4" height="2" fill="#0d0520"/>
                {/* Body */}
                <rect x="316" y="178" width="8" height="12" fill="#0a0418"/>
                {/* Arms resting on railing */}
                <rect x="312" y="180" width="4" height="3" fill="#0a0418"/>
                <rect x="324" y="180" width="4" height="3" fill="#0a0418"/>
                {/* Legs */}
                <rect x="316" y="190" width="3" height="8" fill="#0a0418"/>
                <rect x="321" y="190" width="3" height="8" fill="#0a0418"/>
                {/* Jacket detail */}
                <rect x="314" y="184" width="12" height="2" fill="#150830"/>
              </g>
            </svg>

            {/* Overlay text */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-5 pb-4 pt-10">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-[0.15em] text-red-300 drop-shadow-lg" style={{ textShadow: "0 0 20px rgba(255,45,123,0.4)" }}>The Underbelly</h1>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    No corp oversight. No limits. All credits. Enter at your own risk.
                  </p>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Credits</div>
                  <div className="text-lg font-black text-amber-400 font-mono drop-shadow-lg" style={{ textShadow: "0 0 12px rgba(245,158,11,0.4)" }}>{pilot.credits.toLocaleString()} ₡</div>
                </div>
              </div>
            </div>
          </div>

          {/* Credits display for mobile */}
          <div className="sm:hidden rounded-md border border-purple-900/30 bg-[#0b0f14] px-4 py-2.5 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Credits</span>
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
