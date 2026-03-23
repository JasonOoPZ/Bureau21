import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(3).max(40),
  tag: z
    .string()
    .min(2)
    .max(6)
    .regex(/^[A-Z0-9]+$/, "Tag must be uppercase letters/numbers only."),
  description: z.string().max(200).optional(),
});

// GET — list syndicates (top 20 by member count)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await prisma.pilotState.findUnique({
    where: { userId: session.user.id },
    include: { syndicateMember: { include: { syndicate: { include: { members: true } } } } },
  });

  const syndicates = await prisma.syndicate.findMany({
    include: { members: true },
    orderBy: { members: { _count: "desc" } },
    take: 20,
  });

  return NextResponse.json({
    current: pilot?.syndicateMember?.syndicate ?? null,
    currentRole: pilot?.syndicateMember?.role ?? null,
    syndicates: syndicates.map((s) => ({
      id: s.id,
      name: s.name,
      tag: s.tag,
      description: s.description,
      treasury: s.treasury,
      leaderId: s.leaderId,
      memberCount: s.members.length,
    })),
  });
}

// POST — create a new syndicate
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Already in a syndicate?
  const existing = await prisma.syndicateMember.findUnique({ where: { pilotId: pilot.id } });
  if (existing) {
    return NextResponse.json({ error: "Leave your current syndicate first." }, { status: 400 });
  }

  // Name / tag uniqueness
  const { name, tag, description } = parsed.data;
  const conflict = await prisma.syndicate.findFirst({
    where: { OR: [{ name }, { tag }] },
  });
  if (conflict) {
    return NextResponse.json({ error: "That name or tag is already taken." }, { status: 400 });
  }

  const syndicate = await prisma.syndicate.create({
    data: {
      name,
      tag: tag.toUpperCase(),
      description: description ?? "",
      leaderId: pilot.id,
      members: { create: { pilotId: pilot.id, role: "leader" } },
    },
    include: { members: true },
  });

  return NextResponse.json({ syndicate });
}
