"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  initial: {
    trainsRemaining: number;
    maxTrains: number;
    creditReward: number;
    xpReward: number;
    levelChance: number;
    level: number;
    xp: number;
    credits: number;
  };
}

export function SimulatorClient({ initial }: Props) {
  const [trainsRemaining, setTrainsRemaining] = useState(initial.trainsRemaining);
  const [level, setLevel] = useState(initial.level);
  const [xp, setXp] = useState(initial.xp);
  const [credits, setCredits] = useState(initial.credits);
  const [creditReward, setCreditReward] = useState(initial.creditReward);
  const [xpReward, setXpReward] = useState(initial.xpReward);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "fail" | "info">("info");

  async function train(type: "credits" | "xp" | "level") {
    if (loading || trainsRemaining <= 0) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/game/battle/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "Training failed.");
        setMessageType("fail");
        return;
      }

      setMessage(data.message);
      setTrainsRemaining(data.trainsRemaining);
      setLevel(data.level);
      setXp(data.xp);
      setCredits(data.credits);
      setCreditReward(Math.floor(data.level * 405));
      setXpReward(Math.floor(data.level * 6));

      if (type === "level" && data.leveledUp) {
        setMessageType("success");
      } else if (type === "level") {
        setMessageType("fail");
      } else {
        setMessageType("success");
      }
    } catch {
      setMessage("Connection error.");
      setMessageType("fail");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Lore */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] text-slate-400 leading-relaxed">
          Throughout Bureau 21&apos;s history there have been squads of legend — squads that breached
          orbital fortifications, seized derelict stations, and turned the tide of entire sector
          conflicts. Not every pilot begins as a hero. In the Combat Simulator, recruits drill against
          holographic adversaries, testing tactics and hardening reflexes. It is the one place on Sol
          Prime where failure costs nothing but pride, and where repetition forges the instincts needed
          to survive real engagements. Practice here, and you&apos;ll be ready when the stakes are real.
        </p>
      </div>

      {/* Status */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Training Sessions Remaining</span>
          <span className="text-cyan-300 font-bold">{trainsRemaining} / {initial.maxTrains}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Current Level</span>
          <span className="text-cyan-300">{level}</span>
        </div>
      </div>

      {/* Training result message */}
      {message && (
        <div className={`rounded-md border p-3 text-[11px] ${
          messageType === "success"
            ? "border-emerald-800 bg-emerald-950/20 text-emerald-300"
            : messageType === "fail"
            ? "border-red-800 bg-red-950/20 text-red-400"
            : "border-slate-800 bg-slate-900/30 text-slate-300"
        }`}>
          {message}
        </div>
      )}

      {/* ── Training Options ── */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <h2 className="text-[14px] font-bold text-amber-300 mb-1">Pick a training protocol</h2>
      </div>

      {/* Train for Credits */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <h3 className="text-[13px] font-bold text-slate-200">
          Drill for {creditReward.toLocaleString()} Credits
        </h3>
        <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
          Run a simulated contract mission. Many a strong pilot has fallen by the wayside of a lesser
          opponent with greater resources. Anyone can be strong; it takes a true pilot to be wealthy.
        </p>
        <button
          onClick={() => train("credits")}
          disabled={loading || trainsRemaining <= 0}
          className="mt-2 rounded border border-amber-800 bg-amber-950/40 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 transition hover:bg-amber-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Training..." : "Train for Credits"}
        </button>
      </div>

      {/* Train for XP */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <h3 className="text-[13px] font-bold text-slate-200">
          Drill for {xpReward} XP
        </h3>
        <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
          Focus on technique refinement. You know that might makes right, and the more might the more
          right you are. Improving your experience rating is the obvious choice.
        </p>
        <button
          onClick={() => train("xp")}
          disabled={loading || trainsRemaining <= 0}
          className="mt-2 rounded border border-cyan-800 bg-cyan-950/40 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Training..." : "Train for XP"}
        </button>
      </div>

      {/* Train for 1 Level */}
      <div className="rounded-md border border-red-900/30 bg-[#0a0d11] p-4">
        <h3 className="text-[13px] font-bold text-slate-200">
          Gambit — Train for 1 Level
        </h3>
        <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
          Throwing caution to the void, there are those who know what they want and are willing to get it no matter
          what the cost. 1:{initial.levelChance} chance of gaining a level and losing any XP you currently have.
        </p>
        <button
          onClick={() => train("level")}
          disabled={loading || trainsRemaining <= 0}
          className="mt-2 rounded border border-red-800 bg-red-950/40 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Training..." : "Train for Level"}
        </button>
      </div>

      <div className="text-center">
        <Link href="/battle" className="text-[11px] text-cyan-400 hover:text-cyan-300">[← Back]</Link>
      </div>
    </div>
  );
}
