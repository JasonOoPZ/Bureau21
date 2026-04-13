export type HeroBonusType =
  | "atk_pct"
  | "def_pct"
  | "speed_flat"
  | "lf_pct"
  | "confidence_flat"
  | "xp_pct";

export type HeroRarity = "common" | "rare" | "epic" | "legendary";

export interface HeroTemplate {
  slug: string;
  name: string;
  soul: string;
  hull: string;
  rarity: HeroRarity;
  description: string;
  bonusType: HeroBonusType;
  bonusBase: number;
  bonusPerLevel: number;
  icon: string;
}

/** Aggregated bonuses from all active heroes, applied during battle. */
export interface HeroBonuses {
  atkPct: number;
  defPct: number;
  speedFlat: number;
  maxLfPct: number;
  confidenceFlat: number;
  xpPct: number;
}

export const RARITY_WEIGHTS: Record<HeroRarity, number> = {
  legendary: 2,
  epic: 10,
  rare: 28,
  common: 60,
};

export const RARITY_DISPLAY: Record<
  HeroRarity,
  { label: string; color: string; border: string; badge: string }
> = {
  common:    { label: "Common",    color: "text-slate-300",  border: "border-slate-600",   badge: "bg-slate-700/80 text-slate-200" },
  rare:      { label: "Rare",      color: "text-cyan-300",   border: "border-cyan-700",    badge: "bg-cyan-900/60 text-cyan-200" },
  epic:      { label: "Epic",      color: "text-purple-300", border: "border-purple-700",  badge: "bg-purple-900/60 text-purple-200" },
  legendary: { label: "Legendary", color: "text-amber-300",  border: "border-amber-600",   badge: "bg-amber-900/60 text-amber-200" },
};

export const BONUS_LABELS: Record<HeroBonusType, string> = {
  atk_pct:          "ATK",
  def_pct:          "DEF",
  speed_flat:       "Speed",
  lf_pct:           "Life Force",
  confidence_flat:  "Confidence",
  xp_pct:           "XP Gain",
};

export const PACK_FREE_COOLDOWN_HOURS = 24;
export const PACK_CREDIT_COST = 300;
export const HERO_MAX_ACTIVE = 3;
export const HERO_MAX_ROSTER = 15;
export const HERO_MAX_LEVEL = 20;

export function heroXpForLevel(level: number): number {
  return level * 100;
}

export function heroEffectiveBonus(template: HeroTemplate, heroLevel: number): number {
  return template.bonusBase + (heroLevel - 1) * template.bonusPerLevel;
}

export function heroBonusDisplay(template: HeroTemplate, heroLevel: number): string {
  const val = heroEffectiveBonus(template, heroLevel);
  const label = BONUS_LABELS[template.bonusType];
  if (template.bonusType === "speed_flat") return `+${val.toFixed(1)} ${label}`;
  if (template.bonusType === "confidence_flat") return `+${val.toFixed(0)} ${label}`;
  return `+${val.toFixed(1)}% ${label}`;
}

export function applyHeroXpProgression(
  xp: number,
  level: number
): { xp: number; level: number } {
  let currentXp = xp;
  let currentLevel = level;
  while (currentLevel < HERO_MAX_LEVEL && currentXp >= heroXpForLevel(currentLevel)) {
    currentXp -= heroXpForLevel(currentLevel);
    currentLevel++;
  }
  if (currentLevel >= HERO_MAX_LEVEL) {
    currentXp = Math.min(currentXp, heroXpForLevel(HERO_MAX_LEVEL) - 1);
  }
  return { xp: currentXp, level: currentLevel };
}

export function computeHeroBonuses(
  activeHeroes: { heroSlug: string; level: number }[]
): HeroBonuses {
  const result: HeroBonuses = {
    atkPct: 0,
    defPct: 0,
    speedFlat: 0,
    maxLfPct: 0,
    confidenceFlat: 0,
    xpPct: 0,
  };
  for (const hero of activeHeroes) {
    const template = HERO_TEMPLATES.find((t) => t.slug === hero.heroSlug);
    if (!template) continue;
    const bonus = heroEffectiveBonus(template, hero.level);
    switch (template.bonusType) {
      case "atk_pct":         result.atkPct         += bonus; break;
      case "def_pct":         result.defPct         += bonus; break;
      case "speed_flat":      result.speedFlat      += bonus; break;
      case "lf_pct":          result.maxLfPct       += bonus; break;
      case "confidence_flat": result.confidenceFlat += bonus; break;
      case "xp_pct":          result.xpPct          += bonus; break;
    }
  }
  return result;
}

