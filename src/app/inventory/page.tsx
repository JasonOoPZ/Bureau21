import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { InventoryClient } from "@/components/game/inventory-client";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const items = await prisma.inventoryItem.findMany({
    where: { pilotId: pilot.id },
    orderBy: [{ equipped: "desc" }, { tier: "desc" }, { createdAt: "desc" }],
  });

  const serialized = items.map((i) => ({
    id: i.id,
    name: i.name,
    type: i.type,
    tier: i.tier,
    bonusType: i.bonusType,
    bonusAmt: i.bonusAmt,
    equipped: i.equipped,
  }));

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-4xl space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Inventory</span>
          </div>

          {/* Header */}
          <div className="rounded-md border border-slate-700 bg-[#0b0f14] px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold uppercase tracking-widest text-slate-100">Gear Room</h1>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Equip one weapon, one shield, and one engine. Slots: {items.length}/20.
                </p>
              </div>
              <Link
                href="/station/armory"
                className="rounded border border-cyan-800/60 bg-cyan-900/20 px-3 py-1.5 text-[10px] text-cyan-300 hover:border-cyan-600 transition"
              >
                Visit Armory →
              </Link>
            </div>
          </div>

          <InventoryClient initialItems={serialized} slotMax={20} pilotCallsign={pilot.callsign} pilotId={pilot.id} />
        </div>
      </main>
    </>
  );
}
