import type { Prisma } from "@prisma/client";
import { guardedPilotUpdate, type Db } from "@/lib/economy";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import {
  applyPassiveRegeneration,
  FUEL_CAP,
  HULL_CAP,
  maxLifeForce,
  type VitalsState,
} from "@/lib/vitals";

type VitalsRow = VitalsState & { userId: string };

/**
 * Bring a pilot's fuel, hull and Life Force up to date and persist the result.
 *
 * Call this wherever those stats are read for gameplay (and before they are
 * spent), so every route sees the same regenerated values and an offline
 * pilot who is attacked has regenerated too.
 *
 * Concurrency: the write is a compare-and-swap on `lastFuelRegen`, so of N
 * parallel callers exactly one grants a given interval. Gains are increments,
 * each guarded so it cannot push a stat past its cap if something else healed
 * the pilot between the read and the write. When the write does not apply the
 * fresh row is returned instead, and regen simply runs on a later call.
 */
export async function syncVitals<T extends VitalsRow>(
  db: Db,
  pilot: T,
  now: Date = new Date()
): Promise<T> {
  const regen = applyPassiveRegeneration(pilot, now);
  if (regen.lastFuelRegen === pilot.lastFuelRegen) return pilot;

  const fuelGain = regen.fuel - pilot.fuel;
  const hullGain = regen.hull - pilot.hull;
  const lifeForceGain = regen.lifeForce - pilot.lifeForce;

  const guard: Prisma.PilotStateWhereInput = {
    lastFuelRegen: pilot.lastFuelRegen,
    ...(fuelGain > 0 ? { fuel: { lte: FUEL_CAP - fuelGain } } : {}),
    ...(hullGain > 0 ? { hull: { lte: HULL_CAP - hullGain } } : {}),
    ...(lifeForceGain > 0 ? { lifeForce: { lte: maxLifeForce(pilot) - lifeForceGain } } : {}),
  };

  const applied = await guardedPilotUpdate(db, pilot.userId, guard, {
    fuel: { increment: fuelGain },
    hull: { increment: hullGain },
    lifeForce: { increment: lifeForceGain },
    lastFuelRegen: regen.lastFuelRegen,
  });

  const fresh = applied ?? (await db.pilotState.findUnique({ where: { userId: pilot.userId } }));
  return fresh ? { ...pilot, ...fresh } : pilot;
}

/** The pilot (created on first use) with passive regeneration applied. */
export async function loadPilotForPlay(userId: string, displayName?: string | null) {
  const pilot = await getOrCreatePilotState(userId, displayName);
  return syncVitals(prisma, pilot);
}
