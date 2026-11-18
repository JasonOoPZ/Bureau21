import { authOptions } from "@/auth";
import {
  economyErrorResponse,
  EconomyError,
  economyTx,
  guardedPilotUpdate,
  settleLevelProgression,
  type Db,
} from "@/lib/economy";
import { findPilotByCallsign } from "@/lib/callsign";
import { getOrCreatePilotState } from "@/lib/game-state";
import { pvpDefenderLossAllowance, resolvePvpBattle } from "@/lib/battle-engine";
import type { BattleOutcome, PvpPilotInput, PvpTarget } from "@/lib/battle-engine";
import { computeHeroBonuses, applyHeroXpProgression } from "@/lib/hero-data";
import { loadPilotForPlay, syncVitals } from "@/lib/pilot-sync";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { GAME_CONSTANTS, getConfidenceCap } from "@/lib/constants";
import {
  applyBattleConfidence,
  maxLifeForce,
  pvpMinLifeForce,
  resolveDailyConfidence,
} from "@/lib/vitals";
import type { InventoryItem, PilotState, PlayerHero } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  targetUserId: z.string().min(1).optional(),
  targetCallsign: z.string().min(1).max(40).optional(),
}).refine((d) => d.targetUserId || d.targetCallsign, { message: "Target required" });

const MS_PER_MINUTE = 60_000;
const PAIR_WINDOW_MS = 24 * 60 * MS_PER_MINUTE;
const HERO_XP_WIN = 20;
const HERO_XP_LOSS = 5;
/** BattleLog.kind / BattleLog.role values. */
const PVP_KIND = "pvp";
const ROLE_ATTACKER = "attacker";
const ROLE_DEFENDER = "defender";

type Combatant = PilotState & { inventory: InventoryItem[] };

/**
 * Row-lock both pilots for the rest of the transaction. Locks are always taken
 * in userId order, so A attacking B while B attacks A cannot deadlock. Every
 * check and write below then runs against rows nobody else can change, which
 * is what makes the cooldown / daily-cap checks atomic with the battle itself.
 */
async function lockCombatants(tx: Db, attackerUserId: string, defenderUserId: string) {
  for (const userId of [attackerUserId, defenderUserId].sort()) {
    await tx.$queryRaw`SELECT "id" FROM "PilotState" WHERE "userId" = ${userId} FOR UPDATE`;
  }
}

async function loadCombatant(tx: Db, userId: string, now: Date): Promise<Combatant | null> {
  const pilot = await tx.pilotState.findUnique({ where: { userId }, include: { inventory: true } });
  if (!pilot) return null;

  // Regeneration first, so an offline defender fights with the LF they have
  // earned back, then the midnight-HKT confidence reset.
  const synced = await syncVitals(tx, pilot, now);
  const daily = resolveDailyConfidence(synced.confidence, synced.lastConfidenceResetAt, now);
  if (!daily.didReset) return synced;

  await tx.pilotState.update({
    where: { userId },
    data: { confidence: daily.confidence, lastConfidenceResetAt: now },
  });
  return { ...synced, confidence: daily.confidence, lastConfidenceResetAt: now };
}

async function assertNotSuspended(tx: Db, attackerUserId: string, defenderUserId: string) {
  const users = await tx.user.findMany({
    where: { id: { in: [attackerUserId, defenderUserId] } },
    select: { id: true, suspended: true },
  });
  if (users.find((u) => u.id === attackerUserId)?.suspended) {
    throw new EconomyError("Your account is suspended.", 403);
  }
  if (users.find((u) => u.id === defenderUserId)?.suspended) {
    throw new EconomyError("That pilot cannot be attacked.", 403);
  }
}

async function assertBattleAllowed(tx: Db, attacker: Combatant, defender: Combatant, now: Date) {
  // Level-based attack restriction: level 6+ cannot attack level 5 or below
  if (attacker.level >= 6 && defender.level <= 5) {
    throw new EconomyError("You cannot attack pilots level 5 or below.", 403);
  }

  const attackerMinLf = pvpMinLifeForce(attacker);
  if (attacker.lifeForce < attackerMinLf) {
    throw new EconomyError(
      `Too injured to fight. You need at least ${attackerMinLf} Life Force to attack.`
    );
  }
  if (defender.lifeForce < pvpMinLifeForce(defender)) {
    throw new EconomyError("That pilot is recovering and cannot be attacked right now.", 409);
  }

  // The defender's own cooldown, never shorter than the global minimum.
  if (defender.lastAttackedAt) {
    const cooldownMs =
      Math.max(GAME_CONSTANTS.PVP_MIN_DEFENDER_COOLDOWN_MINUTES, defender.battleCooldown) *
      MS_PER_MINUTE;
    const elapsed = now.getTime() - defender.lastAttackedAt.getTime();
    if (elapsed < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - elapsed) / MS_PER_MINUTE);
      throw new EconomyError(
        `That pilot was attacked recently. Try again in ~${remaining} minute(s).`,
        429
      );
    }
  }

  // Per-pair daily cap. Each battle writes one row per side, so the attacker's
  // rows against this opponent count battles between the two pilots in either
  // direction. Matched on the opponent's pilot id, so a rename does not reset
  // it. Rows written before `opponentPilotId` existed that the migration could
  // not backfill are matched by name; they age out of the 24h window.
  const recentBetweenPair = await tx.battleLog.count({
    where: {
      pilotId: attacker.id,
      kind: PVP_KIND,
      createdAt: { gte: new Date(now.getTime() - PAIR_WINDOW_MS) },
      OR: [
        { opponentPilotId: defender.id },
        { opponentPilotId: null, opponentName: defender.callsign },
      ],
    },
  });
  if (recentBetweenPair >= GAME_CONSTANTS.PVP_PAIR_DAILY_CAP) {
    throw new EconomyError(
      `You have already fought ${defender.callsign} ${GAME_CONSTANTS.PVP_PAIR_DAILY_CAP} times in the last 24 hours.`,
      429
    );
  }
}

