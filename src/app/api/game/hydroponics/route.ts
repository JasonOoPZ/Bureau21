import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createInitialState, processOfflineProgress } from "@/lib/hydroponics/engine";
import type { HydroponicsGameState } from "@/lib/hydroponics/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

async function loadOrCreateState(pilotId: string): Promise<{ state: HydroponicsGameState; isNew: boolean }> {
  const existing = await prisma.hydroponicsData.findUnique({ where: { pilotId } });
  if (existing) {
    return { state: existing.gameState as unknown as HydroponicsGameState, isNew: false };
  }
  const state = createInitialState();
  await prisma.hydroponicsData.create({ data: { pilotId, gameState: state as unknown as Prisma.InputJsonValue } });
  return { state, isNew: true };
}

/** GET — Load game state + calculate offline progress */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const { state, isNew } = await loadOrCreateState(pilot.id);

  if (isNew) {
    return NextResponse.json({ state, credits: pilot.credits, offline: null });
  }

  // Process offline progress
  const now = Date.now();
  const { state: updated, report, creditsDelta } = processOfflineProgress(state, pilot.credits, now);

  // Apply credit delta from wages
  if (creditsDelta !== 0) {
    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { credits: { increment: creditsDelta } },
    });
  }

  // Save updated state
  await prisma.hydroponicsData.update({
    where: { pilotId: pilot.id },
    data: { gameState: updated as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json({
    state: updated,
    credits: pilot.credits + creditsDelta,
    offline: report.elapsedHours > 0.01 ? report : null,
  });
}

const saveSchema = z.object({
  action: z.enum(["save", "spend", "earn"]),
  gameState: z.any(),
  creditsDelta: z.number().optional(),
});

/** POST — Save state + apply credit changes atomically */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid save data." }, { status: 400 });
  }

  const { action, gameState, creditsDelta } = parsed.data;
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Block earn actions from sending negative deltas
  if (action === "earn" && creditsDelta && creditsDelta < 0) {
    return NextResponse.json({ error: "Invalid credit operation." }, { status: 400 });
  }

  // Only "spend" actions are allowed to deduct credits
  if (creditsDelta && creditsDelta < 0 && action !== "spend") {
    return NextResponse.json({ error: "Invalid credit operation." }, { status: 400 });
  }

  // Pre-flight balance check
  if (action === "spend" && creditsDelta && creditsDelta < 0) {
    if (pilot.credits + creditsDelta < 0) {
      return NextResponse.json({ error: "Not enough credits." }, { status: 400 });
    }
  }

  // Atomic update with balance re-check inside transaction to prevent race conditions
  try {
    const newCredits = await prisma.$transaction(async (tx) => {
      // Save/upsert game state
      await tx.hydroponicsData.upsert({
        where: { pilotId: pilot.id },
        update: { gameState: gameState as Prisma.InputJsonValue },
        create: { pilotId: pilot.id, gameState: gameState as Prisma.InputJsonValue },
      });

      if (creditsDelta && creditsDelta !== 0) {
        // Re-read balance inside transaction for atomicity
        if (creditsDelta < 0) {
          const fresh = await tx.pilotState.findUnique({ where: { userId: session.user.id }, select: { credits: true } });
          if (!fresh || fresh.credits + creditsDelta < 0) {
            throw new Error("INSUFFICIENT_CREDITS");
          }
        }

        const updated = await tx.pilotState.update({
          where: { userId: session.user.id },
          data: { credits: { increment: creditsDelta } },
        });
        return updated.credits;
      }

      return pilot.credits;
    });

    return NextResponse.json({ ok: true, credits: newCredits });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Not enough credits." }, { status: 400 });
    }
    throw err;
  }
}
