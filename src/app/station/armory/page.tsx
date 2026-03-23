import { authOptions } from "@/auth";
import { ArmoryClient } from "@/components/game/armory-client";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { ITEM_TEMPLATES } from "@/lib/item-data";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const ITEM_PRICES: Record<number, number> = { 1: 120, 2: 300, 3: 750 };

export default async function ArmoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const catalog = ITEM_TEMPLATES.map((t) => ({
    name: t.name,
    type: t.type,
    tier: t.tier,
    bonusType: t.bonusType,
    bonusAmt: t.bonusAmt,
    price: ITEM_PRICES[t.tier] ?? 999,
  }));

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/station" className="text-[11px] text-slate-500 hover:text-cyan-300">← Station</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Armory</span>
          </div>

          <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4">
            <h1 className="text-xl font-bold uppercase tracking-widest text-slate-100">Armory</h1>
            <p className="mt-1 text-[11px] text-slate-400">
              Purchase weapons, shields, and engines. Equipped items boost your field performance.
            </p>
          </div>

          <ArmoryClient
            catalog={catalog}
            initialCredits={pilot.credits}
            inventoryCount={pilot.inventory.length}
          />
        </div>
      </main>
    </>
  );
}
