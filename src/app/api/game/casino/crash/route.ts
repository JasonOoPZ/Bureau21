import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Void Runner (formerly Crash) -- server-side bet tracking.
 *
 * Flow:
 *   POST   -> place bet, deduct credits, store in-memory game state
 *   PUT    -> cash out (player chose to stop), calculate payout from elapsed time
 *   DELETE -> player died (hit wall), record loss
 *   GET    -> check if a game is active
 *
 * The multiplier is computed server-side from elapsed time: e^(t * 0.12)
 * where t is seconds since game start. This mirrors the client exactly.
 */

const activeGames = new Map<
  string,
  { bet: number; startedAt: number; pilotId: string; settled: boolean }
>();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;

  if (activeGames.has(uid)) {
    return NextResponse.json(
      { error: "Game already running." },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    bet?: number;
  } | null;
  const bet = body?.bet;

  if (!bet || !Number.isInteger(bet) || bet < 10 || bet > 1_000_000) {
    return NextResponse.json(
      { error: "Invalid bet (10-1,000,000)." },
      { status: 400 }
    );
  }

  const pilot = await prisma.pilotState.findUnique({
    where: { userId: uid },
    select: { id: true, credits: true },
  });
  if (!pilot)
    return NextResponse.json({ error: "Pilot not found." }, { status: 404 });
  if (pilot.credits < bet)
    return NextResponse.json(
      { error: "Not enough credits." },
      { status: 400 }
    );

  await prisma.pilotState.update({
    where: { userId: uid },
    data: { credits: { decrement: bet } },
  });

  activeGames.set(uid, {
    bet,
    startedAt: Date.now(),
    pilotId: pilot.id,
    settled: false,
  });

  return NextResponse.json({ status: "started" });
}

// PUT -- cash out
export async function PUT() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const game = activeGames.get(uid);
  if (!game || game.settled)
    return NextResponse.json(
      { error: "No active game." },
      { status: 400 }
    );

  game.settled = true;

  const elapsedMs = Date.now() - game.startedAt;
  // Must have played at least 500ms to prevent instant cash-out exploits
  const elapsedSec = Math.max(elapsedMs / 1000, 0.5);
  const multiplier = parseFloat(
    Math.pow(Math.E, elapsedSec * 0.12).toFixed(2)
  );

  const payout = Math.floor(game.bet * multiplier);

  await prisma.pilotState.update({
    where: { userId: uid },
    data: { credits: { increment: payout } },
  });
  await prisma.casinoBet.create({
    data: {
      pilotId: game.pilotId,
      game: "crash",
      bet: game.bet,
      payout,
      net: payout - game.bet,
    },
  });

  activeGames.delete(uid);

  return NextResponse.json({
    status: "cashed_out",
    multiplier,
    payout,
    label: `Cashed out at ${multiplier}x! Won ${payout.toLocaleString()} credits`,
  });
}

// DELETE -- player died (hit wall)
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const game = activeGames.get(uid);
  if (!game || game.settled)
    return NextResponse.json(
      { error: "No active game." },
      { status: 400 }
    );

  game.settled = true;

  const elapsedMs = Date.now() - game.startedAt;
  const multiplier = parseFloat(
    Math.pow(Math.E, (elapsedMs / 1000) * 0.12).toFixed(2)
  );

  await prisma.casinoBet.create({
    data: {
      pilotId: game.pilotId,
      game: "crash",
      bet: game.bet,
      payout: 0,
      net: -game.bet,
    },
  });

  activeGames.delete(uid);

  return NextResponse.json({
    status: "crashed",
    multiplier,
    label: `Crashed at ${multiplier}x! Lost ${game.bet.toLocaleString()} credits`,
  });
}

// GET -- check if a game is active (auto-expire stale games after 10 min)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const game = activeGames.get(uid);

  if (!game) {
    return NextResponse.json({ status: "idle" });
  }

  // Auto-expire after 10 minutes (safety net)
  const elapsed = Date.now() - game.startedAt;
  if (elapsed > 600_000 && !game.settled) {
    game.settled = true;
    await prisma.casinoBet.create({
      data: {
        pilotId: game.pilotId,
        game: "crash",
        bet: game.bet,
        payout: 0,
        net: -game.bet,
      },
    });
    activeGames.delete(uid);
    return NextResponse.json({ status: "expired" });
  }

  return NextResponse.json({ status: "running" });
}
