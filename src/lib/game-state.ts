import { defaultStarterCharacter } from "@/lib/starter-characters";
import { rollItemDrop } from "@/lib/item-data";
import { prisma } from "@/lib/prisma";

export async function getOrCreatePilotState(userId: string, displayName?: string | null) {
  const callsign = (displayName?.trim() || "Rookie Pilot").slice(0, 24);

  return prisma.pilotState.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      callsign,
      characterSlug: defaultStarterCharacter,
      appearanceNeedsSetup: true,
    },
    include: { inventory: true, missions: true },
  });
}

export function applyLevelProgression(xp: number, level: number) {
  let currentXp = xp;
  let currentLevel = level;

  while (currentXp >= currentLevel * 100) {
    currentXp -= currentLevel * 100;
    currentLevel += 1;
  }

  return { xp: currentXp, level: currentLevel };
}

export function applyPassiveRegeneration(state: {
  fuel: number;
  hull: number;
  lifeForce: number;
  level: number;
  lastFuelRegen: Date;
}) {
  let fuel = state.fuel;
  let hull = state.hull;
  let lifeForce = state.lifeForce;

  const now = new Date();
  const secondsElapsed = (now.getTime() - state.lastFuelRegen.getTime()) / 1000;

  // Regenerate 1 fuel every 30 seconds, max 10
  const fuelGain = Math.floor(secondsElapsed / 30);
  fuel = Math.min(10, fuel + fuelGain);

  // Regenerate 1 hull every 60 seconds, max 100
  const hullGain = Math.floor(secondsElapsed / 60);
  hull = Math.min(100, hull + hullGain);

  // Regenerate 1 Life Force every 2 minutes, capped at level * 5 (min 15)
  const maxLF = Math.max(15, state.level * 5);
  const lfGain = Math.floor(secondsElapsed / 120);
  lifeForce = Math.min(maxLF, lifeForce + lfGain);

  const hasRegen = fuelGain > 0 || hullGain > 0 || lfGain > 0;

  return {
    fuel,
    hull,
    lifeForce,
    lastFuelRegen: hasRegen ? now : state.lastFuelRegen,
  };
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

export async function getOrCreateMissions(pilotId: string) {
  const existingMissions = await prisma.mission.findMany({
    where: { pilotId },
  });

  if (existingMissions.length >= 3) {
    return existingMissions;
  }

  const newMissions = await Promise.all(
    MISSION_CONFIGS.slice(existingMissions.length).map((config) =>
      prisma.mission.create({
        data: {
          pilotId,
          title: config.title,
          description: config.description,
          targetCount: config.count,
          rewardXp: config.xp,
          rewardCredits: config.credits,
        },
      })
    )
  );

  return [...existingMissions, ...newMissions];
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
