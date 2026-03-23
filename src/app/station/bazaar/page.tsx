import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const TIER_LABELS: Record<number, string> = { 1: "Common", 2: "Rare", 3: "Legendary" };
const TIER_COLORS: Record<number, string> = {
  1: "text-slate-300",
  2: "text-cyan-300",
  3: "text-amber-300",
};
const TYPE_ICONS: Record<string, string> = { weapon: "⚔", shield: "🛡", engine: "⚡" };

// Sell price is 60% of buy price (buy prices: T1=120, T2=300, T3=750)
const SELL_PRICES: Record<number, number> = { 1: 70, 2: 180, 3: 450 };

export default async function BazaarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  // Top items for sale from all pilots (marketplace preview)
  const recentItems = await prisma.inventoryItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { pilot: { select: { callsign: true } } },
  });

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/station" className="text-[11px] text-slate-500 hover:text-cyan-300">← Station</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Bazaar</span>
          </div>

          <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4">
            <h1 className="text-xl font-bold uppercase tracking-widest text-slate-100">Bazaar</h1>
            <p className="mt-1 text-[11px] text-slate-400">
              The network marketplace. Browse loot carried by active pilots. Full P2P trading arrives in a future update.
            </p>
          </div>

          {/* Sell your items */}
          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Your Inventory</p>
              <Link href="/inventory" className="text-[10px] text-cyan-600 hover:text-cyan-300">
                Manage →
              </Link>
            </div>
            {pilot.inventory.length === 0 ? (
              <p className="text-[11px] text-slate-600">No items in inventory. Head to the Armory or earn drops from field ops.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {pilot.inventory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/40 px-2 py-2"
                  >
                    <div>
                      <p className={`text-[11px] font-medium ${TIER_COLORS[item.tier]}`}>
                        {TYPE_ICONS[item.type]} {item.name}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {TIER_LABELS[item.tier]} · {item.equipped ? "Equipped" : "Unequipped"}
                      </p>
                    </div>
                    <span className="text-[11px] text-amber-500">{SELL_PRICES[item.tier]} Cr</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Network marketplace */}
          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">
              Network Drop Feed (Latest 12)
            </p>
            {recentItems.length === 0 ? (
              <p className="text-[11px] text-slate-600">No items in circulation yet.</p>
            ) : (
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded border border-slate-800/60 bg-slate-900/30 px-3 py-2"
                  >
                    <p className={`text-[11px] font-medium ${TIER_COLORS[item.tier]}`}>
                      {TYPE_ICONS[item.type]} {item.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {TIER_LABELS[item.tier]} · held by {item.pilot.callsign}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
