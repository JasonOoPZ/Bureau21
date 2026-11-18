import { authOptions } from "@/auth";
import { GAME_CONSTANTS } from "@/lib/constants";
import { EconomyError, economyErrorResponse, economyTx, guardedPilotUpdate, type Db } from "@/lib/economy";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import type { PilotState } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const BOND_RATES: Record<number, number> = { 7: 1, 14: 2.25, 30: 5, 45: 7.5, 60: 11, 90: 15, 180: 20, 365: 25 };

/** A loan may be at most 5% of the bank balance, i.e. the bank must hold 20x the loan. */
const LOAN_COLLATERAL_MULTIPLE = 20;

const CLEARED_BOND = { bondAmount: 0, bondRate: 0, bondDays: 0, bondCreatedAt: null, bondMaturesAt: null, bondLastClaimedAt: null };
const CLEARED_BOND_RESPONSE = { bondDays: 0, bondMaturesAt: null, bondLastClaimedAt: null, bondCreatedAt: null };

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}

/** Balance fields every bank response carries. Always built from a post-write row. */
function balances(p: PilotState) {
  return {
    credits: p.credits,
    creditsBank: p.creditsBank,
    tokens: p.tokens,
    loanAmount: p.loanAmount,
    bondAmount: p.bondAmount,
    bondRate: p.bondRate,
    bondMaturesAt: p.bondMaturesAt?.toISOString() ?? null,
  };
}

function bondDetails(p: PilotState) {
  return {
    bondDays: p.bondDays,
    bondLastClaimedAt: p.bondLastClaimedAt?.toISOString() ?? null,
    bondCreatedAt: p.bondCreatedAt?.toISOString() ?? null,
  };
}

async function addToTreasury(db: Db, amount: number) {
  if (amount <= 0) return;
  await db.gameGlobal.upsert({
    where: { id: "singleton" },
    update: { bankTreasury: { increment: amount } },
    create: { id: "singleton", bankTreasury: amount },
  });
}

