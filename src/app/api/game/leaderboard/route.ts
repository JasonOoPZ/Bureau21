import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilots = await prisma.pilotState.findMany({
    orderBy: [{ level: "desc" }, { xp: "desc" }, { credits: "desc" }],
    take: 15,
    select: {
      callsign: true,
      level: true,
      xp: true,
      credits: true,
      kills: true,
      currentSector: true,
      userId: true,
    },
  });

  const leaderboard = pilots.map((p, i) => ({
    rank: i + 1,
    callsign: p.callsign,
    level: p.level,
    xp: p.xp,
    credits: p.credits,
    kills: p.kills,
    sector: p.currentSector,
    isYou: p.userId === session.user!.id,
  }));

  return NextResponse.json({ leaderboard });
}
