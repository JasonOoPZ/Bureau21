import { authOptions } from "@/auth";
import { getOrCreateMissions } from "@/lib/game-state";
import { loadPilotForPlay } from "@/lib/pilot-sync";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Persists passive regeneration, so the console shows current vitals.
  const state = await loadPilotForPlay(session.user.id, session.user.name);
  const missions = await getOrCreateMissions(state.id);

  // Re-fetch with inventory included
  const fullState = await prisma.pilotState.findUnique({
    where: { userId: session.user.id },
    include: { missions: true, inventory: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json({ state: fullState, missions });
}
