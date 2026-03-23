import { authOptions } from "@/auth";
import { applyLevelProgression, getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const COOLDOWN_MINUTES = 60;

const JOBS = [
  { id: "courier", label: "Courier Run", description: "Deliver a priority data-package to the outer docks.", levelReq: 1, creditReward: 60, xpReward: 20, durationLabel: "1 hr" },
  { id: "hauler",  label: "Cargo Hauler", description: "Transport bulk freight across three sector waypoints.", levelReq: 5, creditReward: 150, xpReward: 50, durationLabel: "1 hr" },
  { id: "contractor", label: "Independent Contractor", description: "Execute a classified retrieval contract for an unknown client.", levelReq: 10, creditReward: 300, xpReward: 100, durationLabel: "1 hr" },
] as const;

type JobId = "courier" | "hauler" | "contractor";
const schema = z.object({ jobId: z.enum(["courier", "hauler", "contractor"]) });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const state = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });

  const lastDockAt = state?.lastDockAt ?? new Date(0);
  const elapsedMinutes = (Date.now() - lastDockAt.getTime()) / 60000;
  const cooldownRemaining = Math.max(0, Math.ceil(COOLDOWN_MINUTES - elapsedMinutes));
  const ready = cooldownRemaining === 0;

  return NextResponse.json({
    jobs: JOBS.map((j) => ({ ...j, available: pilot.level >= j.levelReq })),
    ready,
    cooldownRemaining,
    cooldownMinutes: COOLDOWN_MINUTES,
    lastDockAt: lastDockAt.toISOString(),
    level: pilot.level,
    credits: pilot.credits,
    xp: pilot.xp,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid job selection." }, { status: 400 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const state = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });

  const lastDockAt = state?.lastDockAt ?? new Date(0);
  const elapsedMinutes = (Date.now() - lastDockAt.getTime()) / 60000;

  if (elapsedMinutes < COOLDOWN_MINUTES) {
    const remaining = Math.ceil(COOLDOWN_MINUTES - elapsedMinutes);
    return NextResponse.json(
      { error: `You are already on assignment. Return in ${remaining} minute${remaining === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }

  const job = JOBS.find((j) => j.id === parsed.data.jobId);
  if (!job) return NextResponse.json({ error: "Unknown job." }, { status: 400 });

  if (pilot.level < job.levelReq) {
    return NextResponse.json(
      { error: `${job.label} requires Level ${job.levelReq}.` },
      { status: 403 }
    );
  }

  const progressed = applyLevelProgression(pilot.xp + job.xpReward, pilot.level);

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      credits: { increment: job.creditReward },
      xp: progressed.xp,
      level: progressed.level,
      lastDockAt: new Date(),
    },
  });

  return NextResponse.json({
    job,
    creditGain: job.creditReward,
    xpGain: job.xpReward,
    newLevel: progressed.level,
    leveledUp: progressed.level > pilot.level,
    message: `Contract complete: ${job.label}. +${job.creditReward} credits, +${job.xpReward} XP.`,
  });
}
