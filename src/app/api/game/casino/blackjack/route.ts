import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   VEGAS BLACKJACK ENGINE
   - 6-deck shoe, reshuffled when < 75 cards remain
   - Dealer hits soft 17 (H17)
   - Blackjack pays 3:2
   - Double on any first 2 cards
   - Double after split allowed
   - Split up to 4 hands
   - Split aces receive one card only, no re-split
   - Insurance pays 2:1 when dealer has blackjack
   - No surrender (standard Vegas)
   ═══════════════════════════════════════════════════════════════════════════ */

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const NUM_DECKS = 6;
const RESHUFFLE_THRESHOLD = 75;
const MAX_SPLIT_HANDS = 4;

function buildShoe(): string[] {
  const shoe: string[] = [];
  for (let d = 0; d < NUM_DECKS; d++)
    for (const s of SUITS) for (const r of RANKS) shoe.push(`${r}${s}`);
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  return shoe;
}

function cardRank(card: string): string { return card.slice(0, -1); }
function cardValue(card: string): number {
  const r = cardRank(card);
  if (["J", "Q", "K"].includes(r)) return 10;
  if (r === "A") return 11;
  return parseInt(r, 10);
}

function handTotal(hand: string[]): number {
  let total = hand.reduce((s, c) => s + cardValue(c), 0);
  let aces = hand.filter((c) => cardRank(c) === "A").length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isSoft(hand: string[]): boolean {
  let total = hand.reduce((s, c) => s + cardValue(c), 0);
  const aces = hand.filter((c) => cardRank(c) === "A").length;
  if (aces === 0) return false;
  let reduced = 0;
  let t = total;
  while (t > 21 && reduced < aces) { t -= 10; reduced++; }
  return reduced < aces; // still counting at least 1 ace as 11
}

function isBlackjack(hand: string[]): boolean {
  return hand.length === 2 && handTotal(hand) === 21;
}

function canSplitHand(hand: string[]): boolean {
  return hand.length === 2 && cardValue(hand[0]) === cardValue(hand[1]);
}

interface Hand {
  cards: string[];
  bet: number;
  doubled: boolean;
  fromSplitAces: boolean;
  stood: boolean;
  busted: boolean;
}

interface GameState {
  shoe: string[];
  hands: Hand[];
  activeHandIndex: number;
  dealer: string[];
  baseBet: number;
  insuranceBet: number;
  phase: "player_turn" | "resolving" | "done";
  pilotId: string;
}

async function logBlackjackBet(game: GameState, totalPayout: number) {
  const totalWagered = game.hands.reduce((s, h) => s + h.bet, 0) + game.insuranceBet;
  await prisma.casinoBet.create({
    data: {
      pilotId: game.pilotId,
      game: "blackjack",
      bet: totalWagered,
      payout: totalPayout,
      net: totalPayout - totalWagered,
    },
  });
}

const activeGames = new Map<string, GameState>();

function draw(shoe: string[]): string {
  if (shoe.length === 0) {
    const fresh = buildShoe();
    shoe.push(...fresh);
  }
  return shoe.pop()!;
}

function getActiveHand(game: GameState): Hand | null {
  return game.hands[game.activeHandIndex] ?? null;
}

function advanceToNextHand(game: GameState): boolean {
  game.activeHandIndex++;
  while (game.activeHandIndex < game.hands.length) {
    const h = game.hands[game.activeHandIndex];
    if (!h.stood && !h.busted) {
      // Split aces get exactly one card
      if (h.fromSplitAces) {
        h.cards.push(draw(game.shoe));
        h.stood = true;
        if (handTotal(h.cards) > 21) h.busted = true;
        game.activeHandIndex++;
        continue;
      }
      return true; // found playable hand
    }
    game.activeHandIndex++;
  }
  return false; // no more hands to play
}

function dealerPlay(game: GameState): void {
  // Dealer hits on soft 17
  while (true) {
    const t = handTotal(game.dealer);
    if (t < 17) { game.dealer.push(draw(game.shoe)); continue; }
    if (t === 17 && isSoft(game.dealer)) { game.dealer.push(draw(game.shoe)); continue; }
    break;
  }
}

interface HandResult {
  cards: string[];
  total: number;
  bet: number;
  payout: number;
  label: string;
  doubled: boolean;
}

function resolveHands(game: GameState): { results: HandResult[]; totalPayout: number; dealerTotal: number } {
  const dtotal = handTotal(game.dealer);
  const dealerBJ = isBlackjack(game.dealer);
  let totalPayout = 0;

  const results: HandResult[] = game.hands.map((h) => {
    const pt = handTotal(h.cards);
    const playerBJ = isBlackjack(h.cards) && !h.fromSplitAces && game.hands.length === 1;
    let payout = 0;
    let label = "";

    if (h.busted) {
      label = `Bust (${pt})`;
      payout = 0;
    } else if (playerBJ && dealerBJ) {
      label = "Push — both Blackjack";
      payout = h.bet; // return bet
    } else if (playerBJ) {
      label = "BLACKJACK! 3:2";
      payout = h.bet + Math.floor(h.bet * 1.5); // 3:2
    } else if (dealerBJ) {
      label = "Dealer Blackjack";
      payout = 0;
    } else if (dtotal > 21) {
      label = `Dealer busts (${dtotal})!`;
      payout = h.bet * 2;
    } else if (pt > dtotal) {
      label = `Win! ${pt} vs ${dtotal}`;
      payout = h.bet * 2;
    } else if (pt === dtotal) {
      label = `Push — ${pt}`;
      payout = h.bet;
    } else {
      label = `Lose. ${dtotal} vs ${pt}`;
      payout = 0;
    }

    totalPayout += payout;
    return { cards: h.cards, total: pt, bet: h.bet, payout, label, doubled: h.doubled };
  });

  return { results, totalPayout, dealerTotal: dtotal };
}

function serializeState(game: GameState, hideDealer = true) {
  return {
    hands: game.hands.map((h, i) => ({
      cards: h.cards,
      total: handTotal(h.cards),
      bet: h.bet,
      doubled: h.doubled,
      stood: h.stood,
      busted: h.busted,
      fromSplitAces: h.fromSplitAces,
      active: i === game.activeHandIndex && game.phase === "player_turn",
    })),
    dealer: hideDealer ? [game.dealer[0], "??"] : game.dealer,
    dealerTotal: hideDealer ? null : handTotal(game.dealer),
    activeHandIndex: game.activeHandIndex,
    canSplit: false,
    canDouble: false,
    canInsurance: false,
  };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { action: string; bet?: number; choice?: string };
  const { action, bet, choice } = body;
  const uid = session.user.id;

  /* ── DEAL ────────────────────────────────────────────────────────────── */
  if (action === "deal") {
    if (!bet || !Number.isInteger(bet) || bet < 10 || bet > 1_000_000)
      return NextResponse.json({ error: "Invalid bet." }, { status: 400 });

    const pilot = await prisma.pilotState.findUnique({ where: { userId: uid } });
    if (!pilot) return NextResponse.json({ error: "Pilot not found." }, { status: 404 });
    if (pilot.credits < bet) return NextResponse.json({ error: "Not enough credits." }, { status: 400 });

    await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { decrement: bet } } });

    // Build or reuse shoe
    let shoe: string[];
    const prev = activeGames.get(uid);
    if (prev && prev.shoe.length >= RESHUFFLE_THRESHOLD) {
      shoe = prev.shoe;
    } else {
      shoe = buildShoe();
    }

    const playerCards = [draw(shoe), draw(shoe)];
    const dealerCards = [draw(shoe), draw(shoe)];

    const game: GameState = {
      shoe,
      hands: [{ cards: playerCards, bet, doubled: false, fromSplitAces: false, stood: false, busted: false }],
      activeHandIndex: 0,
      dealer: dealerCards,
      baseBet: bet,
      insuranceBet: 0,
      phase: "player_turn",
      pilotId: pilot.id,
    };

    const dealerUpAce = cardRank(dealerCards[0]) === "A";
    const playerBJ = isBlackjack(playerCards);
    const dealerBJ = isBlackjack(dealerCards);

    // If player has blackjack and dealer doesn't show ace, resolve immediately
    if (playerBJ && !dealerUpAce) {
      game.phase = "done";
      const payout = dealerBJ ? bet : bet + Math.floor(bet * 1.5);
      await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { increment: payout } } });
      await logBlackjackBet(game, payout);
      activeGames.delete(uid);
      return NextResponse.json({
        status: dealerBJ ? "push" : "blackjack",
        ...serializeState(game, false),
        dealer: dealerCards,
        dealerTotal: handTotal(dealerCards),
        payout,
        label: dealerBJ ? "Push — both Blackjack" : "BLACKJACK! Pays 3:2!",
      });
    }

    activeGames.set(uid, game);

    const hand = game.hands[0];
    const state = serializeState(game);
    state.canInsurance = dealerUpAce && !playerBJ;
    state.canSplit = canSplitHand(playerCards) && game.hands.length < MAX_SPLIT_HANDS;
    state.canDouble = hand.cards.length === 2 && !hand.fromSplitAces && pilot.credits >= bet;

    // If dealer shows ace and player has BJ, offer even money (handled as insurance on client)
    if (playerBJ && dealerUpAce) {
      return NextResponse.json({ status: "insurance_offered", ...state, playerBJ: true });
    }

    return NextResponse.json({ status: "playing", ...state });
  }

  /* ── INSURANCE ───────────────────────────────────────────────────────── */
  if (action === "insurance") {
    const game = activeGames.get(uid);
    if (!game) return NextResponse.json({ error: "No active game." }, { status: 400 });

    const accept = choice === "yes";
    const insuranceCost = Math.floor(game.baseBet / 2);

    if (accept) {
      const pilot = await prisma.pilotState.findUnique({ where: { userId: uid } });
      if (!pilot || pilot.credits < insuranceCost)
        return NextResponse.json({ error: "Not enough credits for insurance." }, { status: 400 });
      await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { decrement: insuranceCost } } });
      game.insuranceBet = insuranceCost;
    }

    const dealerBJ = isBlackjack(game.dealer);
    const playerBJ = isBlackjack(game.hands[0].cards) && game.hands.length === 1;

    if (dealerBJ) {
      // Insurance pays 2:1
      let payout = 0;
      let label = "Dealer Blackjack!";
      if (accept) {
        payout += insuranceCost * 3; // return + 2:1
        label += " Insurance pays 2:1.";
      }
      if (playerBJ) {
        payout += game.baseBet; // push on main bet
        label = "Both Blackjack! " + (accept ? "Insurance pays." : "Push.");
      }
      if (payout > 0) {
        await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { increment: payout } } });
      }
      await logBlackjackBet(game, payout);
      game.phase = "done";
      activeGames.delete(uid);
      return NextResponse.json({
        status: "done",
        ...serializeState(game, false),
        dealer: game.dealer,
        dealerTotal: handTotal(game.dealer),
        payout,
        label,
        insurancePaid: accept,
      });
    }

    // Dealer doesn't have BJ — insurance lost, continue playing
    if (playerBJ) {
      // Player BJ, no dealer BJ
      const payout = game.baseBet + Math.floor(game.baseBet * 1.5);
      await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { increment: payout } } });
      await logBlackjackBet(game, payout);
      game.phase = "done";
      activeGames.delete(uid);
      return NextResponse.json({
        status: "blackjack",
        ...serializeState(game, false),
        dealer: game.dealer,
        dealerTotal: handTotal(game.dealer),
        payout,
        label: "BLACKJACK! Pays 3:2!" + (accept ? " Insurance lost." : ""),
        insurancePaid: accept,
      });
    }

    // Normal play continues
    const hand = game.hands[0];
    const pilot = await prisma.pilotState.findUnique({ where: { userId: uid } });
    const state = serializeState(game);
    state.canSplit = canSplitHand(hand.cards) && game.hands.length < MAX_SPLIT_HANDS;
    state.canDouble = hand.cards.length === 2 && !hand.fromSplitAces && (pilot?.credits ?? 0) >= hand.bet;

    return NextResponse.json({
      status: "playing",
      ...state,
      insuranceLost: accept,
    });
  }

  /* ── HIT ─────────────────────────────────────────────────────────────── */
  if (action === "hit") {
    const game = activeGames.get(uid);
    if (!game || game.phase !== "player_turn") return NextResponse.json({ error: "No active game." }, { status: 400 });

    const hand = getActiveHand(game);
    if (!hand || hand.stood || hand.busted) return NextResponse.json({ error: "Cannot hit." }, { status: 400 });

    hand.cards.push(draw(game.shoe));
    const total = handTotal(hand.cards);

    if (total > 21) {
      hand.busted = true;
      if (!advanceToNextHand(game)) {
        // All hands done — resolve
        dealerPlay(game);
        game.phase = "done";
        const { results, totalPayout, dealerTotal } = resolveHands(game);
        if (totalPayout > 0) {
          await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { increment: totalPayout } } });
        }
        await logBlackjackBet(game, totalPayout);
        activeGames.delete(uid);
        return NextResponse.json({
          status: "done",
          ...serializeState(game, false),
          dealer: game.dealer,
          dealerTotal,
          results,
          payout: totalPayout,
          label: results.map((r) => r.label).join(" | "),
        });
      }
    } else if (total === 21) {
      hand.stood = true;
      if (!advanceToNextHand(game)) {
        dealerPlay(game);
        game.phase = "done";
        const { results, totalPayout, dealerTotal } = resolveHands(game);
        if (totalPayout > 0) {
          await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { increment: totalPayout } } });
        }
        await logBlackjackBet(game, totalPayout);
        activeGames.delete(uid);
        return NextResponse.json({
          status: "done",
          ...serializeState(game, false),
          dealer: game.dealer,
          dealerTotal,
          results,
          payout: totalPayout,
          label: results.map((r) => r.label).join(" | "),
        });
      }
    }

    const pilot = await prisma.pilotState.findUnique({ where: { userId: uid } });
    const activeH = getActiveHand(game);
    const state = serializeState(game);
    if (activeH) {
      state.canSplit = canSplitHand(activeH.cards) && game.hands.length < MAX_SPLIT_HANDS && (pilot?.credits ?? 0) >= activeH.bet;
      state.canDouble = activeH.cards.length === 2 && !activeH.fromSplitAces && (pilot?.credits ?? 0) >= activeH.bet;
    }
    return NextResponse.json({ status: "playing", ...state });
  }

  /* ── STAND ───────────────────────────────────────────────────────────── */
  if (action === "stand") {
    const game = activeGames.get(uid);
    if (!game || game.phase !== "player_turn") return NextResponse.json({ error: "No active game." }, { status: 400 });

    const hand = getActiveHand(game);
    if (!hand) return NextResponse.json({ error: "Cannot stand." }, { status: 400 });
    hand.stood = true;

    if (!advanceToNextHand(game)) {
      dealerPlay(game);
      game.phase = "done";
      const { results, totalPayout, dealerTotal } = resolveHands(game);
      if (totalPayout > 0) {
        await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { increment: totalPayout } } });
      }
      await logBlackjackBet(game, totalPayout);
      activeGames.delete(uid);
      return NextResponse.json({
        status: "done",
        ...serializeState(game, false),
        dealer: game.dealer,
        dealerTotal,
        results,
        payout: totalPayout,
        label: results.map((r) => r.label).join(" | "),
      });
    }

    const pilot = await prisma.pilotState.findUnique({ where: { userId: uid } });
    const activeH = getActiveHand(game);
    const state = serializeState(game);
    if (activeH) {
      state.canSplit = canSplitHand(activeH.cards) && game.hands.length < MAX_SPLIT_HANDS && (pilot?.credits ?? 0) >= activeH.bet;
      state.canDouble = activeH.cards.length === 2 && !activeH.fromSplitAces && (pilot?.credits ?? 0) >= activeH.bet;
    }
    return NextResponse.json({ status: "playing", ...state });
  }

  /* ── DOUBLE ──────────────────────────────────────────────────────────── */
  if (action === "double") {
    const game = activeGames.get(uid);
    if (!game || game.phase !== "player_turn") return NextResponse.json({ error: "No active game." }, { status: 400 });

    const hand = getActiveHand(game);
    if (!hand || hand.cards.length !== 2 || hand.fromSplitAces)
      return NextResponse.json({ error: "Cannot double." }, { status: 400 });

    const pilot = await prisma.pilotState.findUnique({ where: { userId: uid } });
    if (!pilot || pilot.credits < hand.bet)
      return NextResponse.json({ error: "Not enough credits to double." }, { status: 400 });

    await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { decrement: hand.bet } } });
    hand.bet *= 2;
    hand.doubled = true;
    hand.cards.push(draw(game.shoe));
    hand.stood = true;
    if (handTotal(hand.cards) > 21) hand.busted = true;

    if (!advanceToNextHand(game)) {
      dealerPlay(game);
      game.phase = "done";
      const { results, totalPayout, dealerTotal } = resolveHands(game);
      if (totalPayout > 0) {
        await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { increment: totalPayout } } });
      }
      await logBlackjackBet(game, totalPayout);
      activeGames.delete(uid);
      return NextResponse.json({
        status: "done",
        ...serializeState(game, false),
        dealer: game.dealer,
        dealerTotal,
        results,
        payout: totalPayout,
        label: results.map((r) => r.label).join(" | "),
      });
    }

    const activeH = getActiveHand(game);
    const state = serializeState(game);
    const p2 = await prisma.pilotState.findUnique({ where: { userId: uid } });
    if (activeH) {
      state.canSplit = canSplitHand(activeH.cards) && game.hands.length < MAX_SPLIT_HANDS && (p2?.credits ?? 0) >= activeH.bet;
      state.canDouble = activeH.cards.length === 2 && !activeH.fromSplitAces && (p2?.credits ?? 0) >= activeH.bet;
    }
    return NextResponse.json({ status: "playing", ...state });
  }

  /* ── SPLIT ───────────────────────────────────────────────────────────── */
  if (action === "split") {
    const game = activeGames.get(uid);
    if (!game || game.phase !== "player_turn") return NextResponse.json({ error: "No active game." }, { status: 400 });

    const hand = getActiveHand(game);
    if (!hand || !canSplitHand(hand.cards) || game.hands.length >= MAX_SPLIT_HANDS)
      return NextResponse.json({ error: "Cannot split." }, { status: 400 });

    const pilot = await prisma.pilotState.findUnique({ where: { userId: uid } });
    if (!pilot || pilot.credits < hand.bet)
      return NextResponse.json({ error: "Not enough credits to split." }, { status: 400 });

    await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { decrement: hand.bet } } });

    const splitCard = hand.cards.pop()!;
    const isSplitAces = cardRank(hand.cards[0]) === "A";

    // Deal one card to original hand
    hand.cards.push(draw(game.shoe));
    hand.fromSplitAces = isSplitAces;
    if (isSplitAces) {
      hand.stood = true;
      if (handTotal(hand.cards) > 21) hand.busted = true;
    }

    // Create new hand
    const newHand: Hand = {
      cards: [splitCard, draw(game.shoe)],
      bet: hand.bet / (hand.doubled ? 2 : 1), // use original bet
      doubled: false,
      fromSplitAces: isSplitAces,
      stood: false,
      busted: false,
    };
    // Fix: use baseBet for new hand
    newHand.bet = game.baseBet;
    if (isSplitAces) {
      newHand.stood = true;
      if (handTotal(newHand.cards) > 21) newHand.busted = true;
    }

    game.hands.splice(game.activeHandIndex + 1, 0, newHand);

    // If aces, both hands already stood — advance
    if (isSplitAces) {
      if (!advanceToNextHand(game)) {
        dealerPlay(game);
        game.phase = "done";
        const { results, totalPayout, dealerTotal } = resolveHands(game);
        if (totalPayout > 0) {
          await prisma.pilotState.update({ where: { userId: uid }, data: { credits: { increment: totalPayout } } });
        }
        await logBlackjackBet(game, totalPayout);
        activeGames.delete(uid);
        return NextResponse.json({
          status: "done",
          ...serializeState(game, false),
          dealer: game.dealer,
          dealerTotal,
          results,
          payout: totalPayout,
          label: results.map((r) => r.label).join(" | "),
        });
      }
    }

    const p2 = await prisma.pilotState.findUnique({ where: { userId: uid } });
    const activeH = getActiveHand(game);
    const state = serializeState(game);
    if (activeH) {
      state.canSplit = canSplitHand(activeH.cards) && game.hands.length < MAX_SPLIT_HANDS && (p2?.credits ?? 0) >= game.baseBet;
      state.canDouble = activeH.cards.length === 2 && !activeH.fromSplitAces && (p2?.credits ?? 0) >= activeH.bet;
    }
    return NextResponse.json({ status: "playing", ...state });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
