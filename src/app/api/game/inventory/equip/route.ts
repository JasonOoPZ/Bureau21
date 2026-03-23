import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  itemId: z.string().min(1),
  equip: z.boolean(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { itemId, equip } = parsed.data;

  // Verify this item belongs to the requesting pilot
  const pilot = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });
  if (!pilot) return NextResponse.json({ error: "Pilot not found." }, { status: 404 });

  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, pilotId: pilot.id },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  if (equip) {
    // Unequip any other item of the same type first (one equipped per slot)
    await prisma.inventoryItem.updateMany({
      where: { pilotId: pilot.id, type: item.type, equipped: true },
      data: { equipped: false },
    });
  }

  const updated = await prisma.inventoryItem.update({
    where: { id: itemId },
    data: { equipped: equip },
  });

  const inventory = await prisma.inventoryItem.findMany({
    where: { pilotId: pilot.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ item: updated, inventory });
}
