import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { GAME_CONSTANTS } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  stat: z.enum(["hp", "strength", "speed", "endurance", "panic", "confidence"]),
  points: z.number().int().min(1).max(100),
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

  const { stat, points } = parsed.data;

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  if (pilot.unspentPoints < points) {
    return NextResponse.json(
      { error: `Not enough points. You have ${pilot.unspentPoints} available.` },
      { status: 400 }
    );
  }

  // Confidence cap check
  if (stat === "confidence" && pilot.confidence >= GAME_CONSTANTS.CONFIDENCE_CAP) {
    return NextResponse.json(
      { error: "Max confidence reached." },
      { status: 400 }
    );
  }

  // Calculate stat gains — 1 point per allocation
  const data: Record<string, unknown> = {
    unspentPoints: { decrement: points },
  };

  let gainDescription = "";

  switch (stat) {
    case "hp": {
      data.lifeForce = pilot.lifeForce + points;
      gainDescription = `+${points} Life Force`;
      break;
    }
    case "strength": {
      data.strength = pilot.strength + points;
      gainDescription = `+${points} Strength`;
      break;
    }
    case "speed": {
      data.speed = pilot.speed + points;
      gainDescription = `+${points} Speed`;
      break;
    }
    case "endurance": {
      data.endurance = pilot.endurance + points;
      gainDescription = `+${points} Endurance`;
      break;
    }
    case "panic": {
      data.panic = pilot.panic + points;
      gainDescription = `+${points} Panic`;
      break;
    }
    case "confidence": {
      const newConf = Math.min(pilot.confidence + points, GAME_CONSTANTS.CONFIDENCE_CAP);
      const actualGain = newConf - pilot.confidence;
      if (actualGain <= 0) {
        return NextResponse.json(
          { error: "Max confidence reached." },
          { status: 400 }
        );
      }
      // Only spend the points that actually raise confidence
      data.confidence = newConf;
      data.unspentPoints = { decrement: actualGain };
      gainDescription = `+${actualGain} Confidence`;
      break;
    }
  }

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data,
  });

  return NextResponse.json({
    ok: true,
    stat,
    points,
    gain: gainDescription,
    remaining: pilot.unspentPoints - points,
  });
}
