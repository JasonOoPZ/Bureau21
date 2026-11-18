import { AMBIGUOUS_CALLSIGN_MESSAGE, findPilotByCallsign, normalizeCallsign } from "@/lib/callsign";
import { prisma } from "@/lib/prisma";
import { durableRateLimit, tooManyRequests } from "@/lib/rate-limit";
import { requireUser } from "@/lib/require-user";
import { NextResponse } from "next/server";
import { z } from "zod";

const SEND_WINDOW_MS = 60_000;
const SEND_MAX_PER_WINDOW = 10;
const SEND_DAY_MS = 24 * 60 * 60_000;
const SEND_MAX_PER_DAY = 200;

const sendSchema = z.object({
  toCallsign: z.string().trim().min(1).max(40),
  body: z.string().trim().min(1).max(500),
});

const markReadSchema = z.object({
  postId: z.string().min(1).max(64).nullish(),
});

type RecipientLookup =
  | { status: "found"; userId: string }
  | { status: "not_found" }
  | { status: "ambiguous" };

/**
 * Resolve a recipient with direct, case-insensitive queries. The pilot
 * callsign is the canonical name; accounts that have not created a pilot yet
 * are matched on User.name. Any duplicate is refused rather than guessed.
 */
async function resolveRecipient(toCallsign: string): Promise<RecipientLookup> {
  const pilot = await findPilotByCallsign(prisma, toCallsign);
  if (pilot) return { status: "found", userId: pilot.userId };

  const pilotless = await prisma.user.findMany({
    where: { name: { equals: normalizeCallsign(toCallsign), mode: "insensitive" }, pilotState: null },
    select: { id: true },
    take: 2,
  });
  if (pilotless.length === 0) return { status: "not_found" };
  if (pilotless.length > 1) return { status: "ambiguous" };
  return { status: "found", userId: pilotless[0].id };
}

// GET — inbox (received posts, newest first) + unread count
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const received = await prisma.quickPost.findMany({
    where: { toId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { from: { select: { id: true, name: true } } },
  });

  const sent = await prisma.quickPost.findMany({
    where: { fromId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { to: { select: { id: true, name: true } } },
  });

  const unread = received.filter((p) => !p.read).length;

  return NextResponse.json({ received, sent, unread });
}

// POST — send a quick post to a pilot by callsign
export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const userId = auth.userId;

  const body = await request.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const burst = await durableRateLimit(`quickpost:${userId}`, SEND_MAX_PER_WINDOW, SEND_WINDOW_MS);
  if (burst.limited) {
    return tooManyRequests("You are sending posts too quickly. Try again shortly.", burst.retryAfterMs);
  }
  const daily = await durableRateLimit(`quickpost:day:${userId}`, SEND_MAX_PER_DAY, SEND_DAY_MS);
  if (daily.limited) {
    return tooManyRequests("Daily quick post limit reached.", daily.retryAfterMs);
  }

  const recipient = await resolveRecipient(parsed.data.toCallsign);

  if (recipient.status === "ambiguous") {
    return NextResponse.json({ error: AMBIGUOUS_CALLSIGN_MESSAGE }, { status: 409 });
  }

  if (recipient.status === "not_found") {
    return NextResponse.json({ error: "Pilot not found." }, { status: 404 });
  }

  if (recipient.userId === userId) {
    return NextResponse.json({ error: "You cannot send a post to yourself." }, { status: 400 });
  }

  const post = await prisma.quickPost.create({
    data: {
      fromId: userId,
      toId: recipient.userId,
      body: parsed.data.body,
    },
    include: { to: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ post });
}

// PATCH — mark post(s) as read
export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = markReadSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const postId = parsed.data.postId ?? null;

  if (postId) {
    await prisma.quickPost.updateMany({
      where: { id: postId, toId: auth.userId },
      data: { read: true },
    });
  } else {
    // Mark all as read
    await prisma.quickPost.updateMany({
      where: { toId: auth.userId, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
