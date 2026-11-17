import { CallsignTakenError, callsignSchema as callsignField, claimCallsign } from "@/lib/callsign";
import { economyErrorResponse, economyTx } from "@/lib/economy";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/require-user";
import { themeIds } from "@/lib/themes";
import { NextResponse } from "next/server";
import { z } from "zod";

const atkSplitSchema = z.object({
  atkSplit: z.number().int().min(10).max(90),
});

const themeSchema = z.object({
  theme: z.enum(themeIds as [string, ...string[]]),
});

/**
 * Quicklinks are rendered as <a href>. Only same-site paths are allowed: one
 * leading "/", then URL path/query characters. That rules out schemes
 * ("javascript:", "https:"), protocol-relative "//host" and the "/\\host"
 * form some browsers treat the same way (no ":" or "\\" can appear at all).
 */
const INTERNAL_PATH_PATTERN = /^\/(?!\/)[A-Za-z0-9\-._~/?#=&%+]*$/;

const quicklinkSchema = z.object({
  href: z.string().min(1).max(100).regex(INTERNAL_PATH_PATTERN),
  label: z.string().trim().min(1).max(30),
});

const quicklinksSchema = z.object({
  customQuicklinks: z.array(quicklinkSchema).max(5),
});

const callsignSchema = z.object({
  callsign: callsignField,
});

const RENAME_WINDOW_MS = 60_000;
const RENAME_MAX_PER_WINDOW = 5;

/** Stored quicklinks predate the href check, so they are re-validated on read. */
function parseStoredQuicklinks(raw: string | null | undefined): { href: string; label: string }[] {
  try {
    const parsed = z.array(z.unknown()).safeParse(JSON.parse(raw ?? "[]"));
    if (!parsed.success) return [];
    return parsed.data.flatMap((entry) => {
      const link = quicklinkSchema.safeParse(entry);
      return link.success ? [link.data] : [];
    });
  } catch {
    return [];
  }
}

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const pilot = await getOrCreatePilotState(auth.userId, auth.name);

  const customQuicklinks = parseStoredQuicklinks(pilot.customQuicklinks);

  return NextResponse.json({
    theme: pilot.theme ?? "original",
    customQuicklinks,
    atkSplit: pilot.atkSplit,
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const userId = auth.userId;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await getOrCreatePilotState(userId, auth.name);

  // Callsign update
  if ("callsign" in body) {
    const parsed = callsignSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid callsign.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (rateLimit(`rename:${userId}`, RENAME_MAX_PER_WINDOW, RENAME_WINDOW_MS).limited) {
      return NextResponse.json({ error: "Too many rename attempts. Try again shortly." }, { status: 429 });
    }

    const callsign = parsed.data.callsign;
    try {
      // One transaction: reserve the name, then write it to both places
      // other players resolve it from (PilotState.callsign and User.name).
      await economyTx(async (tx) => {
        await claimCallsign(tx, callsign, userId);
        await tx.pilotState.update({ where: { userId }, data: { callsign } });
        await tx.user.update({ where: { id: userId }, data: { name: callsign } });
      });
    } catch (error) {
      if (error instanceof CallsignTakenError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return economyErrorResponse(error);
    }

    return NextResponse.json({ callsign, message: "Callsign updated." });
  }

  // ATK split update
  if ("atkSplit" in body) {
    const parsed = atkSplitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ATK split must be between 10 and 90." }, { status: 400 });
    }
    await prisma.pilotState.update({
      where: { userId },
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
      where: { userId },
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
      return NextResponse.json(
        { error: "Invalid quicklinks. Max 5 links, each an internal path starting with \"/\"." },
        { status: 400 }
      );
    }
    await prisma.pilotState.update({
      where: { userId },
      data: { customQuicklinks: JSON.stringify(parsed.data.customQuicklinks) },
    });
    return NextResponse.json({
      customQuicklinks: parsed.data.customQuicklinks,
      message: "Custom quicklinks updated.",
    });
  }

  return NextResponse.json({ error: "No valid field provided." }, { status: 400 });
}