/**
 * What the defender can still lose under the rolling 24h loss cap. Runs under
 * the defender's row lock, and every battle writes its log row in the same
 * transaction, so concurrent battles cannot both spend the same allowance.
 *
 * Only losses taken while defending count (`role = "defender"`): credits a
 * pilot lost in fights they started are their own risk and do not use up the
 * allowance. Rows written before `role` existed (null) are still counted, as
 * they were before, which is the stricter reading; they age out in 24h.
 */
async function defenderLossAllowance(tx: Db, defender: Combatant, now: Date): Promise<number> {
  const recent = await tx.battleLog.aggregate({
    where: {
      pilotId: defender.id,
      kind: PVP_KIND,
      creditsGained: { lt: 0 },
      createdAt: { gte: new Date(now.getTime() - PAIR_WINDOW_MS) },
      OR: [{ role: ROLE_DEFENDER }, { role: null }],
    },
    _sum: { creditsGained: true },
  });
  return pvpDefenderLossAllowance(defender.credits, -(recent._sum.creditsGained ?? 0));
}

function toBattleInput(pilot: Combatant): PvpPilotInput {
  return {
    callsign: pilot.callsign,
    level: pilot.level,
    lifeForce: pilot.lifeForce,
    bonusLifeForce: pilot.bonusLifeForce,
    strength: pilot.strength,
    speed: pilot.speed,
    confidence: pilot.confidence,
    atkSplit: pilot.atkSplit,
    characterSlug: pilot.characterSlug,
    credits: pilot.credits,
    inventory: pilot.inventory,
  };
}

interface SideResult {
  won: boolean;
  xp: number;
  credits: number;
  lifeForceAfter: number;
}

/**
 * Apply one side's result. Both rows are locked, so `pilot` is current; even
 * so every stat is written as a delta, and a loser's payment is guarded so
 * credits can never go negative.
 */
async function applySideResult(tx: Db, pilot: Combatant, side: SideResult, now: Date, attacked: boolean) {
  const confidence = applyBattleConfidence(
    pilot.confidence,
    side.won,
    getConfidenceCap(pilot.characterSlug)
  );

  const updated = await guardedPilotUpdate(
    tx,
    pilot.userId,
    side.credits < 0 ? { credits: { gte: -side.credits } } : {},
    {
      xp: { increment: side.xp },
      credits: { increment: side.credits },
      lifeForce: { increment: side.lifeForceAfter - pilot.lifeForce },
      confidence: { increment: confidence - pilot.confidence },
      kills: { increment: side.won ? 1 : 0 },
      ...(attacked ? { lastAttackedAt: now } : { lastActionAt: now }),
    }
  );
  if (!updated) throw new EconomyError("Battle could not be settled. Try again.", 409);
}

async function grantHeroXp(tx: Db, heroes: PlayerHero[], won: boolean) {
  const gain = won ? HERO_XP_WIN : HERO_XP_LOSS;
  for (const hero of heroes) {
    const progressed = applyHeroXpProgression(hero.xp + gain, hero.level);
    await tx.playerHero.update({
      where: { id: hero.id },
      data: { xp: progressed.xp, level: progressed.level },
    });
  }
}

