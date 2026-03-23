import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const HYDRO_COOLDOWN_MINUTES = 60;
const CREDIT_MIN = 20;
const CREDIT_MAX = 50;
const LF_RESTORE = 10;
const PLOTS = 3;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const state = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });

  const lastHydroAt = state?.lastHydroAt ?? new Date(0);
  const nowMs = Date.now();
  const elapsedMinutes = (nowMs - lastHydroAt.getTime()) / 60000;
  const cooldownRemaining = Math.max(0, Math.ceil(HYDRO_COOLDOWN_MINUTES - elapsedMinutes));
  const ready = cooldownRemaining === 0;

  return NextResponse.json({
    plots: PLOTS,
    ready,
    cooldownRemaining,
    cooldownMinutes: HYDRO_COOLDOWN_MINUTES,
    lastHydroAt: lastHydroAt.toISOString(),
    credits: pilot.credits,
    lifeForce: pilot.lifeForce,
    herbs: state?.herbs ?? 0,
  });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const state = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });
  if (!state) {
    return NextResponse.json({ error: "Pilot not found." }, { status: 404 });
  }

  const lastHydroAt = state.lastHydroAt ?? new Date(0);
  const elapsedMinutes = (Date.now() - lastHydroAt.getTime()) / 60000;

  if (elapsedMinutes < HYDRO_COOLDOWN_MINUTES) {
    const remaining = Math.ceil(HYDRO_COOLDOWN_MINUTES - elapsedMinutes);
    return NextResponse.json(
      { error: `Plots are not ready. Come back in ${remaining} minute${remaining === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }

  const creditGain = Math.floor(Math.random() * (CREDIT_MAX - CREDIT_MIN + 1)) + CREDIT_MIN;
  const herbGain = Math.random() < 0.4 ? 1 : 0; // 40% chance of a blue herb
  const newHerbs = (state.herbs ?? 0) + herbGain;
  const newLf = Math.min(state.lifeForce + LF_RESTORE, state.level * 2 + 20);

  await prisma.pilotState.update({
    where: { userId: session.user.id },
    data: {
      credits: { increment: creditGain },
      lifeForce: newLf,
      herbs: newHerbs,
      lastHydroAt: new Date(),
    },
  });

  return NextResponse.json({
    creditGain,
    lfRestore: newLf - state.lifeForce,
    herbGain,
    herbs: newHerbs,
    message: herbGain
      ? `Harvest complete! +${creditGain} credits, +${LF_RESTORE} LF, and a Blue Herb was found in plot 3!`
      : `Harvest complete! +${creditGain} credits and +${LF_RESTORE} Life Force restored.`,
  });
}
