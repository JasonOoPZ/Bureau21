import { authOptions } from "@/auth";
import { guardedPilotUpdate, settleLevelProgression } from "@/lib/economy";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { GAME_CONSTANTS, xpForLevel } from "@/lib/constants";
import { maxLifeForce } from "@/lib/vitals";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["credits", "xp", "level"]),
});

/** Reset daily training count if a new day has started */
function resolveSimReset(trainsToday: number, lastTrainAt: Date | null): { trainsToday: number; didReset: boolean } {
  if (!lastTrainAt) return { trainsToday: 0, didReset: true };
  const now = new Date();
  const hktNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const hktLast = new Date(lastTrainAt.getTime() + 8 * 60 * 60 * 1000);
  const nowDay = `${hktNow.getUTCFullYear()}-${hktNow.getUTCMonth()}-${hktNow.getUTCDate()}`;
  const lastDay = `${hktLast.getUTCFullYear()}-${hktLast.getUTCMonth()}-${hktLast.getUTCDate()}`;
  if (nowDay !== lastDay) return { trainsToday: 0, didReset: true };
  return { trainsToday, didReset: false };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const { trainsToday } = resolveSimReset(pilot.simTrainsToday, pilot.lastSimTrainAt);
  const remaining = Math.max(0, GAME_CONSTANTS.BATTLE_VILLAGE_TRAINS_PER_DAY - trainsToday);

  return NextResponse.json({
    trainsToday,
    trainsRemaining: remaining,
    maxTrains: GAME_CONSTANTS.BATTLE_VILLAGE_TRAINS_PER_DAY,
    creditReward: Math.floor(pilot.level * GAME_CONSTANTS.SIM_CREDIT_MULTIPLIER),
    xpReward: Math.floor(pilot.level * GAME_CONSTANTS.SIM_XP_MULTIPLIER),
    levelChance: GAME_CONSTANTS.SIM_LEVEL_CHANCE,
    level: pilot.level,
    xp: pilot.xp,
    credits: pilot.credits,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const { trainsToday } = resolveSimReset(pilot.simTrainsToday, pilot.lastSimTrainAt);

  if (trainsToday >= GAME_CONSTANTS.BATTLE_VILLAGE_TRAINS_PER_DAY) {
    return NextResponse.json({ error: "No training sessions remaining today." }, { status: 429 });
  }

  const newTrainCount = trainsToday + 1;
  const type = parsed.data.type;
  let message = "";
  let creditsGain = 0;
  let xpGain = 0;
  let leveledUp = false;

  if (type === "credits") {
    creditsGain = Math.floor(pilot.level * GAME_CONSTANTS.SIM_CREDIT_MULTIPLIER);
    message = `Combat simulation complete. Earned ${creditsGain.toLocaleString()} credits.`;
  } else if (type === "xp") {
    xpGain = Math.floor(pilot.level * GAME_CONSTANTS.SIM_XP_MULTIPLIER);
    message = `Training drill finished. Gained ${xpGain} XP.`;
  } else if (type === "level") {
    const roll = Math.floor(Math.random() * GAME_CONSTANTS.SIM_LEVEL_CHANCE) + 1;
    if (roll === 1) {
      leveledUp = true;
      message = `Extraordinary performance! You advanced to level ${pilot.level + 1}! All current XP was consumed in the process.`;
    } else {
      message = `The risky maneuver didn't pay off. Your accumulated XP was lost in the attempt. (Roll: ${roll}/${GAME_CONSTANTS.SIM_LEVEL_CHANCE})`;
    }
  }

  // Apply results. The daily counter is claimed with a compare-and-swap on
  // (simTrainsToday, lastSimTrainAt): of N parallel sessions computed from the
  // same snapshot exactly one is counted and rewarded. Rewards are relative.
  const now = new Date();
  const claimed = await guardedPilotUpdate(
    prisma,
    session.user.id,
    { simTrainsToday: pilot.simTrainsToday, lastSimTrainAt: pilot.lastSimTrainAt },
    {
      credits: { increment: creditsGain },
      // the level gamble consumes all XP, win or lose
      xp: type === "level" ? 0 : { increment: xpGain },
      ...(leveledUp
        ? {
            level: { increment: 1 },
            unspentPoints: { increment: GAME_CONSTANTS.POINTS_PER_LEVEL },
          }
        : {}),
      simTrainsToday: newTrainCount,
      lastSimTrainAt: now,
      lastActionAt: now,
    }
  );

  if (!claimed) {
    return NextResponse.json(
      { error: "Another training session is still resolving. Try again." },
      { status: 409 }
    );
  }

  if (leveledUp) {
    // Level-up refill: raise LF to the new max (which includes allocated HP),
    // but never lower LF that is already above it.
    const newMax = maxLifeForce(claimed);
    await guardedPilotUpdate(prisma, session.user.id, { lifeForce: { lt: newMax } }, { lifeForce: newMax });
  }

  const settled = type === "xp" ? await settleLevelProgression(prisma, session.user.id) : null;
  const progressed = { level: settled?.level ?? claimed.level, xp: settled?.xp ?? claimed.xp };

  const remaining = Math.max(0, GAME_CONSTANTS.BATTLE_VILLAGE_TRAINS_PER_DAY - newTrainCount);

  return NextResponse.json({
    message,
    type,
    creditsGain,
    xpGain,
    leveledUp,
    trainsRemaining: remaining,
    level: progressed.level,
    xp: progressed.xp,
    xpNeeded: xpForLevel(progressed.level),
    credits: claimed.credits,
  });
}
