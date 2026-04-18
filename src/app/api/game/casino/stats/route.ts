import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pilot = await prisma.pilotState.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!pilot)
    return NextResponse.json({ error: "Pilot not found." }, { status: 404 });

  const bets = await prisma.casinoBet.findMany({
    where: { pilotId: pilot.id },
    select: { game: true, bet: true, net: true },
  });

  if (bets.length === 0) {
    return NextResponse.json({
      totalBets: 0,
      wins: 0,
      losses: 0,
      totalWagered: 0,
      totalNet: 0,
      averageBet: 0,
      favoriteGame: null,
    });
  }

  let wins = 0;
  let losses = 0;
  let totalWagered = 0;
  let totalNet = 0;
  const gameCounts: Record<string, number> = {};

  for (const b of bets) {
    if (b.net > 0) wins++;
    else if (b.net < 0) losses++;
    totalWagered += b.bet;
    totalNet += b.net;
    gameCounts[b.game] = (gameCounts[b.game] ?? 0) + 1;
  }

  const favoriteGame = Object.entries(gameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return NextResponse.json({
    totalBets: bets.length,
    wins,
    losses,
    totalWagered,
    totalNet,
    averageBet: Math.round(totalWagered / bets.length),
    favoriteGame,
  });
}
