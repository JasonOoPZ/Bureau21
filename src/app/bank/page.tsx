import { authOptions } from "@/auth";
import { BankClient } from "@/components/game/bank-client";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { GAME_CONSTANTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BankPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const [pilot, global, ventureCard, limitlessCard, wealthInvestments] = await Promise.all([
    getOrCreatePilotState(session.user.id, session.user.name),
    prisma.gameGlobal.findUnique({ where: { id: "singleton" } }),
    prisma.inventoryItem.findFirst({
      where: {
        pilot: { userId: session.user.id },
        name: "Centurion Venture Card",
        type: "special",
      },
    }),
    prisma.inventoryItem.findFirst({
      where: {
        pilot: { userId: session.user.id },
        name: "Nexus Limitless Yield",
        type: "special",
      },
    }),
    prisma.wealthInvestment.findMany({
      where: { pilot: { userId: session.user.id } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-amber-400">Bureau Bank</span>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-r from-[#0f0d08] via-[#12100a] to-[#0f0d08] p-5">
            {/* Vault door SVG illustration */}
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 text-amber-500 opacity-[0.06]" viewBox="0 0 96 96" fill="none">
              <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="2"/>
              <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/>
              <circle cx="48" cy="48" r="28" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4"/>
              <circle cx="48" cy="48" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
              <path d="M48 20v-4M48 80v-4M20 48h-4M80 48h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M48 38v20M38 48h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M33 33l-3-3M63 33l3-3M33 63l-3 3M63 63l3 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            {/* Circuit line decoration */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" viewBox="0 0 400 80" preserveAspectRatio="none">
              <path d="M0 40h60l5-5h30l5 5h40l5-10h20l5 10h50l5-5h30l5 5h140" stroke="#f59e0b" strokeWidth="0.5" fill="none"/>
              <path d="M0 25h30l5 5h40l5-5h20l5-8h15l5 8h35l5 5h235" stroke="#f59e0b" strokeWidth="0.5" fill="none"/>
              <path d="M0 55h45l5-5h35l5 5h25l5 8h15l5-8h40l5-5h215" stroke="#f59e0b" strokeWidth="0.5" fill="none"/>
            </svg>
            <div className="relative flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/20 bank-icon-glow">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                  <path d="M4 20V10h16v10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 3L2 10h20L12 3z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.07"/>
                  <path d="M8 14v6M12 14v6M16 14v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 20h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-[0.15em] text-amber-300">Bureau Bank</h1>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Secure vault · Loans · Bonds · Sovereign exchange · Pilot transfers
                </p>
              </div>
            </div>
          </div>

          <BankClient
            initialCredits={pilot.credits}
            initialCreditsBank={pilot.creditsBank}
            initialTokens={pilot.tokens}
            initialLoanAmount={pilot.loanAmount}
            initialLoanCreatedAt={pilot.loanCreatedAt?.toISOString() ?? null}
            initialBondAmount={pilot.bondAmount}
            initialBondRate={pilot.bondRate}
            initialBondDays={pilot.bondDays}
            initialBondMaturesAt={pilot.bondMaturesAt?.toISOString() ?? null}
            initialBondCreatedAt={pilot.bondCreatedAt?.toISOString() ?? null}
            initialBondLastClaimedAt={pilot.bondLastClaimedAt?.toISOString() ?? null}
            buyRate={GAME_CONSTANTS.TOKEN_BUY_RATE}
            sellRate={GAME_CONSTANTS.TOKEN_SELL_RATE}
            initialBankTreasury={global?.bankTreasury ?? 0}
            hasVentureCard={!!ventureCard}
            hasLimitlessCard={!!limitlessCard}
            initialWealthInvestments={wealthInvestments.map((inv) => ({
              id: inv.id,
              name: inv.name,
              amount: inv.amount,
              rate: inv.rate,
              days: inv.days,
              createdAt: inv.createdAt.toISOString(),
              maturesAt: inv.maturesAt.toISOString(),
              lastClaimedAt: inv.lastClaimedAt.toISOString(),
            }))}
          />
        </div>
      </main>
    </>
  );
}
