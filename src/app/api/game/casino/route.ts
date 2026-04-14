import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  game: z.enum(["coin_flip", "slots", "high_low"]),
  bet: z.number().int().min(10).max(10000),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bet." }, { status: 400 });
  }

  const { game, bet } = parsed.data;
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  if (pilot.credits < bet) {
    return NextResponse.json({ error: "Not enough credits." }, { status: 400 });
  }

  let won = false;
  let payout = 0;
  let detail = "";

  if (game === "coin_flip") {
    won = Math.random() < 0.48; // slight house edge
    payout = won ? bet : -bet;
    detail = won ? "Heads — you win!" : "Tails — house takes it.";
  } else if (game === "slots") {
    const roll = Math.random();
    if (roll < 0.01) {
      payout = bet * 10; won = true; detail = "🎰 JACKPOT! ×10 payout!";
    } else if (roll < 0.08) {
      payout = bet * 3; won = true; detail = "Triple match — ×3 payout!";
    } else if (roll < 0.25) {
      payout = bet; won = true; detail = "Double match — ×2 payout (break even).";
    } else {
      payout = -bet; won = false; detail = "No match. House wins.";
    }
  } else if (game === "high_low") {
    const house = Math.floor(Math.random() * 13) + 1;
    const player = Math.floor(Math.random() * 13) + 1;
    won = player > house;
    payout = won ? bet : player === house ? 0 : -bet;
    detail = `You drew ${player}, house drew ${house}. ${player === house ? "Push — credits returned." : won ? "You win!" : "House wins."}`;
  }

  const netCredits = payout;
  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: { credits: { increment: netCredits } },
  });

  return NextResponse.json({
    won,
    payout: netCredits,
    detail,
    credits: pilot.credits + netCredits,
  });
}
