"use client";

import { useState } from "react";
import Link from "next/link";

const QUICK_BETS = [50, 100, 250, 500, 1000];

function Card({ card }: { card: string }) {
  const isRed = card.includes("♥") || card.includes("♦");
  return (
    <div className={`w-14 h-20 bg-slate-900 border border-slate-600 rounded-lg flex items-center justify-center text-xl font-bold ${isRed ? "text-red-400" : "text-slate-200"}`}>
      {card === "??" ? "🂠" : card}
    </div>
  );
}

export function BlackjackGame({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);
  const [bet, setBet] = useState(100);
  const [phase, setPhase] = useState<"betting" | "playing" | "done">("betting");
  const [player, setPlayer] = useState<string[]>([]);
  const [dealer, setDealer] = useState<string[]>([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState<number | null>(null);
  const [result, setResult] = useState<{ label: string; payout: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const api = async (action: string, extraBet?: number) => {
    setLoading(true);
    const res = await fetch("/api/game/casino/blackjack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, bet: extraBet }),
    });
    const data = await res.json();
    setLoading(false);
    return { ok: res.ok, data };
  };

  const deal = async () => {
    setResult(null);
    const { ok, data } = await api("deal", bet);
    if (!ok) { setResult({ label: data.error, payout: 0 }); return; }
    setCredits((c) => c - bet);
    setPlayer(data.player);
    setDealer(data.dealer);
    setPlayerTotal(data.playerTotal);
    setDealerTotal(data.dealerTotal);

    if (data.status === "blackjack") {
      setDealer(data.dealer);
      setDealerTotal(data.dealerTotal);
      setCredits((c) => c + data.payout);
      setResult({ label: data.label, payout: data.payout - bet });
      setPhase("done");
    } else {
      setPhase("playing");
    }
  };

  const hit = async () => {
    const { data } = await api("hit");
    setPlayer(data.player);
    setPlayerTotal(data.playerTotal);
    if (data.status === "bust") {
      setDealer(data.dealer);
      setDealerTotal(data.dealerTotal);
      setResult({ label: data.label, payout: -bet });
      setPhase("done");
    }
  };

  const stand = async () => {
    const { data } = await api("stand");
    setPlayer(data.player);
    setDealer(data.dealer);
    setPlayerTotal(data.playerTotal);
    setDealerTotal(data.dealerTotal);
    const net = (data.payout ?? 0) - bet;
    setCredits((c) => c + (data.payout ?? 0));
    setResult({ label: data.label, payout: net });
    setPhase("done");
  };

  const newGame = () => {
    setPhase("betting");
    setPlayer([]);
    setDealer([]);
    setPlayerTotal(0);
    setDealerTotal(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 px-3 py-4">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/primaris/casino" className="hover:text-red-300">← Casino</Link>
          <span>/</span>
          <span className="text-emerald-400">Blackjack</span>
        </div>

        <div className="bg-[#0b0f14] border border-emerald-900/40 rounded-xl p-6">
          <h1 className="text-xl font-bold text-emerald-400 mb-1 text-center">🃏 Blackjack</h1>
          <p className="text-slate-500 text-xs text-center mb-6">Beat the dealer. Closest to 21 wins.</p>

          {(player.length > 0 || dealer.length > 0) && (
            <div className="space-y-6">
              <div>
                <div className="text-xs text-slate-400 mb-2">Dealer {dealerTotal != null ? `(${dealerTotal})` : ""}</div>
                <div className="flex gap-2">{dealer.map((c, i) => <Card key={i} card={c} />)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-2">You ({playerTotal})</div>
                <div className="flex gap-2">{player.map((c, i) => <Card key={i} card={c} />)}</div>
              </div>
            </div>
          )}

          {result && (
            <div className={`mt-4 rounded-lg p-3 text-sm text-center ${result.payout > 0 ? "bg-green-900/20 border border-green-800 text-green-300" : result.payout === 0 ? "bg-slate-800 text-slate-400" : "bg-red-900/20 border border-red-800 text-red-300"}`}>
              {result.label}
              {result.payout !== 0 && (
                <span className="ml-2 font-bold">{result.payout > 0 ? "+" : ""}{result.payout} ₡</span>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#0a0d11] border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Credits</span>
            <span className="text-amber-400 font-bold font-mono">{credits.toLocaleString()} ₡</span>
          </div>

          {phase === "betting" && (
            <>
              <div className="flex gap-2">
                {QUICK_BETS.map((q) => (
                  <button key={q} onClick={() => setBet(q)}
                    className={`flex-1 py-1.5 rounded text-xs font-bold transition ${bet === q ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                    {q}
                  </button>
                ))}
              </div>
              <input type="number" value={bet} onChange={(e) => setBet(Math.max(10, Number(e.target.value)))} min={10}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-center" />
              <button onClick={deal} disabled={loading || bet > credits}
                className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white disabled:opacity-40 transition">
                Deal ({bet} ₡)
              </button>
            </>
          )}

          {phase === "playing" && (
            <div className="flex gap-3">
              <button onClick={hit} disabled={loading}
                className="flex-1 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-white disabled:opacity-40 transition">
                Hit
              </button>
              <button onClick={stand} disabled={loading}
                className="flex-1 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold text-white disabled:opacity-40 transition">
                Stand
              </button>
            </div>
          )}

          {phase === "done" && (
            <button onClick={newGame}
              className="w-full py-3 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-white transition">
              New Hand
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
