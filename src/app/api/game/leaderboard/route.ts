import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type Category = "overall" | "pvp" | "wealth" | "xp";

const ORDER_MAP: Record<Category, Prisma.PilotStateOrderByWithRelationInput[]> = {
  overall: [{ level: "desc" }, { xp: "desc" }, { credits: "desc" }],
  // `kills` counts PvP wins and PvE patrols alike (no column separates them),
  // so this board is labelled "Kills" in the UI, not "PVP".
  pvp: [{ kills: "desc" }, { level: "desc" }],
  wealth: [{ credits: "desc" }, { level: "desc" }],
  // `xp` is only the remainder within the current level, so level ranks first.
  xp: [{ level: "desc" }, { xp: "desc" }],
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cat = (searchParams.get("category") ?? "overall") as Category;
  const category: Category = cat in ORDER_MAP ? cat : "overall";

  const pilots = await prisma.pilotState.findMany({
    where: { user: { suspended: false } },
    orderBy: ORDER_MAP[category],
    take: 25,
    select: {
      callsign: true,
      level: true,
      xp: true,
      credits: true,
      kills: true,
      currentSector: true,
      characterSlug: true,
      userId: true,
    },
  });

  const leaderboard = pilots.map((p, i) => ({
    rank: i + 1,
    callsign: p.callsign,
    userId: p.userId,
    level: p.level,
    xp: p.xp,
    credits: p.credits,
    kills: p.kills,
    sector: p.currentSector,
    characterSlug: p.characterSlug,
    isYou: p.userId === session.user!.id,
  }));

  return NextResponse.json(
    { leaderboard, category },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
