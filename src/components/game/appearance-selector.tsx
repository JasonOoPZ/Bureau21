"use client";

import { StarterCharacterPortrait } from "@/components/game/starter-character-portrait";
import { starterCharacters, type StarterCharacter } from "@/lib/starter-characters";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const CHANGE_COST = 100;

type Gender = "male" | "female" | "non-binary" | "unspecified";

type AppearanceSelectorProps = {
  currentSlug: string;
  initialCredits: number;
  initialSelections: number;
  initialCallsign?: string;
  setupMode?: boolean;
};

export function AppearanceSelector({
  currentSlug,
  initialCredits,
  initialSelections,
  initialCallsign = "",
  setupMode = false,
}: AppearanceSelectorProps) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState(currentSlug);
  const [credits, setCredits] = useState(initialCredits);
  const [selections, setSelections] = useState(initialSelections);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState<StarterCharacter | null>(null);
  const [callsign, setCallsign] = useState(initialCallsign);
  const [gender, setGender] = useState<Gender>("unspecified");

  const currentCost = useMemo(() => (selections === 0 ? 0 : CHANGE_COST), [selections]);
  const canAfford = credits >= currentCost;
  const hasChanged = selectedSlug !== currentSlug;

  async function saveAppearance() {
    setError(null);
    setNotice(null);

    if (setupMode && callsign.trim().length < 2) {
      setError("Pilot name must be at least 2 characters.");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = { characterSlug: selectedSlug };
      if (setupMode) {
        payload.callsign = callsign.trim();
        payload.gender = gender;
      }

      const res = await fetch("/api/game/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as
        | {
            error?: string;
            credits: number;
            characterSlug: string;
            appearanceSelections: number;
            spentCredits: number;
          }
        | null;

      if (!res.ok || !data) {
        setError(data?.error ?? "Failed to update appearance.");
        return;
      }

      setCredits(data.credits);
      setSelections(data.appearanceSelections);
      setNotice(
        data.spentCredits > 0
          ? `Appearance updated. ${data.spentCredits} credits spent.`
          : "Appearance locked in for free."
      );

      if (setupMode) {
        router.push("/lobby");
        router.refresh();
        return;
      }

      router.refresh();
    } catch {
      setError("Network error while updating appearance.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Pilot Identity (setup mode only) ── */}
      {setupMode && (
        <div className="grid gap-4 sm:grid-cols-2 rounded-md border border-slate-800 bg-slate-900/40 p-4">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Pilot Name</span>
            <input
              type="text"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              placeholder="Enter your callsign"
              maxLength={24}
              className="mt-1.5 w-full rounded-lg border border-slate-700/80 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500 focus:shadow-[0_0_12px_rgba(34,211,238,0.1)]"
            />
            <p className="mt-1 text-[10px] text-slate-600">{callsign.length}/24 characters</p>
          </label>

          <fieldset>
            <legend className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Gender</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(["male", "female", "non-binary", "unspecified"] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`rounded-lg border px-3 py-2.5 text-xs capitalize transition ${
                    gender === g
                      ? "border-cyan-500 bg-cyan-500/15 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                      : "border-slate-700 bg-black/30 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                  }`}
                >
                  {g === "non-binary" ? "Non-Binary" : g === "unspecified" ? "Prefer not to say" : g}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <div className="rounded-md border border-slate-800 bg-slate-900/40 p-3 text-[11px] text-slate-300">
        <p className="uppercase tracking-[0.15em] text-slate-500">Appearance Change Policy</p>
        <p className="mt-1">
          First model lock-in is <span className="text-emerald-400">free</span>. Every change after that costs
          <span className="text-amber-300"> {CHANGE_COST} credits</span>.
        </p>
        <p className="mt-1 text-slate-400">Current credits: <span className="text-cyan-300">{credits}</span></p>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 justify-items-center">
        {starterCharacters.map((character) => {
          const selected = selectedSlug === character.slug;
          return (
            <div key={character.slug} className="relative w-full">
              <button
                type="button"
                onClick={() => setSelectedSlug(character.slug)}
                className={`flex h-full w-full flex-col items-center rounded-xl border-2 p-4 text-center transition ${
                  selected
                    ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/20"
                    : "border-slate-800 bg-[#0c1118] hover:border-slate-600"
                }`}
              >
                <div className="mb-3 flex justify-center">
                  <StarterCharacterPortrait slug={character.slug} size="sm" />
                </div>
                <p className="text-base font-bold text-slate-200">{character.name}</p>
                <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">{character.title}</p>
                <p
                  className="mt-auto pt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: character.perk.color }}
                >
                  {character.perk.name}
                </p>
              </button>
              {/* Info button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setInspecting(character); }}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-[11px] font-bold text-slate-400 transition hover:border-cyan-500 hover:text-cyan-300"
                title="View stats"
              >
                ?
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Stats overlay ── */}
      {inspecting && <CharacterStatsOverlay character={inspecting} onClose={() => setInspecting(null)} />}

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-800 bg-[#0a0d11] p-3">
        <button
          type="button"
          onClick={saveAppearance}
          disabled={loading || (!setupMode && !hasChanged) || !canAfford}
          className="rounded-md border border-cyan-700 bg-cyan-900/30 px-4 py-2 text-xs uppercase tracking-[0.15em] text-cyan-200 transition hover:bg-cyan-900/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : setupMode
            ? "Confirm Alien Model"
            : currentCost === 0
            ? "Save Appearance (Free)"
            : `Save Appearance (${currentCost} cr)`}
        </button>

        {!canAfford && currentCost > 0 ? (
          <p className="text-xs text-red-400">Not enough credits for this change.</p>
        ) : null}

        {notice ? <p className="text-xs text-emerald-400">{notice}</p> : null}
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}

/* ─── Stats Overlay ─── */

function CharacterStatsOverlay({
  character,
  onClose,
}: {
  character: StarterCharacter;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const { perk } = character;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-[#0a0e14] shadow-2xl"
        style={{ boxShadow: `0 0 80px ${perk.color}22, 0 0 30px ${perk.color}11` }}
      >
        {/* Top glow strip */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, ${perk.color}, transparent)` }} />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-sm text-slate-400 transition hover:border-red-500 hover:text-red-300"
        >
          ✕
        </button>

        <div className="p-6">
          {/* Character portrait */}
          <div className="mb-4 flex justify-center">
            <div
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"
              style={{ boxShadow: `0 0 40px ${perk.color}18` }}
            >
              <StarterCharacterPortrait slug={character.slug} size="md" />
            </div>
          </div>

          {/* Name & Title */}
          <div className="mb-4 text-center">
            <h3 className="font-display text-2xl font-bold uppercase text-slate-100">
              {character.name}
            </h3>
            <p className="mt-0.5 text-xs uppercase tracking-[0.2em] text-slate-500">
              {character.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {character.summary}
            </p>
          </div>

          {/* Perk card */}
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: `${perk.color}40`,
              background: `${perk.color}08`,
            }}
          >
            <div className="mb-1 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: perk.color, boxShadow: `0 0 8px ${perk.color}` }}
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Passive Perk
              </p>
            </div>

            <h4 className="font-display text-lg font-bold" style={{ color: perk.color }}>
              {perk.name}
            </h4>

            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {perk.description}
            </p>

            {/* Stat bar */}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-800 bg-black/40 px-3 py-2">
              <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
                {perk.stat}
              </span>
              <span
                className="font-display text-lg font-bold"
                style={{ color: perk.color }}
              >
                {perk.value}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
