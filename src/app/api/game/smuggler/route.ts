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

  if (currentMotivation < 25) {
    return NextResponse.json({ error: "Need 25 motivation for a smuggling run." }, { status: 400 });
  }

  // Risk/reward cargo delivery
  const roll = Math.random();
  let outcome: string;
  let creditsGained: number;
  let success: boolean;

  if (roll < 0.10) {
    // Busted by patrol
    outcome = "Intercepted by station security! Cargo confiscated and fined.";
    creditsGained = -Math.min(300, Math.floor(pilot.credits * 0.1));
    success = false;
  } else if (roll < 0.25) {
    // Close call, small profit
    outcome = "Narrow escape from a patrol sweep. Delivered the goods, barely.";
    creditsGained = 100;
    success = true;
  } else if (roll < 0.55) {
    // Standard delivery
    outcome = "Clean delivery. Contact paid in full, no questions asked.";
    creditsGained = 250;
    success = true;
  } else if (roll < 0.80) {
    // Good run
    outcome = "Express delivery bonus! Contact was impressed with the speed.";
    creditsGained = 400;
    success = true;
  } else if (roll < 0.95) {
    // Great run
    outcome = "High-value cargo delivered to a VIP client. Premium payout.";
    creditsGained = 600;
    success = true;
  } else {
    // Jackpot
    outcome = "Black-market auction item delivered to an off-station buyer. Massive payday!";
    creditsGained = 1200;
    success = true;
  }

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      motivation: currentMotivation - 25,
      lastMotivationAt: now,
      credits: { increment: creditsGained },
    },
  });

  return NextResponse.json({
    outcome,
    success,
    creditsGained,
    credits: pilot.credits + creditsGained,
    motivationLeft: currentMotivation - 25,
  });
}
