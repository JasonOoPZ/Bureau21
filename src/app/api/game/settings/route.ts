import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  atkSplit: z.number().int().min(10).max(90),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ATK split must be between 10 and 90." },
      { status: 400 }
    );
  }

  await getOrCreatePilotState(session.user.id, session.user.name);
  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: { atkSplit: parsed.data.atkSplit },
  });

  return NextResponse.json({
    atkSplit: parsed.data.atkSplit,
    message: `ATK/DEF split updated to ${parsed.data.atkSplit}% ATK / ${100 - parsed.data.atkSplit}% DEF.`,
  });
}
