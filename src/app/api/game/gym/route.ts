import { authOptions } from "@/auth";
import { GAME_CONSTANTS, computeGymEnergy, getConfidenceCap } from "@/lib/constants";
import { guardedPilotUpdate } from "@/lib/economy";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const TRAINING_OPTIONS = {
  strength:      { cost: 8,  field: "strength",  gain: 0.3,   label: "Strength" },
  speed:         { cost: 8,  field: "speed",     gain: 0.3,   label: "Speed" },
  endurance:     { cost: 5,  field: "endurance",  gain: 0.02,  label: "Endurance" },
  panic_control: { cost: 10, field: "panic",      gain: -0.05, label: "Panic Control" },
} as const;

type TrainingType = keyof typeof TRAINING_OPTIONS;

const schema = z.object({
  training: z.enum(["strength", "speed", "endurance", "panic_control"]),
});

/** Reset gym energy to max if 24h have passed since last reset. */
function resolveGymEnergy(pilot: {
  gymEnergy: number;
  lastGymEnergyAt: Date;
  endurance: number;
  gymStreak: number;
}) {
  const now = new Date();
  const hoursSinceReset =
    (now.getTime() - pilot.lastGymEnergyAt.getTime()) / (1000 * 60 * 60);
  const { max } = computeGymEnergy(pilot.endurance, pilot.gymStreak);

  if (hoursSinceReset >= GAME_CONSTANTS.GYM_ENERGY_RESET_HOURS) {
    return { energy: max, didReset: true };
  }
  return { energy: Math.min(pilot.gymEnergy, max), didReset: false };
}

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

  // Resolve energy (daily reset if needed)
  const { energy: currentEnergy, didReset } = resolveGymEnergy(pilot);

  if (currentEnergy < option.cost) {
    return NextResponse.json(
      {
        error: `Not enough gym energy. Need ${option.cost}, have ${currentEnergy}. Energy resets daily.`,
      },
      { status: 400 }
    );
  }

  // Calculate gym streak
  const now = new Date();
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

  // Stat gains are relative so they never overwrite a concurrent change.
  let statGain: Prisma.PilotStateUpdateManyMutationInput;
  if (training === "strength") {
    statGain = { strength: { increment: effectiveGain } };
  } else if (training === "speed") {
    statGain = { speed: { increment: effectiveGain } };
  } else if (training === "endurance") {
    statGain = { endurance: { increment: effectiveGain } };
  } else {
    statGain = pilot.panic + effectiveGain >= 0 ? { panic: { increment: effectiveGain } } : { panic: 0 };
  }

  // Energy (with its daily reset) is derived from (gymEnergy, lastGymEnergyAt).
  // The write is a compare-and-swap on exactly that pair: of N parallel sessions
  // computed from the same snapshot only one is charged and trained; the others
  // are rejected and must retry against the reduced energy.
  const trained = await guardedPilotUpdate(
    prisma,
    session.user.id,
    { gymEnergy: pilot.gymEnergy, lastGymEnergyAt: pilot.lastGymEnergyAt },
    {
      gymEnergy: currentEnergy - option.cost,
      gymStreak: newStreak,
      lastGymAt: now,
      ...(didReset ? { lastGymEnergyAt: now } : {}),
      ...statGain,
    }
  );

  if (!trained) {
    return NextResponse.json(
      { error: "Another training session is still resolving. Try again." },
      { status: 409 }
    );
  }

  await prisma.gymLog.create({
    data: {
      pilotId: pilot.id,
      training,
      gain: effectiveGain,
      energyCost: option.cost,
    },
  });

  const gainLabel =
    training === "panic_control"
      ? `Panic reduced by ${Math.abs(effectiveGain).toFixed(3)}`
      : `${option.label} +${effectiveGain.toFixed(3)}`;

  const streakLabel = newStreak > 0 ? ` (${newStreak}-day streak, ×${streakBonus.toFixed(2)} bonus)` : "";

  return NextResponse.json({
    message: `Training complete: ${gainLabel}${streakLabel}.`,
    gymEnergy: currentEnergy - option.cost,
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

  const { energy: currentEnergy, didReset } = resolveGymEnergy(pilot);

  if (didReset) {
    // Only refill if nobody reset (or trained) since we read the row; otherwise
    // a slow GET would hand back a full bar that a POST already spent.
    await guardedPilotUpdate(
      prisma,
      session.user.id,
      { gymEnergy: pilot.gymEnergy, lastGymEnergyAt: pilot.lastGymEnergyAt },
      { gymEnergy: currentEnergy, lastGymEnergyAt: new Date() }
    );
  }

  const energyBreakdown = computeGymEnergy(pilot.endurance, pilot.gymStreak);

  const hoursSinceReset =
    (Date.now() - pilot.lastGymEnergyAt.getTime()) / (1000 * 60 * 60);
  const hoursUntilReset = Math.max(
    0,
    GAME_CONSTANTS.GYM_ENERGY_RESET_HOURS - hoursSinceReset
  );

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const gymLogs = await prisma.gymLog.findMany({
    where: { pilotId: pilot.id, createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: "desc" },
    select: { training: true, gain: true, energyCost: true, createdAt: true },
  });

  return NextResponse.json({
    gymEnergy: currentEnergy,
    energyBreakdown,
    hoursUntilReset,
    gymStreak: pilot.gymStreak,
    lastGymAt: pilot.lastGymAt,
    strength: pilot.strength,
    speed: pilot.speed,
    endurance: pilot.endurance,
    panic: pilot.panic,
    confidence: pilot.confidence,
    confidenceCap: getConfidenceCap(pilot.characterSlug),
    gymLogs: gymLogs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
    trainingOptions: Object.entries(TRAINING_OPTIONS).map(([key, val]) => ({
      key,
      label: val.label,
      cost: val.cost,
    })),
  });
}
