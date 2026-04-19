import { authOptions } from "@/auth";
import { BankClient } from "@/components/game/bank-client";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { GAME_CONSTANTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

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

          <PixelBanner scene="bank" title="Bureau Bank" subtitle="Secure vault · Loans · Bonds · Sovereign exchange · Pilot transfers" />

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
