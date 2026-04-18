"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface ScanResult {
  id: string;
  odId: string;
  userId: string;
  callsign: string;
  level: number;
  gender: string;
  characterSlug: string;
  sector: string;
  kills: number;
  online: boolean;
  syndicateTag: string | null;
  syndicateName: string | null;
}

interface ScanResponse {
  results: ScanResult[];
  total: number;
  page: number;
  totalPages: number;
}

interface ScanFilters {
  levelEnabled: boolean;
  levelMin: number;
  levelMax: number;
  killsEnabled: boolean;
  killsMin: number;
  killsMax: number;
  minAgeDaysEnabled: boolean;
  minAgeDays: number;
  gender: "" | "male" | "female";
  excludeWatchlist: boolean;
  sameSector: boolean;
  onlineOnly: boolean;
  excludeStaff: boolean;
  attackableOnly: boolean;
  syndicateFilter: string;
  sortBy: "id" | "level" | "kills";
  cacheSearch: boolean;
}

const DEFAULT_FILTERS: ScanFilters = {
  levelEnabled: false,
  levelMin: 1,
  levelMax: 500,
  killsEnabled: false,
  killsMin: 0,
  killsMax: 9999,
  minAgeDaysEnabled: false,
  minAgeDays: 0,
  gender: "",
  excludeWatchlist: false,
  sameSector: false,
  onlineOnly: false,
  excludeStaff: false,
  attackableOnly: false,
  syndicateFilter: "any",
  sortBy: "level",
  cacheSearch: true,
};

interface Props {
  syndicates: Array<{ id: string; name: string; tag: string }>;
}

