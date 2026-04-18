import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// ─── Slot Machine ────────────────────────────────────────────────────────────

const SLOT_SYMBOLS = ["🎰", "💎", "⚡", "🔥", "💀", "🪙"];
const SLOT_WEIGHTS = [1, 3, 5, 8, 10, 15];
const SLOT_JACKPOTS: Record<string, number> = {
  "🎰": 50, "💎": 20, "⚡": 10, "🔥": 5, "💀": 3, "🪙": 2,
};

function weightedPick(symbols: string[], weights: number[]): string {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < symbols.length; i++) {
    r -= weights[i];
    if (r <= 0) return symbols[i];
  }
  return symbols[symbols.length - 1];
}

function playSlots(bet: number) {
  const reels = [0, 1, 2].map(() => weightedPick(SLOT_SYMBOLS, SLOT_WEIGHTS));
  const [a, b, c] = reels;
  if (a === b && b === c) {
    const mult = SLOT_JACKPOTS[a];
    return { reels, payout: Math.floor(bet * mult), label: `JACKPOT! ${a}${b}${c} — ${mult}x` };
  }
  if (a === b || b === c || a === c) {
    return { reels, payout: Math.floor(bet * 1.2), label: "Partial match — 1.2x" };
  }
  return { reels, payout: 0, label: "No match" };
}

// ─── Dice ─────────────────────────────────────────────────────────────────────

function playDice(bet: number, choice: "over" | "under" | "seven") {
  const d1 = Math.ceil(Math.random() * 6);
  const d2 = Math.ceil(Math.random() * 6);
  const total = d1 + d2;

  if (choice === "seven") {
    const won = total === 7;
    return { dice: [d1, d2], total, payout: won ? Math.floor(bet * 4) : 0, label: won ? `Exactly 7! — 4x` : `Rolled ${total} — lose` };
  }
  if (choice === "over") {
    const won = total > 7;
    return { dice: [d1, d2], total, payout: won ? Math.floor(bet * 1.9) : 0, label: won ? `Over 7 (${total}) — 1.9x` : `Rolled ${total} — lose` };
  }
  const won = total < 7;
  return { dice: [d1, d2], total, payout: won ? Math.floor(bet * 1.9) : 0, label: won ? `Under 7 (${total}) — 1.9x` : `Rolled ${total} — lose` };
}

// ─── Coin Flip ────────────────────────────────────────────────────────────────

function playCoinFlip(bet: number, choice: "heads" | "tails") {
  const result = Math.random() < 0.5 ? "heads" : "tails";
  const won = result === choice;
  return { result, payout: won ? Math.floor(bet * 1.95) : 0, label: won ? `${result.toUpperCase()} — 1.95x` : `${result.toUpperCase()} — lose` };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { game, bet, choice } = body as { game: string; bet: number; choice?: string };

  if (!Number.isInteger(bet) || bet < 10 || bet > 1_000_000) {
    return NextResponse.json({ error: "Invalid bet (10–1,000,000)." }, { status: 400 });
  }

  const pilot = await prisma.pilotState.findUnique({ where: { userId: session.user.id } });
  if (!pilot) return NextResponse.json({ error: "Pilot not found." }, { status: 404 });
  if (pilot.credits < bet) return NextResponse.json({ error: "Not enough credits." }, { status: 400 });

  let result: { payout: number; label: string; [key: string]: unknown };

  if (game === "slots") {
    result = playSlots(bet);
  } else if (game === "dice") {
    if (!["over", "under", "seven"].includes(choice ?? "")) {
      return NextResponse.json({ error: "Invalid choice." }, { status: 400 });
    }
    result = playDice(bet, choice as "over" | "under" | "seven");
  } else if (game === "coinflip") {
    if (!["heads", "tails"].includes(choice ?? "")) {
      return NextResponse.json({ error: "Invalid choice." }, { status: 400 });
    }
    result = playCoinFlip(bet, choice as "heads" | "tails");
  } else {
    return NextResponse.json({ error: "Unknown game." }, { status: 400 });
  }

  const netChange = result.payout - bet;
  const newCredits = pilot.credits + netChange;

  await prisma.$transaction([
    prisma.pilotState.update({
      where: { userId: session.user.id },
      data: { credits: newCredits },
    }),
    prisma.casinoBet.create({
      data: { pilotId: pilot.id, game, bet, payout: result.payout, net: netChange },
    }),
  ]);

  return NextResponse.json({ ...result, bet, net_change: netChange, new_credits: newCredits });
}
