import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { PawnShopClient } from "@/components/game/pawn-shop-client";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

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
          <PixelBanner scene="pawn-shop" title="Pawn Shop" subtitle="Sell unwanted gear for quick credits." />
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
