/**
 * HYDROPONICS BAY — Master Configuration
 * =========================================
 * ALL tunable balance numbers live here.
 * Change any value and the game rebalances automatically.
 */

/* ─── Properties ──────────────────────────────────────────────────── */

export interface PropertyDef {
  id: string;
  name: string;
  tier: number;
  cost: number;
  plotCount: number;
  type: "indoor" | "outdoor" | "mixed";
  growthBonus: number;   // e.g. 0.05 = +5%
  qualityBonus: number;  // e.g. 0.10 = +10%
  unlockTier: number;    // must own property at this tier first (0 = none)
  flavor: string;
}

export const PROPERTIES: PropertyDef[] = [
  { id: "p1",  name: "Starter Hydroponics Bay",  tier: 1,  cost: 0,          plotCount: 3,  type: "indoor",  growthBonus: 0,    qualityBonus: 0,    unlockTier: 0,  flavor: "Where every empire begins." },
  { id: "p2",  name: "Abandoned Greenhouse",      tier: 2,  cost: 500,        plotCount: 4,  type: "outdoor", growthBonus: 0.05, qualityBonus: 0,    unlockTier: 1,  flavor: "A forgotten glass house behind the station." },
  { id: "p3",  name: "Rooftop Garden",             tier: 3,  cost: 1500,       plotCount: 4,  type: "outdoor", growthBonus: 0.05, qualityBonus: 0.05, unlockTier: 2,  flavor: "Sunlight is free." },
  { id: "p4",  name: "Basement Grow Room",         tier: 4,  cost: 4000,       plotCount: 5,  type: "indoor",  growthBonus: 0.10, qualityBonus: 0.05, unlockTier: 3,  flavor: "Discreet. Climate-controlled." },
  { id: "p5",  name: "Subleased Warehouse",        tier: 5,  cost: 10000,      plotCount: 6,  type: "mixed",   growthBonus: 0.10, qualityBonus: 0.10, unlockTier: 4,  flavor: "Industrial scale, industrial problems." },
  { id: "p6",  name: "Riverside Farmstead",        tier: 6,  cost: 25000,      plotCount: 8,  type: "outdoor", growthBonus: 0.15, qualityBonus: 0.10, unlockTier: 5,  flavor: "Rich soil, rare peace." },
  { id: "p7",  name: "Converted Bunker",           tier: 7,  cost: 60000,      plotCount: 8,  type: "indoor",  growthBonus: 0.15, qualityBonus: 0.15, unlockTier: 6,  flavor: "Nothing grows like things grown in secret." },
  { id: "p8",  name: "Terraced Vineyard",          tier: 8,  cost: 140000,     plotCount: 10, type: "outdoor", growthBonus: 0.20, qualityBonus: 0.15, unlockTier: 7,  flavor: "A gentleman's operation." },
  { id: "p9",  name: "Climate Dome Alpha",         tier: 9,  cost: 320000,     plotCount: 12, type: "indoor",  growthBonus: 0.25, qualityBonus: 0.20, unlockTier: 8,  flavor: "Weather, solved." },
  { id: "p10", name: "Private Island Plots",       tier: 10, cost: 700000,     plotCount: 14, type: "outdoor", growthBonus: 0.25, qualityBonus: 0.25, unlockTier: 9,  flavor: "No neighbors. No laws." },
  { id: "p11", name: "Orbital Ag-Pod",             tier: 11, cost: 1500000,    plotCount: 16, type: "indoor",  growthBonus: 0.30, qualityBonus: 0.30, unlockTier: 10, flavor: "Zero-g does something to the roots." },
  { id: "p12", name: "Black Site Greenhouse",      tier: 12, cost: 3200000,    plotCount: 18, type: "mixed",   growthBonus: 0.35, qualityBonus: 0.35, unlockTier: 11, flavor: "It was never here." },
  { id: "p13", name: "Ancient Temple Gardens",     tier: 13, cost: 7000000,    plotCount: 20, type: "outdoor", growthBonus: 0.40, qualityBonus: 0.40, unlockTier: 12, flavor: "The old ones grew things too." },
  { id: "p14", name: "Mega-Tower Vertical Farm",   tier: 14, cost: 15000000,   plotCount: 24, type: "indoor",  growthBonus: 0.45, qualityBonus: 0.45, unlockTier: 13, flavor: "60 floors of pure production." },
  { id: "p15", name: "Bureau 21 Secret Biome",     tier: 15, cost: 35000000,   plotCount: 30, type: "mixed",   growthBonus: 0.60, qualityBonus: 0.60, unlockTier: 14, flavor: "The reason they recruited you." },
];

