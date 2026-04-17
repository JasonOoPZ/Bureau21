/**
 * HYDROPONICS BAY — Game Engine
 * ===============================
 * Pure functions for all game logic. No React, no side effects.
 * Handles: market pricing, quality rolls, growth, offline progress,
 * events, staff wages, tech bonuses, and state initialization.
 */

import {
  PROPERTIES, CROPS, QUALITY_TIERS, PLOT_TYPE_MODS, PREMIUM_CROPS, COMMON_CROPS,
  SEASONS, SEASON_DURATION_MS, STAFF_ROLES, STAFF_FIRST_NAMES, STAFF_LAST_NAMES,
  STAFF_HIRE_COST_BASE, STAFF_HIRE_COST_PER_SKILL, EVENTS, EVENT_CHECK_INTERVAL_MS,
  EVENT_BASE_CHANCE, INSPECTION_FINE_MIN, INSPECTION_FINE_MAX, TECH_TREE, EQUIPMENT,
  MARKET_TICK_INTERVAL_MS, MARKET_HISTORY_LENGTH, MARKET_WALK_STRENGTH,
  BASE_OFFLINE_CAP_HOURS, RP_PER_HARVEST, RP_BONUS_PREMIUM, RP_BONUS_LEGENDARY,
  MAX_EVENT_LOG, BASE_INVENTORY_CAP,
  type PropertyDef, type CropDef, type SeasonDef, type StaffRole,
} from "./config";
import type {
  HydroponicsGameState, PlotState, OwnedProperty, StaffMember,
  ActiveEvent, EventLogEntry, Inventory,
} from "./types";

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

let _rngSeed = Date.now();
/** Seeded pseudo-random for deterministic offline calculations */
function seededRandom(): number {
  _rngSeed = (_rngSeed * 16807 + 0) % 2147483647;
  return (_rngSeed - 1) / 2147483646;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/* ═══════════════════════════════════════════════════════════════════
   SEASON
   ═══════════════════════════════════════════════════════════════════ */

export function getCurrentSeason(seasonEpoch: number, now = Date.now()): SeasonDef {
  const elapsed = now - seasonEpoch;
  const idx = Math.floor(elapsed / SEASON_DURATION_MS) % SEASONS.length;
  return SEASONS[(idx % SEASONS.length + SEASONS.length) % SEASONS.length];
}

export function getSeasonTimeRemaining(seasonEpoch: number, now = Date.now()): number {
  const elapsed = now - seasonEpoch;
  const current = elapsed % SEASON_DURATION_MS;
  return SEASON_DURATION_MS - current;
}

/* ═══════════════════════════════════════════════════════════════════
   MARKET — Smooth random walk price oscillation
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Advance market prices by one tick using a bounded random walk.
 * Price drifts toward basePrice (mean-reversion) with random noise
 * scaled by the crop's volatility. This creates trend-like price
 * movements that feel like a real market.
 */
export function tickMarketPrices(
  currentPrices: Record<string, number>,
  history: Record<string, number[]>,
  rng = Math.random,
): { prices: Record<string, number>; history: Record<string, number[]> } {
  const newPrices: Record<string, number> = {};
  const newHistory: Record<string, number[]> = {};

  for (const crop of CROPS) {
    const current = currentPrices[crop.id] ?? crop.basePrice;
    // Random walk with mean-reversion
    const noise = (rng() * 2 - 1) * crop.volatility * MARKET_WALK_STRENGTH;
    const reversion = (crop.basePrice - current) / crop.basePrice * 0.1;
    let next = current * (1 + noise + reversion);
    // Clamp within volatility bounds
    const min = crop.basePrice * (1 - crop.volatility);
    const max = crop.basePrice * (1 + crop.volatility);
    next = clamp(Math.round(next * 100) / 100, min, max);
    newPrices[crop.id] = next;

    const prev = history[crop.id] ?? [];
    newHistory[crop.id] = [...prev, next].slice(-MARKET_HISTORY_LENGTH);
  }

  return { prices: newPrices, history: newHistory };
}

/** Catch up market ticks that happened while offline */
export function catchUpMarket(
  state: HydroponicsGameState,
  now: number,
): { prices: Record<string, number>; history: Record<string, number[]>; lastTick: number } {
  let { marketPrices: prices, marketHistory: history, marketLastTick: lastTick } = state;
  const ticksMissed = Math.floor((now - lastTick) / MARKET_TICK_INTERVAL_MS);
  const ticksToProcess = Math.min(ticksMissed, 200); // cap to prevent lag

  _rngSeed = lastTick; // deterministic for offline
  for (let i = 0; i < ticksToProcess; i++) {
    const result = tickMarketPrices(prices, history, seededRandom);
    prices = result.prices;
    history = result.history;
  }

  return { prices, history, lastTick: lastTick + ticksToProcess * MARKET_TICK_INTERVAL_MS };
}

/* ═══════════════════════════════════════════════════════════════════
   QUALITY TIER ROLL
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Roll a quality tier with bonuses shifting probability upward.
 * qualityBonus is a sum of property + staff + tech bonuses (0–1 range).
 * Higher bonus compresses lower tiers and expands higher tiers.
 */
export function rollQualityTier(qualityBonus: number, rng = Math.random): number {
  // Shift chances: reduce tier 1 by bonus%, redistribute upward
  const shift = clamp(qualityBonus, 0, 0.8); // cap at 80% shift
  const chances = QUALITY_TIERS.map((q) => q.baseChance);

  // Move percentage from lower tiers to upper tiers
  const toRedistribute = chances[0] * shift;
  chances[0] -= toRedistribute;
  chances[1] += toRedistribute * 0.3;
  chances[2] += toRedistribute * 0.35;
  chances[3] += toRedistribute * 0.25;
  chances[4] += toRedistribute * 0.10;

  const total = chances.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < chances.length; i++) {
    roll -= chances[i];
    if (roll <= 0) return QUALITY_TIERS[i].tier;
  }
  return 1;
}

