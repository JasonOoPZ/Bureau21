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

  if (currentMotivation < 20) {
    return NextResponse.json({ error: "Need 20 motivation to explore." }, { status: 400 });
  }

  if (pilot.fuel < 5) {
    return NextResponse.json({ error: "Need 5 fuel to launch an expedition." }, { status: 400 });
  }

  // Random exploration event
  const roll = Math.random();
  let event: string;
  let creditsGained = 0;
  let xpGained = 0;
  let oreGained = 0;
  let herbsGained = 0;
  let eventType: string;

  if (roll < 0.03) {
    event = "Discovered an abandoned station! Massive haul of credits and resources.";
    creditsGained = 500;
    xpGained = 100;
    oreGained = 20;
    eventType = "legendary";
  } else if (roll < 0.10) {
    event = "Found a derelict freighter drifting in the void. Salvaged valuable cargo.";
    creditsGained = 200;
    xpGained = 50;
    eventType = "rare";
  } else if (roll < 0.20) {
    event = "Scanned an asteroid field rich with minerals.";
    oreGained = 15;
    xpGained = 25;
    eventType = "uncommon";
  } else if (roll < 0.35) {
    event = "Mapped a new sector route. Navigation data sold for credits.";
    creditsGained = 75;
    xpGained = 30;
    eventType = "common";
  } else if (roll < 0.50) {
    event = "Found a patch of space-borne flora clinging to a rogue asteroid.";
    herbsGained = 5;
    xpGained = 15;
    eventType = "common";
  } else if (roll < 0.70) {
    event = "Quiet sector. Nothing of note, but the void is always watching.";
    xpGained = 10;
    eventType = "empty";
  } else {
    event = "Sensors picked up interference. Wasted fuel chasing ghost signals.";
    xpGained = 5;
    eventType = "miss";
  }

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      motivation: currentMotivation - 20,
      lastMotivationAt: now,
      fuel: { decrement: 5 },
      credits: { increment: creditsGained },
      xp: { increment: xpGained },
      ore: { increment: oreGained },
      herbs: { increment: herbsGained },
    },
  });

  return NextResponse.json({
    event,
    eventType,
    creditsGained,
    xpGained,
    oreGained,
    herbsGained,
    motivationLeft: currentMotivation - 20,
    fuelLeft: pilot.fuel - 5,
  });
}
