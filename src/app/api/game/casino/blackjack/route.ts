import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function newDeck() {
  const deck: string[] = [];
  for (const s of SUITS) for (const r of RANKS) deck.push(`${r}${s}`);
  // shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(card: string): number {
  const rank = card.slice(0, -1);
  if (["J", "Q", "K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return parseInt(rank, 10);
}

function handTotal(hand: string[]): number {
  let total = hand.reduce((s, c) => s + cardValue(c), 0);
  let aces = hand.filter((c) => c.startsWith("A")).length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

// In-memory game state (volatile — fine for a fun game)
const activeGames = new Map<string, { deck: string[]; player: string[]; dealer: string[]; bet: number }>();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, bet } = await request.json() as { action: string; bet?: number };
  const uid = session.user.id;

  // ── DEAL ──────────────────────────────────────────────────────────────────
  if (action === "deal") {
    if (!bet || !Number.isInteger(bet) || bet < 10 || bet > 1_000_000)
      return NextResponse.json({ error: "Invalid bet." }, { status: 400 });

    const pilot = await prisma.pilotState.findUnique({ where: { userId: uid } });
    if (!pilot) return NextResponse.json({ error: "Pilot not found." }, { status: 404 });
    if (pilot.credits < bet) return NextResponse.json({ error: "Not enough credits." }, { status: 400 });

    // Deduct bet up front
    await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { decrement: bet } } });

    const deck = newDeck();
    const player = [deck.pop()!, deck.pop()!];
    const dealer = [deck.pop()!, deck.pop()!];
    activeGames.set(uid, { deck, player, dealer, bet });

    const ptotal = handTotal(player);
    if (ptotal === 21) {
      // Natural blackjack
      const payout = Math.floor(bet * 2.5);
      await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { increment: payout } } });
      activeGames.delete(uid);
      return NextResponse.json({
        status: "blackjack",
        player, dealer,
        playerTotal: 21,
        dealerTotal: handTotal(dealer),
        payout,
        label: "BLACKJACK! 2.5x payout!",
      });
    }

    return NextResponse.json({
      status: "playing",
      player,
      dealer: [dealer[0], "??"],
      playerTotal: ptotal,
      dealerTotal: null,
    });
  }

  // ── HIT ───────────────────────────────────────────────────────────────────
  if (action === "hit") {
    const game = activeGames.get(uid);
    if (!game) return NextResponse.json({ error: "No active game." }, { status: 400 });

    game.player.push(game.deck.pop()!);
    const ptotal = handTotal(game.player);
    if (ptotal > 21) {
      activeGames.delete(uid);
      return NextResponse.json({
        status: "bust",
        player: game.player,
        dealer: game.dealer,
        playerTotal: ptotal,
        dealerTotal: handTotal(game.dealer),
        payout: 0,
        label: `Bust! (${ptotal})`,
      });
    }
    return NextResponse.json({
      status: "playing",
      player: game.player,
      dealer: [game.dealer[0], "??"],
      playerTotal: ptotal,
      dealerTotal: null,
    });
  }

  // ── STAND ─────────────────────────────────────────────────────────────────
  if (action === "stand") {
    const game = activeGames.get(uid);
    if (!game) return NextResponse.json({ error: "No active game." }, { status: 400 });

    // Dealer draws to 17
    while (handTotal(game.dealer) < 17) game.dealer.push(game.deck.pop()!);
    const ptotal = handTotal(game.player);
    const dtotal = handTotal(game.dealer);

    let payout = 0;
    let label = "";
    if (dtotal > 21) {
      payout = game.bet * 2; label = `Dealer busts (${dtotal})! You win!`;
    } else if (ptotal > dtotal) {
      payout = game.bet * 2; label = `You win! ${ptotal} vs ${dtotal}`;
    } else if (ptotal === dtotal) {
      payout = game.bet; label = `Push — ${ptotal} vs ${dtotal}`;
    } else {
      payout = 0; label = `Dealer wins. ${dtotal} vs ${ptotal}`;
    }

    if (payout > 0) {
      await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { increment: payout } } });
    }
    activeGames.delete(uid);

    return NextResponse.json({
      status: payout > game.bet ? "win" : payout === game.bet ? "push" : "lose",
      player: game.player,
      dealer: game.dealer,
      playerTotal: ptotal,
      dealerTotal: dtotal,
      payout,
      label,
    });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