/* ═══════════════════════════════════════════════════════════════════
   GROWTH CALCULATION
   ═══════════════════════════════════════════════════════════════════ */

/** Calculate effective growth time in ms for a plot + crop + bonuses */
export function calcGrowthMs(
  crop: CropDef,
  plotType: "indoor" | "outdoor",
  property: PropertyDef,
  season: SeasonDef,
  techGrowthReduction: number,
  equipGrowthReduction: number,
): number {
  let mult = 1.0;
  // Plot type modifier
  mult *= PLOT_TYPE_MODS[plotType].growthMult;
  // Property bonus (reduces time)
  mult *= (1 - property.growthBonus);
  // Season (outdoor only)
  if (plotType === "outdoor") mult *= season.growthMult;
  // Tech tree reduction
  mult *= (1 - techGrowthReduction);
  // Equipment reduction
  mult *= (1 - equipGrowthReduction);

  return Math.max(60_000, Math.round(crop.baseGrowthMinutes * 60_000 * mult));
}

/** Calculate effective yield for a plot + crop + bonuses */
export function calcYield(
  crop: CropDef,
  plotType: "indoor" | "outdoor",
  property: PropertyDef,
  season: SeasonDef,
  techYieldBonus: number,
  techFlatBonus: number,
  equipYieldBonus: number,
): number {
  let mult = 1.0;
  mult *= PLOT_TYPE_MODS[plotType].yieldMult;
  mult *= (1 + property.growthBonus); // Property growth bonus also boosts yield slightly
  if (plotType === "outdoor") mult *= season.yieldMult;
  mult *= (1 + techYieldBonus);
  mult *= (1 + equipYieldBonus);
  return Math.max(1, Math.round((crop.baseYield + techFlatBonus) * mult));
}

