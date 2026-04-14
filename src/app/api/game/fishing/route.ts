import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { GAME_CONSTANTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Cost: 10 motivation
  const now = new Date();
  const minutesElapsed = Math.floor((now.getTime() - pilot.lastMotivationAt.getTime()) / (1000 * 60));
  const regenAmount = Math.floor(minutesElapsed / GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES);
  const currentMotivation = Math.min(pilot.motivation + regenAmount, GAME_CONSTANTS.MOTIVATION_CAP_FREE);

  if (currentMotivation < 10) {
    return NextResponse.json({ error: "Need 10 motivation to fish." }, { status: 400 });
  }

  const roll = Math.random();
  let catchName: string;
  let catchValue: number;
  let rarity: string;

  if (roll < 0.01) {
    catchName = "Void Leviathan Fragment"; catchValue = 500; rarity = "legendary";
  } else if (roll < 0.05) {
    catchName = "Prismatic Eel"; catchValue = 150; rarity = "rare";
  } else if (roll < 0.12) {
    catchName = "Nebula Jellyfish"; catchValue = 80; rarity = "uncommon";
  } else if (roll < 0.25) {
    catchName = "Astral Carp"; catchValue = 40; rarity = "common";
  } else if (roll < 0.45) {
    catchName = "Drift Minnow"; catchValue = 15; rarity = "common";
  } else if (roll < 0.70) {
    catchName = "Space Plankton"; catchValue = 5; rarity = "junk";
  } else {
    catchName = "Nothing"; catchValue = 0; rarity = "miss";
  }

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      motivation: currentMotivation - 10,
      lastMotivationAt: now,
      credits: { increment: catchValue },
      fish: { increment: catchValue > 0 ? 1 : 0 },
    },
  });

  return NextResponse.json({
    catchName,
    catchValue,
    rarity,
    totalFish: pilot.fish + (catchValue > 0 ? 1 : 0),
    credits: pilot.credits + catchValue,
    motivationLeft: currentMotivation - 10,
  });
}
