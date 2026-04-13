import { authOptions } from "@/auth";
import { applyLevelProgression, getOrCreatePilotState } from "@/lib/game-state";
import { resolveBattle, NPC_BOTS } from "@/lib/battle-engine";
import { computeHeroBonuses, applyHeroXpProgression } from "@/lib/hero-data";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ botSlug: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rl = rateLimit(`battle:${session.user.id}`, 10, 60_000);
  if (rl.limited) {
    return NextResponse.json(
      { error: "Too many battles. Try again shortly." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const botTemplate = NPC_BOTS.find((b) => b.slug === parsed.data.botSlug);
  if (!botTemplate) {
    return NextResponse.json({ error: "Unknown opponent." }, { status: 400 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  if (pilot.level < botTemplate.levelReq) {
    return NextResponse.json(
      { error: `Requires level ${botTemplate.levelReq}.` },
      { status: 403 }
    );
  }

  // Fetch active heroes and compute their aggregate bonuses
  const activeHeroes = await prisma.playerHero.findMany({
    where: { pilotId: pilot.id, active: true },
  });
  const heroBonuses = computeHeroBonuses(activeHeroes);

  const outcome = resolveBattle(
    {
      callsign: pilot.callsign,
      level: pilot.level,
      lifeForce: pilot.lifeForce,
      strength: pilot.strength,
      speed: pilot.speed,
      confidence: pilot.confidence,
      atkSplit: pilot.atkSplit,
      inventory: pilot.inventory,
    },
    parsed.data.botSlug,
    heroBonuses
  );

  const progressed = applyLevelProgression(
    pilot.xp + outcome.xpGained,
    pilot.level
  );

  const newConfidence = Math.max(
    0,
    Math.min(75, pilot.confidence + outcome.confidenceDelta)
  );

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      xp: progressed.xp,
      level: progressed.level,
      credits: { increment: outcome.creditsGained },
      lifeForce: outcome.playerLfAfter,
      confidence: newConfidence,
      kills: outcome.winner === "player" ? { increment: 1 } : undefined,
      lastActionAt: new Date(),
    },
  });

  // Give each active hero XP for participating
  if (activeHeroes.length > 0) {
    const heroXpGain = outcome.winner === "player" ? 20 : 5;
    await Promise.all(
      activeHeroes.map(async (hero) => {
        const progressed = applyHeroXpProgression(hero.xp + heroXpGain, hero.level);
        await prisma.playerHero.update({
          where: { id: hero.id },
          data: { xp: progressed.xp, level: progressed.level },
        });
      })
    );
  }

  await prisma.battleLog.create({
    data: {
      pilotId: pilot.id,
      opponentName: botTemplate.name,
      result: outcome.winner === "player" ? "win" : "loss",
      xpGained: outcome.xpGained,
      creditsGained: outcome.creditsGained,
      roundsCount: outcome.totalRounds,
      logText: outcome.logText,
    },
  });

  const finalState = await prisma.pilotState.findUnique({
    where: { userId: session.user.id },
    include: { inventory: true, missions: true },
  });

  return NextResponse.json({ outcome, state: finalState });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const logs = await prisma.battleLog.findMany({
    where: { pilotId: pilot.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    bots: NPC_BOTS.filter((b) => pilot.level >= b.levelReq),
    logs,
    pilot: {
      level: pilot.level,
      lifeForce: pilot.lifeForce,
      strength: pilot.strength,
      speed: pilot.speed,
      confidence: pilot.confidence,
      atkSplit: pilot.atkSplit,
    },
  });
}
