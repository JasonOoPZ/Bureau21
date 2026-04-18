import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BattleSettingsClient } from "@/components/game/battle-settings-client";

export default async function BattleSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/battle" className="text-[11px] text-slate-500 hover:text-cyan-300">← Combat Arena</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Combat Settings</span>
          </div>

          {/* ── Settings Banner ── */}
          <div className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-r from-[#0a0d11] via-[#0c1016] to-[#0a0d11]">
            <div className="absolute inset-0 opacity-[0.04]" style={{ background: "repeating-linear-gradient(180deg, transparent, transparent 12px, rgba(148,163,184,0.08) 12px, rgba(148,163,184,0.08) 13px)" }} />
            <div className="relative flex items-center gap-4 p-5">
              {/* Gear / Calibration SVG */}
              <div className="shrink-0">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                  <circle cx="24" cy="24" r="10" stroke="#94a3b8" strokeWidth="1.5" opacity="0.5" />
                  <circle cx="24" cy="24" r="5" stroke="#cbd5e1" strokeWidth="1" opacity="0.4" />
                  <circle cx="24" cy="24" r="2" fill="#94a3b8" opacity="0.7" />
                  {/* Gear teeth */}
                  <rect x="22" y="4" width="4" height="8" rx="1" fill="#64748b" opacity="0.5" />
                  <rect x="22" y="36" width="4" height="8" rx="1" fill="#64748b" opacity="0.5" />
                  <rect x="4" y="22" width="8" height="4" rx="1" fill="#64748b" opacity="0.5" />
                  <rect x="36" y="22" width="8" height="4" rx="1" fill="#64748b" opacity="0.5" />
                  <rect x="8" y="8" width="6" height="3" rx="1" fill="#64748b" opacity="0.3" transform="rotate(45 11 9.5)" />
                  <rect x="34" y="8" width="6" height="3" rx="1" fill="#64748b" opacity="0.3" transform="rotate(-45 37 9.5)" />
                  <rect x="8" y="37" width="6" height="3" rx="1" fill="#64748b" opacity="0.3" transform="rotate(-45 11 38.5)" />
                  <rect x="34" y="37" width="6" height="3" rx="1" fill="#64748b" opacity="0.3" transform="rotate(45 37 38.5)" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-wider text-slate-100">Combat Settings</h1>
                <p className="text-[11px] text-slate-500">Tactical Configuration & Combat Parameters</p>
              </div>
              <div className="ml-auto hidden sm:block text-right">
                <div className="text-[10px] uppercase tracking-widest text-slate-600">System</div>
                <div className="text-sm font-bold text-slate-400">Calibration</div>
              </div>
            </div>
          </div>

          <BattleSettingsClient
            initial={{
              autoHerbs: pilot.autoHerbs,
              hideBattleLogs: pilot.hideBattleLogs,
              battleCooldown: pilot.battleCooldown,
              combatStimUse: pilot.combatStimUse,
              atkSplit: pilot.atkSplit,
              herbs: pilot.herbs,
            }}
          />
        </div>
      </main>
    </>
  );
}
