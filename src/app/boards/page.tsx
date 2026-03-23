import { authOptions } from "@/auth";
import { BoardsClient } from "@/components/game/boards-client";
import { TopBar } from "@/components/layout/top-bar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BoardsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const posts = await prisma.boardPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { author: { select: { name: true } } },
  });

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-4xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Message Boards</span>
          </div>

          <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4">
            <h1 className="text-xl font-bold uppercase tracking-widest text-slate-100">Message Boards</h1>
            <p className="mt-1 text-[11px] text-slate-400">
              Network communications. Trading, help, events, and general dispatches.
            </p>
          </div>

          <BoardsClient
            initialPosts={posts.map((p) => ({
              id: p.id,
              title: p.title,
              body: p.body,
              category: p.category,
              karma: p.karma,
              authorName: p.author.name ?? "Unknown Pilot",
              createdAt: p.createdAt.toISOString(),
            }))}
            currentUser={session.user.name ?? "Pilot"}
          />
        </div>
      </main>
    </>
  );
}
