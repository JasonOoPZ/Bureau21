/**
 * HYDROPONICS BAY — stored-state sanitizer (server side)
 * =======================================================
 * The persisted JSON used to be written verbatim from the browser, so nothing
 * in it can be trusted. Before the server runs the engine on a stored state it
 * is rebuilt here: unknown ids are dropped and every number that feeds a credit
 * calculation is clamped to what the game rules allow.
 */

import {
  CROPS, EQUIPMENT, MARKET_HISTORY_LENGTH, MAX_EVENT_LOG, PLOT_TYPE_MODS, PROPERTIES,
  QUALITY_TIERS, SEASONS, STAFF_MAX_SKILL, STAFF_ROLES, TECH_TREE,
  type CropDef, type PropertyDef,
} from "./config";
import { clamp, createInitialState, getEquipmentEffect, getTechEffect, inventoryKey } from "./engine";
import type {
  EventLogEntry, HydroponicsGameState, Inventory, OwnedProperty, PlotState, StaffMember,
} from "./types";

/** Hard ceiling per inventory stack. Legit play stays far below this. */
export const MAX_INVENTORY_PER_KEY = 10_000;
export const MAX_RESEARCH_POINTS = 100_000;
const MAX_STAFF_TOTAL = Math.max(...PROPERTIES.map((p) => p.tier)) * 2;
const MAX_STAT = Number.MAX_SAFE_INTEGER;
const MIN_GROWTH_MS = 60_000;
const MAX_ID_LENGTH = 40;
const MAX_NAME_LENGTH = 60;
const MAX_LOG_MESSAGE_LENGTH = 200;
const MAX_LOG_ICON_LENGTH = 8;
/** Minimum wage factor: the only wage discount in the game is 25%. */
const MIN_WAGE_FACTOR = 1 - Math.max(0, ...TECH_TREE.map((n) => n.effect.wageDiscount ?? 0));
const LOG_TYPES: ReadonlySet<string> = new Set(["event", "harvest", "sale", "purchase", "staff", "tech", "info"]);

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return clamp(Math.floor(value), min, max);
}

/** A timestamp that is finite, positive and not in the future. */
function pastTime(value: unknown, now: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= now ? value : now;
}

function shortString(value: unknown, maxLength: number, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value.slice(0, maxLength) : fallback;
}

/** Highest yield the engine can ever assign to one plot of this crop. */
export function maxPlotYield(crop: CropDef): number {
  const allTech = TECH_TREE.map((n) => n.id);
  const soil = EQUIPMENT.find((e) => e.id === "soil");
  const mult =
    Math.max(PLOT_TYPE_MODS.indoor.yieldMult, PLOT_TYPE_MODS.outdoor.yieldMult) *
    (1 + Math.max(...PROPERTIES.map((p) => p.growthBonus))) *
    Math.max(1, ...SEASONS.map((s) => s.yieldMult)) *
    (1 + getTechEffect(allTech, "yieldBonus")) *
    (1 + getEquipmentEffect("soil", soil?.maxLevel ?? 0));
  return Math.ceil((crop.baseYield + getTechEffect(allTech, "flatYieldBonus")) * mult);
}

function canonicalPlotType(def: PropertyDef, index: number): "indoor" | "outdoor" {
  if (def.type !== "mixed") return def.type;
  // Mirrors buyProperty: mixed properties alternate indoor / outdoor plots.
  return index % 2 === 0 ? "indoor" : "outdoor";
}

function sanitizePlot(raw: unknown, def: PropertyDef, index: number, now: number): PlotState {
  const source = isRecord(raw) ? raw : {};
  const crop = CROPS.find((c) => c.id === source.cropId);
  const base = {
    id: `${def.id}_${index}`,
    propertyId: def.id,
    plotType: canonicalPlotType(def, index),
    harvested: source.harvested === true,
  };
  if (!crop) {
    return { ...base, cropId: null, plantedAt: null, growthMs: 0, yieldAmount: 0, qualityTier: null };
  }
  return {
    ...base,
    cropId: crop.id,
    plantedAt: pastTime(source.plantedAt, now),
    growthMs: clampInt(source.growthMs, MIN_GROWTH_MS, MAX_STAT, crop.baseGrowthMinutes * 60_000),
    yieldAmount: clampInt(source.yieldAmount, 1, maxPlotYield(crop), 1),
    qualityTier: clampInt(source.qualityTier, 1, QUALITY_TIERS.length, 1),
  };
}

function sanitizeEquipment(raw: unknown): Record<string, number> {
  const source = isRecord(raw) ? raw : {};
  const entries = EQUIPMENT
    .map((def) => [def.id, clampInt(source[def.id], 0, def.maxLevel, 0)] as const)
    .filter(([, level]) => level > 0);
  return Object.fromEntries(entries);
}

function sanitizeProperties(raw: unknown, now: number): OwnedProperty[] {
  const byId = new Map<string, Json>();
  for (const entry of asArray(raw)) {
    if (isRecord(entry) && typeof entry.id === "string" && !byId.has(entry.id)) byId.set(entry.id, entry);
  }
  return PROPERTIES.filter((def) => byId.has(def.id)).map((def) => {
    const source = byId.get(def.id) ?? {};
    const rawPlots = asArray(source.plots);
    return {
      id: def.id,
      plots: Array.from({ length: def.plotCount }, (_, i) => sanitizePlot(rawPlots[i], def, i, now)),
      equipment: sanitizeEquipment(source.equipment),
    };
  });
}

