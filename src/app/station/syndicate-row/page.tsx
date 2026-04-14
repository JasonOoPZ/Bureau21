import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { SyndicateClient } from "@/components/game/syndicate-client";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SyndicateRowPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const fullPilot = await prisma.pilotState.findUnique({
    where: { id: pilot.id },
    include: {
      syndicateMember: {
        include: {
          syndicate: { include: { members: true } },
        },
      },
    },
  });

  const syndicates = await prisma.syndicate.findMany({
    include: { members: true },
    orderBy: { members: { _count: "desc" } },
    take: 20,
  });

  const currentSyndicate = fullPilot?.syndicateMember?.syndicate ?? null;
  const currentRole = fullPilot?.syndicateMember?.role ?? null;

  const serializedCurrent = currentSyndicate
    ? {
        id: currentSyndicate.id,
        name: currentSyndicate.name,
        tag: currentSyndicate.tag,
        description: currentSyndicate.description,
        treasury: currentSyndicate.treasury,
        leaderId: currentSyndicate.leaderId,
        memberCount: currentSyndicate.members.length,
      }
    : null;

  const serializedList = syndicates.map((s) => ({
    id: s.id,
    name: s.name,
    tag: s.tag,
    description: s.description,
    treasury: s.treasury,
    leaderId: s.leaderId,
    memberCount: s.members.length,
  }));

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <Link href="/station" className="text-[11px] text-slate-500 hover:text-cyan-300">← Station</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-purple-400">Syndicate Row</span>
          </div>

          {/* Header */}
          <div className="rounded-md border border-purple-900/50 bg-[#0e0a14] px-4 py-3">
            <h1 className="text-lg font-bold uppercase tracking-widest text-slate-100">⬡ Syndicate Row</h1>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Form alliances, pool treasury, and earn collective bonuses. Found a syndicate or join with a tag.
            </p>
          </div>

          <SyndicateClient
            pilotId={pilot.id}
            initialCurrent={serializedCurrent}
            initialRole={currentRole}
            initialList={serializedList}
          />
        </div>
      </main>
    </>
  );
}
