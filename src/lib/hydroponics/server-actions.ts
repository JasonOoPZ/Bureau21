/**
 * HYDROPONICS BAY — server-authoritative actions
 * ================================================
 * The browser sends an intent ("sell 5 of this", "plant that there"); it never
 * sends a game state or a credit amount. Each action is validated against the
 * stored state and its credit effect is computed here from the pure engine.
 */

import { z } from "zod";
import {
  CROPS, EQUIPMENT, MAX_EVENT_LOG, PROPERTIES, QUALITY_TIERS, STAFF_MAX_SKILL,
  STAFF_ROLES, STAFF_UNLOCK_TIER, TECH_TREE,
} from "./config";
import {
  buyProperty, canUnlockTech, generateStaffName, getEquipmentCost, getHireCost,
  getInventoryCap, getMaxStaff, getSellPrice, getTechEffect, harvestPlot,
  inventoryKey, inventoryTotal, plantCrop, uid,
} from "./engine";
import type { EventLogEntry, HydroponicsGameState, PlotState, StaffMember } from "./types";

const INT32_MAX = 2_147_483_647;
const idSchema = z.string().min(1).max(40);
const QUALITY_NAMES = ["", ...QUALITY_TIERS.map((q) => q.name)];

export const hydroponicsActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("plant"), plotId: idSchema, cropId: idSchema }).strict(),
  z.object({ action: z.literal("harvest"), plotId: idSchema }).strict(),
  z.object({ action: z.literal("harvestAll"), propertyId: idSchema }).strict(),
  z.object({ action: z.literal("replantAll"), propertyId: idSchema }).strict(),
  z.object({
    action: z.literal("sell"),
    cropId: idSchema,
    tier: z.number().int().min(1).max(QUALITY_TIERS.length),
    amount: z.number().int().min(1).max(INT32_MAX),
  }).strict(),
  z.object({ action: z.literal("buyProperty"), propertyId: idSchema }).strict(),
  z.object({
    action: z.literal("hireStaff"),
    role: z.enum(["gardener", "harvester", "botanist", "security"]),
    skillLevel: z.number().int().min(1).max(STAFF_MAX_SKILL),
  }).strict(),
  z.object({ action: z.literal("fireStaff"), staffId: idSchema }).strict(),
  z.object({ action: z.literal("assignStaff"), staffId: idSchema, propertyId: idSchema.nullable() }).strict(),
  z.object({ action: z.literal("unlockTech"), techId: idSchema }).strict(),
  z.object({ action: z.literal("upgradeEquipment"), propertyId: idSchema, equipmentId: idSchema }).strict(),
]);

export type HydroponicsAction = z.infer<typeof hydroponicsActionSchema>;

export type ActionResult =
  /** creditsDelta is a server-computed integer: negative = cost, positive = sale proceeds. */
  | { ok: true; state: HydroponicsGameState; creditsDelta: number }
  | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });
const done = (state: HydroponicsGameState, creditsDelta = 0): ActionResult => ({ ok: true, state, creditsDelta });

function withLog(
  state: HydroponicsGameState,
  now: number,
  icon: string,
  message: string,
  type: EventLogEntry["type"],
): HydroponicsGameState {
  return { ...state, eventLog: [...state.eventLog, { timestamp: now, icon, message, type }].slice(-MAX_EVENT_LOG) };
}

function replacePlot(state: HydroponicsGameState, plot: PlotState): HydroponicsGameState {
  return {
    ...state,
    properties: state.properties.map((p) =>
      p.id === plot.propertyId ? { ...p, plots: p.plots.map((pl) => (pl.id === plot.id ? plot : pl)) } : p
    ),
  };
}

function findPlot(state: HydroponicsGameState, plotId: string): PlotState | undefined {
  return state.properties.flatMap((p) => p.plots).find((pl) => pl.id === plotId);
}

function maxOwnedTier(state: HydroponicsGameState): number {
  return state.properties.reduce((max, p) => Math.max(max, PROPERTIES.find((d) => d.id === p.id)?.tier ?? 0), 0);
}

function cropName(cropId: string): string {
  return CROPS.find((c) => c.id === cropId)?.name ?? cropId;
}

function propertyName(propertyId: string): string {
  return PROPERTIES.find((d) => d.id === propertyId)?.name ?? propertyId;
}

/** Plants one plot. Returns null when the plot or crop is not plantable. */
function plantOne(
  state: HydroponicsGameState,
  plotId: string,
  cropId: string,
  now: number,
): { state: HydroponicsGameState; seedCost: number } | null {
  const plot = findPlot(state, plotId);
  const crop = CROPS.find((c) => c.id === cropId);
  if (!plot || plot.cropId || !crop || crop.unlockTier > maxOwnedTier(state)) return null;
  const { plot: planted, seedCost } = plantCrop(plot, crop.id, state, now);
  return { state: replacePlot(state, planted), seedCost };
}

