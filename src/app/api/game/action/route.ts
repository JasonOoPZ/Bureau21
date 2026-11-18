import { authOptions } from "@/auth";
import { guardedPilotUpdate, settleLevelProgression } from "@/lib/economy";
import {
  applyEquipmentBonuses,
  applyPassiveRegeneration,
  checkCooldown,
  COOLDOWN_SECONDS,
  getOrCreateMissions,
  getOrCreatePilotState,
  tryDropItem,
} from "@/lib/game-state";
import { GAME_CONSTANTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["scan", "mine", "patrol", "repair", "jump", "use_herb"]),
});

const RECHARGING_ERROR = "Recharging... try again in a moment.";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const action = parsed.data.action;
  const current = await getOrCreatePilotState(session.user.id, session.user.name);

  // Check cooldown
  if (!checkCooldown(current.lastActionAt, COOLDOWN_SECONDS)) {
    const remaining = Math.ceil(
      COOLDOWN_SECONDS - (new Date().getTime() - current.lastActionAt.getTime()) / 1000
    );
    return NextResponse.json(
      { error: `Recharging... ${remaining}s remaining.` },
      { status: 429 }
    );
  }

  // Apply passive regeneration
  const regen = applyPassiveRegeneration({
    fuel: current.fuel,
    hull: current.hull,
    lifeForce: current.lifeForce,
    level: current.level,
    lastFuelRegen: current.lastFuelRegen,
  });

  let credits = current.credits;
  let fuel = regen.fuel;
  let hull = regen.hull;
  let lifeForce = regen.lifeForce;
  let xp = current.xp;
  let currentSector = current.currentSector;
  let kills = current.kills;
  let message = "";

  // Base deltas before equipment bonuses
  let baseCredits = 0;
  let baseXp = 0;
  let baseHullDamage = 0;
  let baseFuelCost = 0;

  if (action === "scan") {
    baseCredits = 8;
    baseXp = 12;
  } else if (action === "mine") {
    if (fuel < 1) return NextResponse.json({ error: "Not enough fuel." }, { status: 400 });
    baseFuelCost = 1;
    baseCredits = 24;
    baseXp = 18;
  } else if (action === "patrol") {
    if (fuel < 2) return NextResponse.json({ error: "Not enough fuel." }, { status: 400 });
    baseFuelCost = 2;
    baseCredits = 16;
    baseXp = 30;
    baseHullDamage = 6;
    kills += 1;
  } else if (action === "repair") {
    if (credits < 20) return NextResponse.json({ error: "Not enough credits." }, { status: 400 });
    credits -= 20;
    hull = Math.min(100, hull + 22);
    baseXp = 6;
    message = "Dockside repair complete: hull integrity restored.";
  } else if (action === "jump") {
    if (fuel < 3) return NextResponse.json({ error: "Not enough fuel." }, { status: 400 });
    const sectors = ["Fringe Expanse", "Void Corridor", "Meridian Rift", "Bastion Hub"];
    const nextIndex = (sectors.indexOf(currentSector) + 1) % sectors.length;
    baseFuelCost = 3;
    baseCredits = 35;
    baseXp = 42;
    currentSector = sectors[nextIndex] ?? "Fringe Expanse";
  } else if (action === "use_herb") {
    if ((current.herbs ?? 0) < 1) {
      return NextResponse.json({ error: "No Blue Herbs in inventory." }, { status: 400 });
    }
    const maxLF = Math.max(GAME_CONSTANTS.STARTING_LIFE_FORCE, current.level * 5);
    if (lifeForce >= maxLF) {
      return NextResponse.json({ error: "Life Force is already at maximum." }, { status: 400 });
    }
    const restored = Math.min(GAME_CONSTANTS.BLUE_HERB_REVIVE_LF, maxLF - lifeForce);
    lifeForce = Math.min(maxLF, lifeForce + GAME_CONSTANTS.BLUE_HERB_REVIVE_LF);
    // Compare-and-swap on lastActionAt claims the action slot; the herb
    // check is in the same WHERE clause so one herb is never used twice.
    const used = await guardedPilotUpdate(
      prisma,
      session.user.id,
      { lastActionAt: current.lastActionAt, herbs: { gte: 1 } },
      { lifeForce, herbs: { decrement: 1 }, lastActionAt: new Date() }
    );
    if (!used) {
      return NextResponse.json({ error: RECHARGING_ERROR }, { status: 429 });
    }
    const finalState = await prisma.pilotState.findUnique({
      where: { userId: session.user.id },
      include: { missions: true, inventory: { orderBy: { createdAt: "desc" } } },
    });
    return NextResponse.json({
      state: finalState,
      message: `Blue Herb consumed. Life Force restored by ${restored}.`,
    });
  }

  // Apply equipment bonuses to all non-repair actions
  if (action !== "repair") {
    const bonused = applyEquipmentBonuses(current.inventory, {
      credits: baseCredits,
      xp: baseXp,
      hullDamage: baseHullDamage,
      fuelCost: baseFuelCost,
    });
    fuel = Math.max(0, fuel - bonused.fuelCost);
    credits += bonused.credits;
    xp += bonused.xp;
    hull = Math.max(1, hull - bonused.hullDamage);

    if (action === "scan") message = `Long-range scan: +${bonused.credits} credits, +${bonused.xp} xp.`;
    else if (action === "mine") message = `Asteroid harvest: +${bonused.credits} credits, -${bonused.fuelCost} fuel.`;
    else if (action === "patrol") message = `Patrol run: +${bonused.credits} credits, hull took ${bonused.hullDamage} damage.`;
    else if (action === "jump") message = `Warp jump: arrived at ${currentSector}.`;
  } else {
    xp += baseXp;
  }

  // Everything this action earned or spent, as deltas against the row we read.
  const creditsDelta = credits - current.credits;
  const xpGain = xp - current.xp;
  const killsGain = kills - current.kills;

  // Persist with a compare-and-swap on lastActionAt. That one guard both
  // enforces the cooldown atomically (N parallel actions => one applies) and
  // proves no other action ran since our read, so the regen-derived fuel/hull
  // values are still valid. Credits, XP and kills are applied as deltas and a
  // spend (repair) must still be covered at write time.
  const applied = await guardedPilotUpdate(
    prisma,
    session.user.id,
    {
      lastActionAt: current.lastActionAt,
      ...(creditsDelta < 0 ? { credits: { gte: -creditsDelta } } : {}),
    },
    {
      credits: { increment: creditsDelta },
      fuel: Math.max(0, fuel),
      hull: Math.max(0, hull),
      lifeForce,
      xp: { increment: xpGain },
      currentSector,
      kills: { increment: killsGain },
      lastActionAt: new Date(),
      lastFuelRegen: regen.lastFuelRegen,
    }
  );
  if (!applied) {
    return NextResponse.json({ error: RECHARGING_ERROR }, { status: 429 });
  }

  // Try item drop (only for the request that actually claimed the action)
  const drop = await tryDropItem(current.id, action);
  if (drop) {
    const tierLabel = drop.tier === 3 ? "LEGENDARY" : drop.tier === 2 ? "RARE" : "Common";
    message += ` [LOOT: ${tierLabel} — ${drop.name}!]`;
  }

  // Track mission progress
  const missions = await getOrCreateMissions(current.id);
  const activeMissions = missions.filter((m) => !m.completed).filter((m) => {
    if (m.title === "Mining Novice") return action === "mine";
    if (m.title === "Explorer") return action === "jump";
    if (m.title === "Patrol Duty") return action === "patrol";
    return false;
  });

  for (const mission of activeMissions) {
    const newCount = mission.currentCount + 1;
    const isCompleted = newCount >= mission.targetCount;
    // Guarded on completed=false so a mission reward is paid at most once.
    const progressedMission = await prisma.mission.updateMany({
      where: { id: mission.id, completed: false },
      data: { currentCount: { increment: 1 }, completed: isCompleted },
    });
    if (isCompleted && progressedMission.count === 1) {
      message += ` [MISSION COMPLETE: ${mission.title}! +${mission.rewardXp} XP, +${mission.rewardCredits} credits]`;
      await prisma.pilotState.update({
        where: { userId: session.user.id },
        data: {
          xp: { increment: mission.rewardXp },
          credits: { increment: mission.rewardCredits },
        },
      });
    }
  }

  // Convert banked XP (action + mission rewards) into levels and stat points.
  await settleLevelProgression(prisma, session.user.id);

  // Fetch final state with inventory and missions
  const finalState = await prisma.pilotState.findUnique({
    where: { userId: session.user.id },
    include: { missions: true, inventory: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json({ state: finalState, message });
}
