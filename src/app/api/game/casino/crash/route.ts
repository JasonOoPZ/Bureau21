import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// In-memory crash game state per user
const activeCrash = new Map<string, { bet: number; multiplier: number; crashPoint: number; startedAt: number }>();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bet } = await request.json() as { bet: number };
  const uid = session.user.id;

  if (activeCrash.has(uid)) {
    return NextResponse.json({ error: "Crash game already running." }, { status: 400 });
  }

  if (!Number.isInteger(bet) || bet < 10 || bet > 1_000_000) {
    return NextResponse.json({ error: "Invalid bet (10–1,000,000)." }, { status: 400 });
  }

  const pilot = await prisma.pilotState.findUnique({ where: { userId: uid } });
  if (!pilot) return NextResponse.json({ error: "Pilot not found." }, { status: 404 });
  if (pilot.credits < bet) return NextResponse.json({ error: "Not enough credits." }, { status: 400 });

  await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { decrement: bet } } });

  // Generate crash point (house edge ~3%)
  const r = Math.random();
  const crashPoint = r < 0.03 ? 1.0 : Math.max(1.0, parseFloat((0.97 / (1 - r)).toFixed(2)));

  activeCrash.set(uid, { bet, multiplier: 1.0, crashPoint, startedAt: Date.now() });

  return NextResponse.json({ status: "started", crashPoint_hint: "hidden" });
}

// GET to poll current multiplier
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const game = activeCrash.get(session.user.id);
  if (!game) return NextResponse.json({ status: "idle" });

  // Calculate current multiplier based on elapsed time
  const elapsed = (Date.now() - game.startedAt) / 1000;
  const currentMult = parseFloat(Math.pow(Math.E, elapsed * 0.08).toFixed(2));

  if (currentMult >= game.crashPoint) {
    activeCrash.delete(session.user.id);
    return NextResponse.json({
      status: "crashed",
      crashPoint: game.crashPoint,
      payout: 0,
      label: `Crashed at ${game.crashPoint}x!`,
    });
  }

  return NextResponse.json({
    status: "running",
    multiplier: currentMult,
  });
}

// PUT to cash out
export async function PUT() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const game = activeCrash.get(uid);
  if (!game) return NextResponse.json({ error: "No active crash game." }, { status: 400 });

  const elapsed = (Date.now() - game.startedAt) / 1000;
  const currentMult = parseFloat(Math.pow(Math.E, elapsed * 0.08).toFixed(2));

  if (currentMult >= game.crashPoint) {
    activeCrash.delete(uid);
    return NextResponse.json({
      status: "crashed",
      crashPoint: game.crashPoint,
      payout: 0,
      label: `Too late! Crashed at ${game.crashPoint}x`,
    });
  }

  const payout = Math.floor(game.bet * currentMult);
  await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { increment: payout } } });
  activeCrash.delete(uid);

  return NextResponse.json({
    status: "cashed_out",
    multiplier: currentMult,
    payout,
    label: `Cashed out at ${currentMult}x! Won ${payout} ₡`,
  });
}