/** Harvests one ready plot into inventory. Returns null if not ready or storage is full. */
function harvestOne(state: HydroponicsGameState, plotId: string, now: number): HydroponicsGameState | null {
  const plot = findPlot(state, plotId);
  const result = plot ? harvestPlot(plot, state, now) : null;
  if (!plot || !result) return null;
  if (inventoryTotal(state.inventory) + result.amount > getInventoryCap(state.techUnlocked)) return null;

  const key = inventoryKey(result.cropId, result.qualityTier);
  const harvested = replacePlot(state, { ...plot, harvested: true, cropId: null, plantedAt: null });
  return withLog(
    {
      ...harvested,
      inventory: { ...state.inventory, [key]: (state.inventory[key] ?? 0) + result.amount },
      researchPoints: state.researchPoints + result.rp,
      totalHarvests: state.totalHarvests + 1,
      totalCropsGrown: {
        ...state.totalCropsGrown,
        [result.cropId]: (state.totalCropsGrown[result.cropId] ?? 0) + result.amount,
      },
    },
    now, "🌾",
    `Harvested ${result.amount}× ${cropName(result.cropId)} (${QUALITY_NAMES[result.qualityTier] ?? ""})`,
    "harvest",
  );
}

function plant(state: HydroponicsGameState, credits: number, plotId: string, cropId: string, now: number): ActionResult {
  const planted = plantOne(state, plotId, cropId, now);
  if (!planted) return fail("That plot cannot be planted with that crop.");
  if (credits < planted.seedCost) return fail("Not enough credits.");
  const plot = findPlot(planted.state, plotId);
  const logged = withLog(planted.state, now, "🌱", `Planted ${cropName(cropId)} in ${propertyName(plot?.propertyId ?? "")}`, "info");
  return done(logged, -planted.seedCost);
}

function harvest(state: HydroponicsGameState, plotId: string, now: number): ActionResult {
  const plot = findPlot(state, plotId);
  if (!plot || !harvestPlot(plot, state, now)) return fail("That plot is not ready to harvest.");
  const harvested = harvestOne(state, plotId, now);
  return harvested ? done(harvested) : fail("Storage is full. Sell some crops first.");
}

function harvestAll(state: HydroponicsGameState, propertyId: string, now: number): ActionResult {
  const property = state.properties.find((p) => p.id === propertyId);
  if (!property) return fail("You do not own that property.");
  const next = property.plots.reduce((acc, plot) => harvestOne(acc, plot.id, now) ?? acc, state);
  return next === state ? fail("Nothing could be harvested (not ready, or storage is full).") : done(next);
}

function replantAll(state: HydroponicsGameState, credits: number, propertyId: string, now: number): ActionResult {
  const property = state.properties.find((p) => p.id === propertyId);
  if (!property) return fail("You do not own that property.");
  const cropId = property.plots.find((p) => p.cropId)?.cropId;
  if (!cropId) return fail("Plant one plot first so there is a crop to copy.");

  let next = state;
  let totalCost = 0;
  let plantedCount = 0;
  for (const plot of property.plots) {
    const planted = plot.cropId ? null : plantOne(next, plot.id, cropId, now);
    if (!planted || totalCost + planted.seedCost > credits) continue;
    next = planted.state;
    totalCost += planted.seedCost;
    plantedCount += 1;
  }
  if (plantedCount === 0) return fail("Nothing was planted (no empty plots, or not enough credits).");
  const logged = withLog(next, now, "🌱", `Planted ${plantedCount}× ${cropName(cropId)} in ${propertyName(propertyId)}`, "info");
  return done(logged, -totalCost);
}

function sell(state: HydroponicsGameState, cropId: string, tier: number, amount: number, now: number): ActionResult {
  if (!CROPS.some((c) => c.id === cropId)) return fail("Unknown crop.");
  const key = inventoryKey(cropId, tier);
  const have = state.inventory[key] ?? 0;
  if (have < amount) return fail("You do not have that many to sell.");

  // Price comes from the server-side market, never from the request.
  const unitPrice = getSellPrice(cropId, tier, state.marketPrices, state.activeEvents);
  const total = unitPrice * amount;
  if (!Number.isSafeInteger(total) || total < 0 || total > INT32_MAX) return fail("That sale is too large. Sell a smaller amount.");

  const sold = {
    ...state,
    inventory: { ...state.inventory, [key]: have - amount },
    totalCreditsEarned: state.totalCreditsEarned + total,
  };
  return done(withLog(sold, now, "💰", `Sold ${amount}× ${cropName(cropId)} for ${total.toLocaleString("en-US")} cr`, "sale"), total);
}

function purchaseProperty(state: HydroponicsGameState, credits: number, propertyId: string): ActionResult {
  const result = buyProperty(propertyId, state);
  if (!result) return fail("That property is not available.");
  if (credits < result.cost) return fail("Not enough credits.");
  return done(result.state, -result.cost);
}