async function runBattle(tx: Db, attackerUserId: string, defenderUserId: string): Promise<BattleOutcome> {
  const now = new Date();
  await lockCombatants(tx, attackerUserId, defenderUserId);
  await assertNotSuspended(tx, attackerUserId, defenderUserId);

  const attacker = await loadCombatant(tx, attackerUserId, now);
  const defender = await loadCombatant(tx, defenderUserId, now);
  if (!attacker) throw new EconomyError("Pilot not found.", 404);
  if (!defender) throw new EconomyError("Opponent not found.", 404);

  await assertBattleAllowed(tx, attacker, defender, now);

  // Fetch active heroes for both players (read under the pilot locks)
  const [attackerHeroes, defenderHeroes] = await Promise.all([
    tx.playerHero.findMany({ where: { pilotId: attacker.id, active: true } }),
    tx.playerHero.findMany({ where: { pilotId: defender.id, active: true } }),
  ]);

  const defenderMaxLoss = await defenderLossAllowance(tx, defender, now);

  const outcome = resolvePvpBattle(
    toBattleInput(attacker),
    { ...toBattleInput(defender), maxLoss: defenderMaxLoss },
    computeHeroBonuses(attackerHeroes),
    computeHeroBonuses(defenderHeroes)
  );
  const attackerWon = outcome.winner === "attacker";

  await applySideResult(tx, attacker, {
    won: attackerWon,
    xp: outcome.attackerXp,
    credits: outcome.attackerCredits,
    lifeForceAfter: outcome.attackerLfAfter,
  }, now, false);
  await applySideResult(tx, defender, {
    won: !attackerWon,
    xp: outcome.defenderXp,
    credits: outcome.defenderCredits,
    lifeForceAfter: outcome.defenderLfAfter,
  }, now, true);

  const attackerLevel = (await settleLevelProgression(tx, attackerUserId))?.level ?? attacker.level;
  await settleLevelProgression(tx, defenderUserId);

  await grantHeroXp(tx, attackerHeroes, attackerWon);
  await grantHeroXp(tx, defenderHeroes, !attackerWon);

  // Auto-herbs: top the attacker back up to their max. Guarded so a herb is
  // only spent when it actually heals, and LF is never lowered.
  const attackerMaxLf = maxLifeForce({ level: attackerLevel, bonusLifeForce: attacker.bonusLifeForce });
  if (attacker.autoHerbs && outcome.attackerLfAfter < attackerMaxLf) {
    await guardedPilotUpdate(
      tx,
      attackerUserId,
      { herbs: { gte: 1 }, lifeForce: { lt: attackerMaxLf } },
      { lifeForce: attackerMaxLf, herbs: { decrement: 1 } }
    );
  }

  // Battle logs for both players
  const defenderLogText = attacker.hideBattleLogs ? "[Battle log hidden by attacker]" : outcome.logText;
  await tx.battleLog.createMany({
    data: [
      {
        pilotId: attacker.id,
        opponentPilotId: defender.id,
        role: ROLE_ATTACKER,
        kind: PVP_KIND,
        opponentName: defender.callsign,
        result: attackerWon ? "win" : "loss",
        xpGained: outcome.attackerXp,
        creditsGained: outcome.attackerCredits,
        roundsCount: outcome.totalRounds,
        logText: outcome.logText,
      },
      {
        pilotId: defender.id,
        opponentPilotId: attacker.id,
        role: ROLE_DEFENDER,
        kind: PVP_KIND,
        opponentName: attacker.callsign,
        result: attackerWon ? "loss" : "win",
        xpGained: outcome.defenderXp,
        creditsGained: outcome.defenderCredits,
        roundsCount: outcome.totalRounds,
        logText: defenderLogText,
      },
    ],
  });

  return outcome;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const attackerUserId = session.user.id;

  const rl = rateLimit(`battle:${attackerUserId}`, 10, 60_000);
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

  if (parsed.data.targetUserId === attackerUserId) {
    return NextResponse.json({ error: "You cannot fight yourself." }, { status: 400 });
  }

  await getOrCreatePilotState(attackerUserId, session.user.name);

  // Resolve target: by userId or callsign lookup
  let resolvedTargetUserId = parsed.data.targetUserId;
  if (!resolvedTargetUserId && parsed.data.targetCallsign) {
    const found = await findPilotByCallsign(prisma, parsed.data.targetCallsign);
    if (!found) return NextResponse.json({ error: "Pilot not found." }, { status: 404 });
    resolvedTargetUserId = found.userId;
  }
  if (!resolvedTargetUserId) return NextResponse.json({ error: "Target required." }, { status: 400 });
  if (resolvedTargetUserId === attackerUserId) return NextResponse.json({ error: "You cannot fight yourself." }, { status: 400 });
  const defenderUserId = resolvedTargetUserId;

  let outcome: BattleOutcome;
  try {
    outcome = await economyTx((tx) => runBattle(tx, attackerUserId, defenderUserId));
  } catch (error) {
    return economyErrorResponse(error);
  }

  const finalState = await prisma.pilotState.findUnique({
    where: { userId: attackerUserId },
    include: { inventory: true, missions: true },
  });

  return NextResponse.json({ outcome, state: finalState });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await loadPilotForPlay(session.user.id, session.user.name);

  // Fetch all other pilots as potential PVP targets (exclude self, newbies and
  // suspended accounts)
  const targets = await prisma.pilotState.findMany({
    where: {
      userId: { not: session.user.id },
      level: { gte: GAME_CONSTANTS.NEWBIE_PROTECTION_LEVEL },
      user: { suspended: false },
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