/** Calculate total quality bonus for a plot from all sources */
export function calcQualityBonus(
  cropId: string,
  plotType: "indoor" | "outdoor",
  property: PropertyDef,
  botanistSkill: number,     // 0 if no botanist on this property
  techQualityBonus: number,
  equipQualityBonus: number,
): number {
  let bonus = property.qualityBonus;
  // Plot type + crop affinity bonus
  if (plotType === "indoor" && PREMIUM_CROPS.has(cropId)) {
    bonus += PLOT_TYPE_MODS.indoor.premiumQualityBonus;
  }
  if (plotType === "outdoor" && COMMON_CROPS.has(cropId)) {
    bonus += PLOT_TYPE_MODS.outdoor.commonQualityBonus;
  }
  // Botanist: each skill level = +2% quality
  bonus += botanistSkill * 0.02;
  bonus += techQualityBonus;
  bonus += equipQualityBonus;
  return bonus;
}

/* ═══════════════════════════════════════════════════════════════════
   TECH TREE HELPERS
   ═══════════════════════════════════════════════════════════════════ */

/** Sum a specific effect from all unlocked tech nodes */
export function getTechEffect(unlocked: string[], effectKey: string): number {
  return TECH_TREE
    .filter((n) => unlocked.includes(n.id))
    .reduce((sum, n) => sum + (n.effect[effectKey] ?? 0), 0);
}

/** Check if a tech node can be unlocked */
export function canUnlockTech(nodeId: string, unlocked: string[], rp: number): boolean {
  const node = TECH_TREE.find((n) => n.id === nodeId);
  if (!node || unlocked.includes(nodeId)) return false;
  if (node.requires && !unlocked.includes(node.requires)) return false;
  return rp >= node.rpCost;
}

/* ═══════════════════════════════════════════════════════════════════
   EQUIPMENT HELPERS
   ═══════════════════════════════════════════════════════════════════ */

export function getEquipmentCost(equipId: string, currentLevel: number, propertyTier: number): number {
  const def = EQUIPMENT.find((e) => e.id === equipId);
  if (!def) return Infinity;
  return Math.round(def.baseCost * (currentLevel + 1) * (1 + propertyTier * 0.3));
}

export function getEquipmentEffect(equipId: string, level: number): number {
  const def = EQUIPMENT.find((e) => e.id === equipId);
  if (!def || level <= 0) return 0;
  return def.perLevel * level;
}

/* ═══════════════════════════════════════════════════════════════════
   STAFF
   ═══════════════════════════════════════════════════════════════════ */

