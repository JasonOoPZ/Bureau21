import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ targetCallsign: z.string().min(1).max(50) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a callsign." }, { status: 400 });
  }

  const buyer = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });
  if (!buyer) {
    return NextResponse.json({ error: "Pilot not found." }, { status: 400 });
  }

  const cost = 150;
  if (buyer.credits < cost) {
    return NextResponse.json({ error: `Intel costs ${cost} credits.` }, { status: 400 });
  }

  const target = await prisma.pilotState.findFirst({
    where: { callsign: { equals: parsed.data.targetCallsign, mode: "insensitive" } },
    include: {
      inventory: { where: { equipped: true } },
      syndicateMember: { include: { syndicate: { select: { name: true, tag: true } } } },
      _count: { select: { battleLogs: true } },
    },
  });

  if (!target) {
    return NextResponse.json({ error: "No pilot found with that callsign." }, { status: 404 });
  }

  if (target.userId === session.user.id) {
    return NextResponse.json({ error: "You already know your own stats, pilot." }, { status: 400 });
  }

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: { credits: { decrement: cost } },
  });

  return NextResponse.json({
    cost,
    credits: buyer.credits - cost,
    intel: {
      callsign: target.callsign,
      level: target.level,
      characterSlug: target.characterSlug,
      strength: target.strength,
      speed: target.speed,
      endurance: target.endurance,
      confidence: target.confidence,
      panic: target.panic,
      atkSplit: target.atkSplit,
      kills: target.kills,
      bounty: target.bounty,
      lifeForce: target.lifeForce,
      sector: target.currentSector,
      totalBattles: target._count.battleLogs,
      equipment: target.inventory.map((i) => ({
        name: i.name,
        type: i.type,
        tier: i.tier,
      })),
      syndicate: target.syndicateMember
        ? { name: target.syndicateMember.syndicate.name, tag: target.syndicateMember.syndicate.tag }
        : null,
    },
  });
}
