import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { GAME_CONSTANTS, hpPerPoint } from "@/lib/constants";
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

  // Calculate stat gains
  const data: Record<string, unknown> = {
    unspentPoints: { decrement: points },
  };

  let gainDescription = "";

  switch (stat) {
    case "hp": {
      const hpGain = hpPerPoint(pilot.level) * points;
      data.lifeForce = pilot.lifeForce + hpGain;
      gainDescription = `+${hpGain} Life Force`;
      break;
    }
    case "strength": {
      const gain = GAME_CONSTANTS.POINT_STR_GAIN * points;
      data.strength = pilot.strength + gain;
      gainDescription = `+${gain.toFixed(1)} Strength`;
      break;
    }
    case "speed": {
      const gain = GAME_CONSTANTS.POINT_SPEED_GAIN * points;
      data.speed = pilot.speed + gain;
      gainDescription = `+${gain.toFixed(1)} Speed`;
      break;
    }
    case "endurance": {
      const gain = GAME_CONSTANTS.POINT_END_GAIN * points;
      data.endurance = pilot.endurance + gain;
      gainDescription = `+${gain.toFixed(2)} Endurance`;
      break;
    }
    case "panic": {
      const gain = GAME_CONSTANTS.POINT_PANIC_GAIN * points;
      data.panic = pilot.panic + gain;
      gainDescription = `+${gain.toFixed(2)} Panic`;
      break;
    }
    case "confidence": {
      const gain = GAME_CONSTANTS.POINT_CONF_GAIN * points;
      data.confidence = Math.min(pilot.confidence + gain, GAME_CONSTANTS.CONFIDENCE_CAP);
      gainDescription = `+${gain.toFixed(2)} Confidence`;
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
