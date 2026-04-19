import { authOptions } from "@/auth";
import { FabricationClient } from "@/components/game/fabrication-client";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PixelBanner } from "@/components/layout/pixel-banner";

export default async function FabricationPage() {
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
          <span className="text-slate-300">Fabrication Deck</span>
        </div>

        <PixelBanner scene="fabrication" title="Fabrication Deck" subtitle="Mine ore from nearby asteroid fields, then forge weapons, shields, and engines from raw materials." />

        <FabricationClient />
      </main>
    </div>
  );
}
