import { authOptions } from "@/auth";
import { BoardsClient } from "@/components/game/boards-client";
import { TopBar } from "@/components/layout/top-bar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";

const BOARD_NAMES: Record<string, string> = {
  announcements: "Announcements",
  bugfix: "Bugfix Board",
  "game-discussion": "Game Discussion",
  "game-help": "Game Help",
  suggestions: "Suggestion Board",
  trading: "Trading Board",
  "non-game": "Non-Game Discussion",
  "for-fun": "For Fun",
  "video-games": "Video Games",
  entertainment: "Entertainment Board",
  tech: "Tech Board",
  foodies: "Foodies",
  sports: "Sports Den",
  "book-club": "Book Club",
};

export default async function BoardCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const boardName = BOARD_NAMES[category];
  if (!boardName) notFound();

  const posts = await prisma.boardPost.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { author: { select: { id: true, name: true } } },
  });

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <Link href="/boards" className="text-[11px] text-slate-500 hover:text-cyan-300">Boards</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">{boardName}</span>
          </div>

          <div className="rounded-md border border-cyan-900/30 bg-[#0b0f14] p-4">
            <h1 className="text-lg font-bold uppercase tracking-widest text-slate-100">{boardName}</h1>
            <p className="mt-1 text-[11px] text-slate-500">
              {posts.length} topic{posts.length !== 1 ? "s" : ""}
            </p>
          </div>

          <BoardsClient
            initialPosts={posts.map((p) => ({
              id: p.id,
              title: p.title,
              body: p.body,
              category: p.category,
              karma: p.karma,
              authorId: p.author.id,
              authorName: p.author.name ?? "Unknown Pilot",
              createdAt: p.createdAt.toISOString(),
            }))}
            currentUser={session.user.name ?? "Pilot"}
            boardCategory={category}
          />
        </div>
      </main>
    </>
  );
}
