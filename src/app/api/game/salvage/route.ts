import { authOptions } from "@/auth";
import { EconomyError, economyErrorResponse, economyTx, guardedPilotUpdate } from "@/lib/economy";
import { getOrCreatePilotState } from "@/lib/game-state";
import { GAME_CONSTANTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { ITEM_TEMPLATES } from "@/lib/item-data";

const SALVAGE_MOTIVATION_COST = 10;
const BUSY_ERROR = "Another action is still resolving. Try again.";

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

  if (currentMotivation < SALVAGE_MOTIVATION_COST) {
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

  // The charge is guarded twice: credits must still cover the cost, and the
  // motivation snapshot the regen was computed from must be unchanged
  // (compare-and-swap). N parallel salvages from one snapshot => one charge,
  // one roll; the rest are rejected.
  const chargeGuard: Prisma.PilotStateWhereInput = {
    credits: { gte: cost },
    motivation: pilot.motivation,
    lastMotivationAt: pilot.lastMotivationAt,
  };
  const charge: Prisma.PilotStateUpdateManyMutationInput = {
    credits: { decrement: cost },
    motivation: currentMotivation - SALVAGE_MOTIVATION_COST,
    lastMotivationAt: now,
  };

  if (foundItem) {
    try {
      const charged = await economyTx(async (tx) => {
        const row = await guardedPilotUpdate(tx, session.user.id, chargeGuard, charge);
        if (!row) throw new EconomyError(BUSY_ERROR, 409);
        await tx.inventoryItem.create({
          data: {
            pilotId: pilot.id,
            name: itemName,
            type: itemType,
            tier: itemTier,
            bonusType: itemBonusType,
            bonusAmt: itemBonusAmt,
          },
        });
        return row;
      });

      return NextResponse.json({
        found: true,
        item: { name: itemName, type: itemType, tier: itemTier, bonusType: itemBonusType, bonusAmt: itemBonusAmt },
        credits: charged.credits,
        motivationLeft: charged.motivation,
      });
    } catch (error) {
      return economyErrorResponse(error);
    }
  }

  const charged = await guardedPilotUpdate(prisma, session.user.id, chargeGuard, charge);
  if (!charged) {
    return NextResponse.json({ error: BUSY_ERROR }, { status: 409 });
  }

  return NextResponse.json({
    found: false,
    item: null,
    message: "Sifted through wreckage but found nothing useful.",
    credits: charged.credits,
    motivationLeft: charged.motivation,
  });
}