/* ─── Crops ────────────────────────────────────────────────────────── */

export interface CropDef {
  id: string;
  name: string;
  icon: string;
  seedCost: number;
  baseGrowthMinutes: number;
  baseYield: number;
  basePrice: number;
  volatility: number;   // e.g. 0.15 = ±15%
  prefers: "indoor" | "outdoor" | "either";
  unlockTier: number;
}

export const CROPS: CropDef[] = [
  { id: "marijuana",        name: "Marijuana",        icon: "🌿", seedCost: 20,   baseGrowthMinutes: 10,  baseYield: 10, basePrice: 8,    volatility: 0.15, prefers: "either",  unlockTier: 1 },
  { id: "magic_mushrooms",  name: "Magic Mushrooms",  icon: "🍄", seedCost: 60,   baseGrowthMinutes: 25,  baseYield: 8,  basePrice: 25,   volatility: 0.25, prefers: "indoor",  unlockTier: 2 },
  { id: "salvia",           name: "Salvia",           icon: "🌾", seedCost: 100,  baseGrowthMinutes: 40,  baseYield: 6,  basePrice: 55,   volatility: 0.25, prefers: "outdoor", unlockTier: 4 },
  { id: "peyote",           name: "Peyote",           icon: "🌵", seedCost: 250,  baseGrowthMinutes: 90,  baseYield: 5,  basePrice: 180,  volatility: 0.35, prefers: "outdoor", unlockTier: 6 },
  { id: "coca",             name: "Coca Plant",       icon: "🍃", seedCost: 500,  baseGrowthMinutes: 180, baseYield: 12, basePrice: 220,  volatility: 0.35, prefers: "outdoor", unlockTier: 8 },
  { id: "poppy",            name: "Poppy",            icon: "🌺", seedCost: 800,  baseGrowthMinutes: 240, baseYield: 10, basePrice: 400,  volatility: 0.50, prefers: "either",  unlockTier: 10 },
  { id: "ayahuasca",        name: "Ayahuasca",        icon: "🧬", seedCost: 2000, baseGrowthMinutes: 360, baseYield: 4,  basePrice: 1800, volatility: 0.70, prefers: "indoor",  unlockTier: 12 },
];

/* ─── Quality Tiers ───────────────────────────────────────────────── */

export interface QualityDef {
  tier: number;
  name: string;
  baseChance: number;  // percentage (sums to 100)
  priceMultiplier: number;
  color: string;       // Tailwind text color
}

export const QUALITY_TIERS: QualityDef[] = [
  { tier: 1, name: "Schwag",     baseChance: 50, priceMultiplier: 0.7, color: "text-slate-400" },
  { tier: 2, name: "Standard",   baseChance: 30, priceMultiplier: 1.0, color: "text-white" },
  { tier: 3, name: "Premium",    baseChance: 15, priceMultiplier: 1.5, color: "text-emerald-400" },
  { tier: 4, name: "Boutique",   baseChance: 4,  priceMultiplier: 2.5, color: "text-purple-400" },
  { tier: 5, name: "Legendary",  baseChance: 1,  priceMultiplier: 5.0, color: "text-amber-400" },
];

/* ─── Plot Type Modifiers ─────────────────────────────────────────── */

