import { authOptions } from "@/auth";
import {
  applyEquipmentBonuses,
  applyLevelProgression,
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
  let level = current.level;
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
    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: {
        lifeForce,
        herbs: { decrement: 1 },
        lastActionAt: new Date(),
      },
    });
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

  const progressed = applyLevelProgression(xp, level);
  xp = progressed.xp;
  level = progressed.level;

  // Try item drop
  const drop = await tryDropItem(current.id, action);
  if (drop) {
    const tierLabel = drop.tier === 3 ? "LEGENDARY" : drop.tier === 2 ? "RARE" : "Common";
    message += ` [LOOT: ${tierLabel} — ${drop.name}!]`;
  }

  // Persist pilot state update
  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      credits: Math.max(0, credits),
      fuel: Math.max(0, fuel),
      hull: Math.max(0, hull),
      lifeForce,
      xp,
      level,
      unspentPoints: { increment: progressed.pointsEarned },
      currentSector,
      kills,
      lastActionAt: new Date(),
      lastFuelRegen: regen.lastFuelRegen,
    },
  });

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
    await prisma.mission.update({
      where: { id: mission.id },
      data: { currentCount: newCount, completed: isCompleted },
    });
    if (isCompleted) {
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

  // Fetch final state with inventory and missions
  const finalState = await prisma.pilotState.findUnique({
    where: { userId: session.user.id },
    include: { missions: true, inventory: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json({ state: finalState, message });
}
