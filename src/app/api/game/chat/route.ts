import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const messageSchema = z.object({
  body: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message too short or too long." }, { status: 400 });
  }

  // Rate limit: max 1 message per 3 seconds (check last message time)
  const lastMsg = await prisma.chatMessage.findFirst({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (lastMsg) {
    const elapsed = (Date.now() - lastMsg.createdAt.getTime()) / 1000;
    if (elapsed < 3) {
      return NextResponse.json({ error: "Slow down — 3s cooldown." }, { status: 429 });
    }
  }

  const message = await prisma.chatMessage.create({
    data: {
      authorId: session.user.id,
      body: parsed.data.body.trim(),
    },
    include: { author: { select: { name: true } } },
  });

  return NextResponse.json({ message });
}

export async function GET() {
  const messages = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "asc" },
    take: 60,
    include: { author: { select: { name: true } } },
  });

  return NextResponse.json({ messages });
}
