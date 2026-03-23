import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const joinSchema = z.object({ tag: z.string().min(2).max(6) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tag." }, { status: 400 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const alreadyIn = await prisma.syndicateMember.findUnique({ where: { pilotId: pilot.id } });
  if (alreadyIn) {
    return NextResponse.json({ error: "Leave your current syndicate first." }, { status: 400 });
  }

  const syndicate = await prisma.syndicate.findUnique({
    where: { tag: parsed.data.tag.toUpperCase() },
  });
  if (!syndicate) {
    return NextResponse.json({ error: "No syndicate found with that tag." }, { status: 404 });
  }

  await prisma.syndicateMember.create({
    data: { syndicateId: syndicate.id, pilotId: pilot.id, role: "member" },
  });

  return NextResponse.json({ success: true, syndicate });
}
