import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Can only claim every 24 hours
  const now = new Date();
  if (pilot.lastOutpostClaim) {
    const hoursSince = (now.getTime() - new Date(pilot.lastOutpostClaim).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      const hoursLeft = Math.ceil(24 - hoursSince);
      return NextResponse.json({ error: `Outpost supplies replenish in ${hoursLeft}h.` }, { status: 400 });
    }
  }

  // Income scales with level
  const baseIncome = 50;
  const levelBonus = pilot.level * 10;
  const income = baseIncome + levelBonus;
  const xpGain = 10 + pilot.level * 2;

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      credits: { increment: income },
      xp: { increment: xpGain },
      lastOutpostClaim: now,
    },
  });

  return NextResponse.json({
    creditsClaimed: income,
    xpClaimed: xpGain,
    credits: pilot.credits + income,
    nextClaimIn: "24 hours",
  });
}
