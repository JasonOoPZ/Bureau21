/**
 * HYDROPONICS BAY — Type Definitions
 * ====================================
 * Interfaces for the full game state persisted to DB as JSON.
 */

/* ─── Per-Plot State ──────────────────────────────────────────────── */

export interface PlotState {
  id: string;                 // unique plot id
  propertyId: string;
  plotType: "indoor" | "outdoor";
  cropId: string | null;      // null = empty
  plantedAt: number | null;   // epoch ms
  growthMs: number;            // total growth time for this plot (after all bonuses)
  yieldAmount: number;         // pre-calculated yield (after bonuses)
  qualityTier: number | null;  // 1-5, rolled at plant time for prediction, finalized at harvest
  harvested: boolean;
}

/* ─── Owned Property ──────────────────────────────────────────────── */

export interface OwnedProperty {
  id: string;                  // matches PropertyDef.id
  plots: PlotState[];
  equipment: Record<string, number>;  // equipmentId -> level (0 = not purchased)
}

/* ─── Staff ───────────────────────────────────────────────────────── */

export interface StaffMember {
  id: string;
  name: string;
  role: "gardener" | "harvester" | "botanist" | "security";
  skillLevel: number;          // 1–10
  wagePerHour: number;
  assignedPropertyId: string | null;
}

/* ─── Inventory ───────────────────────────────────────────────────── */

/** Inventory keyed as `${cropId}:${qualityTier}` -> amount */
export type Inventory = Record<string, number>;

/* ─── Active Events ───────────────────────────────────────────────── */

export interface ActiveEvent {
  id: string;              // unique event instance id
  eventDefId: string;      // references EventDef.id
  propertyId: string;
  cropId?: string;         // for black_market events
  expiresAt: number;       // epoch ms
  appliedAt: number;       // epoch ms
}

/* ─── Event Log ───────────────────────────────────────────────────── */

export interface EventLogEntry {
  timestamp: number;
  icon: string;
  message: string;
  type: "event" | "harvest" | "sale" | "purchase" | "staff" | "tech" | "info";
}

/* ─── Full Game State (persisted as JSON) ─────────────────────────── */

export interface HydroponicsGameState {
  initialized: boolean;

  // Properties
  properties: OwnedProperty[];

  // Inventory
  inventory: Inventory;

  // Staff
  staff: StaffMember[];

  // Market
  marketPrices: Record<string, number>;       // cropId -> current price
  marketHistory: Record<string, number[]>;    // cropId -> last N prices
  marketLastTick: number;                      // epoch ms

  // Tech tree
  techUnlocked: string[];                      // node IDs
  researchPoints: number;

  // Events
  eventLog: EventLogEntry[];
  activeEvents: ActiveEvent[];
  lastEventCheck: number;                      // epoch ms

  // Season
  seasonEpoch: number;                         // fixed epoch for season cycling

  // Timestamps
  lastSave: number;                            // epoch ms
  lastOnline: number;                          // epoch ms
  lastWageDeduction: number;                   // epoch ms

  // Stats
  totalHarvests: number;
  totalCreditsEarned: number;
  totalCropsGrown: Record<string, number>;     // cropId -> count
}