function hireStaff(
  state: HydroponicsGameState,
  credits: number,
  role: StaffMember["role"],
  skillLevel: number,
  now: number,
): ActionResult {
  if (maxOwnedTier(state) < STAFF_UNLOCK_TIER) return fail(`Own a Tier ${STAFF_UNLOCK_TIER} property to hire staff.`);
  if (state.staff.length >= getMaxStaff(state.properties)) return fail("Your staff roster is full.");
  const roleDef = STAFF_ROLES.find((r) => r.role === role);
  if (!roleDef) return fail("Unknown staff role.");
  const cost = getHireCost(skillLevel);
  if (credits < cost) return fail("Not enough credits.");

  const wageDiscount = getTechEffect(state.techUnlocked, "wageDiscount");
  const hired: StaffMember = {
    id: uid(),
    name: generateStaffName(),
    role,
    skillLevel,
    wagePerHour: Math.round(roleDef.baseWagePerHour * skillLevel * (1 - wageDiscount)),
    assignedPropertyId: null,
  };
  const next = { ...state, staff: [...state.staff, hired] };
  return done(withLog(next, now, "👤", `Hired ${hired.name} as ${role}`, "staff"), -cost);
}

function fireStaff(state: HydroponicsGameState, staffId: string, now: number): ActionResult {
  const member = state.staff.find((s) => s.id === staffId);
  if (!member) return fail("Staff member not found.");
  const next = { ...state, staff: state.staff.filter((s) => s.id !== staffId) };
  return done(withLog(next, now, "👤", `Fired ${member.name}`, "staff"));
}

function assignStaff(state: HydroponicsGameState, staffId: string, propertyId: string | null): ActionResult {
  if (!state.staff.some((s) => s.id === staffId)) return fail("Staff member not found.");
  if (propertyId !== null && !state.properties.some((p) => p.id === propertyId)) return fail("You do not own that property.");
  return done({
    ...state,
    staff: state.staff.map((s) => (s.id === staffId ? { ...s, assignedPropertyId: propertyId } : s)),
  });
}

function unlockTech(state: HydroponicsGameState, techId: string, now: number): ActionResult {
  const node = TECH_TREE.find((n) => n.id === techId);
  if (!node || !canUnlockTech(techId, state.techUnlocked, state.researchPoints)) return fail("That research is not available.");
  const next = {
    ...state,
    techUnlocked: [...state.techUnlocked, techId],
    researchPoints: state.researchPoints - node.rpCost,
  };
  return done(withLog(next, now, "🔬", `Researched ${node.name}`, "tech"));
}

function upgradeEquipment(
  state: HydroponicsGameState,
  credits: number,
  propertyId: string,
  equipmentId: string,
  now: number,
): ActionResult {
  const property = state.properties.find((p) => p.id === propertyId);
  const propertyDef = PROPERTIES.find((d) => d.id === propertyId);
  const equipment = EQUIPMENT.find((e) => e.id === equipmentId);
  if (!property || !propertyDef) return fail("You do not own that property.");
  if (!equipment) return fail("Unknown equipment.");
  const level = property.equipment[equipmentId] ?? 0;
  if (level >= equipment.maxLevel) return fail("That equipment is already maxed.");
  const cost = getEquipmentCost(equipmentId, level, propertyDef.tier);
  if (!Number.isSafeInteger(cost) || cost <= 0) return fail("Unknown equipment.");
  if (credits < cost) return fail("Not enough credits.");

  const next = {
    ...state,
    properties: state.properties.map((p) =>
      p.id === propertyId ? { ...p, equipment: { ...p.equipment, [equipmentId]: level + 1 } } : p
    ),
  };
  return done(withLog(next, now, "🔧", `Upgraded equipment on ${propertyDef.name}`, "purchase"), -cost);
}

/**
 * Applies one validated action to a sanitized state. Pure apart from the
 * engine's own randomness (quality rolls, staff names). `credits` is the
 * balance read inside the caller's transaction and is only used for
 * affordability checks; the caller still applies the delta with a guarded write.
 */
export function applyHydroponicsAction(
  state: HydroponicsGameState,
  credits: number,
  action: HydroponicsAction,
  now: number = Date.now(),
): ActionResult {
  switch (action.action) {
    case "plant": return plant(state, credits, action.plotId, action.cropId, now);
    case "harvest": return harvest(state, action.plotId, now);
    case "harvestAll": return harvestAll(state, action.propertyId, now);
    case "replantAll": return replantAll(state, credits, action.propertyId, now);
    case "sell": return sell(state, action.cropId, action.tier, action.amount, now);
    case "buyProperty": return purchaseProperty(state, credits, action.propertyId);
    case "hireStaff": return hireStaff(state, credits, action.role, action.skillLevel, now);
    case "fireStaff": return fireStaff(state, action.staffId, now);
    case "assignStaff": return assignStaff(state, action.staffId, action.propertyId);
    case "unlockTech": return unlockTech(state, action.techId, now);
    case "upgradeEquipment": return upgradeEquipment(state, credits, action.propertyId, action.equipmentId, now);
  }
}
