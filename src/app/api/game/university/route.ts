import { authOptions } from "@/auth";
import { COURSES, STUDY_COST, MAX_COURSES_FREE } from "@/lib/courses";
import { GAME_CONSTANTS } from "@/lib/constants";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  course: z.string(),
  amount: z.number().int().min(1).max(100).default(1),
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

  const { course, amount } = parsed.data;
  const courseData = COURSES.find((c) => c.slug === course);
  if (!courseData) {
    return NextResponse.json({ error: "Unknown course." }, { status: 400 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Recalculate motivation with regen
  const now = new Date();
  const minutesElapsed = Math.floor(
    (now.getTime() - pilot.lastMotivationAt.getTime()) / (1000 * 60)
  );
  const regenAmount = Math.floor(minutesElapsed / GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES);
  const currentMotivation = Math.min(
    pilot.motivation + regenAmount,
    GAME_CONSTANTS.MOTIVATION_CAP_FREE
  );

  const totalCost = STUDY_COST * amount;
  if (currentMotivation < totalCost) {
    return NextResponse.json(
      { error: `Not enough motivation. Need ${totalCost}, have ${currentMotivation}.` },
      { status: 400 }
    );
  }

  // Check course limit for non-subscribed accounts
  const existingStudies = await prisma.studyProgress.findMany({
    where: { pilotId: pilot.id },
  });

  const alreadyStudying = existingStudies.find((s) => s.course === course);
  if (!alreadyStudying) {
    const activeCount = existingStudies.filter((s) => s.points > 0).length;
    if (activeCount >= MAX_COURSES_FREE) {
      return NextResponse.json(
        { error: `You can only study ${MAX_COURSES_FREE} courses at a time.` },
        { status: 400 }
      );
    }
  }

  // Check if already at max
  const currentPoints = alreadyStudying?.points ?? 0;
  if (currentPoints >= courseData.maxPoints) {
    return NextResponse.json(
      { error: `You have already mastered ${courseData.name}.` },
      { status: 400 }
    );
  }

  // Calculate points gained (each study has a random chance of 0 or 1 point)
  let pointsGained = 0;
  for (let i = 0; i < amount; i++) {
    if (Math.random() < 0.7) pointsGained += 1; // 70% chance per study
  }
  const newPoints = Math.min(courseData.maxPoints, currentPoints + pointsGained);

  // Upsert study progress
  await prisma.studyProgress.upsert({
    where: { pilotId_course: { pilotId: pilot.id, course } },
    create: { pilotId: pilot.id, course, points: newPoints },
    update: { points: newPoints },
  });

  // Deduct motivation
  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      motivation: currentMotivation - totalCost,
      lastMotivationAt: now,
    },
  });

  return NextResponse.json({
    message: `Studied ${courseData.name} ×${amount}. Gained ${pointsGained} point${pointsGained !== 1 ? "s" : ""}.`,
    course,
    pointsGained,
    totalPoints: newPoints,
    maxPoints: courseData.maxPoints,
    motivationLeft: currentMotivation - totalCost,
  });
}
