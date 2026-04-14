import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { PawnShopClient } from "@/components/game/pawn-shop-client";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PawnShopPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const unequippedItems = await prisma.inventoryItem.findMany({
    where: { pilotId: pilot.id, equipped: false },
    orderBy: { tier: "desc" },
  });

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/primaris" className="text-[11px] text-slate-500 hover:text-cyan-300">← Primaris</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-amber-300">Pawn Shop</span>
          </div>
          <div className="rounded-md border border-amber-900/30 bg-[#0b0f14] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300">Commerce Row</p>
            <h1 className="mt-1 text-2xl font-bold uppercase tracking-[0.2em] text-amber-200">Pawn Shop</h1>
          </div>
          <PawnShopClient
            credits={pilot.credits}
            items={unequippedItems.map((i) => ({
              id: i.id,
              name: i.name,
              type: i.type,
              tier: i.tier,
              bonusType: i.bonusType,
              bonusAmt: i.bonusAmt,
            }))}
          />
        </div>
      </main>
    </>
  );
}
