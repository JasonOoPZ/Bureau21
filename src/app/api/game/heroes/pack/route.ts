import { authOptions } from "@/auth";
import { EconomyError, economyErrorResponse, economyTx, guardedPilotUpdate } from "@/lib/economy";
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

const DUPLICATE_XP_GAIN = 30;

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

  const userId = session.user.id;
  const pilot = await getOrCreatePilotState(userId, session.user.name);
  const isFree = parsed.data.type === "free";
  const cooldownMs = PACK_FREE_COOLDOWN_HOURS * 60 * 60 * 1000;
  const insufficientCredits = `Not enough credits. Need ${PACK_CREDIT_COST} cr.`;
  const rosterFull = `Roster full (${HERO_MAX_ROSTER} max). Release a hero first.`;

  // Friendly early exits; the authoritative checks run inside the transaction below.
  if (isFree) {
    if (pilot.lastPackAt) {
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
      return NextResponse.json({ error: insufficientCredits }, { status: 402 });
    }
  }

  // Check roster cap
  const rosterCount = await prisma.playerHero.count({
    where: { pilotId: pilot.id },
  });
  if (rosterCount >= HERO_MAX_ROSTER) {
    return NextResponse.json({ error: rosterFull }, { status: 409 });
  }

  // Roll the hero
  const template = rollHeroPack();

  try {
    const { heroRecord, isNew } = await economyTx(async (tx) => {
      // Pay first: claim the free-pack cooldown or debit the credits, guarded.
      // This also row-locks the pilot, so parallel opens queue up and the
      // roster / duplicate checks below see every hero granted before them.
      const now = new Date();
      const paid = isFree
        ? await guardedPilotUpdate(
            tx,
            userId,
            { OR: [{ lastPackAt: null }, { lastPackAt: { lte: new Date(now.getTime() - cooldownMs) } }] },
            { lastPackAt: now }
          )
        : await guardedPilotUpdate(
            tx,
            userId,
            { credits: { gte: PACK_CREDIT_COST } },
            { credits: { decrement: PACK_CREDIT_COST } }
          );

      if (!paid) {
        if (!isFree) throw new EconomyError(insufficientCredits, 402);
        const elapsedMs = pilot.lastPackAt ? now.getTime() - pilot.lastPackAt.getTime() : 0;
        throw new EconomyError("Free pack not ready yet.", 429, {
          remainingMs: Math.max(0, cooldownMs - elapsedMs),
        });
      }

      const roster = await tx.playerHero.count({ where: { pilotId: pilot.id } });
      if (roster >= HERO_MAX_ROSTER) throw new EconomyError(rosterFull, 409);

      // Check for duplicate
      const existing = await tx.playerHero.findFirst({
        where: { pilotId: pilot.id, heroSlug: template.slug },
      });

      if (existing) {
        // Duplicate: give +30 XP to existing hero
        const progressed = applyHeroXpProgression(existing.xp + DUPLICATE_XP_GAIN, existing.level);
        const updatedHero = await tx.playerHero.update({
          where: { id: existing.id },
          data: { xp: progressed.xp, level: progressed.level },
        });
        return { heroRecord: updatedHero, isNew: false };
      }

      const createdHero = await tx.playerHero.create({
        data: {
          pilotId: pilot.id,
          heroSlug: template.slug,
          level: 1,
          xp: 0,
          active: false,
        },
      });
      return { heroRecord: createdHero, isNew: true };
    });

    return NextResponse.json({
      hero: { ...heroRecord, createdAt: heroRecord.createdAt.toISOString() },
      template,
      isNew,
      xpGain: isNew ? 0 : DUPLICATE_XP_GAIN,
    });
  } catch (error) {
    return economyErrorResponse(error);
  }
}
