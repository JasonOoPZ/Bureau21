import { authOptions } from "@/auth";
import { guardedPilotUpdate } from "@/lib/economy";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { GAME_CONSTANTS } from "@/lib/constants";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  stat: z.enum(["hp", "strength", "speed", "endurance", "panic", "confidence"]),
  points: z.number().int().min(1).max(100),
});

type Stat = z.infer<typeof schema>["stat"];

const STAT_LABELS: Record<Stat, string> = {
  hp: "Life Force",
  strength: "Strength",
  speed: "Speed",
  endurance: "Endurance",
  panic: "Panic",
  confidence: "Confidence",
};

/** Relative stat gain — never an absolute value computed from an earlier read. */
function statIncrement(stat: Stat, amount: number): Prisma.PilotStateUpdateManyMutationInput {
  switch (stat) {
    case "hp":
      return { lifeForce: { increment: amount } };
    case "strength":
      return { strength: { increment: amount } };
    case "speed":
      return { speed: { increment: amount } };
    case "endurance":
      return { endurance: { increment: amount } };
    case "panic":
      return { panic: { increment: amount } };
    case "confidence":
      return { confidence: { increment: amount } };
  }
}

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

  const { stat, points } = parsed.data;

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  if (pilot.unspentPoints < points) {
    return NextResponse.json(
      { error: `Not enough points. You have ${pilot.unspentPoints} available.` },
      { status: 400 }
    );
  }

  // Confidence is capped: only spend the whole points that actually raise it.
  const spend =
    stat === "confidence"
      ? Math.min(points, Math.floor(GAME_CONSTANTS.CONFIDENCE_CAP - pilot.confidence))
      : points;

  if (spend < 1) {
    return NextResponse.json({ error: "Max confidence reached." }, { status: 400 });
  }

  // One statement spends the points and grants the stat. The points check is in
  // the WHERE clause, so five parallel requests (one per stat) can only spend
  // what is really there.
  const guard: Prisma.PilotStateWhereInput = {
    unspentPoints: { gte: spend },
    ...(stat === "confidence"
      ? { confidence: { lte: GAME_CONSTANTS.CONFIDENCE_CAP - spend } }
      : {}),
  };

  const updated = await guardedPilotUpdate(prisma, session.user.id, guard, {
    unspentPoints: { decrement: spend },
    ...statIncrement(stat, spend),
  });

  if (!updated) {
    const fresh = await prisma.pilotState.findUnique({
      where: { userId: session.user.id },
      select: { unspentPoints: true },
    });
    const available = fresh?.unspentPoints ?? 0;
    return NextResponse.json(
      {
        error:
          available < spend
            ? `Not enough points. You have ${available} available.`
            : "Max confidence reached.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    stat,
    points,
    gain: `+${spend} ${STAT_LABELS[stat]}`,
    remaining: updated.unspentPoints,
  });
}