/*
 * Every action below follows the same shape:
 *   1. a cheap pre-check on the row we read (only to produce a friendly error),
 *   2. ONE guarded write whose WHERE clause re-states the precondition,
 *   3. a response built from the row that write returned.
 * Step 2 is the only thing protecting the balance: N parallel copies of a
 * request all pass step 1, but the guard holds for exactly as many of them
 * as the balance really covers.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return json({ error: "Unauthorized." }, 401);
  const userId = session.user.id;

  const rl = rateLimit(`bank:${userId}`, 30, 60_000);
  if (rl.limited) return json({ error: "Too many transactions." }, 429);

  const body = await request.json().catch(() => null);
  if (!body?.action) return json({ error: "Invalid request." }, 400);

  const { action, amount, recipientCallsign, bondDays } = body as {
    action: string; amount?: number; recipientCallsign?: string; bondDays?: number;
  };
  const amt = typeof amount === "number" && Number.isInteger(amount) && amount > 0 ? amount : 0;

  const pilot = await prisma.pilotState.findUnique({ where: { userId } });
  if (!pilot) return json({ error: "Pilot not found." }, 404);

  try {
    // ── Deposit ───────────────────────────────────────────────────────────
    if (action === "deposit") {
      if (amt < 1 || amt > pilot.credits) return json({ error: "Invalid amount." }, 400);
      const updated = await guardedPilotUpdate(
        prisma, userId,
        { credits: { gte: amt } },
        { credits: { decrement: amt }, creditsBank: { increment: amt } }
      );
      if (!updated) return json({ error: "Invalid amount." }, 400);
      return json({ message: `Deposited ${amt.toLocaleString()} ₡ into bank.`, ...balances(updated) });
    }

    // ── Withdraw ──────────────────────────────────────────────────────────
    // Loans are never collected, so deposits act as collateral: a withdrawal
    // may not take the bank balance below the outstanding loan.
    if (action === "withdraw") {
      if (amt < 1 || amt > pilot.creditsBank) return json({ error: "Insufficient bank balance." }, 400);
      const collateral = Math.max(0, pilot.loanAmount);
      if (pilot.creditsBank - amt < collateral) {
        return json({ error: `Outstanding loan of ${collateral.toLocaleString()} ₡: that much of your deposit is held as collateral. Repay the loan to withdraw it.` }, 400);
      }

      const fee = Math.ceil(amt * 0.025);
      const received = amt - fee;
      // Deduct full amount from bank, credit pilot with (amount - fee), fee goes to treasury
      const updated = await economyTx(async (tx) => {
        const row = await guardedPilotUpdate(
          tx, userId,
          // loanAmount lte: a loan taken concurrently raises the collateral and voids this guard
          { creditsBank: { gte: amt + collateral }, loanAmount: { lte: collateral } },
          { credits: { increment: received }, creditsBank: { decrement: amt } }
        );
        if (!row) throw new EconomyError("Insufficient bank balance.");
        await addToTreasury(tx, fee);
        return row;
      });
      return json({ message: `Withdrew ${amt.toLocaleString()} ₡ (fee: ${fee.toLocaleString()} ₡). Received ${received.toLocaleString()} ₡.`, ...balances(updated), fee });
    }

    // ── Transfer ──────────────────────────────────────────────────────────
    if (action === "transfer") {
      if (amt < 1 || amt > pilot.credits) return json({ error: "Insufficient credits." }, 400);
      if (!recipientCallsign?.trim()) return json({ error: "Recipient callsign required." }, 400);
      const recipient = await prisma.pilotState.findFirst({ where: { callsign: { equals: recipientCallsign.trim(), mode: "insensitive" } } });
      if (!recipient) return json({ error: `Pilot "${recipientCallsign}" not found.` }, 404);
      if (recipient.userId === userId) return json({ error: "Cannot transfer to yourself." }, 400);

      const updated = await economyTx(async (tx) => {
        const row = await guardedPilotUpdate(tx, userId, { credits: { gte: amt } }, { credits: { decrement: amt } });
        if (!row) throw new EconomyError("Insufficient credits.");
        await tx.pilotState.update({ where: { id: recipient.id }, data: { credits: { increment: amt } } });
        return row;
      });
      return json({ message: `Sent ${amt.toLocaleString()} ₡ to ${recipient.callsign}.`, ...balances(updated) });
    }

    // ── Take Loan ─────────────────────────────────────────────────────────
    if (action === "take_loan") {
      if (pilot.loanAmount > 0) return json({ error: "Repay existing loan first." }, 400);
      const maxLoan = Math.floor(pilot.creditsBank * 0.05);
      if (amt < 1 || amt > maxLoan) return json({ error: `Max loan: ${maxLoan.toLocaleString()} ₡ (5% of bank).` }, 400);
      const owes = Math.ceil(amt * 1.069);
      const updated = await guardedPilotUpdate(
        prisma, userId,
        // one loan at a time, and the bank must still hold the 20x that justifies it
        { loanAmount: { lte: 0 }, creditsBank: { gte: amt * LOAN_COLLATERAL_MULTIPLE } },
        { credits: { increment: amt }, loanAmount: owes, loanCreatedAt: new Date() }
      );
      if (!updated) return json({ error: "Repay existing loan first." }, 400);
      return json({ message: `Borrowed ${amt.toLocaleString()} ₡. You owe ${owes.toLocaleString()} ₡.`, ...balances(updated) });
    }

    // ── Repay Loan ────────────────────────────────────────────────────────
    if (action === "repay_loan") {
      if (pilot.loanAmount <= 0) return json({ error: "No outstanding loan." }, 400);
      const repay = Math.min(amt, pilot.loanAmount, pilot.credits);
      if (repay < 1) return json({ error: "Insufficient credits." }, 400);
      const repaid = await guardedPilotUpdate(
        prisma, userId,
        { credits: { gte: repay }, loanAmount: { gte: repay } },
        { credits: { decrement: repay }, loanAmount: { decrement: repay } }
      );
      if (!repaid) return json({ error: "Insufficient credits." }, 400);
      const cleared = repaid.loanAmount === 0
        ? await guardedPilotUpdate(prisma, userId, { loanAmount: 0 }, { loanCreatedAt: null })
        : null;
      const updated = cleared ?? repaid;
      return json({ message: updated.loanAmount === 0 ? `Loan fully repaid!` : `Repaid ${repay.toLocaleString()} ₡. Remaining: ${updated.loanAmount.toLocaleString()} ₡.`, ...balances(updated) });
    }

    // ── Buy Bond ──────────────────────────────────────────────────────────
    if (action === "buy_bond") {
      const activeBondError = "Already have an active bond. Claim yield and collect first.";
      if (pilot.bondAmount > 0) return json({ error: activeBondError }, 400);
      const rate = BOND_RATES[bondDays ?? 0];
      if (!rate) return json({ error: "Invalid bond duration." }, 400);
      if (amt < 100 || amt > pilot.creditsBank) return json({ error: "Insufficient bank balance (min 100 ₡)." }, 400);
      const maturesAt = new Date(Date.now() + (bondDays ?? 7) * 86400000);
      const now = new Date();
      const updated = await guardedPilotUpdate(
        prisma, userId,
        { bondAmount: { lte: 0 }, creditsBank: { gte: amt } },
        { creditsBank: { decrement: amt }, bondAmount: amt, bondRate: rate, bondDays: bondDays ?? 7, bondCreatedAt: now, bondMaturesAt: maturesAt, bondLastClaimedAt: now }
      );
      if (!updated) return json({ error: activeBondError }, 400);
      return json({ message: `Invested ${amt.toLocaleString()} ₡ at ${rate}% for ${bondDays} days.`, ...balances(updated), ...bondDetails(updated) });
    }

    // ── Claim Yield ───────────────────────────────────────────────────────
    if (action === "claim_yield") {
      if (pilot.bondAmount <= 0) return json({ error: "No active bond." }, 400);
      if (!pilot.bondLastClaimedAt || !pilot.bondCreatedAt) return json({ error: "Bond data missing." }, 400);

      const now = new Date();
      const dailyRate = pilot.bondRate / pilot.bondDays;
      // Yield accrues at midnight UTC — first yield available the day AFTER creation
      const accrualStart = Math.floor(pilot.bondCreatedAt.getTime() / 86_400_000) + 1;
      const nowDay = Math.floor(now.getTime() / 86_400_000);
      const lastClaimedDay = Math.max(Math.floor(pilot.bondLastClaimedAt.getTime() / 86_400_000), accrualStart - 1);
      const totalDaysPassed = Math.min(Math.max(0, nowDay - accrualStart + 1), pilot.bondDays);
      const daysAlreadyClaimed = Math.max(0, lastClaimedDay - accrualStart + 1);
      const claimableDays = Math.max(0, totalDaysPassed - daysAlreadyClaimed);

      const nothingYetError = "No yield to claim yet. Yield accrues at midnight UTC.";
      if (claimableDays < 1) return json({ error: nothingYetError }, 400);

      const yield_ = Math.floor(pilot.bondAmount * (dailyRate / 100) * claimableDays);
      if (yield_ < 1) return json({ error: "Yield too small to claim." }, 400);

      // The yield was computed from this exact bond + claim marker: pay only if both are unchanged.
      const updated = await guardedPilotUpdate(
        prisma, userId,
        { bondAmount: pilot.bondAmount, bondCreatedAt: pilot.bondCreatedAt, bondLastClaimedAt: pilot.bondLastClaimedAt },
        { creditsBank: { increment: yield_ }, bondLastClaimedAt: now }
      );
      if (!updated) return json({ error: nothingYetError }, 400);
      return json({ message: `Claimed ${yield_.toLocaleString()} ₡ yield (${claimableDays} day${claimableDays > 1 ? "s" : ""}).`, ...balances(updated), ...bondDetails(updated) });
    }

    // ── Collect Bond ──────────────────────────────────────────────────────
    if (action === "collect_bond") {
      if (pilot.bondAmount <= 0) return json({ error: "No active bond." }, 400);
      if (pilot.bondMaturesAt && pilot.bondMaturesAt > new Date()) return json({ error: "Bond hasn't matured yet." }, 400);

      // Return principal + any unclaimed remaining yield
      let remainingYield = 0;
      if (pilot.bondLastClaimedAt && pilot.bondCreatedAt) {
        const accrualStart = Math.floor(pilot.bondCreatedAt.getTime() / 86_400_000) + 1;
        const lastClaimedDay = Math.max(Math.floor(pilot.bondLastClaimedAt.getTime() / 86_400_000), accrualStart - 1);
        const daysAlreadyClaimed = Math.max(0, lastClaimedDay - accrualStart + 1);
        const unclaimedDays = Math.max(0, pilot.bondDays - daysAlreadyClaimed);
        const dailyRate = pilot.bondRate / pilot.bondDays;
        remainingYield = Math.floor(pilot.bondAmount * (dailyRate / 100) * unclaimedDays);
      }

      const payout = pilot.bondAmount + remainingYield;
      // Zeroing the bond is the claim: only the request that still sees this bond gets paid.
      const updated = await guardedPilotUpdate(
        prisma, userId,
        { bondAmount: pilot.bondAmount, bondCreatedAt: pilot.bondCreatedAt, bondLastClaimedAt: pilot.bondLastClaimedAt },
        { creditsBank: { increment: payout }, ...CLEARED_BOND }
      );
      if (!updated) return json({ error: "No active bond." }, 400);
      return json({ message: `Bond matured! Collected ${payout.toLocaleString()} ₡ (principal + ${remainingYield.toLocaleString()} ₡ unclaimed yield).`, ...balances(updated), ...CLEARED_BOND_RESPONSE });
    }

    // ── Early Bond Withdrawal (15% penalty) ───────────────────────────────
    if (action === "early_withdraw_bond") {
      if (pilot.bondAmount <= 0) return json({ error: "No active bond." }, 400);

      const penalty = Math.floor(pilot.bondAmount * 0.15);
      const payout = pilot.bondAmount - penalty;

      const updated = await economyTx(async (tx) => {
        const row = await guardedPilotUpdate(
          tx, userId,
          { bondAmount: pilot.bondAmount, bondCreatedAt: pilot.bondCreatedAt },
          { creditsBank: { increment: payout }, ...CLEARED_BOND }
        );
        if (!row) throw new EconomyError("No active bond.");
        // Penalty goes to the bank treasury
        await addToTreasury(tx, penalty);
        return row;
      });
      return json({ message: `Early withdrawal. Returned ${payout.toLocaleString()} ₡ (15% penalty: −${penalty.toLocaleString()} ₡).`, ...balances(updated), ...CLEARED_BOND_RESPONSE });
    }

    // ── Buy Tokens ────────────────────────────────────────────────────────
    if (action === "buy_tokens") {
      if (amt < 1) return json({ error: "Invalid amount." }, 400);
      const cost = amt * GAME_CONSTANTS.TOKEN_BUY_RATE;
      if (pilot.credits < cost) return json({ error: `Need ${cost} credits.` }, 400);
      const updated = await guardedPilotUpdate(
        prisma, userId,
        { credits: { gte: cost } },
        { credits: { decrement: cost }, tokens: { increment: amt } }
      );
      if (!updated) return json({ error: `Need ${cost} credits.` }, 400);
      return json({ message: `Bought ${amt} tokens for ${cost} credits.`, ...balances(updated) });
    }

    // ── Sell Tokens ───────────────────────────────────────────────────────
    if (action === "sell_tokens") {
      if (amt < 1) return json({ error: "Invalid amount." }, 400);
      if (pilot.tokens < amt) return json({ error: `Only have ${pilot.tokens} tokens.` }, 400);
      const gained = amt * GAME_CONSTANTS.TOKEN_SELL_RATE;
      const updated = await guardedPilotUpdate(
        prisma, userId,
        { tokens: { gte: amt } },
        { tokens: { decrement: amt }, credits: { increment: gained } }
      );
      if (!updated) return json({ error: `Only have ${pilot.tokens} tokens.` }, 400);
      return json({ message: `Sold ${amt} tokens for ${gained} credits.`, ...balances(updated) });
    }
  } catch (error) {
    return economyErrorResponse(error);
  }

  return json({ error: "Unknown action." }, 400);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return json({ error: "Unauthorized." }, 401);

  const pilot = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });
  if (!pilot) return json({ error: "Pilot not found." }, 404);

  const global = await prisma.gameGlobal.findUnique({ where: { id: "singleton" } });

  return json({
    credits: pilot.credits,
    creditsBank: pilot.creditsBank,
    tokens: pilot.tokens,
    loanAmount: pilot.loanAmount,
    bondAmount: pilot.bondAmount,
    bondRate: pilot.bondRate,
    bondDays: pilot.bondDays,
    bondMaturesAt: pilot.bondMaturesAt?.toISOString() ?? null,
    bondCreatedAt: pilot.bondCreatedAt?.toISOString() ?? null,
    bondLastClaimedAt: pilot.bondLastClaimedAt?.toISOString() ?? null,
    bankTreasury: global?.bankTreasury ?? 0,
  });
}
