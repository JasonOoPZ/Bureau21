"use client";

import { useEffect, useState } from "react";

type InventoryItem = {
  id: string;
  name: string;
  type: string;
  tier: number;
  bonusType: string;
  bonusAmt: number;
  equipped: boolean;
};

type PilotState = {
  id: string;
  callsign: string;
  level: number;
  xp: number;
  credits: number;
  fuel: number;
  hull: number;
  kills: number;
  currentSector: string;
  lastActionAt: string;
  inventory: InventoryItem[];
};

type Mission = {
  id: string;
  title: string;
  description: string;
  currentCount: number;
  targetCount: number;
  completed: boolean;
  rewardXp: number;
  rewardCredits: number;
};

const actions = [
  { id: "scan",   label: "Deep Scan",    hint: "+credits +xp" },
  { id: "mine",   label: "Mine Belt",    hint: "-fuel +credits" },
  { id: "patrol", label: "Patrol Route", hint: "-fuel +xp -hull" },
  { id: "repair", label: "Repair Hull",  hint: "-credits +hull" },
  { id: "jump",   label: "Warp Jump",    hint: "-fuel +xp +credits" },
] as const;

const COOLDOWN_SECONDS = 2;

const TIER_COLORS: Record<number, string> = {
  1: "text-slate-300",
  2: "text-sky-300",
  3: "text-amber-300",
};
const TIER_LABELS: Record<number, string> = { 1: "Common", 2: "Rare", 3: "Legendary" };
const BONUS_DESC: Record<string, string> = {
  credits: "% credit boost",
  xp: "% XP boost",
  hull: " hull armour",
  fuel: "% fuel save chance",
};

type Tab = "ops" | "inventory" | "contracts";

