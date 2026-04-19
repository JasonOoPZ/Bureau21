import { authOptions } from "@/auth";
import { GymConsole } from "@/components/game/gym-console";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { GAME_CONSTANTS, getConfidenceCap, computeGymEnergy } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

export default async function GymPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Resolve gym energy (daily reset)
  const now = new Date();
  const hoursSinceReset =
    (now.getTime() - pilot.lastGymEnergyAt.getTime()) / (1000 * 60 * 60);
  const energyBreakdown = computeGymEnergy(pilot.endurance, pilot.gymStreak);
  let currentEnergy = pilot.gymEnergy;
  let didReset = false;

  if (hoursSinceReset >= GAME_CONSTANTS.GYM_ENERGY_RESET_HOURS) {
    currentEnergy = energyBreakdown.max;
    didReset = true;
    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { gymEnergy: currentEnergy, lastGymEnergyAt: now },
    });
  } else {
    currentEnergy = Math.min(pilot.gymEnergy, energyBreakdown.max);
  }

  const hoursUntilReset = didReset
    ? GAME_CONSTANTS.GYM_ENERGY_RESET_HOURS
    : Math.max(0, GAME_CONSTANTS.GYM_ENERGY_RESET_HOURS - hoursSinceReset);

  // Fetch last 30 days of gym logs
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const gymLogs = await prisma.gymLog.findMany({
    where: { pilotId: pilot.id, createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: "desc" },
    select: { training: true, gain: true, energyCost: true, createdAt: true },
  });

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-5xl space-y-3">
          <PixelBanner scene="gym" title="Galaxy Gym" subtitle="Burn energy to train your stats." />

          <GymConsole
            initial={{
              gymEnergy: currentEnergy,
              energyBreakdown,
              hoursUntilReset,
              gymStreak: pilot.gymStreak,
              lastGymAt: pilot.lastGymAt?.toISOString() ?? null,
              strength: pilot.strength,
              speed: pilot.speed,
              endurance: pilot.endurance,
              panic: pilot.panic,
              confidence: pilot.confidence,
              confidenceCap: getConfidenceCap(pilot.characterSlug),
              trainingOptions: [
                { key: "strength", label: "Strength", cost: 8 },
                { key: "speed", label: "Speed", cost: 8 },
                { key: "endurance", label: "Endurance", cost: 5 },
                { key: "panic_control", label: "Panic Control", cost: 10 },
              ],
              gymLogs: gymLogs.map((l) => ({
                ...l,
                createdAt: l.createdAt.toISOString(),
              })),
            }}
          />
        </div>
      </main>
    </>
  );
}
