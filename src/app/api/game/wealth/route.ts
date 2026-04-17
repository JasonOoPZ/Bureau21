import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const MAX_INVESTMENTS = 5;
const MAX_AMOUNT = 3_000_000;   // max sovereigns per issuance
const MIN_AMOUNT = 500;         // min sovereigns per issuance

const WEALTH_RATES: Record<number, { rate: number; name: string }> = {
  7:   { rate: 2,    name: "Treasury Notes" },
  14:  { rate: 5,    name: "Municipal Bonds" },
  30:  { rate: 13,   name: "Blue-Chip Real Estate" },
  45:  { rate: 22,   name: "Private Credit" },
  60:  { rate: 33,   name: "Hedge Fund LP" },
  90:  { rate: 55,   name: "Private Equity" },
  180: { rate: 125,  name: "Venture Capital" },
  365: { rate: 275,  name: "Sovereign Wealth Fund" },
};

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return json({ error: "Unauthorized." }, 401);

  const rl = rateLimit(`wealth:${session.user.id}`, 20, 60_000);
  if (rl.limited) return json({ error: "Too many requests." }, 429);

  const body = await request.json().catch(() => null);
  if (!body?.action) return json({ error: "Invalid request." }, 400);

  const { action, amount, investmentDays, investmentId } = body as {
    action: string; amount?: number; investmentDays?: number; investmentId?: string;
  };

  const pilot = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });
  if (!pilot) return json({ error: "Pilot not found." }, 404);

  // Verify Centurion Venture Card ownership
  const ventureCard = await prisma.inventoryItem.findFirst({
    where: { pilotId: pilot.id, name: "Centurion Venture Card", type: "special" },
  });
  if (!ventureCard) return json({ error: "Centurion Venture Card required." }, 403);

  // Check for Nexus Limitless Yield card (waives max SVN per position)
  const limitlessCard = await prisma.inventoryItem.findFirst({
    where: { pilotId: pilot.id, name: "Nexus Limitless Yield", type: "special" },
  });

  const investments = await prisma.wealthInvestment.findMany({
    where: { pilotId: pilot.id },
    orderBy: { createdAt: "asc" },
  });

  const serializeInvestments = (list: typeof investments) =>
    list.map((inv) => ({
      id: inv.id,
      name: inv.name,
      amount: inv.amount,
      rate: inv.rate,
      days: inv.days,
      createdAt: inv.createdAt.toISOString(),
      maturesAt: inv.maturesAt.toISOString(),
      lastClaimedAt: inv.lastClaimedAt.toISOString(),
    }));

  // ── Status Check (lightweight, for client sync) ────────────────────
  if (action === "check_status") {
    return json({
      hasLimitlessCard: !!limitlessCard,
      tokens: pilot.tokens,
      investments: serializeInvestments(investments),
    });
  }

  // ── Buy Investment ────────────────────────────────────────────────────
  if (action === "buy_investment") {
    if (investments.length >= MAX_INVESTMENTS)
      return json({ error: `Maximum ${MAX_INVESTMENTS} active investments allowed.` }, 400);

    const tier = WEALTH_RATES[investmentDays ?? 0];
    if (!tier) return json({ error: "Invalid investment duration." }, 400);

    // Prevent duplicate investment types
    const hasSameTier = investments.some((inv) => inv.days === investmentDays);
    if (hasSameTier)
      return json({ error: `You already have an active ${tier.name} position. Only one per type allowed.` }, 400);

    const amt = typeof amount === "number" && Number.isInteger(amount) && amount > 0 ? amount : 0;
    if (amt < MIN_AMOUNT)
      return json({ error: `Minimum investment: ${MIN_AMOUNT.toLocaleString()} SVN.` }, 400);
    if (!limitlessCard && amt > MAX_AMOUNT)
      return json({ error: `Maximum ${MAX_AMOUNT.toLocaleString()} SVN per issuance.` }, 400);
    if (amt > pilot.tokens)
      return json({ error: "Insufficient Sovereigns." }, 400);

    const now = new Date();
    const maturesAt = new Date(now.getTime() + (investmentDays ?? 7) * 86400000);

    let updated;
    try {
      [updated] = await prisma.$transaction([
        prisma.pilotState.update({
          where: { userId: session.user.id },
          data: { tokens: { decrement: amt } },
        }),
        prisma.wealthInvestment.create({
          data: {
            pilotId: pilot.id,
            name: tier.name,
            amount: amt,
            rate: tier.rate,
            days: investmentDays!,
            maturesAt,
            lastClaimedAt: now,
          },
        }),
      ]);
    } catch (e: unknown) {
      if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
        return json({ error: `You already have an active ${tier.name} position. Only one per type allowed.` }, 400);
      }
      throw e;
    }

    const allInvestments = await prisma.wealthInvestment.findMany({
      where: { pilotId: pilot.id },
      orderBy: { createdAt: "asc" },
    });

    return json({
      message: `Invested ${amt.toLocaleString()} SVN in ${tier.name} at ${tier.rate}% for ${investmentDays} days.`,
      credits: updated.credits,
      creditsBank: updated.creditsBank,
      tokens: updated.tokens,
      investments: serializeInvestments(allInvestments),
      hasLimitlessCard: !!limitlessCard,
    });
  }

  // ── Claim Investment Yield ────────────────────────────────────────────
  if (action === "claim_yield") {
    if (!investmentId) return json({ error: "Investment ID required." }, 400);
    const inv = investments.find((i) => i.id === investmentId);
    if (!inv) return json({ error: "Investment not found." }, 404);

    const now = new Date();
    const dailyRate = inv.rate / inv.days;
    // Yield accrues at midnight UTC — first yield available the day AFTER creation
    const accrualStart = Math.floor(inv.createdAt.getTime() / 86_400_000) + 1;
    const nowDay = Math.floor(now.getTime() / 86_400_000);
    const lastClaimedDay = Math.max(Math.floor(inv.lastClaimedAt.getTime() / 86_400_000), accrualStart - 1);
    const totalDaysPassed = Math.min(Math.max(0, nowDay - accrualStart + 1), inv.days);
    const daysAlreadyClaimed = Math.max(0, lastClaimedDay - accrualStart + 1);
    const claimableDays = Math.max(0, totalDaysPassed - daysAlreadyClaimed);

    if (claimableDays < 1) return json({ error: "No yield to claim yet. Yield accrues daily." }, 400);

    const yieldAmount = Math.floor(inv.amount * (dailyRate / 100) * claimableDays);
    if (yieldAmount < 1) return json({ error: "Yield too small to claim." }, 400);

    const [updated] = await prisma.$transaction([
      prisma.pilotState.update({
        where: { userId: session.user.id },
        data: { tokens: { increment: yieldAmount } },
      }),
      prisma.wealthInvestment.update({
        where: { id: inv.id },
        data: { lastClaimedAt: now },
      }),
    ]);

    const allInvestments = await prisma.wealthInvestment.findMany({
      where: { pilotId: pilot.id },
      orderBy: { createdAt: "asc" },
    });

    return json({
      message: `Claimed ${yieldAmount.toLocaleString()} SVN yield from ${inv.name} (${claimableDays} day${claimableDays > 1 ? "s" : ""}).`,
      credits: updated.credits,
      creditsBank: updated.creditsBank,
      tokens: updated.tokens,
      investments: serializeInvestments(allInvestments),
      hasLimitlessCard: !!limitlessCard,
    });
  }

  // ── Collect Matured Investment ────────────────────────────────────────
  if (action === "collect_investment") {
    if (!investmentId) return json({ error: "Investment ID required." }, 400);
    const inv = investments.find((i) => i.id === investmentId);
    if (!inv) return json({ error: "Investment not found." }, 404);

    if (inv.maturesAt > new Date())
      return json({ error: "Investment hasn't matured yet." }, 400);

    // Calculate unclaimed remaining yield (first yield day = createdDay + 1)
    const accrualStart = Math.floor(inv.createdAt.getTime() / 86_400_000) + 1;
    const lastClaimedDay = Math.max(Math.floor(inv.lastClaimedAt.getTime() / 86_400_000), accrualStart - 1);
    const daysAlreadyClaimed = Math.max(0, lastClaimedDay - accrualStart + 1);
    const unclaimedDays = Math.max(0, inv.days - daysAlreadyClaimed);
    const dailyRate = inv.rate / inv.days;
    const remainingYield = Math.floor(inv.amount * (dailyRate / 100) * unclaimedDays);

    const payout = inv.amount + remainingYield;

    const [updated] = await prisma.$transaction([
      prisma.pilotState.update({
        where: { userId: session.user.id },
        data: { tokens: { increment: payout } },
      }),
      prisma.wealthInvestment.delete({ where: { id: inv.id } }),
    ]);

    const allInvestments = await prisma.wealthInvestment.findMany({
      where: { pilotId: pilot.id },
      orderBy: { createdAt: "asc" },
    });

    return json({
      message: `Collected ${payout.toLocaleString()} SVN from ${inv.name} (principal + ${remainingYield.toLocaleString()} SVN unclaimed yield).`,
      credits: updated.credits,
      creditsBank: updated.creditsBank,
      tokens: updated.tokens,
      investments: serializeInvestments(allInvestments),
      hasLimitlessCard: !!limitlessCard,
    });
  }

  // ── Early Withdrawal (15% penalty) ──────────────────────────────────
  if (action === "early_withdraw") {
    if (!investmentId) return json({ error: "Investment ID required." }, 400);
    const inv = investments.find((i) => i.id === investmentId);
    if (!inv) return json({ error: "Investment not found." }, 404);

    const penalty = Math.floor(inv.amount * 0.15);
    const payout = inv.amount - penalty;

    const [updated] = await prisma.$transaction([
      prisma.pilotState.update({
        where: { userId: session.user.id },
        data: { tokens: { increment: payout } },
      }),
      prisma.wealthInvestment.delete({ where: { id: inv.id } }),
    ]);

    const allInvestments = await prisma.wealthInvestment.findMany({
      where: { pilotId: pilot.id },
      orderBy: { createdAt: "asc" },
    });

    return json({
      message: `Early withdrawal from ${inv.name}. Returned ${payout.toLocaleString()} SVN (15% penalty: −${penalty.toLocaleString()} SVN).`,
      credits: updated.credits,
      creditsBank: updated.creditsBank,
      tokens: updated.tokens,
      investments: serializeInvestments(allInvestments),
      hasLimitlessCard: !!limitlessCard,
    });
  }

  return json({ error: "Unknown action." }, 400);
}
