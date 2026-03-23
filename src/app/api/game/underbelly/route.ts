import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const UNLOCK_LEVEL = 5;
const WIN_CHANCE = 0.45;
const WIN_MULTIPLIER = 1.9;
const MIN_BET = 10;
const MAX_BET = 500;

const schema = z.object({
  bet: z.number().int().min(MIN_BET).max(MAX_BET),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  if (pilot.level < UNLOCK_LEVEL) {
    return NextResponse.json(
      { error: `Underbelly requires Level ${UNLOCK_LEVEL}. You are Level ${pilot.level}.` },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Bet must be between ${MIN_BET} and ${MAX_BET} credits.` },
      { status: 400 }
    );
  }

  const { bet } = parsed.data;

  if (pilot.credits < bet) {
    return NextResponse.json(
      { error: "Insufficient credits for that bet." },
      { status: 400 }
    );
  }

  const won = Math.random() < WIN_CHANCE;
  const creditDelta = won ? Math.floor(bet * WIN_MULTIPLIER) - bet : -bet;
  const newCredits = pilot.credits + creditDelta;

  // Roll dice faces for animation data (client uses these to show the result)
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const diceTotal = die1 + die2;

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: { credits: newCredits },
  });

  return NextResponse.json({
    won,
    bet,
    creditDelta,
    newCredits,
    die1,
    die2,
    diceTotal,
    message: won
      ? `Lucky roll! You won ${Math.floor(bet * WIN_MULTIPLIER - bet)} credits.`
      : `House wins. You lost ${bet} credits.`,
  });
}
