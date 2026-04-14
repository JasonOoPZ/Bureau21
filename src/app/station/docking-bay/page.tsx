import { authOptions } from "@/auth";
import { DockingBayClient } from "@/components/game/docking-bay-client";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DockingBayPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  return (
    <div className="min-h-screen bg-[#0a0d11] text-slate-100">
      <TopBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/lobby" className="hover:text-cyan-300 transition-colors">← Hub</Link>
          <span>/</span>
          <Link href="/station" className="hover:text-cyan-400 transition-colors">← Station</Link>
          <span>/</span>
          <span className="text-slate-300">Docking Bay</span>
        </div>

        <div className="mb-8 rounded-xl border border-cyan-900/40 bg-[#08111a] p-6">
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-500">
            Contract Hub
          </div>
          <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-black text-slate-100">
            Docking Bay
          </h1>
          <p className="mt-2 text-slate-400">
            Accept cargo contracts, courier jobs, and classified retrieval assignments. Deploy your vessel and collect payment on return.
          </p>
        </div>

        <DockingBayClient />
      </main>
    </div>
  );
}
