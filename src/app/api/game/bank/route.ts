import { authOptions } from "@/auth";
import { GAME_CONSTANTS } from "@/lib/constants";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["buy_tokens", "sell_tokens"]),
  amount: z.number().int().min(1).max(500),
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

  const { action, amount } = parsed.data;
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  if (action === "buy_tokens") {
    const cost = amount * GAME_CONSTANTS.TOKEN_BUY_RATE;
    if (pilot.credits < cost) {
      return NextResponse.json(
        { error: `Not enough credits. Need ${cost}, have ${pilot.credits}.` },
        { status: 400 }
      );
    }
    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { credits: { decrement: cost }, tokens: { increment: amount } },
    });
    return NextResponse.json({
      message: `Bought ${amount} tokens for ${cost} credits.`,
      tokens: pilot.tokens + amount,
      credits: pilot.credits - cost,
    });
  }

  if (action === "sell_tokens") {
    if (pilot.tokens < amount) {
      return NextResponse.json(
        { error: `Not enough tokens. Have ${pilot.tokens}.` },
        { status: 400 }
      );
    }
    const gained = amount * GAME_CONSTANTS.TOKEN_SELL_RATE;
    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { tokens: { decrement: amount }, credits: { increment: gained } },
    });
    return NextResponse.json({
      message: `Sold ${amount} tokens for ${gained} credits.`,
      tokens: pilot.tokens - amount,
      credits: pilot.credits + gained,
    });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  return NextResponse.json({
    credits: pilot.credits,
    tokens: pilot.tokens,
    tokenBuyRate: GAME_CONSTANTS.TOKEN_BUY_RATE,
    tokenSellRate: GAME_CONSTANTS.TOKEN_SELL_RATE,
    tokensPerDay: GAME_CONSTANTS.TOKENS_PER_DAY,
    welfareCreditsPerCycle: GAME_CONSTANTS.WELFARE_DAYS,
  });
}
