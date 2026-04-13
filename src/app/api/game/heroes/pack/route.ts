import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import {
  HERO_MAX_ROSTER,
  HERO_TEMPLATES,
  PACK_CREDIT_COST,
  PACK_FREE_COOLDOWN_HOURS,
  applyHeroXpProgression,
  rollHeroPack,
} from "@/lib/hero-data";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const packSchema = z.object({
  type: z.enum(["free", "credit"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = packSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  if (parsed.data.type === "free") {
    if (pilot.lastPackAt) {
      const cooldownMs = PACK_FREE_COOLDOWN_HOURS * 60 * 60 * 1000;
      const elapsedMs = Date.now() - pilot.lastPackAt.getTime();
      if (elapsedMs < cooldownMs) {
        const remainingMs = cooldownMs - elapsedMs;
        return NextResponse.json(
          { error: "Free pack not ready yet.", remainingMs },
          { status: 429 }
        );
      }
    }
  } else {
    // credit pack
    if (pilot.credits < PACK_CREDIT_COST) {
      return NextResponse.json(
        { error: `Not enough credits. Need ${PACK_CREDIT_COST} cr.` },
        { status: 402 }
      );
    }
  }

  // Check roster cap
  const rosterCount = await prisma.playerHero.count({
    where: { pilotId: pilot.id },
  });
  if (rosterCount >= HERO_MAX_ROSTER) {
    return NextResponse.json(
      { error: `Roster full (${HERO_MAX_ROSTER} max). Release a hero first.` },
      { status: 409 }
    );
  }

  // Roll the hero
  const template = rollHeroPack();

  // Check for duplicate
  const existing = await prisma.playerHero.findFirst({
    where: { pilotId: pilot.id, heroSlug: template.slug },
  });

  let heroRecord;
  let isNew: boolean;
  let xpGain = 0;

  if (existing) {
    // Duplicate: give +30 XP to existing hero
    xpGain = 30;
    const progressed = applyHeroXpProgression(existing.xp + xpGain, existing.level);
    heroRecord = await prisma.playerHero.update({
      where: { id: existing.id },
      data: { xp: progressed.xp, level: progressed.level },
    });
    isNew = false;
  } else {
    heroRecord = await prisma.playerHero.create({
      data: {
        pilotId: pilot.id,
        heroSlug: template.slug,
        level: 1,
        xp: 0,
        active: false,
      },
    });
    isNew = true;
  }

  // Deduct cost / record free pack usage
  if (parsed.data.type === "free") {
    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { lastPackAt: new Date() },
    });
  } else {
    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { credits: { decrement: PACK_CREDIT_COST } },
    });
  }

  return NextResponse.json({
    hero: { ...heroRecord, createdAt: heroRecord.createdAt.toISOString() },
    template,
    isNew,
    xpGain: isNew ? 0 : xpGain,
  });
}