export function PilotConsole() {
  const [state, setState] = useState<PilotState | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [message, setMessage] = useState("Booting command console...");
  const [busy, setBusy] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [tab, setTab] = useState<Tab>("ops");

  async function refreshState() {
    const response = await fetch("/api/game/state", { cache: "no-store" });
    if (!response.ok) { setMessage("Unable to load pilot state."); return; }
    const payload = (await response.json()) as { state: PilotState; missions: Mission[] };
    setState(payload.state);
    setMissions(payload.missions);
    setMessage("Command console synchronized.");
  }

  function calculateCooldown() {
    if (!state) return;
    const elapsed = (Date.now() - new Date(state.lastActionAt).getTime()) / 1000;
    setCooldownRemaining(Math.max(0, COOLDOWN_SECONDS - elapsed));
  }

  async function executeAction(action: (typeof actions)[number]["id"]) {
    setBusy(true);
    const response = await fetch("/api/game/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { state?: PilotState; missions?: Mission[]; message?: string; error?: string }
      | null;

    if (!response.ok) { setMessage(payload?.error ?? "Action failed."); setBusy(false); return; }
    if (payload?.state) setState(payload.state);
    if (payload?.missions) setMissions(payload.missions);
    setMessage(payload?.message ?? "Action complete.");
    setBusy(false);
  }

  async function toggleEquip(item: InventoryItem) {
    setBusy(true);
    const response = await fetch("/api/game/inventory/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, equip: !item.equipped }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { inventory?: InventoryItem[]; error?: string }
      | null;

    if (!response.ok) { setMessage(payload?.error ?? "Equip failed."); setBusy(false); return; }
    if (payload?.inventory && state) {
      setState({ ...state, inventory: payload.inventory });
    }
    setMessage(item.equipped ? `${item.name} unequipped.` : `${item.name} equipped.`);
    setBusy(false);
  }

  async function discardItem(item: InventoryItem) {
    if (item.equipped) { setMessage("Unequip before discarding."); return; }
    setBusy(true);
    const response = await fetch(`/api/game/inventory/${item.id}`, { method: "DELETE" });
    if (!response.ok) { setMessage("Discard failed."); setBusy(false); return; }
    if (state) setState({ ...state, inventory: state.inventory.filter((i) => i.id !== item.id) });
    setMessage(`${item.name} discarded.`);
    setBusy(false);
  }

  useEffect(() => { refreshState(); }, []);
  useEffect(() => {
    const t = setInterval(calculateCooldown, 100);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const canAct = cooldownRemaining === 0 && !busy;

  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      className={`rounded-lg px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition ${
        tab === t
          ? "border border-cyan-500/60 text-cyan-200 bg-slate-900"
          : "border border-slate-700 text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="rounded-2xl border border-cyan-400/25 bg-slate-950/75 p-6 shadow-[0_0_35px_rgba(8,145,178,0.16)]">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Live Operations</p>
          <h2 className="font-display mt-1 text-2xl uppercase text-slate-100">Pilot Console</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabBtn("ops", "Ops")}
          {tabBtn("inventory", `Gear (${state?.inventory.length ?? 0})`)}
          {tabBtn("contracts", "Contracts")}
          <button
            type="button"
            onClick={refreshState}
            disabled={busy}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-200 disabled:opacity-50"
          >
            Sync
          </button>
        </div>
      </div>

      {state ? (
        <>
          {/* ── OPS TAB ─────────────────────────────────────────────────────── */}
          {tab === "ops" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Callsign"  value={state.callsign}        accent="text-cyan-300" />
                <Stat label="Sector"    value={state.currentSector}   accent="text-slate-100" />
                <Stat label="Level"     value={String(state.level)}   accent="text-amber-300" />
                <Stat label="XP"        value={`${state.xp}/${state.level * 100}`} accent="text-emerald-300" />
                <Stat label="Credits"   value={String(state.credits)} accent="text-cyan-200" />
                <Stat label="Fuel"      value={String(state.fuel)}    accent="text-sky-300" />
                <Stat label="Hull"      value={`${state.hull}%`}      accent={state.hull < 30 ? "text-red-300" : "text-emerald-300"} />
                <Stat
                  label="Recharge"
                  value={cooldownRemaining > 0 ? `${cooldownRemaining.toFixed(1)}s` : "Ready"}
                  accent={cooldownRemaining > 0 ? "text-orange-300" : "text-lime-300"}
                />
              </div>

              {/* Equipped gear strip */}
              {state.inventory.filter((i) => i.equipped).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {state.inventory.filter((i) => i.equipped).map((item) => (
                    <span key={item.id} className={`rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] ${TIER_COLORS[item.tier]}`}>
                      ⚙ {item.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    disabled={!canAct}
                    onClick={() => executeAction(action.id)}
                    className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-left transition hover:border-cyan-500/50 hover:bg-slate-900 disabled:opacity-55"
                  >
                    <p className="text-sm font-medium text-slate-100">{action.label}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">{action.hint}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── INVENTORY TAB ───────────────────────────────────────────────── */}
          {tab === "inventory" && (
            <div className="space-y-2">
              {state.inventory.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No gear acquired yet. Complete actions to find drops.</p>
              ) : (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {state.inventory.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 transition ${
                          item.equipped
                            ? "border-cyan-500/50 bg-slate-900"
                            : "border-slate-800 bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-sm font-medium ${TIER_COLORS[item.tier]}`}>{item.name}</p>
                            <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-slate-500">
                              {TIER_LABELS[item.tier]} {item.type} &nbsp;·&nbsp; +{item.bonusAmt}{BONUS_DESC[item.bonusType]}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => toggleEquip(item)}
                              className={`rounded-lg border px-2 py-1 text-[10px] uppercase tracking-[0.15em] transition disabled:opacity-50 ${
                                item.equipped
                                  ? "border-cyan-600/50 text-cyan-300 hover:border-red-500/50 hover:text-red-300"
                                  : "border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200"
                              }`}
                            >
                              {item.equipped ? "Unequip" : "Equip"}
                            </button>
                            {!item.equipped && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => discardItem(item)}
                                className="rounded-lg border border-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-slate-600 transition hover:border-red-800/50 hover:text-red-400 disabled:opacity-50"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="pt-1 text-center text-[10px] text-slate-600">
                    {state.inventory.length}/20 slots &nbsp;·&nbsp; One weapon, shield & engine can be equipped at once
                  </p>
                </>
              )}
            </div>
          )}

          {/* ── CONTRACTS TAB ───────────────────────────────────────────────── */}
          {tab === "contracts" && (
            <div className="space-y-3">
              {missions.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No contracts available.</p>
              ) : (
                missions.map((mission) => (
                  <div key={mission.id} className="rounded-xl border border-slate-800/50 bg-slate-900/60 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-100">{mission.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{mission.description}</p>
                      </div>
                      {mission.completed && (
                        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-300">
                          Done
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 rounded-full bg-slate-900/50 p-[3px]">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
                          style={{ width: `${Math.min(100, (mission.currentCount / mission.targetCount) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-300">
                        {mission.currentCount}/{mission.targetCount}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">
                      Rewards: +{mission.rewardXp} XP · +{mission.rewardCredits} credits
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <p className="py-4 text-center text-sm text-slate-400">Initializing pilot records...</p>
      )}

      {/* Message log */}
      <p className="mt-5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-cyan-200/90">
        {message}
      </p>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
