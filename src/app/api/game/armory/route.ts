import { authOptions } from "@/auth";
import { GAME_CONSTANTS } from "@/lib/constants";
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

  if (pilot.credits < price) {
    return NextResponse.json(
      { error: `Not enough credits. Need ${price}, have ${pilot.credits}.` },
      { status: 400 }
    );
  }

  // Cap inventory at 20
  const count = await prisma.inventoryItem.count({ where: { pilotId: pilot.id } });
  if (count >= 20) {
    return NextResponse.json(
      { error: "Inventory full (20/20). Sell or discard an item first." },
      { status: 400 }
    );
  }

  await prisma.inventoryItem.create({
    data: {
      pilotId: pilot.id,
      name: template.name,
      type: template.type,
      tier: template.tier,
      bonusType: template.bonusType,
      bonusAmt: template.bonusAmt,
    },
  });

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: { credits: { decrement: price } },
  });

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