export const PLOT_TYPE_MODS = {
  indoor: {
    growthMult: 0.85,          // –15% growth time
    yieldMult: 1.0,
    eventRiskMult: 0.5,        // –50% event risk
    premiumQualityBonus: 0.10, // +10% quality on premium crops
    commonQualityBonus: 0,
    seedCostMult: 1.15,        // +15% seed cost
  },
  outdoor: {
    growthMult: 1.20,          // +20% growth time
    yieldMult: 1.25,           // +25% yield
    eventRiskMult: 2.0,        // +100% event risk
    premiumQualityBonus: 0,
    commonQualityBonus: 0.10,  // +10% quality on common crops
    seedCostMult: 1.0,
  },
} as const;

/** Which crops count as "premium" for indoor bonus */
export const PREMIUM_CROPS = new Set(["coca", "peyote", "ayahuasca"]);
/** Which crops count as "common" for outdoor bonus */
export const COMMON_CROPS = new Set(["marijuana", "magic_mushrooms", "salvia"]);

/* ─── Seasons (rotate every 6 real hours) ─────────────────────────── */

export interface SeasonDef {
  id: string;
  name: string;
  icon: string;
  growthMult: number;  // applied to outdoor plots
  yieldMult: number;   // applied to outdoor plots
}

export const SEASONS: SeasonDef[] = [
  { id: "spring", name: "Spring", icon: "🌸", growthMult: 0.90, yieldMult: 1.10 },
  { id: "summer", name: "Summer", icon: "☀️",  growthMult: 0.80, yieldMult: 1.20 },
  { id: "autumn", name: "Autumn", icon: "🍂", growthMult: 1.10, yieldMult: 0.90 },
  { id: "winter", name: "Winter", icon: "❄️",  growthMult: 1.20, yieldMult: 0.80 },
];

export const SEASON_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

/* ─── Staff ───────────────────────────────────────────────────────── */

export type StaffRole = "gardener" | "harvester" | "botanist" | "security";

export interface StaffRoleDef {
  role: StaffRole;
  label: string;
  description: string;
  baseWagePerHour: number;
  icon: string;
}

export const STAFF_ROLES: StaffRoleDef[] = [
  { role: "gardener",  label: "Gardener",  description: "Auto-replants plots after harvest",         baseWagePerHour: 5,  icon: "🧑‍🌾" },
  { role: "harvester", label: "Harvester", description: "Auto-harvests ready plots",                 baseWagePerHour: 10, icon: "⛏️" },
  { role: "botanist",  label: "Botanist",  description: "Boosts quality tier rolls on assigned property", baseWagePerHour: 20, icon: "🔬" },
  { role: "security",  label: "Security",  description: "Reduces random event risk on assigned property", baseWagePerHour: 20, icon: "🛡️" },
];

export const STAFF_UNLOCK_TIER = 3;  // Must own a tier-3 property to hire
export const STAFF_HIRE_COST_BASE = 200;
export const STAFF_HIRE_COST_PER_SKILL = 100;
export const STAFF_MAX_SKILL = 10;

/** First names & last names for procedural generation */
export const STAFF_FIRST_NAMES = [
  "Jax", "Kira", "Dex", "Nova", "Rhea", "Cole", "Vex", "Zara", "Finn", "Lyra",
  "Kai", "Sable", "Orion", "Tess", "Rafe", "Ember", "Dorian", "Ivy", "Sol", "Pike",
];
export const STAFF_LAST_NAMES = [
  "Voss", "Chen", "Ortiz", "Drake", "Nyx", "Kapoor", "Frost", "Tanaka", "Reyes", "Wolfe",
  "Cruz", "Strand", "Okafor", "Petrov", "Vasquez", "Kim", "Santos", "Nkosi", "Burke", "Aoki",
];

/* ─── Random Events ───────────────────────────────────────────────── */

export interface EventDef {
  id: string;
  name: string;
  description: string;
  type: "positive" | "negative";
  icon: string;
  outdoorOnly?: boolean;
  indoorOnly?: boolean;
}

