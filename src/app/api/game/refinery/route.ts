import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ amount: z.number().int().min(1).max(9999) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  const { amount } = parsed.data;
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  if (pilot.ore < amount) {
    return NextResponse.json({ error: `Not enough ore. Have ${pilot.ore}.` }, { status: 400 });
  }

  const creditsPerOre = 3;
  const totalCredits = amount * creditsPerOre;

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      ore: { decrement: amount },
      credits: { increment: totalCredits },
    },
  });

  return NextResponse.json({
    oreUsed: amount,
    creditsGained: totalCredits,
    oreLeft: pilot.ore - amount,
    credits: pilot.credits + totalCredits,
  });
}
