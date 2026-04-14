import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { GAME_CONSTANTS, calculateATK, calculateDEF } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// NPC fighters for the pit
const PIT_FIGHTERS = [
  { name: "Scrapyard Berserker", level: 3, str: 8, spd: 6, end: 0.5, panic: 5, conf: 15, lf: 30, split: 60 },
  { name: "Sewer Rat", level: 5, str: 12, spd: 9, end: 0.8, panic: 10, conf: 20, lf: 50, split: 50 },
  { name: "Dock Bruiser", level: 8, str: 20, spd: 14, end: 1.0, panic: 8, conf: 25, lf: 80, split: 55 },
  { name: "Pit Veteran", level: 12, str: 35, spd: 22, end: 1.5, panic: 5, conf: 35, lf: 120, split: 50 },
  { name: "Iron Jaw", level: 16, str: 55, spd: 30, end: 2.0, panic: 3, conf: 40, lf: 160, split: 45 },
  { name: "The Reaper", level: 20, str: 80, spd: 45, end: 2.5, panic: 1, conf: 50, lf: 200, split: 50 },
];

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const now = new Date();
  const minutesElapsed = Math.floor((now.getTime() - pilot.lastMotivationAt.getTime()) / (1000 * 60));
  const regenAmount = Math.floor(minutesElapsed / GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES);
  const currentMotivation = Math.min(pilot.motivation + regenAmount, GAME_CONSTANTS.MOTIVATION_CAP_FREE);

  if (currentMotivation < 15) {
    return NextResponse.json({ error: "Need 15 motivation to enter the pit." }, { status: 400 });
  }

  if (pilot.lifeForce < 5) {
    return NextResponse.json({ error: "Too injured to fight. Recover life force first." }, { status: 400 });
  }

  const entryFee = 100;
  if (pilot.credits < entryFee) {
    return NextResponse.json({ error: `Need ${entryFee} credits entry fee.` }, { status: 400 });
  }

  // Match pilot against appropriate NPC
  const eligible = PIT_FIGHTERS.filter((f) => f.level <= pilot.level + 5);
  const opponent = eligible.length > 0 ? eligible[Math.floor(Math.random() * eligible.length)] : PIT_FIGHTERS[0];

  // Simple combat simulation
  const pilotAtk = calculateATK(pilot.strength, pilot.atkSplit, 0);
  const pilotDef = calculateDEF(pilot.strength, pilot.atkSplit, 0);
  const oppAtk = calculateATK(opponent.str, opponent.split, 0);
  const oppDef = calculateDEF(opponent.str, opponent.split, 0);

  let pilotHP = pilot.lifeForce;
  let oppHP = opponent.lf;
  const rounds: string[] = [];
  let round = 0;

  while (pilotHP > 0 && oppHP > 0 && round < 20) {
    round++;
    // Pilot attacks
    const pilotDmg = Math.max(1, Math.floor(pilotAtk * (1 + pilot.speed / 100) - oppDef * 0.3 + (Math.random() * 4 - 2)));
    oppHP -= pilotDmg;
    rounds.push(`R${round}: You hit ${opponent.name} for ${pilotDmg} damage.`);

    if (oppHP <= 0) break;

    // Opponent attacks
    const oppDmg = Math.max(1, Math.floor(oppAtk * (1 + opponent.spd / 100) - pilotDef * 0.3 + (Math.random() * 4 - 2)));
    pilotHP -= oppDmg;
    rounds.push(`R${round}: ${opponent.name} hits you for ${oppDmg} damage.`);
  }

  const won = oppHP <= 0;
  const creditsReward = won ? opponent.level * 25 : 0;
  const xpReward = won ? opponent.level * 15 : Math.floor(opponent.level * 3);
  const lfLost = Math.max(0, pilot.lifeForce - Math.max(0, pilotHP));

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      motivation: currentMotivation - 15,
      lastMotivationAt: now,
      credits: { increment: creditsReward - entryFee },
      xp: { increment: xpReward },
      lifeForce: Math.max(0, pilotHP),
    },
  });

  return NextResponse.json({
    won,
    opponent: opponent.name,
    opponentLevel: opponent.level,
    rounds,
    creditsReward: won ? creditsReward : 0,
    entryFee,
    netCredits: creditsReward - entryFee,
    xpReward,
    lfLost,
    lfRemaining: Math.max(0, pilotHP),
    motivationLeft: currentMotivation - 15,
  });
}