export const EVENTS: EventDef[] = [
  { id: "drought",          name: "Drought",             description: "Outdoor yields halved this cycle.",                type: "negative", icon: "🏜️", outdoorOnly: true },
  { id: "pest",             name: "Pest Infestation",    description: "1–3 plots' growth destroyed.",                     type: "negative", icon: "🐛" },
  { id: "power_surge",      name: "Power Surge",         description: "Indoor growth delayed by 50% this cycle.",         type: "negative", icon: "⚡", indoorOnly: true },
  { id: "inspection",       name: "Bureau Inspection",   description: "Small credit fine. No crop loss.",                 type: "negative", icon: "🔍" },
  { id: "bumper",           name: "Bumper Crop",         description: "One plot yields 3× this harvest!",                 type: "positive", icon: "🌟" },
  { id: "wild_strain",      name: "Wild Strain",         description: "One plot auto-upgrades to Legendary tier!",        type: "positive", icon: "🧪" },
  { id: "black_market",     name: "Black Market Buyer",  description: "One crop sells at 3× for 10 minutes!",            type: "positive", icon: "💰" },
  { id: "friendly_weather", name: "Friendly Weather",    description: "All outdoor yields +30% this cycle.",              type: "positive", icon: "🌤️", outdoorOnly: true },
];

export const EVENT_CHECK_INTERVAL_MS = 30 * 60 * 1000;  // Check every 30 minutes
export const EVENT_BASE_CHANCE = 0.35;                    // 35% chance per check per property
export const INSPECTION_FINE_MIN = 50;
export const INSPECTION_FINE_MAX = 500;
export const BLACK_MARKET_DURATION_MS = 10 * 60 * 1000;  // 10 minutes

/* ─── Tech Tree ───────────────────────────────────────────────────── */

export interface TechNodeDef {
  id: string;
  name: string;
  branch: string;
  description: string;
  rpCost: number;
  requires: string | null;  // prerequisite node id
  effect: Record<string, number>;
}

export const TECH_TREE: TechNodeDef[] = [
  // Agronomy branch
  { id: "agro1", name: "Faster Growth I",   branch: "Agronomy",  description: "–5% growth time",           rpCost: 5,   requires: null,    effect: { growthReduction: 0.05 } },
  { id: "agro2", name: "Faster Growth II",  branch: "Agronomy",  description: "–10% growth time",          rpCost: 15,  requires: "agro1", effect: { growthReduction: 0.10 } },
  { id: "agro3", name: "Faster Growth III", branch: "Agronomy",  description: "–15% growth time",          rpCost: 40,  requires: "agro2", effect: { growthReduction: 0.15 } },
  { id: "agro4", name: "Bigger Yields I",   branch: "Agronomy",  description: "+10% yield",                rpCost: 10,  requires: null,    effect: { yieldBonus: 0.10 } },
  { id: "agro5", name: "Bigger Yields II",  branch: "Agronomy",  description: "+20% yield",                rpCost: 25,  requires: "agro4", effect: { yieldBonus: 0.20 } },
  { id: "agro6", name: "Bigger Yields III", branch: "Agronomy",  description: "+30% yield",                rpCost: 60,  requires: "agro5", effect: { yieldBonus: 0.30 } },

  // Genetics branch
  { id: "gen1",  name: "Better Quality I",   branch: "Genetics",  description: "+5% quality roll bonus",   rpCost: 8,   requires: null,    effect: { qualityBonus: 0.05 } },
  { id: "gen2",  name: "Better Quality II",  branch: "Genetics",  description: "+10% quality roll bonus",  rpCost: 20,  requires: "gen1",  effect: { qualityBonus: 0.10 } },
  { id: "gen3",  name: "Better Quality III", branch: "Genetics",  description: "+15% quality roll bonus",  rpCost: 50,  requires: "gen2",  effect: { qualityBonus: 0.15 } },
  { id: "gen4",  name: "Hybrid Seeds",       branch: "Genetics",  description: "+2 base yield all crops",  rpCost: 75,  requires: "gen3",  effect: { flatYieldBonus: 2 } },

  // Logistics branch
  { id: "log1",  name: "Extended Offline I",  branch: "Logistics", description: "Offline cap +12h (36h total)",   rpCost: 10,  requires: null,    effect: { offlineCapBonus: 12 } },
  { id: "log2",  name: "Extended Offline II", branch: "Logistics", description: "Offline cap +24h (48h total)",   rpCost: 30,  requires: "log1",  effect: { offlineCapBonus: 24 } },
  { id: "log3",  name: "Auto-Sell Threshold", branch: "Logistics", description: "Unlock auto-sell at set price", rpCost: 20,  requires: null,    effect: { autoSell: 1 } },
  { id: "log4",  name: "Storage Expansion",   branch: "Logistics", description: "+50% inventory capacity",       rpCost: 15,  requires: null,    effect: { storageBonus: 0.50 } },

  // Security branch
  { id: "sec1",  name: "Risk Reduction I",    branch: "Security",  description: "–10% event risk",           rpCost: 8,   requires: null,    effect: { eventRiskReduction: 0.10 } },
  { id: "sec2",  name: "Risk Reduction II",   branch: "Security",  description: "–25% event risk",           rpCost: 20,  requires: "sec1",  effect: { eventRiskReduction: 0.25 } },
  { id: "sec3",  name: "Risk Reduction III",  branch: "Security",  description: "–50% event risk",           rpCost: 50,  requires: "sec2",  effect: { eventRiskReduction: 0.50 } },
  { id: "sec4",  name: "Staff Discount",      branch: "Security",  description: "–25% staff wages",          rpCost: 30,  requires: null,    effect: { wageDiscount: 0.25 } },
];

