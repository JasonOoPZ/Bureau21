import { authOptions } from "@/auth";
import { ChatClient } from "@/components/game/chat-client";
import { TopBar } from "@/components/layout/top-bar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const messages = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "asc" },
    take: 60,
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
            <span className="text-[11px] text-cyan-400">Town Hall</span>
          </div>

          <PixelBanner scene="chat" title="Town Hall" subtitle="Open comms channel. Refreshes every 10 seconds." />

          <ChatClient
            initialMessages={messages.map((m) => ({
              id: m.id,
              body: m.body,
              authorId: m.author.id,
              authorName: m.author.name ?? "Unknown",
              createdAt: m.createdAt.toISOString(),
            }))}
            currentUser={session.user.name ?? "Pilot"}
          />
        </div>
      </main>
    </>
  );
}
