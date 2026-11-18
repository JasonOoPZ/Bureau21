import { authOptions } from "@/auth";
import { economyTx, guardedPilotUpdate, settleLevelProgression } from "@/lib/economy";
import {
  applyEquipmentBonuses,
  checkCooldown,
  COOLDOWN_SECONDS,
  getOrCreateMissions,
  getOrCreatePilotState,
  missionAction,
  tryDropItem,
} from "@/lib/game-state";
import { GAME_CONSTANTS } from "@/lib/constants";
import { syncVitals } from "@/lib/pilot-sync";
import { prisma } from "@/lib/prisma";
import { HULL_CAP, maxLifeForce } from "@/lib/vitals";
import type { Mission } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["scan", "mine", "patrol", "repair", "jump", "use_herb"]),
});

type Action = z.infer<typeof schema>["action"];

const RECHARGING_ERROR = "Recharging... try again in a moment.";
const REPAIR_COST = 20;
const REPAIR_HULL = 22;
const SECTORS = ["Fringe Expanse", "Void Corridor", "Meridian Rift", "Bastion Hub"];

const BASE_ACTIONS: Record<
  Exclude<Action, "repair" | "use_herb">,
  { credits: number; xp: number; hullDamage: number; fuelCost: number }
> = {
  scan: { credits: 8, xp: 12, hullDamage: 0, fuelCost: 0 },
  mine: { credits: 24, xp: 18, hullDamage: 0, fuelCost: 1 },
  patrol: { credits: 16, xp: 30, hullDamage: 6, fuelCost: 2 },
  jump: { credits: 35, xp: 42, hullDamage: 0, fuelCost: 3 },
};

function loadFinalState(userId: string) {
  return prisma.pilotState.findUnique({
    where: { userId },
    include: { missions: true, inventory: { orderBy: { createdAt: "desc" } } },
  });
}

/**
 * Advance one mission and, if that completes it, pay the reward. The progress
 * write is a compare-and-swap on (completed = false, currentCount), and the
 * payout shares its transaction, so a mission pays exactly once.
 */
