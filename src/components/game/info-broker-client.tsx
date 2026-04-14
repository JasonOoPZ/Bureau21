"use client";

import { useState } from "react";

interface Props { credits: number; }

interface Intel {
  callsign: string; level: number; characterSlug: string;
  strength: number; speed: number; endurance: number;
  confidence: number; panic: number; atkSplit: number;
  kills: number; bounty: number; lifeForce: number;
  sector: string; totalBattles: number;
  equipment: { name: string; type: string; tier: number }[];
  syndicate: { name: string; tag: string } | null;
}

export function InfoBrokerClient({ credits: initCredits }: Props) {
  const [credits, setCredits] = useState(initCredits);
  const [callsign, setCallsign] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intel, setIntel] = useState<Intel | null>(null);

  const lookup = async () => {
    if (!callsign.trim()) return;
    setLoading(true);
    setError(null);
    setIntel(null);
    try {
      const res = await fetch("/api/game/info-broker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCallsign: callsign.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setIntel(data.intel);
      setCredits(data.credits);
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  const tierLabel: Record<number, string> = { 1: "Common", 2: "Rare", 3: "Legendary" };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] text-slate-400">
          The Info Broker knows everything about everyone. For 150 credits, you get a complete dossier
          on any pilot — stats, equipment, syndicate affiliation, and more.
        </p>
        <p className="mt-2 text-[11px] text-slate-300">
          Credits: <span className="font-bold text-amber-300">{credits.toLocaleString()}</span>
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter pilot callsign..."
          value={callsign}
          onChange={(e) => setCallsign(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup()}
          className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-[12px] text-slate-200 placeholder:text-slate-600 focus:border-cyan-600 focus:outline-none"
        />
        <button
          onClick={lookup}
          disabled={loading || credits < 150 || !callsign.trim()}
          className="rounded border border-cyan-800 bg-cyan-950/30 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/30 disabled:opacity-50"
        >
          {loading ? "..." : "Buy Intel (150 CR)"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-900 bg-red-950/20 px-4 py-2 text-[11px] text-red-300">
          {error}
        </div>
      )}

      {intel && (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
          <p className="text-[13px] font-bold text-cyan-300">{intel.callsign} — Level {intel.level}</p>
          <p className="text-[10px] text-slate-500">Sector: {intel.sector} {intel.syndicate ? `· [${intel.syndicate.tag}] ${intel.syndicate.name}` : ""}</p>

          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-[11px] sm:grid-cols-3">
            <div><span className="text-slate-500">Strength: </span><span className="text-slate-200">{intel.strength}</span></div>
            <div><span className="text-slate-500">Speed: </span><span className="text-slate-200">{intel.speed}</span></div>
            <div><span className="text-slate-500">Endurance: </span><span className="text-slate-200">{intel.endurance}</span></div>
            <div><span className="text-slate-500">Confidence: </span><span className="text-slate-200">{intel.confidence}</span></div>
            <div><span className="text-slate-500">Panic: </span><span className="text-slate-200">{intel.panic}</span></div>
            <div><span className="text-slate-500">ATK/DEF: </span><span className="text-slate-200">{intel.atkSplit}/{100 - intel.atkSplit}</span></div>
            <div><span className="text-slate-500">Life Force: </span><span className="text-slate-200">{intel.lifeForce}</span></div>
            <div><span className="text-slate-500">Kills: </span><span className="text-slate-200">{intel.kills}</span></div>
            <div><span className="text-slate-500">Bounty: </span><span className="text-slate-200">{intel.bounty}</span></div>
            <div><span className="text-slate-500">Total Battles: </span><span className="text-slate-200">{intel.totalBattles}</span></div>
          </div>

          {intel.equipment.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Equipped Gear</p>
              <div className="mt-1 space-y-0.5">
                {intel.equipment.map((eq, i) => (
                  <p key={i} className="text-[11px] text-slate-300">
                    {eq.name} <span className="text-[10px] text-slate-500">({tierLabel[eq.tier]} {eq.type})</span>
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
