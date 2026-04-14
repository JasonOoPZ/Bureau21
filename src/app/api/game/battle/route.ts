import { authOptions } from "@/auth";
import { applyLevelProgression, getOrCreatePilotState } from "@/lib/game-state";
import { resolvePvpBattle } from "@/lib/battle-engine";
import type { PvpTarget } from "@/lib/battle-engine";
import { computeHeroBonuses, applyHeroXpProgression } from "@/lib/hero-data";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { GAME_CONSTANTS } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ targetUserId: z.string().min(1) });

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

  if (parsed.data.targetUserId === session.user.id) {
    return NextResponse.json({ error: "You cannot fight yourself." }, { status: 400 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Fetch defender
  const defenderPilot = await prisma.pilotState.findUnique({
    where: { userId: parsed.data.targetUserId },
    include: { inventory: true },
  });
  if (!defenderPilot) {
    return NextResponse.json({ error: "Opponent not found." }, { status: 404 });
  }

  // Newbie protection check
  if (pilot.level < GAME_CONSTANTS.NEWBIE_PROTECTION_LEVEL) {
    return NextResponse.json(
      { error: `You must be level ${GAME_CONSTANTS.NEWBIE_PROTECTION_LEVEL} to engage in PVP.` },
      { status: 403 }
    );
  }
  if (defenderPilot.level < GAME_CONSTANTS.NEWBIE_PROTECTION_LEVEL) {
    return NextResponse.json(
      { error: "That pilot is under newbie protection." },
      { status: 403 }
    );
  }

  // Fetch active heroes for both players
  const [attackerHeroes, defenderHeroes] = await Promise.all([
    prisma.playerHero.findMany({ where: { pilotId: pilot.id, active: true } }),
    prisma.playerHero.findMany({ where: { pilotId: defenderPilot.id, active: true } }),
  ]);
  const atkBonuses = computeHeroBonuses(attackerHeroes);
  const defBonuses = computeHeroBonuses(defenderHeroes);

  const outcome = resolvePvpBattle(
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
    {
      callsign: defenderPilot.callsign,
      level: defenderPilot.level,
      lifeForce: defenderPilot.lifeForce,
      strength: defenderPilot.strength,
      speed: defenderPilot.speed,
      confidence: defenderPilot.confidence,
      atkSplit: defenderPilot.atkSplit,
      inventory: defenderPilot.inventory,
    },
    atkBonuses,
    defBonuses
  );

  // Update attacker
  const atkProgressed = applyLevelProgression(
    pilot.xp + outcome.attackerXp,
    pilot.level
  );
  const atkNewConf = Math.max(0, Math.min(75, pilot.confidence + outcome.attackerConfDelta));

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      xp: atkProgressed.xp,
      level: atkProgressed.level,
      credits: { increment: outcome.attackerCredits },
      lifeForce: outcome.attackerLfAfter,
      confidence: atkNewConf,
      kills: outcome.winner === "attacker" ? { increment: 1 } : undefined,
      lastActionAt: new Date(),
    },
  });

  // Update defender
  const defProgressed = applyLevelProgression(
    defenderPilot.xp + outcome.defenderXp,
    defenderPilot.level
  );
  const defNewConf = Math.max(0, Math.min(75, defenderPilot.confidence + outcome.defenderConfDelta));

  await prisma.pilotState.update({
    where: { userId: defenderPilot.userId },
    data: {
      xp: defProgressed.xp,
      level: defProgressed.level,
      credits: { increment: outcome.defenderCredits },
      lifeForce: outcome.defenderLfAfter,
      confidence: defNewConf,
      kills: outcome.winner === "defender" ? { increment: 1 } : undefined,
    },
  });

  // Hero XP for attacker's heroes
  if (attackerHeroes.length > 0) {
    const heroXpGain = outcome.winner === "attacker" ? 20 : 5;
    await Promise.all(
      attackerHeroes.map(async (hero) => {
        const progressed = applyHeroXpProgression(hero.xp + heroXpGain, hero.level);
        await prisma.playerHero.update({
          where: { id: hero.id },
          data: { xp: progressed.xp, level: progressed.level },
        });
      })
    );
  }

  // Hero XP for defender's heroes
  if (defenderHeroes.length > 0) {
    const heroXpGain = outcome.winner === "defender" ? 20 : 5;
    await Promise.all(
      defenderHeroes.map(async (hero) => {
        const progressed = applyHeroXpProgression(hero.xp + heroXpGain, hero.level);
        await prisma.playerHero.update({
          where: { id: hero.id },
          data: { xp: progressed.xp, level: progressed.level },
        });
      })
    );
  }

  // Battle logs for both players
  await Promise.all([
    prisma.battleLog.create({
      data: {
        pilotId: pilot.id,
        opponentName: defenderPilot.callsign,
        result: outcome.winner === "attacker" ? "win" : "loss",
        xpGained: outcome.attackerXp,
        creditsGained: outcome.attackerCredits,
        roundsCount: outcome.totalRounds,
        logText: outcome.logText,
      },
    }),
    prisma.battleLog.create({
      data: {
        pilotId: defenderPilot.id,
        opponentName: pilot.callsign,
        result: outcome.winner === "defender" ? "win" : "loss",
        xpGained: outcome.defenderXp,
        creditsGained: outcome.defenderCredits,
        roundsCount: outcome.totalRounds,
        logText: outcome.logText,
      },
    }),
  ]);

  const finalState = await prisma.pilotState.findUnique({
    where: { userId: session.user.id },
    include: { inventory: true, missions: true },
  });

  return NextResponse.json({ outcome, state: finalState });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Fetch all other pilots as potential PVP targets (exclude self + newbies)
  const targets = await prisma.pilotState.findMany({
    where: {
      userId: { not: session.user.id },
      level: { gte: GAME_CONSTANTS.NEWBIE_PROTECTION_LEVEL },
    },
    select: {
      id: true,
      userId: true,
      callsign: true,
      level: true,
      characterSlug: true,
    },
    orderBy: { level: "asc" },
    take: 50,
  });

  const logs = await prisma.battleLog.findMany({
    where: { pilotId: pilot.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    targets: targets as PvpTarget[],
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
