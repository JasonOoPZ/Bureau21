import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

const BOARD_SECTIONS = [
  {
    header: "Announcements",
    boards: [
      { slug: "announcements", name: "Announcements", desc: "Read the latest game news and updates.", icon: "📢" },
    ],
  },
  {
    header: "Game Related Discussion",
    boards: [
      { slug: "bugfix", name: "Bugfix Board", desc: "Report bugs and minor fixes.", icon: "🐛" },
      { slug: "game-discussion", name: "Game Discussion", desc: "Game related discussion.", icon: "💬" },
      { slug: "game-help", name: "Game Help", desc: "New to the game? Have questions?", icon: "❓" },
      { slug: "suggestions", name: "Suggestion Board", desc: "Suggest game improvements and ideas.", icon: "💡" },
      { slug: "trading", name: "Trading Board", desc: "For all your buying/selling/trading needs.", icon: "🤝" },
    ],
  },
  {
    header: "Non-Game Related Discussion",
    boards: [
      { slug: "non-game", name: "Non-Game Discussion", desc: "Discuss anything unrelated to Bureau 21.", icon: "🗣️" },
      { slug: "for-fun", name: "For Fun", desc: "Jokes, riddles, rants, anything amusing.", icon: "😂" },
      { slug: "video-games", name: "Video Games", desc: "Discuss computer, console, arcade, and handheld video games.", icon: "🎮" },
      { slug: "entertainment", name: "Entertainment Board", desc: "Movies, music, TV shows, comics, anime.", icon: "🎬" },
      { slug: "tech", name: "Tech Board", desc: "Hardware and software discussion.", icon: "💻" },
      { slug: "foodies", name: "Foodies", desc: "Cooks, food lovers, Food TV, etc.", icon: "🍕" },
      { slug: "sports", name: "Sports Den", desc: "Sports-related discussion.", icon: "⚽" },
      { slug: "book-club", name: "Book Club", desc: "Literary discussion and sharing of work.", icon: "📚" },
    ],
  },
];

export default async function BoardsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  // Count topics per category
  const counts = await prisma.boardPost.groupBy({
    by: ["category"],
    _count: { id: true },
  });
  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c.category] = c._count.id;

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Message Boards</span>
          </div>

          <PixelBanner scene="boards" title="Message Boards" subtitle="Bureau 21 network communications hub" />

          {BOARD_SECTIONS.map((section) => (
            <div key={section.header} className="rounded-lg border border-slate-800 bg-[#0a0d11] overflow-hidden">
              {/* Section Header */}
              <div className="flex items-center justify-between bg-[#0d1117] border-b border-slate-800 px-4 py-2.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                  {section.header}
                </span>
                <div className="flex gap-8 text-[10px] uppercase tracking-wider text-slate-600">
                  <span className="w-16 text-right">Topics</span>
                  <span className="w-16 text-right">Posts</span>
                </div>
              </div>

              {/* Board Rows */}
              {section.boards.map((board, idx) => {
                const topicCount = countMap[board.slug] ?? 0;
                return (
                  <Link
                    key={board.slug}
                    href={`/boards/${board.slug}`}
                    className={`flex items-center gap-3 px-4 py-3 transition hover:bg-slate-800/40 group ${
                      idx < section.boards.length - 1 ? "border-b border-slate-800/50" : ""
                    }`}
                  >
                    <div className="text-2xl w-8 text-center shrink-0">{board.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {board.name}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">{board.desc}</div>
                    </div>
                    <div className="flex gap-8 shrink-0">
                      <span className="w-16 text-right text-[12px] font-mono text-slate-400">{topicCount.toLocaleString()}</span>
                      <span className="w-16 text-right text-[12px] font-mono text-slate-500">{topicCount.toLocaleString()}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
