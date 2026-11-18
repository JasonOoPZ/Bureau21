import { prisma } from "@/lib/prisma";
import { claimOnce, durableRateLimit, releaseClaim, tooManyRequests } from "@/lib/rate-limit";
import { requireUser } from "@/lib/require-user";
import { NextResponse } from "next/server";
import { z } from "zod";

const VALID_CATEGORIES = [
  "announcements", "bugfix", "game-discussion", "game-help", "suggestions", "trading",
  "non-game", "for-fun", "video-games", "entertainment", "tech", "foodies", "sports", "book-club",
] as const;

const POST_WINDOW_MS = 10 * 60_000;
const POST_MAX_PER_WINDOW = 5;
const VOTE_WINDOW_MS = 60_000;
const VOTE_MAX_PER_WINDOW = 20;
/**
 * Stop-gap until votes are stored (BoardVote table, see PR notes): a pilot
 * may vote on a given post once per this window. Without the table a vote
 * cannot be changed or undone, and it can be repeated after the window.
 */
const VOTE_ONCE_WINDOW_MS = 30 * 24 * 60 * 60_000;

const postSchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(1).max(2000),
  category: z.enum(VALID_CATEGORIES).default("game-discussion"),
});

const voteSchema = z.object({
  postId: z.string().min(1).max(64),
  direction: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid post data.", details: parsed.error.flatten() }, { status: 400 });
  }

  const limit = await durableRateLimit(`board-post:${auth.userId}`, POST_MAX_PER_WINDOW, POST_WINDOW_MS);
  if (limit.limited) {
    return tooManyRequests("You are posting too quickly. Try again later.", limit.retryAfterMs);
  }

  const post = await prisma.boardPost.create({
    data: {
      authorId: auth.userId,
      title: parsed.data.title.trim(),
      body: parsed.data.body.trim(),
      category: parsed.data.category,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ post });
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

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

  // Now behind a session check, so it must not sit in a shared cache.
  return NextResponse.json({ posts }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  }
  const { postId, direction } = parsed.data;

  const burst = await durableRateLimit(`board-vote:${auth.userId}`, VOTE_MAX_PER_WINDOW, VOTE_WINDOW_MS);
  if (burst.limited) {
    return tooManyRequests("You are voting too quickly. Try again shortly.", burst.retryAfterMs);
  }

  const post = await prisma.boardPost.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  // Atomic: of N parallel votes by one pilot on one post, exactly one wins.
  const voteKey = `board-vote:${auth.userId}:${postId}`;
  if (!(await claimOnce(voteKey, VOTE_ONCE_WINDOW_MS))) {
    return NextResponse.json({ error: "You have already voted on this post." }, { status: 409 });
  }

  const updated = await prisma.boardPost.updateManyAndReturn({
    where: { id: postId },
    data: { karma: { increment: direction } },
    select: { karma: true },
  });

  if (updated.length === 0) {
    // Deleted between the lookup and the write: give the vote back.
    await releaseClaim(voteKey);
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  return NextResponse.json({ karma: updated[0].karma });
}
