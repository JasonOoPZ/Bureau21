import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { themeIds } from "@/lib/themes";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const atkSplitSchema = z.object({
  atkSplit: z.number().int().min(10).max(90),
});

const themeSchema = z.object({
  theme: z.enum(themeIds as [string, ...string[]]),
});

const quicklinksSchema = z.object({
  customQuicklinks: z.array(
    z.object({
      href: z.string().min(1).max(100),
      label: z.string().min(1).max(30),
    })
  ).max(5),
});

const callsignSchema = z.object({
  callsign: z.string().min(2, "Callsign must be at least 2 characters.").max(24, "Callsign must be at most 24 characters.").regex(/^[a-zA-Z0-9 _\-]+$/, "Callsign may only contain letters, numbers, spaces, hyphens, and underscores."),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  let customQuicklinks: { href: string; label: string }[] = [];
  try {
    customQuicklinks = JSON.parse(pilot.customQuicklinks ?? "[]");
  } catch {
    customQuicklinks = [];
  }

  return NextResponse.json({
    theme: pilot.theme ?? "original",
    customQuicklinks,
    atkSplit: pilot.atkSplit,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await getOrCreatePilotState(session.user.id, session.user.name);

  // Callsign update
  if ("callsign" in body) {
    const parsed = callsignSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid callsign.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { callsign: parsed.data.callsign.trim() },
    });
    // Also update User.name so session reflects new name
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.callsign.trim() },
    });
    return NextResponse.json({
      callsign: parsed.data.callsign.trim(),
      message: "Callsign updated.",
    });
  }

  // ATK split update
  if ("atkSplit" in body) {
    const parsed = atkSplitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ATK split must be between 10 and 90." }, { status: 400 });
    }
    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { atkSplit: parsed.data.atkSplit },
    });
    return NextResponse.json({
      atkSplit: parsed.data.atkSplit,
      message: `ATK/DEF split updated to ${parsed.data.atkSplit}% ATK / ${100 - parsed.data.atkSplit}% DEF.`,
    });
  }

  // Theme update
  if ("theme" in body) {
    const parsed = themeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid theme." }, { status: 400 });
    }
    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { theme: parsed.data.theme },
    });

    const response = NextResponse.json({ theme: parsed.data.theme, message: "Theme updated." });
    response.cookies.set("bureau21-theme", parsed.data.theme, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  // Custom quicklinks update
  if ("customQuicklinks" in body) {
    const parsed = quicklinksSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quicklinks. Max 5 links." }, { status: 400 });
    }
    await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { customQuicklinks: JSON.stringify(parsed.data.customQuicklinks) },
    });
    return NextResponse.json({
      customQuicklinks: parsed.data.customQuicklinks,
      message: "Custom quicklinks updated.",
    });
  }

  return NextResponse.json({ error: "No valid field provided." }, { status: 400 });
}
