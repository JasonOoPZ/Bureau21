"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { crashMultiplierAt } from "@/lib/casino-crash";

/* ── constants ─────────────────────────────────────────── */
const W = 400;
const H = 600;
const GRAVITY = 0.45;
const FLAP = -7;
const PLAYER_SIZE = 14;
const GAP_SIZE_START = 170;
const GAP_SIZE_MIN = 100;
const PIPE_WIDTH = 50;
const PIPE_SPEED_START = 2.5;
const PIPE_SPEED_MAX = 6;
const PIPE_SPACING = 220;
const QUICK_BETS = [100, 500, 1000, 10000, 25000];
const CRASH_API = "/api/game/casino/crash";
const POLL_INTERVAL_MS = 1000;
const CASH_OUT_ATTEMPTS = 3;
const CASH_OUT_RETRY_DELAY_MS = 400;

type RunPhase = "idle" | "running" | "dead" | "cashed";

/** Monotonic clock for the run timer (only read from event handlers and animation frames). */
function monotonicNow(): number {
  return performance.now();
}

/* ── geometry helpers ──────────────────────────────────── */
type Pipe = { x: number; gapY: number; gapH: number; scored: boolean };

function createPipe(x: number, gapH: number): Pipe {
  const margin = 60;
  const gapY = margin + Math.random() * (H - gapH - margin * 2);
  return { x, gapY, gapH, scored: false };
}

