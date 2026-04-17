import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { findEquipment, getVendorCatalog } from "@/lib/equipment-data";
import { pilotHasGodCard } from "@/lib/item-data";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const buySchema = z.object({ itemName: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = buySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid item name." }, { status: 400 });
  }

  const equip = findEquipment(parsed.data.itemName);
  if (!equip || !equip.purchasable) {
    return NextResponse.json({ error: "Item not available for purchase." }, { status: 404 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const godCard = await pilotHasGodCard(session.user.id);

  // Level requirement (bypassed by God Card)
  if (!godCard && pilot.level < equip.lvl) {
    return NextResponse.json(
      { error: `Requires level ${equip.lvl}. You are level ${pilot.level}.` },
      { status: 400 }
    );
  }

  // Credit check
  if (pilot.credits < equip.price) {
    return NextResponse.json(
      { error: `Not enough credits. Need ${equip.price.toLocaleString()}, have ${pilot.credits.toLocaleString()}.` },
      { status: 400 }
    );
  }

  // Inventory cap
  const count = await prisma.inventoryItem.count({ where: { pilotId: pilot.id } });
  if (count >= 20) {
    return NextResponse.json(
      { error: "Inventory full (20/20). Discard an item first." },
      { status: 400 }
    );
  }

  // Create the inventory item
  const bonusType = equip.slot === "weapon" ? "atk" : "def";
  await prisma.inventoryItem.create({
    data: {
      pilotId: pilot.id,
      name: equip.name,
      type: equip.slot,
      tier: ["GRAY", "GREEN", "BLUE", "AMBER", "RED", "VIOLET", "BLACK", "OMEGA"].indexOf(equip.tier) + 1,
      bonusType,
      bonusAmt: equip.stat,
    },
  });

  // Deduct credits (free items cost 0)
  if (equip.price > 0) {
    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { credits: { decrement: equip.price } },
    });
  }

  return NextResponse.json({
    message: `Purchased ${equip.name} for ${equip.price.toLocaleString()} credits.`,
    creditsSpent: equip.price,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const catalog = getVendorCatalog();
  return NextResponse.json({ catalog });
}
