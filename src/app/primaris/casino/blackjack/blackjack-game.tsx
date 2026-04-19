"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const QUICK_BETS = [100, 500, 1000, 10000, 25000];

interface HandState {
  cards: string[];
  total: number;
  bet: number;
  doubled: boolean;
  stood: boolean;
  busted: boolean;
  fromSplitAces: boolean;
  active: boolean;
}

interface HandResult {
  cards: string[];
  total: number;
  bet: number;
  payout: number;
  label: string;
  doubled: boolean;
}

function Card({ card, index = 0, isNew = false }: { card: string; index?: number; isNew?: boolean }) {
  const isRed = card.includes("♥") || card.includes("♦");
  return (
    <div
      className={`w-12 h-[4.5rem] sm:w-14 sm:h-20 bg-slate-900 border border-slate-600 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold ${
        isRed ? "text-red-400" : "text-slate-200"
      } ${isNew ? "animate-card-deal" : ""}`}
      style={isNew ? { animationDelay: `${index * 0.12}s` } : undefined}
    >
      {card === "??" ? (
        <span className={isNew ? "animate-card-flip" : ""}>🂠</span>
      ) : (
        <span className={isNew ? "animate-card-flip" : ""}>{card}</span>
      )}
    </div>
  );
}

export function BlackjackGame({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);
  const [bet, setBet] = useState(100);
  const [phase, setPhase] = useState<"betting" | "playing" | "insurance" | "done">("betting");
  const [hands, setHands] = useState<HandState[]>([]);
  const [dealer, setDealer] = useState<string[]>([]);
  const [dealerTotal, setDealerTotal] = useState<number | null>(null);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [canSplit, setCanSplit] = useState(false);
  const [canDouble, setCanDouble] = useState(false);
  const [results, setResults] = useState<HandResult[] | null>(null);
  const [resultLabel, setResultLabel] = useState<string | null>(null);
  const [totalPayout, setTotalPayout] = useState(0);
  const [loading, setLoading] = useState(false);
  const [creditsBump, setCreditsBump] = useState(false);
  const [dealKey, setDealKey] = useState(0);
  const [insuranceMsg, setInsuranceMsg] = useState<string | null>(null);

  useEffect(() => {
    if (creditsBump) {
      const t = setTimeout(() => setCreditsBump(false), 400);
      return () => clearTimeout(t);
    }
  }, [creditsBump]);

  const api = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true);
    const res = await fetch("/api/game/casino/blackjack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = await res.json();
    setLoading(false);
    return { ok: res.ok, data };
  };

  const applyState = (data: Record<string, unknown>) => {
    if (data.hands) setHands(data.hands as HandState[]);
    if (data.dealer) setDealer(data.dealer as string[]);
    if (data.dealerTotal !== undefined) setDealerTotal(data.dealerTotal as number | null);
    if (data.activeHandIndex !== undefined) setActiveHandIndex(data.activeHandIndex as number);
    setCanSplit(!!(data.canSplit));
    setCanDouble(!!(data.canDouble));
  };

  const finishRound = (data: Record<string, unknown>) => {
    applyState(data);
    const payout = (data.payout as number) ?? 0;
    const totalBet = (data.hands as HandState[])?.reduce((s, h) => s + h.bet, 0) ?? bet;
    setTotalPayout(payout);
    setResults((data.results as HandResult[]) ?? null);
    setResultLabel(data.label as string);
    setPhase("done");

    // Credits update: payout - totalBet = net (bet was already deducted)
    setCredits((c) => c + payout);
    setCreditsBump(true);
  };

  const deal = async () => {
    setResults(null);
    setResultLabel(null);
    setInsuranceMsg(null);
    setTotalPayout(0);
    const { ok, data } = await api("deal", { bet });
    if (!ok) { setResultLabel(data.error); setPhase("done"); return; }

    setCredits((c) => c - bet);
    setDealKey((k) => k + 1);
    applyState(data);

    if (data.status === "blackjack" || data.status === "push") {
      finishRound(data);
    } else if (data.status === "insurance_offered") {
      setPhase("insurance");
    } else {
      setPhase("playing");
    }
  };

  const handleInsurance = async (accept: boolean) => {
    const { data } = await api("insurance", { choice: accept ? "yes" : "no" });

    if (accept && data.status !== "done" && data.status !== "blackjack") {
      setCredits((c) => c - Math.floor(bet / 2));
    }

    if (data.insuranceLost) setInsuranceMsg("Insurance lost.");
    if (data.insurancePaid) setInsuranceMsg(data.status === "done" ? "" : "Insurance lost.");

    if (data.status === "done" || data.status === "blackjack") {
      finishRound(data);
    } else {
      applyState(data);
      setPhase("playing");
    }
  };

  const hit = async () => {
    const { data } = await api("hit");
    if (data.status === "done") {
      finishRound(data);
    } else {
      applyState(data);
    }
  };

  const stand = async () => {
    const { data } = await api("stand");
    if (data.status === "done") {
      finishRound(data);
    } else {
      applyState(data);
    }
  };

  const double = async () => {
    const activeHand = hands[activeHandIndex];
    if (!activeHand) return;
    setCredits((c) => c - activeHand.bet);
    const { data } = await api("double");
    if (data.status === "done") {
      finishRound(data);
    } else {
      applyState(data);
    }
  };

  const split = async () => {
    setCredits((c) => c - bet);
    const { data } = await api("split");
    setDealKey((k) => k + 1);
    if (data.status === "done") {
      finishRound(data);
    } else {
      applyState(data);
    }
  };

  const newGame = () => {
    setPhase("betting");
    setHands([]);
    setDealer([]);
    setDealerTotal(null);
    setResults(null);
    setResultLabel(null);
    setInsuranceMsg(null);
    setTotalPayout(0);
    setCanSplit(false);
    setCanDouble(false);
  };

  const totalBetInPlay = hands.reduce((s, h) => s + h.bet, 0);
  const netResult = totalPayout - totalBetInPlay;

  return (
    <div className="min-h-screen bg-black text-slate-100 px-3 py-4">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/primaris/casino" className="hover:text-red-300">← Casino</Link>
          <span>/</span>
          <span className="text-emerald-400">Blackjack</span>
        </div>

        <div className="bg-[#0b0f14] border border-emerald-900/40 rounded-xl p-4 sm:p-6">
          <h1 className="text-xl font-bold text-emerald-400 mb-0.5 text-center">🃏 Blackjack</h1>
          <p className="text-slate-600 text-[10px] text-center mb-4">
            6-Deck · H17 · BJ 3:2 · DAS · Split to 4
          </p>

          {/* Dealer hand */}
          {dealer.length > 0 && (
            <div className="mb-4">
              <div className="text-[11px] text-slate-500 mb-1.5 flex items-center gap-2">
                Dealer {dealerTotal != null && <span className="text-slate-300 font-mono font-bold">({dealerTotal})</span>}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {dealer.map((c, i) => <Card key={`${dealKey}-d-${i}`} card={c} index={i} isNew />)}
              </div>
            </div>
          )}

          {/* Player hands */}
          {hands.length > 0 && (
            <div className="space-y-3">
              {hands.map((hand, hi) => (
                <div
                  key={`${dealKey}-h-${hi}`}
                  className={`rounded-lg p-3 border transition-all ${
                    hand.active && phase === "playing"
                      ? "border-emerald-500 bg-emerald-950/20"
                      : hand.busted
                      ? "border-red-900/50 bg-red-950/10 opacity-60"
                      : "border-slate-800 bg-slate-900/20"
                  }`}
                >
                  <div className="text-[11px] text-slate-500 mb-1.5 flex items-center gap-2">
                    <span>
                      {hands.length > 1 ? `Hand ${hi + 1}` : "Your Hand"}
                      {hand.doubled && <span className="ml-1 text-amber-400">(DOUBLED)</span>}
                      {hand.fromSplitAces && <span className="ml-1 text-purple-400">(Split Ace)</span>}
                    </span>
                    <span className="text-slate-300 font-mono font-bold">({hand.total})</span>
                    <span className="ml-auto text-[10px] text-slate-600">{hand.bet} ₡</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {hand.cards.map((c, ci) => <Card key={`${dealKey}-h${hi}-c${ci}`} card={c} index={ci} isNew />)}
                  </div>
                  {/* Per-hand result */}
                  {results && results[hi] && (
                    <div className={`mt-2 text-[11px] font-semibold ${
                      results[hi].payout > results[hi].bet ? "text-green-400" : results[hi].payout === results[hi].bet ? "text-slate-400" : "text-red-400"
                    }`}>
                      {results[hi].label}
                      {results[hi].payout > 0 && (
                        <span className="ml-1 font-mono">+{results[hi].payout} ₡</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Insurance prompt */}
          {phase === "insurance" && (
            <div className="mt-4 rounded-lg p-4 bg-amber-950/20 border border-amber-800 text-center space-y-3">
              <div className="text-sm text-amber-300 font-bold">🛡️ Insurance?</div>
              <p className="text-[11px] text-slate-400">Dealer shows an Ace. Insurance costs {Math.floor(bet / 2)} ₡ and pays 2:1 if dealer has Blackjack.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => handleInsurance(true)} disabled={loading || credits < Math.floor(bet / 2)}
                  className="px-6 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 font-bold text-white text-sm disabled:opacity-40 transition">
                  Yes ({Math.floor(bet / 2)} ₡)
                </button>
                <button onClick={() => handleInsurance(false)} disabled={loading}
                  className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-white text-sm disabled:opacity-40 transition">
                  No Thanks
                </button>
              </div>
            </div>
          )}

          {/* Overall result banner */}
          {phase === "done" && resultLabel && (
            <div className={`mt-4 rounded-lg p-3 text-sm text-center ${
              netResult > 0
                ? "bg-green-900/20 border border-green-800 text-green-300 animate-win-glow"
                : netResult === 0
                ? "bg-slate-800 border border-slate-700 text-slate-400"
                : "bg-red-900/20 border border-red-800 text-red-300 animate-loss-shake"
            }`}>
              {!results && resultLabel}
              {results && (
                <div className="space-y-0.5">
                  {netResult > 0 ? "🎉 " : netResult < 0 ? "💀 " : ""}
                  Net: <span className="font-bold font-mono">{netResult > 0 ? "+" : ""}{netResult} ₡</span>
                </div>
              )}
              {insuranceMsg && <div className="text-[10px] text-amber-400 mt-1">{insuranceMsg}</div>}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-[#0a0d11] border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Credits</span>
            <span className={`text-amber-400 font-bold font-mono ${creditsBump ? "animate-credits-bump" : ""}`}>
              {credits.toLocaleString()} ₡
            </span>
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
            <div className="space-y-2">
              {hands.length > 1 && (
                <div className="text-center text-[11px] text-emerald-400 font-semibold">
                  Playing Hand {activeHandIndex + 1} of {hands.length}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={hit} disabled={loading}
                  className="flex-1 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-white disabled:opacity-40 transition">
                  Hit
                </button>
                <button onClick={stand} disabled={loading}
                  className="flex-1 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold text-white disabled:opacity-40 transition">
                  Stand
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={double} disabled={loading || !canDouble}
                  className="flex-1 py-2.5 rounded-lg bg-purple-700 hover:bg-purple-600 font-bold text-white text-sm disabled:opacity-30 transition">
                  Double
                </button>
                <button onClick={split} disabled={loading || !canSplit}
                  className="flex-1 py-2.5 rounded-lg bg-pink-700 hover:bg-pink-600 font-bold text-white text-sm disabled:opacity-30 transition">
                  Split
                </button>
              </div>
            </div>
          )}

          {phase === "done" && (
            <button onClick={newGame}
              className="w-full py-3 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-white transition">
              New Hand
            </button>
          )}
        </div>

        {/* Rules reference */}
        <div className="text-[10px] text-slate-600 text-center space-y-0.5 pb-4">
          <p>6-deck shoe · Dealer hits soft 17 · Blackjack pays 3:2</p>
          <p>Double on any 2 cards · Double after split · Split up to 4 hands</p>
          <p>Split aces receive 1 card · Insurance pays 2:1</p>
        </div>
      </div>
    </div>
  );
}
