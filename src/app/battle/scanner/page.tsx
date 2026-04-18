import { authOptions } from "@/auth";
import { ScannerClient } from "@/components/game/scanner-client";
import { TopBar } from "@/components/layout/top-bar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ScannerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const syndicates = await prisma.syndicate.findMany({
    select: { id: true, name: true, tag: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/battle" className="text-[11px] text-slate-500 hover:text-cyan-300">← Combat Arena</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-red-400">Pilot Scanner</span>
          </div>

          <div className="rounded-md border border-red-900/40 bg-[#0f0a0a] px-4 py-3 text-center">
            <h1 className="text-lg font-bold uppercase tracking-[0.2em] text-red-300">Pilot Scanner</h1>
          </div>

          <ScannerClient syndicates={syndicates} />
        </div>
      </main>
    </>
  );
}