/* ── draw helpers ──────────────────────────────────────── */
function drawGrid(ctx: CanvasRenderingContext2D, offset: number) {
  ctx.strokeStyle = "rgba(6,182,212,0.06)";
  ctx.lineWidth = 1;
  const spacing = 40;
  for (let x = -(offset % spacing); x < W; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function drawStars(ctx: CanvasRenderingContext2D, stars: { x: number; y: number; r: number; a: number }[], offset: number) {
  for (const s of stars) {
    const sx = ((s.x - offset * 0.3) % (W + 20) + W + 20) % (W + 20);
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.beginPath();
    ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, y: number, vy: number, trail: { x: number; y: number }[]) {
  const px = 80;
  const rotation = Math.min(Math.max(vy * 3, -30), 60);

  // Trail
  for (let i = 0; i < trail.length; i++) {
    const alpha = (i / trail.length) * 0.5;
    const size = (i / trail.length) * PLAYER_SIZE * 0.6;
    ctx.fillStyle = `rgba(6,182,212,${alpha})`;
    ctx.beginPath();
    ctx.arc(trail[i].x, trail[i].y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glow
  const glow = ctx.createRadialGradient(px, y, 0, px, y, PLAYER_SIZE * 2.5);
  glow.addColorStop(0, "rgba(6,182,212,0.3)");
  glow.addColorStop(1, "rgba(6,182,212,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(px - PLAYER_SIZE * 3, y - PLAYER_SIZE * 3, PLAYER_SIZE * 6, PLAYER_SIZE * 6);

  // Player — diamond
  ctx.save();
  ctx.translate(px, y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.fillStyle = "#06b6d4";
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -PLAYER_SIZE);
  ctx.lineTo(PLAYER_SIZE, 0);
  ctx.lineTo(0, PLAYER_SIZE);
  ctx.lineTo(-PLAYER_SIZE, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner highlight
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.moveTo(0, -PLAYER_SIZE * 0.5);
  ctx.lineTo(PLAYER_SIZE * 0.5, 0);
  ctx.lineTo(0, PLAYER_SIZE * 0.5);
  ctx.lineTo(-PLAYER_SIZE * 0.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPipes(ctx: CanvasRenderingContext2D, pipes: Pipe[], mult: number) {
  for (const p of pipes) {
    // Color shifts as multiplier rises: cyan → green → amber → red
    const r = mult < 2 ? 6 : mult < 4 ? 34 : mult < 7 ? 245 : 239;
    const g = mult < 2 ? 182 : mult < 4 ? 197 : mult < 7 ? 158 : 68;
    const b = mult < 2 ? 212 : mult < 4 ? 94 : mult < 7 ? 11 : 68;
    const color = `rgb(${r},${g},${b})`;
    const colorDark = `rgba(${r},${g},${b},0.3)`;
    const colorGlow = `rgba(${r},${g},${b},0.15)`;

    // Top pipe
    const topGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
    topGrad.addColorStop(0, colorDark);
    topGrad.addColorStop(0.5, color);
    topGrad.addColorStop(1, colorDark);
    ctx.fillStyle = topGrad;
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);

    // Bottom pipe
    ctx.fillStyle = topGrad;
    ctx.fillRect(p.x, p.gapY + p.gapH, PIPE_WIDTH, H - p.gapY - p.gapH);

    // Pipe edges
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.gapY);
    ctx.strokeRect(p.x, p.gapY + p.gapH, PIPE_WIDTH, H - p.gapY - p.gapH);

    // Gap edge glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.gapY);
    ctx.lineTo(p.x + PIPE_WIDTH, p.gapY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.gapY + p.gapH);
    ctx.lineTo(p.x + PIPE_WIDTH, p.gapY + p.gapH);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ambient glow around gap
    ctx.fillStyle = colorGlow;
    ctx.fillRect(p.x - 8, p.gapY - 4, PIPE_WIDTH + 16, p.gapH + 8);
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, mult: number, payout: number, score: number) {
  ctx.textAlign = "center";
  ctx.font = "bold 28px monospace";
  const multColor = mult < 2 ? "#22d3ee" : mult < 4 ? "#4ade80" : mult < 7 ? "#fbbf24" : "#ef4444";
  ctx.fillStyle = multColor;
  ctx.shadowColor = multColor;
  ctx.shadowBlur = 16;
  ctx.fillText(`${mult.toFixed(2)}x`, W / 2, 44);
  ctx.shadowBlur = 0;

  ctx.font = "bold 14px monospace";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`${payout.toLocaleString()} ₡`, W / 2, 66);

  ctx.font = "10px monospace";
  ctx.fillStyle = "#475569";
  ctx.fillText(`gates: ${score}`, W / 2, 82);
}

function drawDeathEffect(ctx: CanvasRenderingContext2D, y: number, frame: number) {
  const px = 80;
  const progress = Math.min(frame / 30, 1);
  const radius = progress * 80;
  const alpha = 1 - progress;

  ctx.strokeStyle = `rgba(239,68,68,${alpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(px, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const dist = progress * 60;
    const particleX = px + Math.cos(angle) * dist;
    const particleY = y + Math.sin(angle) * dist;
    ctx.fillStyle = `rgba(239,68,68,${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(particleX, particleY, 3 * (1 - progress), 0, Math.PI * 2);
    ctx.fill();
  }

  if (frame < 5) {
    ctx.fillStyle = `rgba(239,68,68,${0.3 - frame * 0.06})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ── Component ─────────────────────────────────────────── */
export function CrashGame({ initialCredits }: { initialCredits: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [credits, setCredits] = useState(initialCredits);
  const [bet, setBet] = useState(100);
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [result, setResult] = useState<string | null>(null);
  const [displayMult, setDisplayMult] = useState(1.0);
  const [creditsBump, setCreditsBump] = useState(false);

  const gameRef = useRef({
    playerY: H / 2,
    vy: 0,
    pipes: [] as Pipe[],
    score: 0,
    distance: 0,
    multiplier: 1.0,
    speed: PIPE_SPEED_START,
    gapSize: GAP_SIZE_START,
    trail: [] as { x: number; y: number }[],
    stars: [] as { x: number; y: number; r: number; a: number }[],
    running: false,
    deathFrame: 0,
    deathY: H / 2,
    betAmount: 100,
    startedAt: 0,
  });
  const animRef = useRef<number>(0);

  // Generate stars once
  useEffect(() => {
    const stars: { x: number; y: number; r: number; a: number }[] = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * (W + 200),
        y: Math.random() * H,
        r: 0.5 + Math.random() * 1.5,
        a: 0.2 + Math.random() * 0.6,
      });
    }
    gameRef.current.stars = stars;
  }, []);

  useEffect(() => {
    if (creditsBump) {
      const t = setTimeout(() => setCreditsBump(false), 400);
      return () => clearTimeout(t);
    }
  }, [creditsBump]);

  const flap = useCallback(() => {
    if (gameRef.current.running) {
      gameRef.current.vy = FLAP;
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  // settleRef: a settle request (cash-out / death) is in flight or done.
  // finishedRef: the final result of this run is already on screen.
  const settleRef = useRef(false);
  const finishedRef = useRef(false);
  // Multiplier the server settled at; the animation loop freezes the HUD on it.
  const finalMultRef = useRef<number | null>(null);

  /** Shows the final result of a run exactly once. */
  const finishRun = useCallback((nextPhase: "dead" | "cashed", label: string, multiplier?: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    settleRef.current = true;
    if (typeof multiplier === "number" && multiplier > 0) {
      finalMultRef.current = multiplier;
      setDisplayMult(multiplier);
    }
    setResult(label);
    setPhase(nextPhase);
  }, []);

  // The crash point is hidden on the server. Poll so the run ends on screen
  // when the server says the void collapsed.
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(async () => {
      if (finishedRef.current) return;
      try {
        const res = await fetch(CRASH_API, { cache: "no-store" });
        const data = await res.json();
        if (data.status !== "crashed") return;
        // The animation loop sees finishedRef and plays the death effect.
        finishRun("dead", data.label ?? "The void collapsed!", data.multiplier);
      } catch {
        // Transient poll failure: the next poll or the cash-out settles the run.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [phase, finishRun]);

  const startGame = async () => {
    if (bet > credits || bet < 10) return;
    setResult(null);

    let data: { error?: string };
    let ok = false;
    try {
      const res = await fetch(CRASH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet }),
      });
      data = await res.json();
      ok = res.ok;
    } catch {
      setResult("Could not reach the casino. Please try again.");
      return;
    }
    if (!ok) { setResult(data.error ?? "Could not start the run."); return; }

    settleRef.current = false;
    finishedRef.current = false;
    finalMultRef.current = null;

    setCredits((c) => c - bet);
    setPhase("running");
    setDisplayMult(1.0);

    const g = gameRef.current;
    g.playerY = H / 2;
    g.vy = FLAP;
    g.pipes = [];
    g.score = 0;
    g.distance = 0;
    g.multiplier = 1.0;
    g.speed = PIPE_SPEED_START;
    g.gapSize = GAP_SIZE_START;
    g.trail = [];
    g.running = true;
    g.deathFrame = 0;
    g.betAmount = bet;
    g.startedAt = monotonicNow();

    for (let i = 0; i < 3; i++) {
      g.pipes.push(createPipe(W + i * PIPE_SPACING, g.gapSize));
    }

    cancelAnimationFrame(animRef.current);
    const loop = () => {
      update();
      draw();
      if (g.running || g.deathFrame < 30) {
        animRef.current = requestAnimationFrame(loop);
      }
    };
    animRef.current = requestAnimationFrame(loop);
  };

  const update = () => {
    const g = gameRef.current;
    if (g.running && finishedRef.current) {
      // The server ended the run (the void collapsed): stop flying.
      g.running = false;
      g.deathY = g.playerY;
      g.deathFrame = 0;
      if (finalMultRef.current !== null) g.multiplier = finalMultRef.current;
    }
    if (!g.running) {
      g.deathFrame++;
      return;
    }

    g.vy += GRAVITY;
    g.playerY += g.vy;
    g.distance += g.speed;

    g.trail.push({ x: 80, y: g.playerY });
    if (g.trail.length > 12) g.trail.shift();

    const progress = g.distance / 1000;
    g.speed = Math.min(PIPE_SPEED_MAX, PIPE_SPEED_START + progress * 0.25);
    g.gapSize = Math.max(GAP_SIZE_MIN, GAP_SIZE_START - progress * 5);

    // Same time-based curve the server pays on (the server clock is authoritative).
    g.multiplier = crashMultiplierAt(monotonicNow() - g.startedAt);
    setDisplayMult(g.multiplier);

    const movedPipes = g.pipes.map((p) => ({ ...p, x: p.x - g.speed }));
    const isNewlyPassed = (p: Pipe) => !p.scored && p.x + PIPE_WIDTH < 80;
    g.score += movedPipes.filter(isNewlyPassed).length;
    g.pipes = movedPipes.map((p) => (isNewlyPassed(p) ? { ...p, scored: true } : p));

    if (g.pipes[0] && g.pipes[0].x + PIPE_WIDTH < -10) {
      g.pipes.shift();
      const lastPipe = g.pipes[g.pipes.length - 1];
      const nextX = lastPipe ? lastPipe.x + PIPE_SPACING : W + PIPE_SPACING;
      g.pipes.push(createPipe(nextX, g.gapSize));
    }

    if (g.playerY - PLAYER_SIZE < 0 || g.playerY + PLAYER_SIZE > H) {
      die();
      return;
    }

    const px = 80;
    for (const p of g.pipes) {
      if (px + PLAYER_SIZE > p.x && px - PLAYER_SIZE < p.x + PIPE_WIDTH) {
        if (g.playerY - PLAYER_SIZE < p.gapY || g.playerY + PLAYER_SIZE > p.gapY + p.gapH) {
          die();
          return;
        }
      }
    }
  };

  const die = async () => {
    const g = gameRef.current;
    g.running = false;
    g.deathY = g.playerY;
    g.deathFrame = 0;

    if (settleRef.current) return;
    settleRef.current = true;

    const fallback = `Crashed at ${g.multiplier.toFixed(2)}x! Lost ${g.betAmount.toLocaleString()} ₡`;
    try {
      const res = await fetch(CRASH_API, { method: "DELETE" });
      const data = await res.json();
      finishRun("dead", data.label ?? fallback);
    } catch {
      finishRun("dead", fallback);
    }
  };

  const cashOut = async () => {
    const g = gameRef.current;
    g.running = false;
    cancelAnimationFrame(animRef.current);

    if (settleRef.current) return;
    settleRef.current = true;

    // The server locks the cash-out time on the first request, so a retry
    // after a failed response settles at the same multiplier.
    for (let attempt = 0; attempt < CASH_OUT_ATTEMPTS; attempt++) {
      if (finishedRef.current) return;
      try {
        const res = await fetch(CRASH_API, { method: "PUT" });
        const data = await res.json();

        if (data.status === "cashed_out") {
          if (finishedRef.current) return;
          setCredits((c) => c + data.payout);
          setCreditsBump(true);
          finishRun("cashed", data.label, data.multiplier);
          return;
        }
        if (data.status === "crashed") {
          // Too late: the hidden crash point was passed before the cash-out landed.
          finishRun("dead", data.label ?? "The void collapsed before you cashed out!", data.multiplier);
          return;
        }
        if (res.status === 400) {
          finishRun("dead", "This run was already settled. Reload to check your balance.");
          return;
        }
      } catch {
        // Network failure: fall through and retry.
      }
      await new Promise((resolve) => setTimeout(resolve, CASH_OUT_RETRY_DELAY_MS));
    }
    finishRun("dead", "Cash-out could not be confirmed. Reload to check your balance before playing again.");
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = gameRef.current;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#020617");
    bgGrad.addColorStop(0.5, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    drawGrid(ctx, g.distance);
    drawStars(ctx, g.stars, g.distance);
    drawPipes(ctx, g.pipes, g.multiplier);

    if (g.running) {
      drawPlayer(ctx, g.playerY, g.vy, g.trail);
    } else if (g.deathFrame < 30) {
      drawDeathEffect(ctx, g.deathY, g.deathFrame);
    }

    const payout = Math.floor(g.betAmount * g.multiplier);
    drawHUD(ctx, g.multiplier, payout, g.score);
  };

  // Draw idle / result screen
  useEffect(() => {
    if (phase === "idle" || phase === "dead" || phase === "cashed") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const g = gameRef.current;

      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#020617");
      bgGrad.addColorStop(0.5, "#0f172a");
      bgGrad.addColorStop(1, "#020617");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      drawGrid(ctx, 0);
      drawStars(ctx, g.stars, 0);

      ctx.textAlign = "center";
      ctx.font = "bold 32px monospace";
      ctx.fillStyle = "#22d3ee";
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 20;
      ctx.fillText("VOID RUNNER", W / 2, H / 2 - 40);
      ctx.shadowBlur = 0;

      ctx.font = "12px monospace";
      ctx.fillStyle = "#64748b";
      ctx.fillText("Tap / Click / Space to flap", W / 2, H / 2);
      ctx.fillText("Navigate through the gates", W / 2, H / 2 + 20);
      ctx.fillText("Cash out before the void collapses", W / 2, H / 2 + 40);

      // Diamond icon
      ctx.fillStyle = "#06b6d4";
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, H / 2 - 90);
      ctx.lineTo(W / 2 + 18, H / 2 - 72);
      ctx.lineTo(W / 2, H / 2 - 54);
      ctx.lineTo(W / 2 - 18, H / 2 - 72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }, [phase]);

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-100 px-3 py-4">
      <div className="mx-auto max-w-xl space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/primaris/casino" className="hover:text-red-300">← Casino</Link>
          <span>/</span>
          <span className="text-cyan-400">Void Runner</span>
        </div>

        {/* Game canvas */}
        <div className="relative rounded-xl border border-cyan-900/40 overflow-hidden bg-[#020617]">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="w-full cursor-pointer"
            style={{ imageRendering: "auto" }}
            onClick={phase === "running" ? flap : undefined}
            onTouchStart={phase === "running" ? (e) => { e.preventDefault(); flap(); } : undefined}
          />

          {phase === "running" && (
            <button
              onClick={(e) => { e.stopPropagation(); cashOut(); }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-green-600/90 hover:bg-green-500 px-6 py-3 font-bold text-white text-sm backdrop-blur-sm shadow-[0_0_20px_rgba(34,197,94,0.3)] transition animate-pulse"
            >
              💰 Cash Out ({Math.floor(bet * displayMult).toLocaleString()} ₡)
            </button>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-lg p-3 text-sm text-center ${
            phase === "cashed"
              ? "bg-green-900/20 border border-green-800 text-green-300"
              : "bg-red-900/20 border border-red-800 text-red-300"
          }`}>
            {result}
          </div>
        )}

        {/* Bet controls */}
        <div className="bg-[#0a0d11] border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Credits</span>
            <span className={`text-amber-400 font-bold font-mono ${creditsBump ? "animate-credits-bump" : ""}`}>
              {credits.toLocaleString()} ₡
            </span>
          </div>

          <div className="flex gap-2">
            {QUICK_BETS.map((q) => (
              <button
                key={q}
                onClick={() => setBet(q)}
                disabled={phase === "running"}
                className={`flex-1 py-1.5 rounded text-xs font-bold transition ${
                  bet === q
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          <input
            type="number"
            value={bet}
            onChange={(e) => setBet(Math.max(10, Number(e.target.value)))}
            disabled={phase === "running"}
            min={10}
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-center"
          />

          {phase !== "running" ? (
            <button
              onClick={startGame}
              disabled={bet > credits || bet < 10}
              className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-white disabled:opacity-40 transition"
            >
              🚀 Launch Void Runner ({bet} ₡)
            </button>
          ) : (
            <div className="text-center text-[10px] text-slate-500 uppercase tracking-wider">
              Tap the screen or press Space to flap
            </div>
          )}
        </div>

        {/* How to play */}
        <div className="bg-[#0a0d11] border border-slate-800 rounded-xl p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">How to Play</p>
          <ul className="text-[11px] text-slate-400 space-y-1">
            <li>• <span className="text-cyan-300">Tap / Click / Space</span> to flap and navigate through gates</li>
            <li>• Your <span className="text-green-300">multiplier</span> climbs the longer you survive (max 100x)</li>
            <li>• The void <span className="text-red-300">collapses at a hidden multiplier</span> every run. Cash out before it does</li>
            <li>• Gates get <span className="text-amber-300">narrower</span> and <span className="text-red-300">faster</span> over time</li>
            <li>• Hit <span className="text-green-300">Cash Out</span> anytime to lock in your winnings</li>
            <li>• Hit a wall, or still be flying when the void collapses, and you lose your wager</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
