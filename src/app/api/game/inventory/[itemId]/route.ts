import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { itemId } = await params;
  const pilot = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });
  if (!pilot) return NextResponse.json({ error: "Pilot not found." }, { status: 404 });

  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, pilotId: pilot.id },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  if (item.equipped) {
    return NextResponse.json({ error: "Unequip the item before discarding." }, { status: 400 });
  }

  await prisma.inventoryItem.delete({ where: { id: itemId } });

  return NextResponse.json({ success: true });
}
