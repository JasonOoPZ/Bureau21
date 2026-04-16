import { authOptions } from "@/auth";
import { GAME_CONSTANTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const BOND_RATES: Record<number, number> = { 7: 1, 14: 2.25, 30: 5, 45: 7.5, 60: 11, 90: 15, 180: 20, 365: 25 };

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return json({ error: "Unauthorized." }, 401);

  const rl = rateLimit(`bank:${session.user.id}`, 30, 60_000);
  if (rl.limited) return json({ error: "Too many transactions." }, 429);

  const body = await request.json().catch(() => null);
  if (!body?.action) return json({ error: "Invalid request." }, 400);

  const { action, amount, recipientCallsign, bondDays } = body as {
    action: string; amount?: number; recipientCallsign?: string; bondDays?: number;
  };
  const amt = typeof amount === "number" && Number.isInteger(amount) && amount > 0 ? amount : 0;

  const pilot = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });
  if (!pilot) return json({ error: "Pilot not found." }, 404);

  const respond = (message: string, extra: Record<string, unknown> = {}) =>
    json({ message, credits: pilot.credits, creditsBank: pilot.creditsBank, tokens: pilot.tokens, loanAmount: pilot.loanAmount, bondAmount: pilot.bondAmount, bondRate: pilot.bondRate, bondMaturesAt: pilot.bondMaturesAt?.toISOString() ?? null, ...extra });

  // ── Deposit ─────────────────────────────────────────────────────────────
  if (action === "deposit") {
    if (amt < 1 || amt > pilot.credits) return json({ error: "Invalid amount." }, 400);
    const updated = await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { credits: { decrement: amt }, creditsBank: { increment: amt } },
    });
    return json({ message: `Deposited ${amt.toLocaleString()} ₡ into bank.`, credits: updated.credits, creditsBank: updated.creditsBank, tokens: updated.tokens, loanAmount: updated.loanAmount, bondAmount: updated.bondAmount, bondRate: updated.bondRate, bondMaturesAt: updated.bondMaturesAt?.toISOString() ?? null });
  }

  // ── Withdraw ────────────────────────────────────────────────────────────
  if (action === "withdraw") {
    if (amt < 1 || amt > pilot.creditsBank) return json({ error: "Insufficient bank balance." }, 400);
    const fee = Math.ceil(amt * 0.025);
    const received = amt - fee;
    // Deduct full amount from bank, credit pilot with (amount - fee), fee goes to treasury
    const updated = await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { credits: { increment: received }, creditsBank: { decrement: amt } },
    });
    // Add fee to bank treasury
    if (fee > 0) {
      await prisma.gameGlobal.upsert({
        where: { id: "singleton" },
        update: { bankTreasury: { increment: fee } },
        create: { id: "singleton", bankTreasury: fee },
      });
    }
    return json({ message: `Withdrew ${amt.toLocaleString()} ₡ (fee: ${fee.toLocaleString()} ₡). Received ${received.toLocaleString()} ₡.`, credits: updated.credits, creditsBank: updated.creditsBank, tokens: updated.tokens, loanAmount: updated.loanAmount, bondAmount: updated.bondAmount, bondRate: updated.bondRate, bondMaturesAt: updated.bondMaturesAt?.toISOString() ?? null, fee });
  }

  // ── Transfer ────────────────────────────────────────────────────────────
  if (action === "transfer") {
    if (amt < 1 || amt > pilot.credits) return json({ error: "Insufficient credits." }, 400);
    if (!recipientCallsign?.trim()) return json({ error: "Recipient callsign required." }, 400);
    const recipient = await prisma.pilotState.findFirst({ where: { callsign: { equals: recipientCallsign.trim(), mode: "insensitive" } } });
    if (!recipient) return json({ error: `Pilot "${recipientCallsign}" not found.` }, 404);
    if (recipient.userId === session.user.id) return json({ error: "Cannot transfer to yourself." }, 400);

    await prisma.$transaction([
      prisma.pilotState.update({ where: { userId: session.user.id }, data: { credits: { decrement: amt } } }),
      prisma.pilotState.update({ where: { id: recipient.id }, data: { credits: { increment: amt } } }),
    ]);

    const updated = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });
    return json({ message: `Sent ${amt.toLocaleString()} ₡ to ${recipient.callsign}.`, credits: updated!.credits, creditsBank: updated!.creditsBank, tokens: updated!.tokens, loanAmount: updated!.loanAmount, bondAmount: updated!.bondAmount, bondRate: updated!.bondRate, bondMaturesAt: updated!.bondMaturesAt?.toISOString() ?? null });
  }

  // ── Take Loan ───────────────────────────────────────────────────────────
  if (action === "take_loan") {
    if (pilot.loanAmount > 0) return json({ error: "Repay existing loan first." }, 400);
    const maxLoan = Math.floor(pilot.creditsBank * 0.05);
    if (amt < 1 || amt > maxLoan) return json({ error: `Max loan: ${maxLoan.toLocaleString()} ₡ (5% of bank).` }, 400);
    const owes = Math.ceil(amt * 1.069);
    const updated = await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { credits: { increment: amt }, loanAmount: owes, loanCreatedAt: new Date() },
    });
    return json({ message: `Borrowed ${amt.toLocaleString()} ₡. You owe ${owes.toLocaleString()} ₡.`, credits: updated.credits, creditsBank: updated.creditsBank, tokens: updated.tokens, loanAmount: updated.loanAmount, bondAmount: updated.bondAmount, bondRate: updated.bondRate, bondMaturesAt: updated.bondMaturesAt?.toISOString() ?? null });
  }

  // ── Repay Loan ──────────────────────────────────────────────────────────
  if (action === "repay_loan") {
    if (pilot.loanAmount <= 0) return json({ error: "No outstanding loan." }, 400);
    const repay = Math.min(amt, pilot.loanAmount, pilot.credits);
    if (repay < 1) return json({ error: "Insufficient credits." }, 400);
    const newLoan = pilot.loanAmount - repay;
    const updated = await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { credits: { decrement: repay }, loanAmount: newLoan, ...(newLoan === 0 ? { loanCreatedAt: null } : {}) },
    });
    return json({ message: newLoan === 0 ? `Loan fully repaid!` : `Repaid ${repay.toLocaleString()} ₡. Remaining: ${newLoan.toLocaleString()} ₡.`, credits: updated.credits, creditsBank: updated.creditsBank, tokens: updated.tokens, loanAmount: updated.loanAmount, bondAmount: updated.bondAmount, bondRate: updated.bondRate, bondMaturesAt: updated.bondMaturesAt?.toISOString() ?? null });
  }

  // ── Buy Bond ────────────────────────────────────────────────────────────
  if (action === "buy_bond") {
    if (pilot.bondAmount > 0) return json({ error: "Already have an active bond. Claim yield and collect first." }, 400);
    const rate = BOND_RATES[bondDays ?? 0];
    if (!rate) return json({ error: "Invalid bond duration." }, 400);
    if (amt < 100 || amt > pilot.creditsBank) return json({ error: "Insufficient bank balance (min 100 ₡)." }, 400);
    const maturesAt = new Date(Date.now() + (bondDays ?? 7) * 86400000);
    const now = new Date();
    const updated = await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { creditsBank: { decrement: amt }, bondAmount: amt, bondRate: rate, bondDays: bondDays ?? 7, bondCreatedAt: now, bondMaturesAt: maturesAt, bondLastClaimedAt: now },
    });
    return json({ message: `Invested ${amt.toLocaleString()} ₡ at ${rate}% for ${bondDays} days.`, credits: updated.credits, creditsBank: updated.creditsBank, tokens: updated.tokens, loanAmount: updated.loanAmount, bondAmount: updated.bondAmount, bondRate: updated.bondRate, bondDays: updated.bondDays, bondMaturesAt: updated.bondMaturesAt?.toISOString() ?? null, bondLastClaimedAt: updated.bondLastClaimedAt?.toISOString() ?? null, bondCreatedAt: updated.bondCreatedAt?.toISOString() ?? null });
  }

  // ── Claim Yield ─────────────────────────────────────────────────────────
  if (action === "claim_yield") {
    if (pilot.bondAmount <= 0) return json({ error: "No active bond." }, 400);
    if (!pilot.bondLastClaimedAt || !pilot.bondCreatedAt) return json({ error: "Bond data missing." }, 400);

    const now = new Date();
    const dailyRate = pilot.bondRate / pilot.bondDays;
    const msSinceClaim = now.getTime() - pilot.bondLastClaimedAt.getTime();
    const daysSinceClaim = Math.floor(msSinceClaim / 86400000);
    if (daysSinceClaim < 1) return json({ error: "No yield to claim yet. Yield accrues daily." }, 400);

    // Cap at maturity — don't accrue beyond bond end
    const msFromStart = now.getTime() - pilot.bondCreatedAt.getTime();
    const totalDaysPassed = Math.min(Math.floor(msFromStart / 86400000), pilot.bondDays);
    const msClaimFromStart = pilot.bondLastClaimedAt.getTime() - pilot.bondCreatedAt.getTime();
    const daysAlreadyClaimed = Math.floor(msClaimFromStart / 86400000);
    const claimableDays = Math.max(0, totalDaysPassed - daysAlreadyClaimed);

    if (claimableDays < 1) return json({ error: "No yield to claim." }, 400);

    const yield_ = Math.floor(pilot.bondAmount * (dailyRate / 100) * claimableDays);
    if (yield_ < 1) return json({ error: "Yield too small to claim." }, 400);

    const updated = await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { creditsBank: { increment: yield_ }, bondLastClaimedAt: now },
    });
    return json({ message: `Claimed ${yield_.toLocaleString()} ₡ yield (${claimableDays} day${claimableDays > 1 ? "s" : ""}).`, credits: updated.credits, creditsBank: updated.creditsBank, tokens: updated.tokens, loanAmount: updated.loanAmount, bondAmount: updated.bondAmount, bondRate: updated.bondRate, bondDays: updated.bondDays, bondMaturesAt: updated.bondMaturesAt?.toISOString() ?? null, bondLastClaimedAt: updated.bondLastClaimedAt?.toISOString() ?? null, bondCreatedAt: updated.bondCreatedAt?.toISOString() ?? null });
  }

  // ── Collect Bond ────────────────────────────────────────────────────────
  if (action === "collect_bond") {
    if (pilot.bondAmount <= 0) return json({ error: "No active bond." }, 400);
    if (pilot.bondMaturesAt && pilot.bondMaturesAt > new Date()) return json({ error: "Bond hasn't matured yet." }, 400);

    // Return principal + any unclaimed remaining yield
    let remainingYield = 0;
    if (pilot.bondLastClaimedAt && pilot.bondCreatedAt) {
      const msClaimFromStart = pilot.bondLastClaimedAt.getTime() - pilot.bondCreatedAt.getTime();
      const daysAlreadyClaimed = Math.floor(msClaimFromStart / 86400000);
      const unclaimedDays = Math.max(0, pilot.bondDays - daysAlreadyClaimed);
      const dailyRate = pilot.bondRate / pilot.bondDays;
      remainingYield = Math.floor(pilot.bondAmount * (dailyRate / 100) * unclaimedDays);
    }

    const payout = pilot.bondAmount + remainingYield;
    const updated = await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { creditsBank: { increment: payout }, bondAmount: 0, bondRate: 0, bondDays: 0, bondCreatedAt: null, bondMaturesAt: null, bondLastClaimedAt: null },
    });
    return json({ message: `Bond matured! Collected ${payout.toLocaleString()} ₡ (principal + ${remainingYield.toLocaleString()} ₡ unclaimed yield).`, credits: updated.credits, creditsBank: updated.creditsBank, tokens: updated.tokens, loanAmount: updated.loanAmount, bondAmount: updated.bondAmount, bondRate: updated.bondRate, bondDays: 0, bondMaturesAt: null, bondLastClaimedAt: null, bondCreatedAt: null });
  }

  // ── Buy Tokens ──────────────────────────────────────────────────────────
  if (action === "buy_tokens") {
    const cost = amt * GAME_CONSTANTS.TOKEN_BUY_RATE;
    if (pilot.credits < cost) return json({ error: `Need ${cost} credits.` }, 400);
    const updated = await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { credits: { decrement: cost }, tokens: { increment: amt } },
    });
    return json({ message: `Bought ${amt} tokens for ${cost} credits.`, credits: updated.credits, creditsBank: updated.creditsBank, tokens: updated.tokens, loanAmount: updated.loanAmount, bondAmount: updated.bondAmount, bondRate: updated.bondRate, bondMaturesAt: updated.bondMaturesAt?.toISOString() ?? null });
  }

  // ── Sell Tokens ─────────────────────────────────────────────────────────
  if (action === "sell_tokens") {
    if (pilot.tokens < amt) return json({ error: `Only have ${pilot.tokens} tokens.` }, 400);
    const gained = amt * GAME_CONSTANTS.TOKEN_SELL_RATE;
    const updated = await prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { tokens: { decrement: amt }, credits: { increment: gained } },
    });
    return json({ message: `Sold ${amt} tokens for ${gained} credits.`, credits: updated.credits, creditsBank: updated.creditsBank, tokens: updated.tokens, loanAmount: updated.loanAmount, bondAmount: updated.bondAmount, bondRate: updated.bondRate, bondMaturesAt: updated.bondMaturesAt?.toISOString() ?? null });
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
