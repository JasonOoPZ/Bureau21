import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { guardedPilotUpdate } from "@/lib/economy";
import { planMotivationSpend } from "@/lib/vitals";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const MOTIVATION_COST = 10;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const spend = planMotivationSpend(pilot, MOTIVATION_COST);

  if (spend.available < MOTIVATION_COST) {
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

  // Compare-and-swap on the motivation snapshot: N parallel casts computed
  // from the same snapshot pay for, and land, exactly one.
  const updated = await guardedPilotUpdate(prisma, session.user.id, spend.guard, {
    ...spend.data,
    credits: { increment: catchValue },
    fish: { increment: catchValue > 0 ? 1 : 0 },
  });
  if (!updated) {
    return NextResponse.json(
      { error: "Another action is still resolving. Try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    catchName,
    catchValue,
    rarity,
    totalFish: updated.fish,
    credits: updated.credits,
    motivationLeft: updated.motivation,
  });
}
