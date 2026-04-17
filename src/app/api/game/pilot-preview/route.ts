import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId)
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });

  const pilot = await prisma.pilotState.findFirst({
    where: { userId },
    select: {
      callsign: true,
      level: true,
      xp: true,
      kills: true,
      currentSector: true,
      characterSlug: true,
      lastActionAt: true,
      bounty: true,
      strength: true,
      user: { select: { role: true } },
    },
  });

  if (!pilot)
    return NextResponse.json({ error: "Pilot not found." }, { status: 404 });

  const isOnline =
    (Date.now() - new Date(pilot.lastActionAt).getTime()) / 1000 < 300;

  return NextResponse.json(
    {
      callsign: pilot.callsign,
      level: pilot.level,
      xp: pilot.xp,
      kills: pilot.kills,
      sector: pilot.currentSector,
      characterSlug: pilot.characterSlug,
      bounty: pilot.bounty,
      strength: pilot.strength,
      role: pilot.user.role,
      isOnline,
    },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } },
  );
}
