import { authOptions } from "@/auth";
import { HydroponicsClient } from "@/components/game/hydroponics-client";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HydroponicsPage() {
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
          <span className="text-slate-300">Hydroponics Bay</span>
        </div>

        <div className="mb-8 rounded-xl border border-emerald-900/40 bg-[#081410] p-6">
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-500">
            Resource Production
          </div>
          <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-black text-slate-100">
            Hydroponics Bay
          </h1>
          <p className="mt-2 text-slate-400">
            Tend your growing plots to harvest credits, restore Life Force, and cultivate rare Blue Herbs used for emergency revival.
          </p>
        </div>

        <HydroponicsClient />
      </main>
    </div>
  );
}
