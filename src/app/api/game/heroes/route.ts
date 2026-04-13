import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import {
  HERO_MAX_ACTIVE,
  HERO_MAX_ROSTER,
  HERO_TEMPLATES,
} from "@/lib/hero-data";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

// GET /api/game/heroes — return full roster with merged template data
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const heroes = await prisma.playerHero.findMany({
    where: { pilotId: pilot.id },
    orderBy: [{ active: "desc" }, { level: "desc" }, { createdAt: "asc" }],
  });

  const enriched = heroes.map((h) => ({
    ...h,
    createdAt: h.createdAt.toISOString(),
    template: HERO_TEMPLATES.find((t) => t.slug === h.heroSlug) ?? null,
  }));

  return NextResponse.json({
    heroes: enriched,
    activeCount: heroes.filter((h) => h.active).length,
    maxActive: HERO_MAX_ACTIVE,
    rosterSize: heroes.length,
    maxRoster: HERO_MAX_ROSTER,
  });
}

// POST /api/game/heroes — toggle a hero's active status
const toggleSchema = z.object({
  heroId: z.string().min(1),
  active: z.boolean(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Verify hero belongs to this pilot
  const hero = await prisma.playerHero.findFirst({
    where: { id: parsed.data.heroId, pilotId: pilot.id },
  });
  if (!hero) {
    return NextResponse.json({ error: "Hero not found" }, { status: 404 });
  }

  if (parsed.data.active) {
    // Enforce max active cap
    const activeCount = await prisma.playerHero.count({
      where: { pilotId: pilot.id, active: true },
    });
    if (activeCount >= HERO_MAX_ACTIVE) {
      return NextResponse.json(
        { error: `Maximum ${HERO_MAX_ACTIVE} active heroes allowed. Deactivate one first.` },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.playerHero.update({
    where: { id: parsed.data.heroId },
    data: { active: parsed.data.active },
  });

  return NextResponse.json({
    hero: { ...updated, createdAt: updated.createdAt.toISOString() },
    template: HERO_TEMPLATES.find((t) => t.slug === updated.heroSlug) ?? null,
  });
}
