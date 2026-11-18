import { authOptions } from "@/auth";
import { guardedPilotUpdate } from "@/lib/economy";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const CLAIM_COOLDOWN_HOURS = 24;
const MS_PER_HOUR = 1000 * 60 * 60;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Income scales with level
  const baseIncome = 50;
  const levelBonus = pilot.level * 10;
  const income = baseIncome + levelBonus;
  const xpGain = 10 + pilot.level * 2;

  // Can only claim every 24 hours. Claiming the cooldown and paying out are one
  // statement, so parallel claims pay exactly once.
  const now = new Date();
  const cutoff = new Date(now.getTime() - CLAIM_COOLDOWN_HOURS * MS_PER_HOUR);
  const updated = await guardedPilotUpdate(
    prisma,
    session.user.id,
    { OR: [{ lastOutpostClaim: null }, { lastOutpostClaim: { lte: cutoff } }] },
    {
      credits: { increment: income },
      xp: { increment: xpGain },
      lastOutpostClaim: now,
    }
  );

  if (!updated) {
    const lastClaim = pilot.lastOutpostClaim ?? now;
    const hoursSince = (now.getTime() - new Date(lastClaim).getTime()) / MS_PER_HOUR;
    const hoursLeft = Math.max(1, Math.ceil(CLAIM_COOLDOWN_HOURS - hoursSince));
    return NextResponse.json({ error: `Outpost supplies replenish in ${hoursLeft}h.` }, { status: 400 });
  }

  return NextResponse.json({
    creditsClaimed: income,
    xpClaimed: xpGain,
    credits: updated.credits,
    nextClaimIn: "24 hours",
  });
}
