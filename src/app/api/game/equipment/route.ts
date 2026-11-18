import { authOptions } from "@/auth";
import { economyErrorResponse, INVENTORY_CAP, purchaseInventoryItem } from "@/lib/economy";
import { getOrCreatePilotState } from "@/lib/game-state";
import { findEquipment, getVendorCatalog } from "@/lib/equipment-data";
import { pilotBypassesEquipRequirements } from "@/lib/item-data";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const EQUIPMENT_TIERS = ["GRAY", "GREEN", "BLUE", "AMBER", "RED", "VIOLET", "BLACK", "OMEGA"];

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
  const bypass = await pilotBypassesEquipRequirements(session.user.id);

  // Level requirement (bypassed by God Card or Ring Of Power)
  if (!bypass && pilot.level < equip.lvl) {
    return NextResponse.json(
      { error: `Requires level ${equip.lvl}. You are level ${pilot.level}.` },
      { status: 400 }
    );
  }

  const insufficientCredits = `Not enough credits. Need ${equip.price.toLocaleString()}, have ${pilot.credits.toLocaleString()}.`;
  const inventoryFull = `Inventory full (${INVENTORY_CAP}/${INVENTORY_CAP}). Discard an item first.`;

  // Friendly early exits; the authoritative checks run inside the purchase transaction.
  if (pilot.credits < equip.price) {
    return NextResponse.json({ error: insufficientCredits }, { status: 400 });
  }
  const count = await prisma.inventoryItem.count({ where: { pilotId: pilot.id } });
  if (count >= INVENTORY_CAP) {
    return NextResponse.json({ error: inventoryFull }, { status: 400 });
  }

  // Debit (free items debit 0, which still serializes the cap check) then create.
  try {
    await purchaseInventoryItem(
      session.user.id,
      Math.max(0, equip.price),
      {
        name: equip.name,
        type: equip.slot,
        tier: EQUIPMENT_TIERS.indexOf(equip.tier) + 1,
        bonusType: equip.slot === "weapon" ? "atk" : "def",
        bonusAmt: equip.stat,
      },
      { insufficientCredits, inventoryFull }
    );
  } catch (error) {
    return economyErrorResponse(error);
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