export function generateStaffName(): string {
  const first = STAFF_FIRST_NAMES[Math.floor(Math.random() * STAFF_FIRST_NAMES.length)];
  const last = STAFF_LAST_NAMES[Math.floor(Math.random() * STAFF_LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function getHireCost(skillLevel: number): number {
  return STAFF_HIRE_COST_BASE + STAFF_HIRE_COST_PER_SKILL * skillLevel;
}

export function getMaxStaff(properties: OwnedProperty[]): number {
  const maxTier = properties.reduce((max, p) => {
    const def = PROPERTIES.find((d) => d.id === p.id);
    return Math.max(max, def?.tier ?? 0);
  }, 0);
  return maxTier * 2;
}

export function calcWagePerHour(staff: StaffMember, wageDiscount: number): number {
  return Math.round(staff.wagePerHour * (1 - wageDiscount));
}

/** Deduct wages for elapsed hours, return total deducted and any staff who quit */
export function processWages(
  staff: StaffMember[],
  elapsedMs: number,
  credits: number,
  wageDiscount: number,
): { totalWages: number; remainingStaff: StaffMember[]; firedNames: string[] } {
  const hours = elapsedMs / (60 * 60 * 1000);
  let totalWages = 0;
  for (const s of staff) {
    totalWages += Math.round(calcWagePerHour(s, wageDiscount) * hours);
  }

  if (totalWages <= credits) {
    return { totalWages, remainingStaff: staff, firedNames: [] };
  }

  // Can't afford all — fire highest wage first until affordable
  const sorted = [...staff].sort((a, b) => b.wagePerHour - a.wagePerHour);
  const remaining: StaffMember[] = [];
  const fired: string[] = [];
  let budget = credits;

  for (const s of sorted) {
    const cost = Math.round(calcWagePerHour(s, wageDiscount) * hours);
    if (cost <= budget) {
      remaining.push(s);
      budget -= cost;
    } else {
      fired.push(s.name);
    }
  }

  totalWages = credits - budget;
  return { totalWages, remainingStaff: remaining, firedNames: fired };
}

/* ═══════════════════════════════════════════════════════════════════
   EVENTS
   ═══════════════════════════════════════════════════════════════════ */

/** Generate random events for a single property check */
export function rollEvents(
  property: OwnedProperty,
  propertyDef: PropertyDef,
  securitySkill: number,       // total security staff skill on this property
  techEventReduction: number,
  equipEventReduction: number,
  rng = Math.random,
): ActiveEvent[] {
  // DORMANT: Random events disabled until reworked
  return [];

  const baseChance = EVENT_BASE_CHANCE;
  const riskMult = propertyDef.type === "outdoor" ? PLOT_TYPE_MODS.outdoor.eventRiskMult
    : propertyDef.type === "indoor" ? PLOT_TYPE_MODS.indoor.eventRiskMult
    : 1.0; // mixed = neutral
  const securityReduction = securitySkill * 0.03; // each skill level = –3% risk
  const effectiveChance = baseChance * riskMult * (1 - securityReduction) * (1 - techEventReduction) * (1 - equipEventReduction);

  if (rng() > effectiveChance) return [];

  // Pick a random valid event for this property type
  const validEvents = EVENTS.filter((e) => {
    if (e.outdoorOnly && propertyDef.type === "indoor") return false;
    if (e.indoorOnly && propertyDef.type === "outdoor") return false;
    return true;
  });

  if (validEvents.length === 0) return [];
  const eventDef = validEvents[Math.floor(rng() * validEvents.length)];
  const now = Date.now();

  return [{
    id: uid(),
    eventDefId: eventDef.id,
    propertyId: property.id,
    expiresAt: now + 30 * 60 * 1000, // events last 30 min
    appliedAt: now,
  }];
}

/* ═══════════════════════════════════════════════════════════════════
   PLANTING
   ═══════════════════════════════════════════════════════════════════ */

export function plantCrop(
  plot: PlotState,
  cropId: string,
  state: HydroponicsGameState,
  now = Date.now(),
): { plot: PlotState; seedCost: number } {
  const crop = CROPS.find((c) => c.id === cropId)!;
  const property = PROPERTIES.find((p) => p.id === plot.propertyId)!;
  const season = getCurrentSeason(state.seasonEpoch, now);

  const techGrowthRed = getTechEffect(state.techUnlocked, "growthReduction");
  const techYieldBonus = getTechEffect(state.techUnlocked, "yieldBonus");
  const techFlatYield = getTechEffect(state.techUnlocked, "flatYieldBonus");

  const ownedProp = state.properties.find((p) => p.id === plot.propertyId);
  const equipGrowthRed = getEquipmentEffect("irrigation", ownedProp?.equipment.irrigation ?? 0);
  const equipYieldBonus = getEquipmentEffect("soil", ownedProp?.equipment.soil ?? 0);

  const growthMs = calcGrowthMs(crop, plot.plotType, property, season, techGrowthRed, equipGrowthRed);
  const yieldAmount = calcYield(crop, plot.plotType, property, season, techYieldBonus, techFlatYield, equipYieldBonus);

  // Predict quality tier (finalized at harvest, but gives a preview)
  const botanistSkill = state.staff
    .filter((s) => s.role === "botanist" && s.assignedPropertyId === plot.propertyId)
    .reduce((sum, s) => sum + s.skillLevel, 0);
  const techQuality = getTechEffect(state.techUnlocked, "qualityBonus");
  const equipQuality = getEquipmentEffect("grow_lights", ownedProp?.equipment.grow_lights ?? 0);
  const qualityBonus = calcQualityBonus(cropId, plot.plotType, property, botanistSkill, techQuality, equipQuality);
  const qualityTier = rollQualityTier(qualityBonus);

  const seedCost = Math.round(crop.seedCost * PLOT_TYPE_MODS[plot.plotType].seedCostMult);

  return {
    plot: {
      ...plot,
      cropId,
      plantedAt: now,
      growthMs,
      yieldAmount,
      qualityTier,
      harvested: false,
    },
    seedCost,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   HARVESTING
   ═══════════════════════════════════════════════════════════════════ */

export interface HarvestResult {
  cropId: string;
  qualityTier: number;
  amount: number;
  rp: number;
}

export function harvestPlot(
  plot: PlotState,
  state: HydroponicsGameState,
  now = Date.now(),
): HarvestResult | null {
  if (!plot.cropId || !plot.plantedAt || plot.harvested) return null;
  const elapsed = now - plot.plantedAt;
  if (elapsed < plot.growthMs) return null;

  const tier = plot.qualityTier ?? 1;
  let amount = plot.yieldAmount;

  // Check for active bumper crop event
  const bumper = state.activeEvents.find(
    (e) => e.eventDefId === "bumper" && e.propertyId === plot.propertyId && e.expiresAt > now
  );
  if (bumper) amount *= 3;

  // Check for wild strain event (auto legendary)
  const wildStrain = state.activeEvents.find(
    (e) => e.eventDefId === "wild_strain" && e.propertyId === plot.propertyId && e.expiresAt > now
  );
  const finalTier = wildStrain ? 5 : tier;

  // RP earned
  let rp = RP_PER_HARVEST;
  if (finalTier >= 3) rp += RP_BONUS_PREMIUM;
  if (finalTier >= 5) rp += RP_BONUS_LEGENDARY;

  return { cropId: plot.cropId, qualityTier: finalTier, amount, rp };
}

/* ═══════════════════════════════════════════════════════════════════
   SELLING
   ═══════════════════════════════════════════════════════════════════ */

export function getSellPrice(cropId: string, qualityTier: number, marketPrices: Record<string, number>, activeEvents: ActiveEvent[]): number {
  const price = marketPrices[cropId] ?? CROPS.find((c) => c.id === cropId)?.basePrice ?? 0;
  const qualityDef = QUALITY_TIERS.find((q) => q.tier === qualityTier);
  const mult = qualityDef?.priceMultiplier ?? 1;

  // Black market buyer check
  const blackMarket = activeEvents.find(
    (e) => e.eventDefId === "black_market" && e.cropId === cropId && e.expiresAt > Date.now()
  );
  const eventMult = blackMarket ? 3 : 1;

  return Math.round(price * mult * eventMult);
}

/* ═══════════════════════════════════════════════════════════════════
   INVENTORY
   ═══════════════════════════════════════════════════════════════════ */

export function inventoryKey(cropId: string, tier: number): string {
  return `${cropId}:${tier}`;
}

export function inventoryTotal(inv: Inventory): number {
  return Object.values(inv).reduce((s, v) => s + v, 0);
}

export function getInventoryCap(techUnlocked: string[]): number {
  const bonus = getTechEffect(techUnlocked, "storageBonus");
  return Math.round(BASE_INVENTORY_CAP * (1 + bonus));
}

/* ═══════════════════════════════════════════════════════════════════
   STATE INITIALIZATION
   ═══════════════════════════════════════════════════════════════════ */

export function createInitialState(): HydroponicsGameState {
  const now = Date.now();
  const starterProp = PROPERTIES[0];

  // Initialize market prices at base
  const marketPrices: Record<string, number> = {};
  const marketHistory: Record<string, number[]> = {};
  for (const crop of CROPS) {
    marketPrices[crop.id] = crop.basePrice;
    marketHistory[crop.id] = [crop.basePrice];
  }

  const plots: PlotState[] = Array.from({ length: starterProp.plotCount }, (_, i) => ({
    id: `${starterProp.id}_${i}`,
    propertyId: starterProp.id,
    plotType: starterProp.type === "mixed" ? "indoor" : starterProp.type,
    cropId: null,
    plantedAt: null,
    growthMs: 0,
    yieldAmount: 0,
    qualityTier: null,
    harvested: false,
  }));

  return {
    initialized: true,
    properties: [{ id: starterProp.id, plots, equipment: {} }],
    inventory: {},
    staff: [],
    marketPrices,
    marketHistory,
    marketLastTick: now,
    techUnlocked: [],
    researchPoints: 0,
    eventLog: [],
    activeEvents: [],
    lastEventCheck: now,
    seasonEpoch: now,
    lastSave: now,
    lastOnline: now,
    lastWageDeduction: now,
    totalHarvests: 0,
    totalCreditsEarned: 0,
    totalCropsGrown: {},
  };
}

/* ═══════════════════════════════════════════════════════════════════
   OFFLINE PROGRESS CALCULATOR
   ═══════════════════════════════════════════════════════════════════ */

export interface OfflineReport {
  elapsedHours: number;
  autoHarvests: number;
  autoReplants: number;
  wagesDeducted: number;
  firedStaff: string[];
  eventsOccurred: string[];
  rpEarned: number;
  cropsSummary: Record<string, number>; // cropId -> total harvested
  creditsDelta: number; // wages only (harvests go to inventory)
}

/**
 * Process all offline progress since lastOnline.
 * Crops that completed growth are auto-harvested (added to inventory).
 * If a Gardener is assigned, plots auto-replant with the same crop.
 * If a Harvester is assigned, auto-harvest happens (already handled by growth completion).
 * Wages are deducted. Events are rolled. Market is caught up.
 */
export function processOfflineProgress(
  state: HydroponicsGameState,
  credits: number,
  now = Date.now(),
): { state: HydroponicsGameState; report: OfflineReport; creditsDelta: number } {
  const offlineCapMs = (BASE_OFFLINE_CAP_HOURS + getTechEffect(state.techUnlocked, "offlineCapBonus")) * 60 * 60 * 1000;
  const elapsed = Math.min(now - state.lastOnline, offlineCapMs);
  if (elapsed < 60_000) {
    return { state: { ...state, lastOnline: now }, report: { elapsedHours: 0, autoHarvests: 0, autoReplants: 0, wagesDeducted: 0, firedStaff: [], eventsOccurred: [], rpEarned: 0, cropsSummary: {}, creditsDelta: 0 }, creditsDelta: 0 };
  }

  const s = structuredClone(state);
  const report: OfflineReport = {
    elapsedHours: elapsed / (60 * 60 * 1000),
    autoHarvests: 0,
    autoReplants: 0,
    wagesDeducted: 0,
    firedStaff: [],
    eventsOccurred: [],
    rpEarned: 0,
    cropsSummary: {},
    creditsDelta: 0,
  };

  // 1. Catch up market
  const marketResult = catchUpMarket(s, now);
  s.marketPrices = marketResult.prices;
  s.marketHistory = marketResult.history;
  s.marketLastTick = marketResult.lastTick;

  // 2. Process wages
  const wageDiscount = getTechEffect(s.techUnlocked, "wageDiscount");
  const { totalWages, remainingStaff, firedNames } = processWages(s.staff, elapsed, credits, wageDiscount);
  report.wagesDeducted = totalWages;
  report.firedStaff = firedNames;
  report.creditsDelta -= totalWages;
  s.staff = remainingStaff;

  // 3. Auto-harvest completed plots, auto-replant if gardener present
  for (const prop of s.properties) {
    const hasGardener = s.staff.some((st) => st.role === "gardener" && st.assignedPropertyId === prop.id);

    for (let i = 0; i < prop.plots.length; i++) {
      const plot = prop.plots[i];
      if (!plot.cropId || !plot.plantedAt || plot.harvested) continue;

      const completionTime = plot.plantedAt + plot.growthMs;
      if (completionTime <= now) {
        // Auto-harvest
        const result = harvestPlot(plot, s, completionTime);
        if (result) {
          const key = inventoryKey(result.cropId, result.qualityTier);
          s.inventory[key] = (s.inventory[key] ?? 0) + result.amount;
          s.researchPoints += result.rp;
          report.rpEarned += result.rp;
          report.autoHarvests++;
          report.cropsSummary[result.cropId] = (report.cropsSummary[result.cropId] ?? 0) + result.amount;
          s.totalHarvests++;
          s.totalCropsGrown[result.cropId] = (s.totalCropsGrown[result.cropId] ?? 0) + result.amount;

          // Mark harvested
          prop.plots[i] = { ...plot, harvested: true, cropId: null, plantedAt: null, qualityTier: null };

          // Auto-replant if gardener assigned (uses same crop, free seed cost offline)
          if (hasGardener && result.cropId) {
            const replanted = plantCrop(prop.plots[i], result.cropId, s, completionTime + 1000);
            prop.plots[i] = replanted.plot;
            report.autoReplants++;
          }
        }
      }
    }
  }

  // 4. Events — DORMANT: disabled until reworked
  // const eventChecks = Math.floor(elapsed / EVENT_CHECK_INTERVAL_MS);
  // for (let i = 0; i < Math.min(eventChecks, 10); i++) { ... }

  // Trim event log
  s.eventLog = s.eventLog.slice(-MAX_EVENT_LOG);
  s.lastOnline = now;
  s.lastSave = now;
  s.lastWageDeduction = now;
  // Clean expired events
  s.activeEvents = s.activeEvents.filter((e) => e.expiresAt > now);

  return { state: s, report, creditsDelta: report.creditsDelta };
}

/* ═══════════════════════════════════════════════════════════════════
   PROPERTY PURCHASE
   ═══════════════════════════════════════════════════════════════════ */

export function canBuyProperty(propId: string, owned: OwnedProperty[]): boolean {
  const def = PROPERTIES.find((p) => p.id === propId);
  if (!def) return false;
  if (owned.some((p) => p.id === propId)) return false;
  if (def.unlockTier > 0) {
    const hasPrereq = owned.some((p) => {
      const pDef = PROPERTIES.find((d) => d.id === p.id);
      return pDef && pDef.tier >= def.unlockTier;
    });
    if (!hasPrereq) return false;
  }
  return true;
}

export function buyProperty(
  propId: string,
  state: HydroponicsGameState,
): { state: HydroponicsGameState; cost: number } | null {
  const def = PROPERTIES.find((p) => p.id === propId);
  if (!def || !canBuyProperty(propId, state.properties)) return null;

  const plots: PlotState[] = Array.from({ length: def.plotCount }, (_, i) => ({
    id: `${def.id}_${i}`,
    propertyId: def.id,
    plotType: def.type === "mixed" ? (i % 2 === 0 ? "indoor" : "outdoor") : def.type,
    cropId: null,
    plantedAt: null,
    growthMs: 0,
    yieldAmount: 0,
    qualityTier: null,
    harvested: false,
  }));

  return {
    state: {
      ...state,
      properties: [...state.properties, { id: def.id, plots, equipment: {} }],
      eventLog: [
        ...state.eventLog,
        { timestamp: Date.now(), icon: "🏠", message: `Purchased ${def.name}!`, type: "purchase" as const },
      ].slice(-MAX_EVENT_LOG),
    },
    cost: def.cost,
  };
}
