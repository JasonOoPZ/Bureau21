"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Job {
  id: string;
  label: string;
  description: string;
  levelReq: number;
  creditReward: number;
  xpReward: number;
  durationLabel: string;
  available: boolean;
}

interface DockState {
  jobs: Job[];
  ready: boolean;
  cooldownRemaining: number;
  cooldownMinutes: number;
  level: number;
  credits: number;
  xp: number;
}

interface JobResult {
  job: Job;
  creditGain: number;
  xpGain: number;
  newLevel: number;
  leveledUp: boolean;
  message: string;
}

export function DockingBayClient() {
  const [state, setState] = useState<DockState | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadState = useCallback(async () => {
    try {
      const res = await fetch("/api/game/docking-bay");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState(data);
      setCountdown(data.cooldownRemaining * 60);
      if (data.jobs.length > 0) {
        const first = data.jobs.find((j: Job) => j.available) ?? data.jobs[0];
        setSelectedJob(first.id);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadState(); }, [loadState]);

  useEffect(() => {
    if (countdown <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setState((s) => s ? { ...s, ready: true, cooldownRemaining: 0 } : s);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [countdown]);

  const takeJob = async () => {
    if (!selectedJob) return;
    setError(null);
    setResult(null);
    setRunning(true);
    try {
      const res = await fetch("/api/game/docking-bay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: selectedJob }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      await loadState();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Job failed.");
    } finally {
      setRunning(false);
    }
  };

  const fmtCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500">Loading contracts…</div>;
  }
  if (!state) {
    return <div className="rounded-xl border border-red-900/40 bg-red-900/10 p-4 text-red-400">{error ?? "Could not load Docking Bay."}</div>;
  }

  const selected = state.jobs.find((j) => j.id === selectedJob);

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4 text-center">
          <div className="text-xl font-bold text-amber-300">{state.credits.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Credits</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4 text-center">
          <div className="text-xl font-bold text-cyan-300">{state.level}</div>
          <div className="text-xs text-slate-500 mt-1">Level</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4 text-center">
          <div className="text-xl font-bold text-violet-300">{state.xp}</div>
          <div className="text-xs text-slate-500 mt-1">XP</div>
        </div>
      </div>

      {/* Job list */}
      <div className="rounded-xl border border-cyan-900/30 bg-[#08111a] p-6">
        <h2 className="mb-1 font-[family-name:var(--font-orbitron)] text-base font-bold text-cyan-300">
          Available Contracts
        </h2>
        <p className="mb-5 text-xs text-slate-500">Select a job and deploy. One contract per {state.cooldownMinutes}-minute window.</p>

        <div className="space-y-3">
          {state.jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => job.available && setSelectedJob(job.id)}
              disabled={!job.available}
              className={`w-full rounded-xl border p-4 text-left transition-all ${
                !job.available
                  ? "border-slate-800 bg-slate-800/20 opacity-40 cursor-not-allowed"
                  : selectedJob === job.id
                  ? "border-cyan-600 bg-cyan-900/20"
                  : "border-slate-700 bg-[#0b0f14] hover:border-slate-600"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-100">{job.label}</span>
                    {!job.available && (
                      <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                        Lv {job.levelReq}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{job.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-amber-300">+{job.creditReward} cr</div>
                  <div className="text-xs text-violet-400">+{job.xpReward} XP</div>
                  <div className="text-xs text-slate-500 mt-0.5">{job.durationLabel}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Deploy / Cooldown */}
      <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-6">
        {state.ready ? (
          <div>
            {selected && (
              <div className="mb-4 rounded-lg border border-cyan-900/40 bg-cyan-900/10 p-3 text-sm text-cyan-300">
                Selected: <span className="font-semibold">{selected.label}</span>
                <span className="ml-2 text-xs text-slate-400">({selected.creditReward} cr · {selected.xpReward} XP)</span>
              </div>
            )}
            <button
              onClick={takeJob}
              disabled={running || !selectedJob}
              className="w-full rounded-lg bg-cyan-700 py-3 text-sm font-bold text-white hover:bg-cyan-600 disabled:opacity-60 transition-colors"
            >
              {running ? "Deploying…" : "Deploy on Contract"}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-2 text-xs text-slate-500 uppercase tracking-widest">On assignment — returns in</p>
            <div className="font-[family-name:var(--font-orbitron)] text-4xl font-black text-cyan-300 tabular-nums">
              {fmtCountdown(countdown)}
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-600 transition-all"
                style={{ width: `${Math.max(0, 100 - (countdown / (state.cooldownMinutes * 60)) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-emerald-800/50 bg-emerald-900/10 p-4">
          <p className="text-sm font-semibold text-emerald-300">{result.message}</p>
          {result.leveledUp && (
            <p className="mt-1 text-xs text-amber-300 font-semibold">
              ⬆ Level Up! Now Level {result.newLevel}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-900/10 p-3 text-sm text-red-400">{error}</div>
      )}
    </div>
  );
}