export function ScannerClient({ syndicates }: Props) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ScanFilters>(() => {
    // Load cached if requested
    if (searchParams.get("cached") === "true") {
      try {
        const cached = localStorage.getItem("bureau21_scanner_cache");
        if (cached) return JSON.parse(cached);
      } catch { /* use defaults */ }
    }
    const lvl = searchParams.get("level");
    if (lvl) {
      return { ...DEFAULT_FILTERS, levelMin: parseInt(lvl), levelMax: parseInt(lvl) };
    }
    return DEFAULT_FILTERS;
  });

  const [results, setResults] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSyndicate, setShowSyndicate] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showCache, setShowCache] = useState(false);

  const runScan = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    // Build API body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = { page };
    if (filters.levelEnabled) {
      body.levelMin = filters.levelMin;
      body.levelMax = filters.levelMax;
    }
    if (filters.minAgeDaysEnabled && filters.minAgeDays > 0) body.minAgeDays = filters.minAgeDays;
    if (filters.gender) body.gender = filters.gender;
    if (filters.sameSector) body.sameSector = true;
    if (filters.onlineOnly) body.onlineOnly = true;
    if (filters.excludeWatchlist) body.excludeWatchlist = true;
    if (filters.excludeStaff) body.excludeStaff = true;
    if (filters.attackableOnly) body.attackableOnly = true;
    if (filters.syndicateFilter !== "any") body.syndicateFilter = filters.syndicateFilter;
    body.sortBy = filters.sortBy;

    // Cache
    if (filters.cacheSearch) {
      try { localStorage.setItem("bureau21_scanner_cache", JSON.stringify(filters)); } catch { /* ignore */ }
    }

    try {
      const res = await fetch("/api/game/battle/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Scan failed."); return; }
      setResults(data);
    } catch { setError("Connection error."); } finally { setLoading(false); }
  }, [filters]);

  // Auto-run if cached
  useEffect(() => {
    if (searchParams.get("cached") === "true") runScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter<K extends keyof ScanFilters>(key: K, value: ScanFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-3">
      {/* ── Scan Options ── */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 space-y-4">
        {/* Level range */}
        <div>
          <p className="text-[11px] text-amber-400 font-bold mb-2">Scan Options:</p>
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input type="checkbox" checked={filters.levelEnabled} onChange={(e) => updateFilter("levelEnabled", e.target.checked)}
              className="accent-red-500" />
            Level must be between
            <input type="number" min={1} max={500} value={filters.levelMin}
              onChange={(e) => updateFilter("levelMin", parseInt(e.target.value) || 1)}
              className="w-16 rounded border border-slate-700 bg-black/60 px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-700"
              disabled={!filters.levelEnabled} />
            and
            <input type="number" min={1} max={500} value={filters.levelMax}
              onChange={(e) => updateFilter("levelMax", parseInt(e.target.value) || 1)}
              className="w-16 rounded border border-slate-700 bg-black/60 px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-700"
              disabled={!filters.levelEnabled} />
          </label>
        </div>

        {/* Kill count range */}
        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input type="checkbox" checked={filters.killsEnabled} onChange={(e) => updateFilter("killsEnabled", e.target.checked)}
            className="accent-red-500" />
          Kill count must be between
          <input type="number" min={0} value={filters.killsMin}
            onChange={(e) => updateFilter("killsMin", parseInt(e.target.value) || 0)}
            className="w-20 rounded border border-slate-700 bg-black/60 px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-700"
            disabled={!filters.killsEnabled} />
          and
          <input type="number" min={0} value={filters.killsMax}
            onChange={(e) => updateFilter("killsMax", parseInt(e.target.value) || 0)}
            className="w-20 rounded border border-slate-700 bg-black/60 px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-700"
            disabled={!filters.killsEnabled} />
        </label>

        {/* Account age */}
        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input type="checkbox" checked={filters.minAgeDaysEnabled} onChange={(e) => updateFilter("minAgeDaysEnabled", e.target.checked)}
            className="accent-red-500" />
          Must be at least
          <input type="number" min={0} value={filters.minAgeDays}
            onChange={(e) => updateFilter("minAgeDays", parseInt(e.target.value) || 0)}
            className="w-20 rounded border border-slate-700 bg-black/60 px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-700"
            disabled={!filters.minAgeDaysEnabled} />
          days old.
        </label>
      </div>

      {/* ── Advanced Options ── */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[11px] text-amber-400 font-bold">
          Advanced Scan Options: <span className="text-cyan-400 font-normal">[{showAdvanced ? "hide" : "show"}]</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 text-[11px] text-slate-300">
              <input type="checkbox" checked={filters.excludeWatchlist} onChange={(e) => updateFilter("excludeWatchlist", e.target.checked)}
                className="accent-red-500" />
              Not on my watchlist.
            </label>
            <label className="flex items-center gap-2 text-[11px] text-slate-300">
              <input type="checkbox" checked={filters.sameSector} onChange={(e) => updateFilter("sameSector", e.target.checked)}
                className="accent-red-500" />
              In same sector as me.
            </label>
            <label className="flex items-center gap-2 text-[11px] text-slate-300">
              <input type="checkbox" checked={filters.onlineOnly} onChange={(e) => updateFilter("onlineOnly", e.target.checked)}
                className="accent-red-500" />
              Currently online.
            </label>
            <label className="flex items-center gap-2 text-[11px] text-slate-300">
              <input type="checkbox" checked={filters.excludeStaff} onChange={(e) => updateFilter("excludeStaff", e.target.checked)}
                className="accent-red-500" />
              Not bureau staff.
            </label>
            <label className="flex items-center gap-2 text-[11px] text-slate-300">
              <input type="checkbox" checked={filters.attackableOnly} onChange={(e) => updateFilter("attackableOnly", e.target.checked)}
                className="accent-red-500" />
              Must be attackable (not under protection).
            </label>
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <input type="checkbox" checked={!!filters.gender} onChange={(e) => updateFilter("gender", e.target.checked ? "male" : "")}
                className="accent-red-500" />
              Must be
              <label className="flex items-center gap-1">
                <input type="radio" name="gender" value="male" checked={filters.gender === "male"}
                  onChange={() => updateFilter("gender", "male")} className="accent-red-500" disabled={!filters.gender} />
                male
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="gender" value="female" checked={filters.gender === "female"}
                  onChange={() => updateFilter("gender", "female")} className="accent-red-500" disabled={!filters.gender} />
                female
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ── Syndicate Options ── */}
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <button onClick={() => setShowSyndicate(!showSyndicate)} className="text-[11px] text-amber-400 font-bold">
          Syndicate Search Options: <span className="text-cyan-400 font-normal">[{showSyndicate ? "hide" : "show"}]</span>
        </button>

        {showSyndicate && (
          <div className="mt-3 space-y-2">
            {[
              { value: "any", label: "Doesn't matter." },
              { value: "none", label: "Must not be in a syndicate." },
              { value: "not_mine", label: "Not in my syndicate." },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-[11px] text-slate-300">
                <input type="radio" name="syndicate" value={opt.value}
                  checked={filters.syndicateFilter === opt.value}
                  onChange={() => updateFilter("syndicateFilter", opt.value)}
                  className="accent-red-500" />
                {opt.label}
              </label>
            ))}
            {syndicates.length > 0 && (
              <label className="flex items-center gap-2 text-[11px] text-slate-300">
                <input type="radio" name="syndicate" value="specific"
                  checked={!["any", "none", "not_mine"].includes(filters.syndicateFilter)}
                  onChange={() => updateFilter("syndicateFilter", syndicates[0].id)}
                  className="accent-red-500" />
                Is in syndicate
                <select
                  value={!["any", "none", "not_mine"].includes(filters.syndicateFilter) ? filters.syndicateFilter : syndicates[0]?.id ?? ""}
                  onChange={(e) => updateFilter("syndicateFilter", e.target.value)}
                  className="rounded border border-slate-700 bg-black/60 px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-700"
                >
                  {syndicates.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
      </div>

      {/* ── Sort + Cache ── */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-md border border-slate-800 bg-[#0a0d11] p-4">
          <button onClick={() => setShowSort(!showSort)} className="text-[11px] text-amber-400 font-bold">
            Sort Options: <span className="text-cyan-400 font-normal">[{showSort ? "hide" : "show"}]</span>
          </button>
          {showSort && (
            <div className="mt-2">
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter("sortBy", e.target.value as "id" | "level" | "kills")}
                className="rounded border border-slate-700 bg-black/60 px-3 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-700"
              >
                <option value="id">Sort by ID</option>
                <option value="level">Sort by Level</option>
                <option value="kills">Sort by Kills</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex-1 rounded-md border border-slate-800 bg-[#0a0d11] p-4">
          <button onClick={() => setShowCache(!showCache)} className="text-[11px] text-amber-400 font-bold">
            Cache Options: <span className="text-cyan-400 font-normal">[{showCache ? "hide" : "show"}]</span>
          </button>
          {showCache && (
            <div className="mt-2 space-y-1">
              <label className="flex items-center gap-2 text-[11px] text-slate-300">
                <input type="radio" checked={!filters.cacheSearch} onChange={() => updateFilter("cacheSearch", false)} className="accent-red-500" />
                Don&apos;t remember this search.
              </label>
              <label className="flex items-center gap-2 text-[11px] text-slate-300">
                <input type="radio" checked={filters.cacheSearch} onChange={() => updateFilter("cacheSearch", true)} className="accent-red-500" />
                Cache this search.
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Run Scan button */}
      <button
        onClick={() => runScan(1)}
        disabled={loading}
        className="rounded border border-red-800 bg-red-950/50 px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-red-300 transition hover:bg-red-900/50 disabled:opacity-40"
      >
        {loading ? "Scanning..." : "Run Scan"}
      </button>

      {error && (
        <p className="rounded border border-red-900/40 bg-red-950/20 px-3 py-2 text-[11px] text-red-400">{error}</p>
      )}

      {/* ── Scan Results ── */}
      {results && (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] overflow-x-auto">
          <div className="border-b border-slate-800 bg-slate-900/30 px-4 py-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-300">Scan Results</p>
          </div>

          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-500">ID</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-500">Pilot</th>
                <th className="px-3 py-2 text-center text-[10px] uppercase tracking-wider text-slate-500">Level</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.results.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/40 hover:bg-slate-900/30">
                  <td className="px-3 py-2 text-slate-500 font-mono">{r.odId}</td>
                  <td className="px-3 py-2">
                    <Link href={`/pilot/${r.userId}`} className="text-cyan-400 hover:text-cyan-300 font-semibold">
                      {r.callsign}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-center text-slate-300">{r.level}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1">
                      {r.gender === "male" && <span className="text-blue-400">♂</span>}
                      {r.gender === "female" && <span className="text-pink-400">♀</span>}
                      {r.online && <span className="text-emerald-400" title="Online">●</span>}
                      {r.syndicateTag && (
                        <span className="text-amber-400 text-[9px] font-bold" title={r.syndicateName ?? ""}>[{r.syndicateTag}]</span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <Link
                      href={`/battle?target=${encodeURIComponent(r.callsign)}`}
                      className="text-red-400 hover:text-red-300"
                    >
                      Attack
                    </Link>
                    <span className="text-slate-700">|</span>
                    <Link
                      href={`/pilot/${r.userId}`}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      Snoop
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {results.totalPages > 1 && (
            <div className="border-t border-slate-800 px-4 py-3 text-center space-x-1">
              {Array.from({ length: Math.min(results.totalPages, 4) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => runScan(p)}
                  className={`px-2 py-0.5 rounded text-[11px] transition ${
                    results.page === p
                      ? "bg-cyan-900/50 text-cyan-300 font-bold"
                      : "text-cyan-500 hover:text-cyan-300"
                  }`}
                >
                  {p}
                </button>
              ))}
              {results.totalPages > 5 && <span className="text-slate-600 text-[11px]">...</span>}
              {results.totalPages > 4 && (
                <button
                  onClick={() => runScan(results.totalPages)}
                  className={`px-2 py-0.5 rounded text-[11px] transition ${
                    results.page === results.totalPages
                      ? "bg-cyan-900/50 text-cyan-300 font-bold"
                      : "text-cyan-500 hover:text-cyan-300"
                  }`}
                >
                  {results.totalPages}
                </button>
              )}
              {results.page < results.totalPages && (
                <button
                  onClick={() => runScan(results.page + 1)}
                  className="text-cyan-500 hover:text-cyan-300 text-[11px] ml-2"
                >
                  Next →
                </button>
              )}
            </div>
          )}

          {/* Retrace prompt */}
          <div className="border-t border-slate-800 px-4 py-2 text-center">
            <p className="text-[10px] text-emerald-600/70">
              Scan conditions change frequently. Would you like to{" "}
              <button onClick={() => runScan(1)} className="text-cyan-400 hover:text-cyan-300 underline">
                rescan
              </button>{" "}
              using the same search?
            </p>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/battle" className="text-[11px] text-cyan-400 hover:text-cyan-300">[← Back]</Link>
      </div>
    </div>
  );
}
