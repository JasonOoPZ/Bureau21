import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

export default async function LoungePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  // Find pilots active in the last 30 minutes
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const recentPilots = await prisma.pilotState.findMany({
    where: { updatedAt: { gte: thirtyMinAgo } },
    select: { callsign: true, level: true, characterSlug: true, currentSector: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  // Also get total pilot count
  const totalPilots = await prisma.pilotState.count();

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/primaris" className="text-[11px] text-slate-500 hover:text-cyan-300">← Primaris</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-pink-400">Lounge</span>
          </div>
          <PixelBanner scene="lounge" title="Lounge" subtitle="The social hub. See who's active on the station." />

          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
            <p className="text-[12px] text-slate-400">
              The Lounge is where pilots unwind between shifts. Check who&apos;s recently been active
              on the station — scope out potential allies or mark future targets.
            </p>
            <div className="mt-2 flex gap-6 text-[11px]">
              <div><span className="text-slate-500">Total Pilots: </span><span className="font-bold text-cyan-300">{totalPilots}</span></div>
              <div><span className="text-slate-500">Active (30m): </span><span className="font-bold text-emerald-300">{recentPilots.length}</span></div>
            </div>
          </div>

          {recentPilots.length === 0 ? (
            <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 text-[12px] text-slate-500">
              The lounge is empty. You&apos;re the only one here.
            </div>
          ) : (
            <div className="rounded-md border border-slate-800 bg-[#0a0d11]">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2">Pilot</th>
                    <th className="px-3 py-2">Level</th>
                    <th className="px-3 py-2">Sector</th>
                    <th className="px-3 py-2 text-right">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPilots.map((p) => {
                    const mins = Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / 60000);
                    return (
                      <tr key={p.callsign} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                        <td className="px-3 py-1.5 font-semibold text-cyan-300">{p.callsign}</td>
                        <td className="px-3 py-1.5 text-slate-400">{p.level}</td>
                        <td className="px-3 py-1.5 text-slate-400">{p.currentSector}</td>
                        <td className="px-3 py-1.5 text-right text-slate-500">
                          {mins < 1 ? "Just now" : `${mins}m ago`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
