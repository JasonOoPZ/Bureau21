import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const VALID_CATEGORIES = ["general", "trading", "help", "events"] as const;

const postSchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(1).max(2000),
  category: z.enum(VALID_CATEGORIES).default("general"),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid post data.", details: parsed.error.flatten() }, { status: 400 });
  }

  const post = await prisma.boardPost.create({
    data: {
      authorId: session.user.id,
      title: parsed.data.title.trim(),
      body: parsed.data.body.trim(),
      category: parsed.data.category,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ post });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const posts = await prisma.boardPost.findMany({
    where: category && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])
      ? { category }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(
    { posts },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } }
  );
}
