import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const sendSchema = z.object({
  toCallsign: z.string().min(1).max(40),
  body: z.string().min(1).max(500),
});

// GET — inbox (received posts, newest first) + unread count
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const received = await prisma.quickPost.findMany({
    where: { toId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { from: { select: { id: true, name: true } } },
  });

  const sent = await prisma.quickPost.findMany({
    where: { fromId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { to: { select: { id: true, name: true } } },
  });

  const unread = received.filter((p) => !p.read).length;

  return NextResponse.json({ received, sent, unread });
}

// POST — send a quick post to a pilot by callsign
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Can't message yourself
  const sender = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!sender) return NextResponse.json({ error: "Sender not found." }, { status: 404 });

  const recipientCandidates = await prisma.user.findMany({
    where: { name: { not: null } },
    select: { id: true, name: true },
    take: 500,
  });

  const target = parsed.data.toCallsign.trim().toLowerCase();
  const recipient = recipientCandidates.find((u) => u.name?.toLowerCase() === target) ?? null;

  if (!recipient) {
    return NextResponse.json({ error: "Pilot not found." }, { status: 404 });
  }

  if (recipient.id === session.user.id) {
    return NextResponse.json({ error: "You cannot send a post to yourself." }, { status: 400 });
  }

  const post = await prisma.quickPost.create({
    data: {
      fromId: session.user.id,
      toId: recipient.id,
      body: parsed.data.body,
    },
    include: { to: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ post });
}

// PATCH — mark post(s) as read
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const postId: string | null = body?.postId ?? null;

  if (postId) {
    await prisma.quickPost.updateMany({
      where: { id: postId, toId: session.user.id },
      data: { read: true },
    });
  } else {
    // Mark all as read
    await prisma.quickPost.updateMany({
      where: { toId: session.user.id, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
