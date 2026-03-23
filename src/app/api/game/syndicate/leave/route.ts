import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const membership = await prisma.syndicateMember.findUnique({
    where: { pilotId: pilot.id },
    include: { syndicate: { include: { members: true } } },
  });

  if (!membership) {
    return NextResponse.json({ error: "You are not in a syndicate." }, { status: 400 });
  }

  const isLeader = membership.syndicate.leaderId === pilot.id;
  const memberCount = membership.syndicate.members.length;

  if (isLeader && memberCount > 1) {
    return NextResponse.json(
      { error: "Transfer leadership before leaving. You are the only leader." },
      { status: 400 }
    );
  }

  await prisma.syndicateMember.delete({ where: { pilotId: pilot.id } });

  // Disband if last member
  if (memberCount === 1) {
    await prisma.syndicate.delete({ where: { id: membership.syndicateId } });
    return NextResponse.json({ success: true, disbanded: true });
  }

  return NextResponse.json({ success: true, disbanded: false });
}
