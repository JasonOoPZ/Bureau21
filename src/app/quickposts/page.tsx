import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { QuickPostClient } from "@/components/game/quickpost-client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

export default async function QuickPostsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

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

  const toJson = (p: typeof received[number] | typeof sent[number]) => ({
    id: p.id,
    body: p.body,
    read: p.read,
    createdAt: p.createdAt.toISOString(),
    from: "from" in p ? { id: (p as typeof received[number]).from.id, name: (p as typeof received[number]).from.name } : undefined,
    to: "to" in p ? { id: (p as typeof sent[number]).to.id, name: (p as typeof sent[number]).to.name } : undefined,
  });

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">QuickPosts</span>
          </div>

          {/* Header */}
          <PixelBanner scene="chat" title="Quick Posts" subtitle="Private operator messages. 500 characters max.">
            {unread > 0 && (
              <span className="rounded border border-amber-700/50 bg-amber-900/20 px-2 py-1 text-[10px] text-amber-300">
                {unread} unread
              </span>
            )}
          </PixelBanner>

          <QuickPostClient
            initialReceived={received.map(toJson)}
            initialSent={sent.map(toJson)}
            initialUnread={unread}
          />
        </div>
      </main>
    </>
  );
}