function sanitizeInventory(raw: unknown): Inventory {
  const source = isRecord(raw) ? raw : {};
  const inventory: Inventory = {};
  for (const crop of CROPS) {
    for (const quality of QUALITY_TIERS) {
      const key = inventoryKey(crop.id, quality.tier);
      const amount = clampInt(source[key], 0, MAX_INVENTORY_PER_KEY, 0);
      if (amount > 0) inventory[key] = amount;
    }
  }
  return inventory;
}

function sanitizeStaff(raw: unknown, ownedIds: ReadonlySet<string>): StaffMember[] {
  const seen = new Set<string>();
  const staff: StaffMember[] = [];
  for (const entry of asArray(raw)) {
    if (staff.length >= MAX_STAFF_TOTAL || !isRecord(entry)) continue;
    const roleDef = STAFF_ROLES.find((r) => r.role === entry.role);
    const id = shortString(entry.id, MAX_ID_LENGTH, "");
    if (!roleDef || !id || seen.has(id)) continue;
    seen.add(id);
    const skillLevel = clampInt(entry.skillLevel, 1, STAFF_MAX_SKILL, 1);
    const fullWage = roleDef.baseWagePerHour * skillLevel;
    // A wage below the legal minimum (or negative) would turn payroll into income.
    const wagePerHour = clampInt(entry.wagePerHour, Math.round(fullWage * MIN_WAGE_FACTOR), fullWage, fullWage);
    const assigned = typeof entry.assignedPropertyId === "string" && ownedIds.has(entry.assignedPropertyId)
      ? entry.assignedPropertyId
      : null;
    staff.push({
      id,
      name: shortString(entry.name, MAX_NAME_LENGTH, "Staff"),
      role: roleDef.role,
      skillLevel,
      wagePerHour,
      assignedPropertyId: assigned,
    });
  }
  return staff;
}

function priceBounds(crop: CropDef): { min: number; max: number } {
  return { min: crop.basePrice * (1 - crop.volatility), max: crop.basePrice * (1 + crop.volatility) };
}

function sanitizePrice(value: unknown, crop: CropDef): number {
  const { min, max } = priceBounds(crop);
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, min, max) : crop.basePrice;
}

function sanitizeMarket(rawPrices: unknown, rawHistory: unknown): Pick<HydroponicsGameState, "marketPrices" | "marketHistory"> {
  const prices = isRecord(rawPrices) ? rawPrices : {};
  const history = isRecord(rawHistory) ? rawHistory : {};
  const marketPrices: Record<string, number> = {};
  const marketHistory: Record<string, number[]> = {};
  for (const crop of CROPS) {
    marketPrices[crop.id] = sanitizePrice(prices[crop.id], crop);
    const points = asArray(history[crop.id]).slice(-MARKET_HISTORY_LENGTH).map((p) => sanitizePrice(p, crop));
    marketHistory[crop.id] = points.length > 0 ? points : [marketPrices[crop.id]];
  }
  return { marketPrices, marketHistory };
}

function sanitizeEventLog(raw: unknown, now: number): EventLogEntry[] {
  return asArray(raw)
    .filter(isRecord)
    .slice(-MAX_EVENT_LOG)
    .map((entry) => ({
      timestamp: pastTime(entry.timestamp, now),
      icon: shortString(entry.icon, MAX_LOG_ICON_LENGTH, "•"),
      message: shortString(entry.message, MAX_LOG_MESSAGE_LENGTH, ""),
      type: (typeof entry.type === "string" && LOG_TYPES.has(entry.type) ? entry.type : "info") as EventLogEntry["type"],
    }));
}

function sanitizeCropTotals(raw: unknown): Record<string, number> {
  const source = isRecord(raw) ? raw : {};
  const totals: Record<string, number> = {};
  for (const crop of CROPS) {
    const amount = clampInt(source[crop.id], 0, MAX_STAT, 0);
    if (amount > 0) totals[crop.id] = amount;
  }
  return totals;
}

/** Rebuilds a stored game state so the engine only ever sees rule-conformant data. */
export function sanitizeState(raw: unknown, now: number = Date.now()): HydroponicsGameState {
  if (!isRecord(raw)) return createInitialState();

  const properties = sanitizeProperties(raw.properties, now);
  if (properties.length === 0) return createInitialState();

  const ownedIds = new Set(properties.map((p) => p.id));
  const techIds = new Set(asArray(raw.techUnlocked).filter((id): id is string => typeof id === "string"));

  return {
    initialized: true,
    properties,
    inventory: sanitizeInventory(raw.inventory),
    staff: sanitizeStaff(raw.staff, ownedIds),
    ...sanitizeMarket(raw.marketPrices, raw.marketHistory),
    marketLastTick: pastTime(raw.marketLastTick, now),
    techUnlocked: TECH_TREE.filter((n) => techIds.has(n.id)).map((n) => n.id),
    researchPoints: clampInt(raw.researchPoints, 0, MAX_RESEARCH_POINTS, 0),
    eventLog: sanitizeEventLog(raw.eventLog, now),
    // Random events are dormant in the engine; stored ones would only act as
    // forged 3x yield / 3x price multipliers.
    activeEvents: [],
    lastEventCheck: pastTime(raw.lastEventCheck, now),
    seasonEpoch: pastTime(raw.seasonEpoch, now),
    lastSave: pastTime(raw.lastSave, now),
    lastOnline: pastTime(raw.lastOnline, now),
    lastWageDeduction: pastTime(raw.lastWageDeduction, now),
    totalHarvests: clampInt(raw.totalHarvests, 0, MAX_STAT, 0),
    totalCreditsEarned: clampInt(raw.totalCreditsEarned, 0, MAX_STAT, 0),
    totalCropsGrown: sanitizeCropTotals(raw.totalCropsGrown),
  };
}
