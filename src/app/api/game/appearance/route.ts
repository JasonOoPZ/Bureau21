import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { starterCharacters } from "@/lib/starter-characters";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const APPEARANCE_CHANGE_COST = 100;

const schema = z.object({
  characterSlug: z.string().min(2).max(64),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid appearance payload." }, { status: 400 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const validSlug = starterCharacters.some((c) => c.slug === parsed.data.characterSlug);
  if (!validSlug) {
    return NextResponse.json({ error: "Unknown alien model." }, { status: 400 });
  }

  const changeCost = pilot.appearanceSelections === 0 ? 0 : APPEARANCE_CHANGE_COST;
  if (pilot.credits < changeCost) {
    return NextResponse.json(
      { error: `Not enough credits. ${APPEARANCE_CHANGE_COST} credits required for appearance change.` },
      { status: 402 }
    );
  }

  const updated = await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      characterSlug: parsed.data.characterSlug,
      appearanceSelections: { increment: 1 },
      appearanceNeedsSetup: false,
      credits: { decrement: changeCost },
    },
    select: {
      characterSlug: true,
      credits: true,
      appearanceSelections: true,
      appearanceNeedsSetup: true,
    },
  });

  return NextResponse.json({
    ...updated,
    spentCredits: changeCost,
    nextChangeCost: APPEARANCE_CHANGE_COST,
  });
}
