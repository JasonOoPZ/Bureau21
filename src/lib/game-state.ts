import type { Mission } from "@prisma/client";
import { GAME_CONSTANTS, xpForLevel } from "@/lib/constants";
import { rollItemDrop } from "@/lib/item-data";
import { provisionPilot } from "@/lib/pilot-provision";
import { prisma } from "@/lib/prisma";

export { applyPassiveRegeneration } from "@/lib/vitals";

const PILOT_INCLUDE = { inventory: true, missions: true } as const;

/**
 * The user's pilot, created on first use. Creation goes through
 * `provisionPilot`, so a lazily created pilot claims its callsign exactly
 * like registration and OAuth sign-in do (it used to copy the display name
 * unchecked, which could duplicate an existing callsign).
 */
export async function getOrCreatePilotState(userId: string, displayName?: string | null) {
  const existing = await prisma.pilotState.findUnique({ where: { userId }, include: PILOT_INCLUDE });
  if (existing) return existing;

  await provisionPilot(userId, displayName);
  return prisma.pilotState.findUniqueOrThrow({ where: { userId }, include: PILOT_INCLUDE });
}

export function applyLevelProgression(xp: number, level: number) {
  let currentXp = xp;
  let currentLevel = level;
  let pointsEarned = 0;

  while (currentXp >= xpForLevel(currentLevel)) {
    currentXp -= xpForLevel(currentLevel);
    currentLevel += 1;
    pointsEarned += GAME_CONSTANTS.POINTS_PER_LEVEL;
  }

  return { xp: currentXp, level: currentLevel, pointsEarned };
}

export const COOLDOWN_SECONDS = 2;

export function checkCooldown(lastActionAt: Date, cooldownSec: number = COOLDOWN_SECONDS): boolean {
  const now = new Date();
  const elapsedSeconds = (now.getTime() - lastActionAt.getTime()) / 1000;
  return elapsedSeconds >= cooldownSec;
}

const MISSION_CONFIGS = [
  { title: "Mining Novice", description: "Mine 5 asteroids", action: "mine", count: 5, xp: 100, credits: 75 },
  { title: "Explorer", description: "Jump between 8 sectors", action: "jump", count: 8, xp: 150, credits: 120 },
  { title: "Patrol Duty", description: "Complete 10 patrols", action: "patrol", count: 10, xp: 200, credits: 160 },
];

/** The pilot action that advances a mission, or null for an unknown mission. */
export function missionAction(title: string): string | null {
  return MISSION_CONFIGS.find((config) => config.title === title)?.action ?? null;
}

function missingMissionConfigs(missions: Mission[]) {
  const titles = new Set(missions.map((mission) => mission.title));
  return MISSION_CONFIGS.filter((config) => !titles.has(config.title));
}

/**
 * Idempotent mission setup. `Mission` is unique on (pilotId, title), so the
 * insert simply skips rows that already exist: concurrent callers cannot
 * create a mission twice, and no lock or read-time dedupe is needed.
 */
export async function getOrCreateMissions(pilotId: string): Promise<Mission[]> {
  const existing = await prisma.mission.findMany({ where: { pilotId } });
  const missing = missingMissionConfigs(existing);
  if (missing.length === 0) return existing;

  await prisma.mission.createMany({
    data: missing.map((config) => ({
      pilotId,
      title: config.title,
      description: config.description,
      targetCount: config.count,
      rewardXp: config.xp,
      rewardCredits: config.credits,
    })),
    skipDuplicates: true,
  });

  return prisma.mission.findMany({ where: { pilotId } });
}

export async function tryDropItem(pilotId: string, action: string): Promise<{ name: string; type: string; tier: number } | null> {
  const template = rollItemDrop(action);
  if (!template) return null;

  // Cap inventory at 20 items — drop oldest if over limit
  const count = await prisma.inventoryItem.count({ where: { pilotId } });
  if (count >= 20) {
    const oldest = await prisma.inventoryItem.findFirst({
      where: { pilotId, equipped: false },
      orderBy: { createdAt: "asc" },
    });
    if (oldest) {
      await prisma.inventoryItem.delete({ where: { id: oldest.id } });
    }
  }

  const item = await prisma.inventoryItem.create({
    data: {
      pilotId,
      name: template.name,
      type: template.type,
      tier: template.tier,
      bonusType: template.bonusType,
      bonusAmt: template.bonusAmt,
    },
  });

  return { name: item.name, type: item.type, tier: item.tier };
}

export function applyEquipmentBonuses(
  inventory: { type: string; bonusType: string; bonusAmt: number; equipped: boolean }[],
  base: { credits: number; xp: number; hullDamage: number; fuelCost: number }
) {
  const equipped = inventory.filter((i) => i.equipped);
  let { credits, xp, hullDamage, fuelCost } = base;

  for (const item of equipped) {
    if (item.bonusType === "credits") credits = Math.round(credits * (1 + item.bonusAmt / 100));
    if (item.bonusType === "xp") xp = Math.round(xp * (1 + item.bonusAmt / 100));
    if (item.bonusType === "hull") hullDamage = Math.max(0, hullDamage - item.bonusAmt);
    if (item.bonusType === "fuel" && fuelCost > 0 && Math.random() < item.bonusAmt / 100) fuelCost = Math.max(0, fuelCost - 1);
  }

  return { credits, xp, hullDamage, fuelCost };
}
