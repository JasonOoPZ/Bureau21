import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Character } from '@/types/game';

type BankAction = 'deposit' | 'withdraw' | 'transfer' | 'loan' | 'repay_loan' | 'buy_bond' | 'claim_bond';

const BOND_RATES: Record<number, number> = {
  15:  0.005,
  30:  0.0125,
  45:  0.0155,
  60:  0.02,
  90:  0.025,
  180: 0.06,
  365: 0.18,
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body as { action: BankAction };

    const { data: character } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!character) {
      return NextResponse.json({ error: 'Character not found.' }, { status: 404 });
    }

    const char = character as Character;

    // ── DEPOSIT ─────────────────────────────────────────────────────────────
    if (action === 'deposit') {
      const { amount } = body as { amount: number };
      if (!Number.isInteger(amount) || amount <= 0)
        return NextResponse.json({ error: 'Amount must be a positive integer.' }, { status: 400 });
      if (char.credits_hand < amount)
        return NextResponse.json({ error: 'Not enough credits on hand.' }, { status: 400 });

      await supabase.from('characters').update({
        credits_hand: char.credits_hand - amount,
        credits_bank: char.credits_bank + amount,
      }).eq('id', char.id);

      return NextResponse.json({ message: `Deposited ${amount.toLocaleString()} ₡ into the bank.` });
    }

    // ── WITHDRAW ─────────────────────────────────────────────────────────────
    if (action === 'withdraw') {
      const { amount } = body as { amount: number };
      if (!Number.isInteger(amount) || amount <= 0)
        return NextResponse.json({ error: 'Amount must be a positive integer.' }, { status: 400 });
      if (char.credits_bank < amount)
        return NextResponse.json({ error: 'Not enough credits in bank.' }, { status: 400 });

      await supabase.from('characters').update({
        credits_hand: char.credits_hand + amount,
        credits_bank: char.credits_bank - amount,
      }).eq('id', char.id);

      return NextResponse.json({ message: `Withdrew ${amount.toLocaleString()} ₡ from the bank.` });
    }

    // ── TRANSFER ─────────────────────────────────────────────────────────────
    if (action === 'transfer') {
      const { recipientId, amount } = body as { recipientId: string; amount: number };
      if (!Number.isInteger(amount) || amount <= 0)
        return NextResponse.json({ error: 'Amount must be a positive integer.' }, { status: 400 });
      if (!recipientId)
        return NextResponse.json({ error: 'Recipient ID required.' }, { status: 400 });
      if (recipientId === char.id)
        return NextResponse.json({ error: "You can't transfer to yourself." }, { status: 400 });
      if (char.credits_hand < amount)
        return NextResponse.json({ error: 'Not enough credits on hand.' }, { status: 400 });

      const { data: recipient } = await supabase
        .from('characters')
        .select('id, username, credits_hand')
        .eq('id', recipientId)
        .single();

      if (!recipient)
        return NextResponse.json({ error: 'Recipient not found.' }, { status: 404 });

      await supabase.from('characters').update({
        credits_hand: char.credits_hand - amount,
      }).eq('id', char.id);

      await supabase.from('characters').update({
        credits_hand: (recipient as Pick<Character, 'id' | 'username' | 'credits_hand'>).credits_hand + amount,
      }).eq('id', recipientId);

      return NextResponse.json({
        message: `Transferred ${amount.toLocaleString()} ₡ to ${(recipient as Pick<Character, 'id' | 'username' | 'credits_hand'>).username}.`,
      });
    }

    // ── LOAN ─────────────────────────────────────────────────────────────────
    if (action === 'loan') {
      const { amount } = body as { amount: number };
      if (!Number.isInteger(amount) || amount <= 0)
        return NextResponse.json({ error: 'Amount must be a positive integer.' }, { status: 400 });
      if (char.loan_amount > 0)
        return NextResponse.json({ error: 'You already have an outstanding loan. Repay it first.' }, { status: 400 });

      const maxLoan = Math.floor(char.credits_bank * 0.05);
      if (amount > maxLoan)
        return NextResponse.json({ error: `Max loan is ${maxLoan.toLocaleString()} ₡ (5% of bank balance).` }, { status: 400 });

      const totalOwed = Math.ceil(amount * 1.069);

      await supabase.from('characters').update({
        credits_hand: char.credits_hand + amount,
        loan_amount: totalOwed,
        loan_created_at: new Date().toISOString(),
      }).eq('id', char.id);

      return NextResponse.json({
        message: `Loan of ${amount.toLocaleString()} ₡ approved. Total to repay: ${totalOwed.toLocaleString()} ₡ (6.9% surcharge).`,
      });
    }

    // ── REPAY LOAN ────────────────────────────────────────────────────────────
    if (action === 'repay_loan') {
      if (char.loan_amount <= 0)
        return NextResponse.json({ error: 'You have no outstanding loan.' }, { status: 400 });

      // loan_amount already includes the 6.9% surcharge applied at loan creation
      const repayAmount = char.loan_amount;
      if (char.credits_hand < repayAmount)
        return NextResponse.json({
          error: `You need ${repayAmount.toLocaleString()} ₡ on hand to repay your loan.`,
        }, { status: 400 });

      await supabase.from('characters').update({
        credits_hand: char.credits_hand - repayAmount,
        loan_amount: 0,
        loan_created_at: null,
      }).eq('id', char.id);

      return NextResponse.json({ message: `Loan of ${repayAmount.toLocaleString()} ₡ repaid.` });
    }

    // ── BUY BOND ──────────────────────────────────────────────────────────────
    if (action === 'buy_bond') {
      const { amount, days } = body as { amount: number; days: number };
      if (!Number.isInteger(amount) || amount <= 0)
        return NextResponse.json({ error: 'Amount must be a positive integer.' }, { status: 400 });
      if (amount > 1_000_000)
        return NextResponse.json({ error: 'Maximum bond is 1,000,000 ₡.' }, { status: 400 });
      if (char.bond_amount > 0)
        return NextResponse.json({ error: 'You already have an active bond. Wait for it to mature.' }, { status: 400 });
      if (char.credits_bank < amount)
        return NextResponse.json({ error: 'Not enough credits in bank.' }, { status: 400 });

      const rate = BOND_RATES[days];
      if (rate === undefined)
        return NextResponse.json({ error: 'Invalid bond duration.' }, { status: 400 });

      const maturesAt = new Date();
      maturesAt.setDate(maturesAt.getDate() + days);

      await supabase.from('characters').update({
        credits_bank: char.credits_bank - amount,
        bond_amount: amount,
        bond_rate: rate,
        bond_created_at: new Date().toISOString(),
        bond_matures_at: maturesAt.toISOString(),
      }).eq('id', char.id);

      return NextResponse.json({
        message: `Bond of ${amount.toLocaleString()} ₡ placed at ${(rate * 100).toFixed(2)}% for ${days} days. Matures on ${maturesAt.toLocaleDateString()}.`,
      });
    }

    // ── CLAIM BOND ────────────────────────────────────────────────────────────
    if (action === 'claim_bond') {
      if (char.bond_amount <= 0)
        return NextResponse.json({ error: 'No active bond.' }, { status: 400 });
      if (!char.bond_matures_at || new Date(char.bond_matures_at) > new Date())
        return NextResponse.json({ error: 'Bond has not matured yet.' }, { status: 400 });

      const payout = Math.floor(char.bond_amount * (1 + char.bond_rate));

      await supabase.from('characters').update({
        credits_bank: char.credits_bank + payout,
        bond_amount: 0,
        bond_rate: 0,
        bond_created_at: null,
        bond_matures_at: null,
      }).eq('id', char.id);

      return NextResponse.json({
        message: `✅ Bond matured! ${payout.toLocaleString()} ₡ deposited into your bank account.`,
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

