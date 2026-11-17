import { authOptions } from "@/auth";
import { guardedPilotUpdate } from "@/lib/economy";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const CREDITS_PER_ORE = 3;

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
  const totalCredits = amount * CREDITS_PER_ORE;

  // The ore check lives in the WHERE clause: parallel sells cannot spend the same ore twice.
  const updated = await guardedPilotUpdate(
    prisma,
    session.user.id,
    { ore: { gte: amount } },
    { ore: { decrement: amount }, credits: { increment: totalCredits } }
  );

  if (!updated) {
    return NextResponse.json({ error: `Not enough ore. Have ${pilot.ore}.` }, { status: 400 });
  }

  return NextResponse.json({
    oreUsed: amount,
    creditsGained: totalCredits,
    oreLeft: updated.ore,
    credits: updated.credits,
  });
}
