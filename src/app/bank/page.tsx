import { authOptions } from "@/auth";
import { BankClient } from "@/components/game/bank-client";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { GAME_CONSTANTS } from "@/lib/constants";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BankPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

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

          <div className="rounded-md border border-amber-900/40 bg-[#0f0d08] p-4">
            <h1 className="text-xl font-bold uppercase tracking-widest text-amber-300">Bureau Bank</h1>
            <p className="mt-1 text-[11px] text-slate-400">
              Deposit credits for safekeeping, take out loans, invest in bonds, transfer to other pilots, or exchange tokens.
            </p>
          </div>

          <BankClient
            initialCredits={pilot.credits}
            initialCreditsBank={pilot.creditsBank}
            initialTokens={pilot.tokens}
            initialLoanAmount={pilot.loanAmount}
            initialLoanCreatedAt={pilot.loanCreatedAt?.toISOString() ?? null}
            initialBondAmount={pilot.bondAmount}
            initialBondRate={pilot.bondRate}
            initialBondMaturesAt={pilot.bondMaturesAt?.toISOString() ?? null}
            buyRate={GAME_CONSTANTS.TOKEN_BUY_RATE}
            sellRate={GAME_CONSTANTS.TOKEN_SELL_RATE}
          />
        </div>
      </main>
    </>
  );
}
