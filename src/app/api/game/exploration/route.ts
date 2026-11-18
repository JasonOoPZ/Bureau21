import { authOptions } from "@/auth";
import { guardedPilotUpdate, settleLevelProgression } from "@/lib/economy";
import { loadPilotForPlay } from "@/lib/pilot-sync";
import { planMotivationSpend } from "@/lib/vitals";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const MOTIVATION_COST = 20;
const FUEL_COST = 5;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Regenerated fuel is persisted first, so the fuel check is never stale.
  const pilot = await loadPilotForPlay(session.user.id, session.user.name);
  const spend = planMotivationSpend(pilot, MOTIVATION_COST);

  if (spend.available < MOTIVATION_COST) {
    return NextResponse.json({ error: "Need 20 motivation to explore." }, { status: 400 });
  }

  if (pilot.fuel < FUEL_COST) {
    return NextResponse.json({ error: "Need 5 fuel to launch an expedition." }, { status: 400 });
  }

  // Random exploration event
  const roll = Math.random();
  let event: string;
  let creditsGained = 0;
  let xpGained = 0;
  let oreGained = 0;
  let herbsGained = 0;
  let eventType: string;

  if (roll < 0.03) {
    event = "Discovered an abandoned station! Massive haul of credits and resources.";
    creditsGained = 500;
    xpGained = 100;
    oreGained = 20;
    eventType = "legendary";
  } else if (roll < 0.10) {
    event = "Found a derelict freighter drifting in the void. Salvaged valuable cargo.";
    creditsGained = 200;
    xpGained = 50;
    eventType = "rare";
  } else if (roll < 0.20) {
    event = "Scanned an asteroid field rich with minerals.";
    oreGained = 15;
    xpGained = 25;
    eventType = "uncommon";
  } else if (roll < 0.35) {
    event = "Mapped a new sector route. Navigation data sold for credits.";
    creditsGained = 75;
    xpGained = 30;
    eventType = "common";
  } else if (roll < 0.50) {
    event = "Found a patch of space-borne flora clinging to a rogue asteroid.";
    herbsGained = 5;
    xpGained = 15;
    eventType = "common";
  } else if (roll < 0.70) {
    event = "Quiet sector. Nothing of note, but the void is always watching.";
    xpGained = 10;
    eventType = "empty";
  } else {
    event = "Sensors picked up interference. Wasted fuel chasing ghost signals.";
    xpGained = 5;
    eventType = "miss";
  }

  // One guarded write: the motivation snapshot must be unchanged
  // (compare-and-swap) and the fuel must still be there, so N parallel
  // expeditions from one snapshot pay for, and reward, exactly one.
  const updated = await guardedPilotUpdate(
    prisma,
    session.user.id,
    { ...spend.guard, fuel: { gte: FUEL_COST } },
    {
      ...spend.data,
      fuel: { decrement: FUEL_COST },
      credits: { increment: creditsGained },
      xp: { increment: xpGained },
      ore: { increment: oreGained },
      herbs: { increment: herbsGained },
    }
  );
  if (!updated) {
    return NextResponse.json(
      { error: "Another action is still resolving. Try again." },
      { status: 409 }
    );
  }

  await settleLevelProgression(prisma, session.user.id);

  return NextResponse.json({
    event,
    eventType,
    creditsGained,
    xpGained,
    oreGained,
    herbsGained,
    motivationLeft: updated.motivation,
    fuelLeft: updated.fuel,
  });
}
