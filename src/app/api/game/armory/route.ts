import { authOptions } from "@/auth";
import { economyErrorResponse, INVENTORY_CAP, purchaseInventoryItem } from "@/lib/economy";
import { getOrCreatePilotState } from "@/lib/game-state";
import { ITEM_TEMPLATES } from "@/lib/item-data";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const ITEM_PRICES: Record<number, number> = { 1: 120, 2: 300, 3: 750 };

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

  const template = ITEM_TEMPLATES.find((t) => t.name === parsed.data.itemName);
  if (!template) {
    return NextResponse.json({ error: "Item not found in catalog." }, { status: 404 });
  }

  const price = ITEM_PRICES[template.tier] ?? 999;
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const insufficientCredits = `Not enough credits. Need ${price}, have ${pilot.credits}.`;
  const inventoryFull = `Inventory full (${INVENTORY_CAP}/${INVENTORY_CAP}). Sell or discard an item first.`;

  // Friendly early exits; the authoritative checks run inside the purchase transaction.
  if (pilot.credits < price) {
    return NextResponse.json({ error: insufficientCredits }, { status: 400 });
  }
  const count = await prisma.inventoryItem.count({ where: { pilotId: pilot.id } });
  if (count >= INVENTORY_CAP) {
    return NextResponse.json({ error: inventoryFull }, { status: 400 });
  }

  try {
    await purchaseInventoryItem(
      session.user.id,
      price,
      {
        name: template.name,
        type: template.type,
        tier: template.tier,
        bonusType: template.bonusType,
        bonusAmt: template.bonusAmt,
      },
      { insufficientCredits, inventoryFull }
    );
  } catch (error) {
    return economyErrorResponse(error);
  }

  return NextResponse.json({
    message: `Purchased ${template.name} for ${price} credits.`,
    item: template,
    creditsSpent: price,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const catalog = ITEM_TEMPLATES.map((t) => ({
    ...t,
    price: ITEM_PRICES[t.tier] ?? 999,
  }));

  return NextResponse.json({ catalog });
}
