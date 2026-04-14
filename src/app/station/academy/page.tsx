import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { AcademyClient } from "@/components/game/academy-client";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AcademyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const weaponBonus = pilot.inventory
    .filter((i) => i.equipped && i.type === "weapon")
    .reduce((sum, i) => sum + (i.bonusAmt ?? 0), 0);

  const armorBonus = pilot.inventory
    .filter((i) => i.equipped && i.type === "shield")
    .reduce((sum, i) => sum + (i.bonusAmt ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0d11] text-slate-100">
      <TopBar session={session} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/lobby" className="hover:text-cyan-300 transition-colors">← Hub</Link>
          <span>/</span>
          <Link href="/station" className="hover:text-cyan-400 transition-colors">← Station</Link>
          <span>/</span>
          <span className="text-slate-300">The Academy</span>
        </div>

        {/* Header */}
        <div className="mb-8 rounded-xl border border-cyan-900/40 bg-[#0b1825] p-6">
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-500">
            Knowledge Hub
          </div>
          <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-black text-slate-100">
            The Academy
          </h1>
          <p className="mt-2 text-slate-400">
            Master the mechanics of Bureau 21. Learn how your stats interact, plan your build, and sharpen your combat strategy.
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="text-slate-400">Pilot: <span className="text-slate-100 font-semibold">{pilot.callsign}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Level <span className="text-amber-300 font-semibold">{pilot.level}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">STR <span className="text-emerald-300 font-semibold">{pilot.strength.toFixed(1)}</span></span>
          </div>
        </div>

        <AcademyClient
          pilotStrength={pilot.strength}
          pilotSplit={pilot.atkSplit}
          pilotWeaponBonus={weaponBonus}
          pilotArmorBonus={armorBonus}
          pilotLevel={pilot.level}
        />
      </main>
    </div>
  );
}
