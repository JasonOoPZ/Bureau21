import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const addSchema = z.object({ targetCallsign: z.string().min(1).max(40) });
const updateSchema = z.object({
  id: z.string().min(1),
  blockComms: z.boolean().optional(),
  notes: z.string().max(200).optional(),
});
const removeSchema = z.object({ id: z.string().min(1) });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const entries = await prisma.watchlist.findMany({
    where: { pilotId: pilot.id },
    include: {
      targetPilot: {
        select: {
          id: true,
          userId: true,
          callsign: true,
          level: true,
          characterSlug: true,
          gender: true,
          currentSector: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const target = await prisma.pilotState.findFirst({
    where: { callsign: { equals: parsed.data.targetCallsign, mode: "insensitive" } },
    select: { id: true, callsign: true },
  });
  if (!target) return NextResponse.json({ error: "Pilot not found." }, { status: 404 });
  if (target.id === pilot.id) return NextResponse.json({ error: "You cannot watchlist yourself." }, { status: 400 });

  const existing = await prisma.watchlist.findUnique({
    where: { pilotId_targetPilotId: { pilotId: pilot.id, targetPilotId: target.id } },
  });
  if (existing) return NextResponse.json({ error: "Already on your watchlist." }, { status: 409 });

  const count = await prisma.watchlist.count({ where: { pilotId: pilot.id } });
  if (count >= 50) return NextResponse.json({ error: "Watchlist full (max 50)." }, { status: 400 });

  const entry = await prisma.watchlist.create({
    data: { pilotId: pilot.id, targetPilotId: target.id },
    include: {
      targetPilot: {
        select: {
          id: true,
          userId: true,
          callsign: true,
          level: true,
          characterSlug: true,
          gender: true,
          currentSector: true,
        },
      },
    },
  });

  return NextResponse.json({ entry });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const entry = await prisma.watchlist.findFirst({
    where: { id: parsed.data.id, pilotId: pilot.id },
  });
  if (!entry) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  const updated = await prisma.watchlist.update({
    where: { id: entry.id },
    data: {
      ...(parsed.data.blockComms !== undefined && { blockComms: parsed.data.blockComms }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
  });

  return NextResponse.json({ entry: updated });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const entry = await prisma.watchlist.findFirst({
    where: { id: parsed.data.id, pilotId: pilot.id },
  });
  if (!entry) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  await prisma.watchlist.delete({ where: { id: entry.id } });

  return NextResponse.json({ ok: true });
}
