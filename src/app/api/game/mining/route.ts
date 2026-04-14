import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { GAME_CONSTANTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const now = new Date();
  const minutesElapsed = Math.floor((now.getTime() - pilot.lastMotivationAt.getTime()) / (1000 * 60));
  const regenAmount = Math.floor(minutesElapsed / GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES);
  const currentMotivation = Math.min(pilot.motivation + regenAmount, GAME_CONSTANTS.MOTIVATION_CAP_FREE);

  if (currentMotivation < 15) {
    return NextResponse.json({ error: "Need 15 motivation to mine." }, { status: 400 });
  }

  const baseYield = Math.floor(Math.random() * 5) + 1;
  const roll = Math.random();
  let bonus = 0;
  let find = "";

  if (roll < 0.02) {
    bonus = 50; find = "Struck a rare vein! +50 ore bonus!";
  } else if (roll < 0.10) {
    bonus = 10; find = "Rich deposit! +10 ore bonus.";
  } else if (roll < 0.20) {
    find = "Found some crystalline fragments.";
  } else {
    find = "Standard extraction.";
  }

  const totalOre = baseYield + bonus;

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      motivation: currentMotivation - 15,
      lastMotivationAt: now,
      ore: { increment: totalOre },
    },
  });

  return NextResponse.json({
    oreGained: totalOre,
    find,
    totalOre: pilot.ore + totalOre,
    motivationLeft: currentMotivation - 15,
  });
}
