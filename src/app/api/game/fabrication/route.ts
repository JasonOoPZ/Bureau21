import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { ITEM_TEMPLATES } from "@/lib/item-data";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const MINE_COOLDOWN_MINUTES = 30;
const MINE_ORE_MIN = 3;
const MINE_ORE_MAX = 8;

const CRAFT_RECIPES = [
  { tier: 1, oreCost: 10, label: "Tier 1 Equipment" },
  { tier: 2, oreCost: 25, label: "Tier 2 Equipment" },
  { tier: 3, oreCost: 50, label: "Tier 3 Equipment" },
] as const;

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("mine") }),
  z.object({ action: z.literal("craft"), tier: z.number().int().min(1).max(3) }),
]);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const state = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });

  const lastFabAt = state?.lastFabAt ?? new Date(0);
  const elapsedMinutes = (Date.now() - lastFabAt.getTime()) / 60000;
  const cooldownRemaining = Math.max(0, Math.ceil(MINE_COOLDOWN_MINUTES - elapsedMinutes));
  const mineReady = cooldownRemaining === 0;

  return NextResponse.json({
    ore: state?.ore ?? 0,
    mineReady,
    cooldownRemaining,
    cooldownMinutes: MINE_COOLDOWN_MINUTES,
    lastFabAt: lastFabAt.toISOString(),
    level: pilot.level,
    credits: pilot.credits,
    recipes: CRAFT_RECIPES,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const state = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });

  // MINE action
  if (parsed.data.action === "mine") {
    const lastFabAt = state?.lastFabAt ?? new Date(0);
    const elapsedMinutes = (Date.now() - lastFabAt.getTime()) / 60000;

    if (elapsedMinutes < MINE_COOLDOWN_MINUTES) {
      const remaining = Math.ceil(MINE_COOLDOWN_MINUTES - elapsedMinutes);
      return NextResponse.json(
        { error: `Drill is cooling down. Ready in ${remaining} minute${remaining === 1 ? "" : "s"}.` },
        { status: 429 }
      );
    }

    const oreGain = Math.floor(Math.random() * (MINE_ORE_MAX - MINE_ORE_MIN + 1)) + MINE_ORE_MIN;
    const newOre = (state?.ore ?? 0) + oreGain;

    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { ore: newOre, lastFabAt: new Date() },
    });

    return NextResponse.json({
      action: "mine",
      oreGain,
      ore: newOre,
      message: `Mining complete. Extracted ${oreGain} ore from the asteroid belt.`,
    });
  }

  // CRAFT action
  const { tier } = parsed.data;
  const recipe = CRAFT_RECIPES.find((r) => r.tier === tier);
  if (!recipe) return NextResponse.json({ error: "Unknown recipe." }, { status: 400 });

  const currentOre = state?.ore ?? 0;
  if (currentOre < recipe.oreCost) {
    return NextResponse.json(
      { error: `Not enough ore. Need ${recipe.oreCost}, you have ${currentOre}.` },
      { status: 400 }
    );
  }

  // Pick a random item template of the given tier
  const eligible = ITEM_TEMPLATES.filter((t) => t.tier === tier);
  if (eligible.length === 0) {
    return NextResponse.json({ error: "No crafting templates available for that tier." }, { status: 500 });
  }
  const template = eligible[Math.floor(Math.random() * eligible.length)];

  const newOre = currentOre - recipe.oreCost;

  await prisma.$transaction([
    prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { ore: newOre },
    }),
    prisma.inventoryItem.create({
      data: {
        pilotId: pilot.id,
        name: template.name,
        type: template.type,
        tier: template.tier,
        bonusType: template.bonusType,
        bonusAmt: template.bonusAmt,
        equipped: false,
      },
    }),
  ]);

  return NextResponse.json({
    action: "craft",
    item: template,
    oreCost: recipe.oreCost,
    ore: newOre,
    message: `Fabrication complete! Crafted: ${template.name}.`,
  });
}
