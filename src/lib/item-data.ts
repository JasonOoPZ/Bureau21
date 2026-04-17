export type ItemType = "weapon" | "shield" | "engine" | "armor" | "special";
export type BonusType = "credits" | "hull" | "fuel" | "xp" | "access" | "atk" | "def";

export interface ItemTemplate {
  name: string;
  type: ItemType;
  tier: number;
  bonusType: BonusType;
  bonusAmt: number;
  dropActions: string[];
  dropWeight: number;
}

// bonusAmt for weapons/shields/engines are percentage boosts applied during actions
// credits bonus → multiplies credit gains by (1 + bonusAmt/100)
// xp bonus       → multiplies xp gains by (1 + bonusAmt/100)
// hull bonus      → reduces hull damage from patrol by bonusAmt (flat)
// fuel bonus      → reduces fuel cost of next action by 1 if bonusAmt >= 50 (50% chance)

export const ITEM_TEMPLATES: ItemTemplate[] = [
  // ──── Weapons (boost credit & xp gains) ────────────────────────────────────
  { name: "Pulse Repeater Mk I",     type: "weapon", tier: 1, bonusType: "credits", bonusAmt: 15, dropActions: ["patrol", "scan"],        dropWeight: 60 },
  { name: "Phase Cannon Mk II",      type: "weapon", tier: 2, bonusType: "credits", bonusAmt: 30, dropActions: ["patrol", "scan"],        dropWeight: 30 },
  { name: "Void Disruptor Mk III",   type: "weapon", tier: 3, bonusType: "credits", bonusAmt: 55, dropActions: ["patrol"],                dropWeight: 10 },
  { name: "Scatter Array Mk I",      type: "weapon", tier: 1, bonusType: "xp",      bonusAmt: 15, dropActions: ["patrol", "mine"],        dropWeight: 50 },
  { name: "Resonance Blade Mk II",   type: "weapon", tier: 2, bonusType: "xp",      bonusAmt: 30, dropActions: ["patrol"],                dropWeight: 30 },
  { name: "Singularity Edge Mk III", type: "weapon", tier: 3, bonusType: "xp",      bonusAmt: 60, dropActions: ["patrol", "jump"],        dropWeight: 10 },

  // ──── Shields (reduce hull damage, boost hull regen) ───────────────────────
  { name: "Ablative Plating Mk I",   type: "shield", tier: 1, bonusType: "hull",    bonusAmt: 2,  dropActions: ["patrol", "repair"],      dropWeight: 60 },
  { name: "Reactive Shell Mk II",    type: "shield", tier: 2, bonusType: "hull",    bonusAmt: 4,  dropActions: ["patrol"],                dropWeight: 30 },
  { name: "Void Aegis Mk III",       type: "shield", tier: 3, bonusType: "hull",    bonusAmt: 6,  dropActions: ["patrol", "jump"],        dropWeight: 10 },

  // ──── Engines (reduce fuel costs, boost jump range) ────────────────────────
  { name: "Ion Thruster Mk I",       type: "engine", tier: 1, bonusType: "fuel",    bonusAmt: 20, dropActions: ["mine", "jump"],          dropWeight: 60 },
  { name: "Plasma Drive Mk II",      type: "engine", tier: 2, bonusType: "fuel",    bonusAmt: 40, dropActions: ["jump"],                  dropWeight: 30 },
  { name: "Quantum Slipstream Mk III", type: "engine", tier: 3, bonusType: "fuel",  bonusAmt: 70, dropActions: ["jump"],                  dropWeight: 10 },
];

const DROP_CHANCES: Record<string, number> = {
  scan: 0.05,
  mine: 0.25,
  patrol: 0.30,
  repair: 0.00,
  jump: 0.20,
};

export function rollItemDrop(action: string): ItemTemplate | null {
  const chance = DROP_CHANCES[action] ?? 0;
  if (Math.random() > chance) return null;

  const eligible = ITEM_TEMPLATES.filter((t) => t.dropActions.includes(action));
  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce((acc, t) => acc + t.dropWeight, 0);
  let roll = Math.random() * totalWeight;

  for (const template of eligible) {
    roll -= template.dropWeight;
    if (roll <= 0) return template;
  }

  return eligible[eligible.length - 1];
}

export const TIER_LABELS: Record<number, string> = {
  1: "Common",
  2: "Rare",
  3: "Legendary",
  4: "Exclusive",
  5: "Mythic",
};

export const TYPE_LABELS: Record<ItemType, string> = {
  weapon: "Weapon",
  shield: "Shield",
  engine: "Engine",
  armor: "Armor",
  special: "Special",
};

// ── Special Items (non-droppable, granted by game events) ─────────────────
export const SPECIAL_ITEMS = {
  CENTURION_VENTURE_CARD: {
    name: "Centurion Venture Card",
    type: "special" as ItemType,
    tier: 4,
    bonusType: "access" as BonusType,
    bonusAmt: 0,
    description: "An exclusive black-and-gold membership card granting access to the Bureau Bank's private Wealth Management suite. Issued to select pilots of distinguished financial standing.",
  },
  GOD_CARD: {
    name: "God Card",
    type: "special" as ItemType,
    tier: 5,
    bonusType: "access" as BonusType,
    bonusAmt: 0,
    description: "A mythic obsidian card pulsing with unstable energy. Bypasses all level and stat requirements for equipment and grants unrestricted access to every sector and facility aboard the station.",
  },
};

import { prisma } from "@/lib/prisma";

export async function pilotHasGodCard(userId: string): Promise<boolean> {
  const card = await prisma.inventoryItem.findFirst({
    where: {
      pilot: { userId },
      name: SPECIAL_ITEMS.GOD_CARD.name,
      type: "special",
    },
    select: { id: true },
  });
  return !!card;
}
