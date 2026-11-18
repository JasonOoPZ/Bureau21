import { EconomyError, economyErrorResponse, economyTx } from "@/lib/economy";
import { prisma } from "@/lib/prisma";
import { durableRateLimit, tooManyRequests } from "@/lib/rate-limit";
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

const postSchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(1).max(2000),
  category: z.enum(VALID_CATEGORIES).default("game-discussion"),
});

const voteSchema = z.object({
  postId: z.string().min(1).max(64),
  /** 1 = upvote, -1 = downvote, 0 = withdraw the vote. */
  direction: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

/**
 * Set the caller's vote on a post to `direction` and return the new karma.
 *
 * One BoardVote row per (post, user), so a vote can be changed or withdrawn
 * but never counted twice. The post row is locked first: votes on one post
 * queue up, each reads the vote the previous one left, and karma moves by
 * exactly the difference. Repeating the same vote changes nothing.
 */
async function castVote(userId: string, postId: string, direction: 1 | -1 | 0): Promise<number> {
  return economyTx(async (tx) => {
    const locked = await tx.$queryRaw<{ karma: number }[]>`
      SELECT "karma" FROM "BoardPost" WHERE "id" = ${postId} FOR UPDATE`;
    if (locked.length === 0) throw new EconomyError("Post not found.", 404);

    const where = { postId_userId: { postId, userId } };
    const previous = await tx.boardVote.findUnique({ where, select: { direction: true } });
    const delta = direction - (previous?.direction ?? 0);
    if (delta === 0) return locked[0].karma;

    if (direction === 0) {
      await tx.boardVote.delete({ where });
    } else {
      await tx.boardVote.upsert({
        where,
        create: { postId, userId, direction },
        update: { direction },
      });
    }

    const post = await tx.boardPost.update({
      where: { id: postId },
      data: { karma: { increment: delta } },
      select: { karma: true },
    });
    return post.karma;
  });
}

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

  const rows = await prisma.boardPost.findMany({
    where: category && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])
      ? { category }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: { select: { id: true, name: true } },
      // Only the caller's own vote; other voters are never exposed.
      votes: { where: { userId: auth.userId }, select: { direction: true } },
    },
  });
  const posts = rows.map(({ votes, ...post }) => ({ ...post, myVote: votes[0]?.direction ?? 0 }));

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

  try {
    const karma = await castVote(auth.userId, postId, direction);
    return NextResponse.json({ karma, myVote: direction });
  } catch (error) {
    return economyErrorResponse(error);
  }
}
