import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { guardedPilotUpdate } from "@/lib/economy";
import { planMotivationSpend } from "@/lib/vitals";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const MOTIVATION_COST = 15;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const spend = planMotivationSpend(pilot, MOTIVATION_COST);

  if (spend.available < MOTIVATION_COST) {
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

  // Compare-and-swap on the motivation snapshot: N parallel digs computed
  // from the same snapshot pay for, and yield, exactly one.
  const updated = await guardedPilotUpdate(prisma, session.user.id, spend.guard, {
    ...spend.data,
    ore: { increment: totalOre },
  });
  if (!updated) {
    return NextResponse.json(
      { error: "Another action is still resolving. Try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    oreGained: totalOre,
    find,
    totalOre: updated.ore,
    motivationLeft: updated.motivation,
  });
}
