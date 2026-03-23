import { authOptions } from "@/auth";
import { GAME_CONSTANTS } from "@/lib/constants";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const TRAINING_OPTIONS = {
  strength: { cost: 15, field: "strength", gain: 0.3, label: "Strength" },
  speed: { cost: 15, field: "speed", gain: 0.3, label: "Speed" },
  endurance: { cost: 10, field: "endurance", gain: 0.02, label: "Endurance" },
  panic_control: { cost: 20, field: "panic", gain: -0.05, label: "Panic Control" },
  confidence: { cost: 25, field: "confidence", gain: 2, label: "Confidence" },
} as const;

type TrainingType = keyof typeof TRAINING_OPTIONS;

const schema = z.object({
  training: z.enum(["strength", "speed", "endurance", "panic_control", "confidence"]),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid training type." }, { status: 400 });
  }

  const training = parsed.data.training as TrainingType;
  const option = TRAINING_OPTIONS[training];

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Recalculate current motivation with passive regen
  const now = new Date();
  const minutesElapsed = Math.floor(
    (now.getTime() - pilot.lastMotivationAt.getTime()) / (1000 * 60)
  );
  const regenAmount = Math.floor(minutesElapsed / GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES);
  const currentMotivation = Math.min(
    pilot.motivation + regenAmount,
    GAME_CONSTANTS.MOTIVATION_CAP_FREE
  );

  if (currentMotivation < option.cost) {
    return NextResponse.json(
      {
        error: `Not enough motivation. Need ${option.cost}, have ${currentMotivation}. Regens 1 every ${GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES} min.`,
      },
      { status: 400 }
    );
  }

  // Calculate gym streak
  const lastGym = pilot.lastGymAt;
  const hoursSinceLast = lastGym
    ? (now.getTime() - lastGym.getTime()) / (1000 * 60 * 60)
    : 9999;

  let newStreak = pilot.gymStreak;
  if (hoursSinceLast > 48) {
    newStreak = 0; // streak broken
  } else if (hoursSinceLast >= 1) {
    newStreak = Math.min(pilot.gymStreak + 1, 30); // max 30 days
  }

  const streakBonus = 1 + newStreak * GAME_CONSTANTS.GYM_STREAK_BONUS_PER_DAY;
  const effectiveGain = option.gain * streakBonus;

  // Build the update
  const update: Record<string, number | Date> = {
    motivation: currentMotivation - option.cost,
    gymStreak: newStreak,
    lastGymAt: now,
    lastMotivationAt: now,
  };

  if (training === "strength") {
    update.strength = Math.min(99, pilot.strength + effectiveGain);
  } else if (training === "speed") {
    update.speed = Math.min(99, pilot.speed + effectiveGain);
  } else if (training === "endurance") {
    update.endurance = Math.min(5, pilot.endurance + effectiveGain);
  } else if (training === "panic_control") {
    update.panic = Math.max(0, pilot.panic + effectiveGain); // effectiveGain is negative
  } else if (training === "confidence") {
    update.confidence = Math.min(
      GAME_CONSTANTS.CONFIDENCE_CAP,
      pilot.confidence + Math.round(effectiveGain)
    );
  }

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: update,
  });

  const gainLabel =
    training === "panic_control"
      ? `Panic reduced by ${Math.abs(effectiveGain).toFixed(3)}`
      : `${option.label} +${effectiveGain.toFixed(training === "confidence" ? 0 : 3)}`;

  const streakLabel = newStreak > 0 ? ` (${newStreak}-day streak, ×${streakBonus.toFixed(2)} bonus)` : "";

  return NextResponse.json({
    message: `Training complete: ${gainLabel}${streakLabel}.`,
    motivationLeft: currentMotivation - option.cost,
    gymStreak: newStreak,
    training,
    gainApplied: effectiveGain,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const now = new Date();
  const minutesElapsed = Math.floor(
    (now.getTime() - pilot.lastMotivationAt.getTime()) / (1000 * 60)
  );
  const regenAmount = Math.floor(minutesElapsed / GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES);
  const currentMotivation = Math.min(
    pilot.motivation + regenAmount,
    GAME_CONSTANTS.MOTIVATION_CAP_FREE
  );

  return NextResponse.json({
    motivation: currentMotivation,
    motivationCap: GAME_CONSTANTS.MOTIVATION_CAP_FREE,
    gymStreak: pilot.gymStreak,
    lastGymAt: pilot.lastGymAt,
    strength: pilot.strength,
    speed: pilot.speed,
    endurance: pilot.endurance,
    panic: pilot.panic,
    confidence: pilot.confidence,
    trainingOptions: Object.entries(TRAINING_OPTIONS).map(([key, val]) => ({
      key,
      label: val.label,
      cost: val.cost,
    })),
  });
}
