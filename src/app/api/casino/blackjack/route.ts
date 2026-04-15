import { createHmac, randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─── Card Types ──────────────────────────────────────────────────────────────

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
}

interface BJState {
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  bet: number;
  doubled: boolean;
  charId: string;
  ts: number;
  status: 'playing' | 'done';
}

// ─── Deck Helpers ─────────────────────────────────────────────────────────────

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardVal(card: Card): number {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank, 10);
}

function handValue(hand: Card[]): number {
  let total = hand.reduce((acc, c) => acc + cardVal(c), 0);
  let aces = hand.filter((c) => c.rank === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function isBust(hand: Card[]): boolean {
  return handValue(hand) > 21;
}

function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && handValue(hand) === 21;
}

// ─── Token Helpers ────────────────────────────────────────────────────────────

const SECRET = process.env.CRON_SECRET ?? 'dev-casino-secret';

function signState(state: BJState): string {
  const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyState(token: string): BJState | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex');
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as BJState;
  } catch {
    return null;
  }
}

// ─── Dealer Play ──────────────────────────────────────────────────────────────

function dealerPlay(state: BJState): BJState {
  const s = { ...state, dealerHand: [...state.dealerHand], deck: [...state.deck] };
  while (handValue(s.dealerHand) < 17) {
    s.dealerHand.push(s.deck.pop()!);
  }
  return s;
}

// ─── Payout ───────────────────────────────────────────────────────────────────

function calcPayout(
  playerHand: Card[],
  dealerHand: Card[],
  bet: number,
  doubled: boolean,
): { payout: number; outcome: string } {
  const finalBet = doubled ? bet * 2 : bet;
  const pv = handValue(playerHand);
  const dv = handValue(dealerHand);

  if (isBust(playerHand)) return { payout: 0, outcome: 'bust' };
  if (isBust(dealerHand)) return { payout: finalBet * 2, outcome: 'dealer_bust' };
  if (isBlackjack(playerHand) && !isBlackjack(dealerHand))
    return { payout: Math.floor(finalBet * 2.5), outcome: 'blackjack' };
  if (isBlackjack(dealerHand) && !isBlackjack(playerHand)) return { payout: 0, outcome: 'dealer_blackjack' };
  if (pv > dv) return { payout: finalBet * 2, outcome: 'win' };
  if (pv === dv) return { payout: finalBet, outcome: 'push' };
  return { payout: 0, outcome: 'lose' };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, bet, token } = body as {
      action: 'deal' | 'hit' | 'stand' | 'double';
      bet?: number;
      token?: string;
    };

    // ── DEAL ─────────────────────────────────────────────────────────────────
    if (action === 'deal') {
      if (!Number.isInteger(bet) || bet! <= 0 || bet! > 1_000_000) {
        return NextResponse.json({ error: 'Invalid bet.' }, { status: 400 });
      }

      const { data: character } = await supabase
        .from('characters')
        .select('id, credits_hand, is_dead, level')
        .eq('user_id', user.id)
        .single();

      if (!character) return NextResponse.json({ error: 'Character not found.' }, { status: 404 });
      if (character.is_dead) return NextResponse.json({ error: 'Dead operators cannot gamble.' }, { status: 403 });
      if (character.level < 8) return NextResponse.json({ error: 'Underbelly requires level 8.' }, { status: 403 });
      if (character.credits_hand < bet!) return NextResponse.json({ error: 'Not enough credits.' }, { status: 400 });

      // Deduct bet immediately
      await supabase
        .from('characters')
        .update({ credits_hand: character.credits_hand - bet! })
        .eq('id', character.id);

      const deck = buildDeck();
      const playerHand: Card[] = [deck.pop()!, deck.pop()!];
      const dealerHand: Card[] = [deck.pop()!, deck.pop()!];

      const state: BJState = {
        deck,
        playerHand,
        dealerHand,
        bet: bet!,
        doubled: false,
        charId: character.id,
        ts: Date.now(),
        status: 'playing',
      };

      const gameToken = signState(state);

      return NextResponse.json({
        token: gameToken,
        playerHand,
        dealerUpcard: dealerHand[0], // only show one dealer card
        playerValue: handValue(playerHand),
        isBlackjack: isBlackjack(playerHand),
        status: 'playing',
      });
    }

    // ── HIT / STAND / DOUBLE ─────────────────────────────────────────────────
    if (!token) return NextResponse.json({ error: 'Missing game token.' }, { status: 400 });

    const state = verifyState(token);
    if (!state) return NextResponse.json({ error: 'Invalid game token.' }, { status: 400 });
    if (state.status === 'done') return NextResponse.json({ error: 'Game already ended.' }, { status: 400 });

    // Verify it's this user's game
    const { data: character } = await supabase
      .from('characters')
      .select('id, credits_hand')
      .eq('user_id', user.id)
      .single();

    if (!character || character.id !== state.charId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const s = { ...state, playerHand: [...state.playerHand], dealerHand: [...state.dealerHand], deck: [...state.deck] };

    if (action === 'hit') {
      s.playerHand.push(s.deck.pop()!);

      if (isBust(s.playerHand)) {
        s.status = 'done';
        return NextResponse.json({
          playerHand: s.playerHand,
          dealerHand: s.dealerHand,
          playerValue: handValue(s.playerHand),
          dealerValue: handValue(s.dealerHand),
          outcome: 'bust',
          payout: 0,
          net_change: -(s.doubled ? s.bet * 2 : s.bet),
          new_credits: character.credits_hand,
        });
      }

      s.status = 'playing';
      return NextResponse.json({
        token: signState(s),
        playerHand: s.playerHand,
        dealerUpcard: s.dealerHand[0],
        playerValue: handValue(s.playerHand),
        status: 'playing',
      });
    }

    if (action === 'double') {
      if (s.playerHand.length !== 2) {
        return NextResponse.json({ error: 'Can only double on first two cards.' }, { status: 400 });
      }
      if (character.credits_hand < s.bet) {
        return NextResponse.json({ error: 'Not enough credits to double.' }, { status: 400 });
      }
      // Deduct extra bet
      await supabase
        .from('characters')
        .update({ credits_hand: character.credits_hand - s.bet })
        .eq('id', character.id);

      s.doubled = true;
      s.playerHand.push(s.deck.pop()!);
      // Fall through to stand logic
    }

    if (action === 'stand' || action === 'double') {
      const finalState = dealerPlay(s);
      finalState.status = 'done';

      const { payout, outcome } = calcPayout(
        finalState.playerHand,
        finalState.dealerHand,
        finalState.bet,
        finalState.doubled,
      );

      const extraDeducted = finalState.doubled ? finalState.bet : 0;
      const currentCredits = action === 'double' ? character.credits_hand - s.bet : character.credits_hand;
      const newCredits = currentCredits + payout;

      await supabase
        .from('characters')
        .update({ credits_hand: newCredits })
        .eq('id', finalState.charId);

      const originalBet = finalState.doubled ? finalState.bet * 2 : finalState.bet;
      return NextResponse.json({
        playerHand: finalState.playerHand,
        dealerHand: finalState.dealerHand,
        playerValue: handValue(finalState.playerHand),
        dealerValue: handValue(finalState.dealerHand),
        outcome,
        payout,
        net_change: payout - originalBet - extraDeducted,
        new_credits: newCredits,
      });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
