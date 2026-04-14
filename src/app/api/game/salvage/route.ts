import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { GAME_CONSTANTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { ITEM_TEMPLATES } from "@/lib/item-data";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const cost = 200;
  if (pilot.credits < cost) {
    return NextResponse.json({ error: `Need ${cost} credits to salvage.` }, { status: 400 });
  }

  const now = new Date();
  const minutesElapsed = Math.floor((now.getTime() - pilot.lastMotivationAt.getTime()) / (1000 * 60));
  const regenAmount = Math.floor(minutesElapsed / GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES);
  const currentMotivation = Math.min(pilot.motivation + regenAmount, GAME_CONSTANTS.MOTIVATION_CAP_FREE);

  if (currentMotivation < 10) {
    return NextResponse.json({ error: "Need 10 motivation to salvage." }, { status: 400 });
  }

  // Random item from templates, weighted toward lower tiers
  const roll = Math.random();
  let foundItem = false;
  let itemName = "";
  let itemType = "";
  let itemTier = 1;
  let itemBonusType = "";
  let itemBonusAmt = 0;

  if (roll < 0.45) {
    // Found something
    const tierRoll = Math.random();
    const tier = tierRoll < 0.7 ? 1 : tierRoll < 0.95 ? 2 : 3;
    const eligible = ITEM_TEMPLATES.filter((t) => t.tier === tier);
    const item = eligible[Math.floor(Math.random() * eligible.length)];
    if (item) {
      foundItem = true;
      itemName = item.name;
      itemType = item.type;
      itemTier = item.tier;
      itemBonusType = item.bonusType;
      itemBonusAmt = item.bonusAmt;
    }
  }

  if (foundItem) {
    await prisma.$transaction([
      prisma.pilotState.update({
        where: { userId: session.user.id },
        data: {
          credits: { decrement: cost },
          motivation: currentMotivation - 10,
          lastMotivationAt: now,
        },
      }),
      prisma.inventoryItem.create({
        data: {
          pilotId: pilot.id,
          name: itemName,
          type: itemType,
          tier: itemTier,
          bonusType: itemBonusType,
          bonusAmt: itemBonusAmt,
        },
      }),
    ]);

    return NextResponse.json({
      found: true,
      item: { name: itemName, type: itemType, tier: itemTier, bonusType: itemBonusType, bonusAmt: itemBonusAmt },
      credits: pilot.credits - cost,
      motivationLeft: currentMotivation - 10,
    });
  }

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      credits: { decrement: cost },
      motivation: currentMotivation - 10,
      lastMotivationAt: now,
    },
  });

  return NextResponse.json({
    found: false,
    item: null,
    message: "Sifted through wreckage but found nothing useful.",
    credits: pilot.credits - cost,
    motivationLeft: currentMotivation - 10,
  });
}
