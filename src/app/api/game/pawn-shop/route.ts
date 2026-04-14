import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ itemId: z.string().min(1) });

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

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const item = await prisma.inventoryItem.findFirst({
    where: { id: parsed.data.itemId, pilotId: pilot.id, equipped: false },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found or is equipped." }, { status: 400 });
  }

  // Pawn value: tier-based pricing
  const tierValues: Record<number, number> = { 1: 50, 2: 200, 3: 750 };
  const value = tierValues[item.tier] ?? 50;

  await prisma.$transaction([
    prisma.inventoryItem.delete({ where: { id: item.id } }),
    prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { credits: { increment: value } },
    }),
  ]);

  return NextResponse.json({
    sold: item.name,
    creditsGained: value,
    credits: pilot.credits + value,
  });
}
