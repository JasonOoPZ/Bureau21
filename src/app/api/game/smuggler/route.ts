import { authOptions } from "@/auth";
import { guardedPilotUpdate } from "@/lib/economy";
import { getOrCreatePilotState } from "@/lib/game-state";
import { planMotivationSpend } from "@/lib/vitals";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const RUN_MOTIVATION_COST = 25;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const spend = planMotivationSpend(pilot, RUN_MOTIVATION_COST);

  if (spend.available < RUN_MOTIVATION_COST) {
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

  // Motivation regen is derived from (motivation, lastMotivationAt). The write
  // is a compare-and-swap on exactly that pair, so of N parallel runs computed
  // from the same snapshot only one applies; the rest must retry and pay again.
  const updated = await guardedPilotUpdate(
    prisma,
    session.user.id,
    {
      ...spend.guard,
      // a fine may never push the balance below zero
      ...(creditsGained < 0 ? { credits: { gte: -creditsGained } } : {}),
    },
    {
      ...spend.data,
      credits: { increment: creditsGained },
    }
  );

  if (!updated) {
    return NextResponse.json(
      { error: "Another action is still resolving. Try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    outcome,
    success,
    creditsGained,
    credits: updated.credits,
    motivationLeft: updated.motivation,
  });
}