/** Roll a random hero from the pack pool. */
export function rollHeroPack(): HeroTemplate {
  const roll = Math.random() * 100;
  let rarity: HeroRarity;
  if (roll < RARITY_WEIGHTS.legendary) {
    rarity = "legendary";
  } else if (roll < RARITY_WEIGHTS.legendary + RARITY_WEIGHTS.epic) {
    rarity = "epic";
  } else if (roll < RARITY_WEIGHTS.legendary + RARITY_WEIGHTS.epic + RARITY_WEIGHTS.rare) {
    rarity = "rare";
  } else {
    rarity = "common";
  }
  const pool = HERO_TEMPLATES.filter((h) => h.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO ROSTER — 20 heroes across 4 rarities
// ─────────────────────────────────────────────────────────────────────────────
export const HERO_TEMPLATES: HeroTemplate[] = [
  // ── COMMON (8) ────────────────────────────────────────────────────────────
  {
    slug: "patrol-unit",
    name: "Patrol Unit",
    soul: "Patrol-7",
    hull: "Scout Frame",
    rarity: "common",
    description: "A repurposed surveillance unit providing forward combat support.",
    bonusType: "atk_pct",
    bonusBase: 2,
    bonusPerLevel: 0.2,
    icon: "🤖",
  },
  {
    slug: "iron-shell",
    name: "Iron Shell",
    soul: "Block-5",
    hull: "Tank Frame",
    rarity: "common",
    description: "A heavy armour chassis that absorbs damage destined for the pilot.",
    bonusType: "def_pct",
    bonusBase: 2,
    bonusPerLevel: 0.2,
    icon: "🛡️",
  },
  {
    slug: "power-node",
    name: "Power Node",
    soul: "Zap-2",
    hull: "Energy Frame",
    rarity: "common",
    description: "Electrical surge generator sharpening pilot reaction speed.",
    bonusType: "speed_flat",
    bonusBase: 0.4,
    bonusPerLevel: 0.04,
    icon: "⚡",
  },
  {
    slug: "relay-drone",
    name: "Relay Drone",
    soul: "Relay-12",
    hull: "Scout Frame",
    rarity: "common",
    description: "Broadcasts confidence signals synced to pilot neural patterns.",
    bonusType: "confidence_flat",
    bonusBase: 2,
    bonusPerLevel: 0.2,
    icon: "📡",
  },
  {
    slug: "data-miner",
    name: "Data Miner",
    soul: "Info-9",
    hull: "Processor Frame",
    rarity: "common",
    description: "Analytics unit maximising XP yield from every engagement.",
    bonusType: "xp_pct",
    bonusBase: 5,
    bonusPerLevel: 0.5,
    icon: "💾",
  },
  {
    slug: "scrapper",
    name: "Scrapper",
    soul: "Craft-3",
    hull: "Work Frame",
    rarity: "common",
    description: "Field-repair unit reinforcing pilot defensive systems mid-fight.",
    bonusType: "def_pct",
    bonusBase: 1.5,
    bonusPerLevel: 0.15,
    icon: "🔧",
  },
  {
    slug: "shockwave-unit",
    name: "Shockwave Unit",
    soul: "Shock-8",
    hull: "Assault Frame",
    rarity: "common",
    description: "Delivers electromagnetic pulses that amplify offensive output.",
    bonusType: "atk_pct",
    bonusBase: 1.5,
    bonusPerLevel: 0.15,
    icon: "💥",
  },
  {
    slug: "vanguard-mk1",
    name: "Vanguard Mk I",
    soul: "Vanguard-1",
    hull: "Infantry Frame",
    rarity: "common",
    description: "Standard frontline unit bolstering pilot Life Force reserves.",
    bonusType: "lf_pct",
    bonusBase: 3,
    bonusPerLevel: 0.3,
    icon: "⚔️",
  },
  // ── RARE (5) ──────────────────────────────────────────────────────────────
  {
    slug: "void-scout",
    name: "Void Scout",
    soul: "Shadow-14",
    hull: "Stealth Frame",
    rarity: "rare",
    description: "Cloaked recon unit granting near-precognitive reaction speed.",
    bonusType: "speed_flat",
    bonusBase: 1.0,
    bonusPerLevel: 0.1,
    icon: "🌑",
  },
  {
    slug: "steel-guardian",
    name: "Steel Guardian",
    soul: "Aegis-7",
    hull: "Guardian Frame",
    rarity: "rare",
    description: "Regenerating armour shell providing sustained defensive coverage.",
    bonusType: "def_pct",
    bonusBase: 5,
    bonusPerLevel: 0.5,
    icon: "🛡",
  },
  {
    slug: "plasma-striker",
    name: "Plasma Striker",
    soul: "Blaze-22",
    hull: "Combat Frame",
    rarity: "rare",
    description: "Plasma-infused unit amplifying attack power across all engagements.",
    bonusType: "atk_pct",
    bonusBase: 4,
    bonusPerLevel: 0.4,
    icon: "🔥",
  },
  {
    slug: "surge-capacitor",
    name: "Surge Capacitor",
    soul: "Arc-17",
    hull: "Energy Frame",
    rarity: "rare",
    description: "High-voltage unit transmitting confidence energy to the pilot.",
    bonusType: "confidence_flat",
    bonusBase: 5,
    bonusPerLevel: 0.5,
    icon: "⚡",
  },
  {
    slug: "delta-tank",
    name: "Delta Tank",
    soul: "Delta-9",
    hull: "Delta Frame",
    rarity: "rare",
    description: "Armoured unit specialised in Life Force fortification protocols.",
    bonusType: "lf_pct",
    bonusBase: 6,
    bonusPerLevel: 0.6,
    icon: "🔵",
  },
  // ── EPIC (4) ──────────────────────────────────────────────────────────────
  {
    slug: "voidborn-echo",
    name: "Voidborn Echo",
    soul: "Echo-00",
    hull: "Phantom Frame",
    rarity: "epic",
    description: "An echo-class AI from a destroyed warship — aggressive and relentless.",
    bonusType: "atk_pct",
    bonusBase: 8,
    bonusPerLevel: 0.8,
    icon: "👻",
  },
  {
    slug: "quantum-shield",
    name: "Quantum Shield",
    soul: "Bastion-X",
    hull: "Fortress Frame",
    rarity: "epic",
    description: "Phase-shifting matrix that deflects and mirrors incoming damage.",
    bonusType: "def_pct",
    bonusBase: 10,
    bonusPerLevel: 1.0,
    icon: "🔷",
  },
  {
    slug: "inferno-core",
    name: "Inferno Core",
    soul: "Pyro-Delta",
    hull: "Assault Frame",
    rarity: "epic",
    description: "Plasma-core assault unit that burns through enemy armour on impact.",
    bonusType: "atk_pct",
    bonusBase: 7,
    bonusPerLevel: 0.7,
    icon: "🌋",
  },
  {
    slug: "ghost-protocol",
    name: "Ghost Protocol",
    soul: "Specter-9",
    hull: "Stealth Frame",
    rarity: "epic",
    description: "Phase-masked unit granting the pilot near-invisible reaction speed.",
    bonusType: "speed_flat",
    bonusBase: 2.5,
    bonusPerLevel: 0.25,
    icon: "🕶️",
  },
  // ── LEGENDARY (3) ─────────────────────────────────────────────────────────
  {
    slug: "apex-titan",
    name: "Apex Titan",
    soul: "Titan-Alpha",
    hull: "Supreme Frame",
    rarity: "legendary",
    description: "An ancient war machine awakened from deep-space. Supremely powerful.",
    bonusType: "atk_pct",
    bonusBase: 15,
    bonusPerLevel: 1.5,
    icon: "🔱",
  },
  {
    slug: "null-sovereign",
    name: "Null Sovereign",
    soul: "Sovereign-Null",
    hull: "Void Frame",
    rarity: "legendary",
    description: "A sovereign-class entity that rewrites the rules of damage and defence.",
    bonusType: "def_pct",
    bonusBase: 15,
    bonusPerLevel: 1.5,
    icon: "🌌",
  },
  {
    slug: "the-architect",
    name: "The Architect",
    soul: "Origin-1",
    hull: "Master Frame",
    rarity: "legendary",
    description: "The original AI designer of Bureau 21's combat systems. A living legend.",
    bonusType: "confidence_flat",
    bonusBase: 15,
    bonusPerLevel: 1.5,
    icon: "🏛️",
  },
];
