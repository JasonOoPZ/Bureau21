import { authOptions } from "@/auth";
import { FabricationClient } from "@/components/game/fabrication-client";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function FabricationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  return (
    <div className="min-h-screen bg-[#0a0d11] text-slate-100">
      <TopBar session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/station" className="hover:text-cyan-400 transition-colors">← Station</Link>
          <span>/</span>
          <span className="text-slate-300">Fabrication Deck</span>
        </div>

        <div className="mb-8 rounded-xl border border-orange-900/40 bg-[#130d06] p-6">
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
            Industrial District
          </div>
          <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-black text-slate-100">
            Fabrication Deck
          </h1>
          <p className="mt-2 text-slate-400">
            Mine ore from nearby asteroid fields, then use the fabrication bays to forge weapons, shields, and engines from raw materials.
          </p>
        </div>

        <FabricationClient />
      </main>
    </div>
  );
}