async function progressMission(userId: string, mission: Mission): Promise<boolean> {
  const isCompleted = mission.currentCount + 1 >= mission.targetCount;

  return economyTx(async (tx) => {
    const progressed = await tx.mission.updateMany({
      where: { id: mission.id, completed: false, currentCount: mission.currentCount },
      data: { currentCount: { increment: 1 }, completed: isCompleted },
    });
    if (progressed.count !== 1 || !isCompleted) return false;

    await tx.pilotState.update({
      where: { userId },
      data: {
        xp: { increment: mission.rewardXp },
        credits: { increment: mission.rewardCredits },
      },
    });
    return true;
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const action = parsed.data.action;
  const loaded = await getOrCreatePilotState(userId, session.user.name);

  // Check cooldown
  if (!checkCooldown(loaded.lastActionAt, COOLDOWN_SECONDS)) {
    const remaining = Math.ceil(
      COOLDOWN_SECONDS - (new Date().getTime() - loaded.lastActionAt.getTime()) / 1000
    );
    return NextResponse.json(
      { error: `Recharging... ${remaining}s remaining.` },
      { status: 429 }
    );
  }

  // Passive regeneration is persisted (with its timer) before anything is
  // spent, so the checks below see current fuel / hull / Life Force.
  const current = await syncVitals(prisma, loaded);

  if (action === "use_herb") {
    if ((current.herbs ?? 0) < 1) {
      return NextResponse.json({ error: "No Blue Herbs in inventory." }, { status: 400 });
    }
    const maxLF = maxLifeForce(current);
    if (current.lifeForce >= maxLF) {
      return NextResponse.json({ error: "Life Force is already at maximum." }, { status: 400 });
    }
    const restored = Math.min(GAME_CONSTANTS.BLUE_HERB_REVIVE_LF, maxLF - current.lifeForce);
    // Compare-and-swap on lastActionAt claims the action slot; the herb check
    // is in the same WHERE clause so one herb is never used twice, and the
    // heal is an increment that may not overshoot the maximum.
    const used = await guardedPilotUpdate(
      prisma,
      userId,
      {
        lastActionAt: current.lastActionAt,
        herbs: { gte: 1 },
        lifeForce: { lte: maxLF - restored },
      },
      { lifeForce: { increment: restored }, herbs: { decrement: 1 }, lastActionAt: new Date() }
    );
    if (!used) {
      return NextResponse.json({ error: RECHARGING_ERROR }, { status: 429 });
    }
    return NextResponse.json({
      state: await loadFinalState(userId),
      message: `Blue Herb consumed. Life Force restored by ${restored}.`,
    });
  }

  // Everything this action earns or spends, as deltas against the fresh row.
  let creditsDelta = 0;
  let xpGain = 0;
  let fuelCost = 0;
  let hullDelta = 0;
  let currentSector = current.currentSector;
  let message = "";

  if (action === "repair") {
    if (current.credits < REPAIR_COST) {
      return NextResponse.json({ error: "Not enough credits." }, { status: 400 });
    }
    creditsDelta = -REPAIR_COST;
    hullDelta = Math.max(0, Math.min(HULL_CAP, current.hull + REPAIR_HULL) - current.hull);
    xpGain = 6;
    message = "Dockside repair complete: hull integrity restored.";
  } else {
    const base = BASE_ACTIONS[action];
    if (current.fuel < base.fuelCost) {
      return NextResponse.json({ error: "Not enough fuel." }, { status: 400 });
    }
    if (action === "jump") {
      const nextIndex = (SECTORS.indexOf(currentSector) + 1) % SECTORS.length;
      currentSector = SECTORS[nextIndex] ?? "Fringe Expanse";
    }

    const bonused = applyEquipmentBonuses(current.inventory, base);
    creditsDelta = bonused.credits;
    xpGain = bonused.xp;
    fuelCost = Math.min(current.fuel, bonused.fuelCost);
    hullDelta = Math.max(1, current.hull - bonused.hullDamage) - current.hull;

    if (action === "scan") message = `Long-range scan: +${bonused.credits} credits, +${bonused.xp} xp.`;
    else if (action === "mine") message = `Asteroid harvest: +${bonused.credits} credits, -${bonused.fuelCost} fuel.`;
    else if (action === "patrol") message = `Patrol run: +${bonused.credits} credits, hull took ${bonused.hullDamage} damage.`;
    else message = `Warp jump: arrived at ${currentSector}.`;
  }

  // Persist with a compare-and-swap on lastActionAt, which enforces the
  // cooldown atomically (N parallel actions => one applies). Every stat is a
  // delta, and each spend must still be covered at write time, so a battle or
  // expedition that lands between the read and this write is never overwritten.
  const applied = await guardedPilotUpdate(
    prisma,
    userId,
    {
      lastActionAt: current.lastActionAt,
      ...(creditsDelta < 0 ? { credits: { gte: -creditsDelta } } : {}),
      ...(fuelCost > 0 ? { fuel: { gte: fuelCost } } : {}),
      ...(hullDelta < 0 ? { hull: { gte: -hullDelta } } : {}),
    },
    {
      credits: { increment: creditsDelta },
      fuel: { decrement: fuelCost },
      hull: { increment: hullDelta },
      xp: { increment: xpGain },
      currentSector,
      kills: { increment: action === "patrol" ? 1 : 0 },
      lastActionAt: new Date(),
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

  // Track mission progress (one canonical mission per title)
  const missions = await getOrCreateMissions(current.id);
  for (const mission of missions) {
    if (mission.completed || missionAction(mission.title) !== action) continue;
    if (await progressMission(userId, mission)) {
      message += ` [MISSION COMPLETE: ${mission.title}! +${mission.rewardXp} XP, +${mission.rewardCredits} credits]`;
    }
  }

  // Convert banked XP (action + mission rewards) into levels and stat points.
  await settleLevelProgression(prisma, userId);

  const [finalState, finalMissions] = await Promise.all([
    loadFinalState(userId),
    getOrCreateMissions(current.id),
  ]);

  return NextResponse.json({ state: finalState, missions: finalMissions, message });
}
