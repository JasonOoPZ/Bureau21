import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  autoHerbs: z.boolean().optional(),
  hideBattleLogs: z.boolean().optional(),
  battleCooldown: z.number().int().min(1).max(30).optional(),
  combatStimUse: z.enum(["never", "attack_only", "defend_only", "attack_or_defend"]).optional(),
  atkSplit: z.number().int().min(0).max(100).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  return NextResponse.json({
    autoHerbs: pilot.autoHerbs,
    hideBattleLogs: pilot.hideBattleLogs,
    battleCooldown: pilot.battleCooldown,
    combatStimUse: pilot.combatStimUse,
    atkSplit: pilot.atkSplit,
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings." }, { status: 400 });

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (parsed.data.autoHerbs !== undefined) data.autoHerbs = parsed.data.autoHerbs;
  if (parsed.data.hideBattleLogs !== undefined) data.hideBattleLogs = parsed.data.hideBattleLogs;
  if (parsed.data.battleCooldown !== undefined) data.battleCooldown = parsed.data.battleCooldown;
  if (parsed.data.combatStimUse !== undefined) data.combatStimUse = parsed.data.combatStimUse;
  if (parsed.data.atkSplit !== undefined) data.atkSplit = parsed.data.atkSplit;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes." }, { status: 400 });
  }

  await prisma.pilotState.update({
    where: { id: pilot.id },
    data,
  });

  return NextResponse.json({ ok: true, ...parsed.data });
}