/* ─── Equipment ───────────────────────────────────────────────────── */

export interface EquipmentDef {
  id: string;
  name: string;
  icon: string;
  maxLevel: number;
  baseCost: number;         // level 1 cost; each level is baseCost × level × propertyTier
  effect: string;           // description key
  perLevel: number;         // effect per level
  plotType?: "indoor" | "outdoor";  // restricted to this plot type
}

export const EQUIPMENT: EquipmentDef[] = [
  { id: "irrigation",  name: "Irrigation System",  icon: "💧", maxLevel: 3, baseCost: 300,  effect: "growthReduction", perLevel: 0.05 },
  { id: "grow_lights", name: "Grow Lights",         icon: "💡", maxLevel: 3, baseCost: 500,  effect: "qualityBonus",    perLevel: 0.05, plotType: "indoor" },
  { id: "soil",        name: "Soil Enrichment",     icon: "🌱", maxLevel: 3, baseCost: 400,  effect: "yieldBonus",      perLevel: 0.08, plotType: "outdoor" },
  { id: "cameras",     name: "Security Cameras",    icon: "📷", maxLevel: 3, baseCost: 600,  effect: "eventRiskReduction", perLevel: 0.15 },
  { id: "automation",  name: "Automation Rig",       icon: "🤖", maxLevel: 3, baseCost: 800,  effect: "wageDiscount",    perLevel: 0.10 },
];

/* ─── Market ──────────────────────────────────────────────────────── */

export const MARKET_TICK_INTERVAL_MS = 15 * 60 * 1000;  // 15 minutes
export const MARKET_HISTORY_LENGTH = 20;                  // store last 20 ticks
export const MARKET_WALK_STRENGTH = 0.3;                  // How aggressively prices move per tick

/* ─── Offline & Misc ──────────────────────────────────────────────── */

export const BASE_OFFLINE_CAP_HOURS = 24;
export const SAVE_INTERVAL_MS = 30 * 1000;  // Auto-save every 30s
export const BASE_INVENTORY_CAP = 500;       // units across all crops/tiers
export const RP_PER_HARVEST = 1;
export const RP_BONUS_PREMIUM = 1;   // extra RP for quality ≥ 3
export const RP_BONUS_LEGENDARY = 3; // extra RP for quality 5
export const MAX_EVENT_LOG = 20;
