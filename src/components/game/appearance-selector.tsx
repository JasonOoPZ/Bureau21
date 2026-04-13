"use client";

import { StarterCharacterPortrait } from "@/components/game/starter-character-portrait";
import { starterCharacters } from "@/lib/starter-characters";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const CHANGE_COST = 100;

type AppearanceSelectorProps = {
  currentSlug: string;
  initialCredits: number;
  initialSelections: number;
  setupMode?: boolean;
};

export function AppearanceSelector({
  currentSlug,
  initialCredits,
  initialSelections,
  setupMode = false,
}: AppearanceSelectorProps) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState(currentSlug);
  const [credits, setCredits] = useState(initialCredits);
  const [selections, setSelections] = useState(initialSelections);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentCost = useMemo(() => (selections === 0 ? 0 : CHANGE_COST), [selections]);
  const canAfford = credits >= currentCost;
  const hasChanged = selectedSlug !== currentSlug;

  async function saveAppearance() {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/game/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterSlug: selectedSlug }),
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
      <div className="rounded-md border border-slate-800 bg-slate-900/40 p-3 text-[11px] text-slate-300">
        <p className="uppercase tracking-[0.15em] text-slate-500">Appearance Change Policy</p>
        <p className="mt-1">
          First model lock-in is <span className="text-emerald-400">free</span>. Every change after that costs
          <span className="text-amber-300"> {CHANGE_COST} credits</span>.
        </p>
        <p className="mt-1 text-slate-400">Current credits: <span className="text-cyan-300">{credits}</span></p>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {starterCharacters.map((character) => {
          const selected = selectedSlug === character.slug;
          return (
            <button
              key={character.slug}
              type="button"
              onClick={() => setSelectedSlug(character.slug)}
              className={`rounded-lg border p-3 text-center transition ${
                selected
                  ? "border-cyan-400 bg-cyan-400/10"
                  : "border-slate-800 bg-[#0c1118] hover:border-slate-600"
              }`}
            >
              <div className="mb-2 flex justify-center">
                <StarterCharacterPortrait slug={character.slug} size="sm" />
              </div>
              <p className="text-sm font-semibold text-slate-200">{character.name}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">{character.title}</p>
            </button>
          );
        })}
      </div>

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
