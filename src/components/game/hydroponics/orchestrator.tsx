"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CROPS, PROPERTIES } from "@/lib/hydroponics/config";
import type { HydroponicsGameState } from "@/lib/hydroponics/types";
import type { StaffRole } from "@/lib/hydroponics/config";
import type { OfflineReport } from "@/lib/hydroponics/engine";
import type { HydroponicsAction } from "@/lib/hydroponics/server-actions";
import { getCurrentSeason } from "@/lib/hydroponics/engine";

import { PropertySelector } from "./property-selector";
import { PlotGrid } from "./plot-grid";
import { MarketPanel } from "./market-panel";
import { StaffPanel } from "./staff-panel";
import { TechTreePanel } from "./tech-tree-panel";
import { EquipmentPanel } from "./equipment-panel";
import { InventoryStrip } from "./inventory-strip";
import { ActivityLog } from "./activity-log";
import { WelcomeBackModal } from "./welcome-back-modal";

type Panel = "none" | "market" | "staff" | "tech";

const HYDROPONICS_API = "/api/game/hydroponics";
const CLOCK_TICK_MS = 1000;
const SAVE_FAILED_MESSAGE = "Could not save your action. Please try again.";
const OFFLINE_MESSAGE = "Connection problem: your last action was NOT saved. Please try again.";

/** What the server sends back after a load or an action. The server owns state and credits. */
interface ServerSnapshot {
  state?: HydroponicsGameState;
  credits?: number;
  serverNow?: number;
  offline?: OfflineReport | null;
  error?: string;
}

export function HydroponicsOrchestrator() {
  const [state, setState] = useState<HydroponicsGameState | null>(null);
  const [credits, setCredits] = useState(0);
  const [selectedPropId, setSelectedPropId] = useState("p1");
  const [panel, setPanel] = useState<Panel>("none");
  const [offlineReport, setOfflineReport] = useState<OfflineReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  // Server clock minus browser clock, so countdowns agree with the server's timers.
  const clockOffsetRef = useRef(0);
  // Actions are sent one at a time, in click order.
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  const applySnapshot = useCallback((data: ServerSnapshot): boolean => {
    if (!data.state || typeof data.credits !== "number") return false;
    setState(data.state);
    setCredits(data.credits);
    if (typeof data.serverNow === "number") {
      clockOffsetRef.current = data.serverNow - Date.now();
      setNow(data.serverNow);
    }
    return true;
  }, []);

  // Load initial state
  useEffect(() => {
    fetch(HYDROPONICS_API)
      .then((r) => r.json())
      .then((data: ServerSnapshot) => {
        if (data.error || !applySnapshot(data)) { setError(data.error ?? "Failed to load hydroponics."); return; }
        if (data.offline) setOfflineReport(data.offline);
        const firstProperty = data.state?.properties[0];
        if (firstProperty) setSelectedPropId(firstProperty.id);
      })
      .catch(() => setError("Failed to load hydroponics."))
      .finally(() => setLoading(false));
  }, [applySnapshot]);

  // Tick timer for live countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + clockOffsetRef.current), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  /**
   * Sends one action to the server and adopts the state it returns.
   * Nothing is applied locally first, so a failed save never leaves the
   * screen showing progress the server does not have. Resolves to true on success.
   */
  const act = useCallback((action: HydroponicsAction): Promise<boolean> => {
    setActionError(null);
    setPendingActions((n) => n + 1);

    const send = async (): Promise<boolean> => {
      try {
        const res = await fetch(HYDROPONICS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });
        const data: ServerSnapshot | null = await res.json().catch(() => null);
        if (!res.ok || !data || !applySnapshot(data)) {
          setActionError(data?.error ?? SAVE_FAILED_MESSAGE);
          return false;
        }
        return true;
      } catch {
        setActionError(OFFLINE_MESSAGE);
        return false;
      } finally {
        setPendingActions((n) => n - 1);
      }
    };

    const result = queueRef.current.then(send);
    queueRef.current = result;
    return result;
  }, [applySnapshot]);

  // Derived
  if (loading) return <div className="flex items-center justify-center py-20 text-[11px] text-slate-500">Loading Hydroponics Bay...</div>;
  if (error || !state) return <div className="py-10 text-center text-[11px] text-red-500">{error ?? "Failed to load."}</div>;

  const selectedProp = state.properties.find((p) => p.id === selectedPropId);
  const season = getCurrentSeason(state.seasonEpoch, now);
  const maxTier = state.properties.reduce((m, p) => {
    const d = PROPERTIES.find((x) => x.id === p.id);
    return Math.max(m, d?.tier ?? 0);
  }, 0);
  const unlockedCrops = CROPS.filter((c) => c.unlockTier <= maxTier).map((c) => c.id);

  // ── Handlers: each one is a single server-validated action ──

  const handlePlant = (plotId: string, cropId: string) => { void act({ action: "plant", plotId, cropId }); };
  const handleHarvest = (plotId: string) => { void act({ action: "harvest", plotId }); };
  const handleHarvestAll = () => { void act({ action: "harvestAll", propertyId: selectedPropId }); };
  const handleReplantAll = () => { void act({ action: "replantAll", propertyId: selectedPropId }); };
  const handleSell = (cropId: string, tier: number, amount: number) => {
    if (amount <= 0) return;
    void act({ action: "sell", cropId, tier, amount });
  };
  const handleBuyProperty = (propertyId: string) => {
    void act({ action: "buyProperty", propertyId }).then((ok) => { if (ok) setSelectedPropId(propertyId); });
  };
  const handleHireStaff = (role: StaffRole, skillLevel: number) => { void act({ action: "hireStaff", role, skillLevel }); };
  const handleFireStaff = (staffId: string) => { void act({ action: "fireStaff", staffId }); };
  const handleAssignStaff = (staffId: string, propertyId: string | null) => {
    void act({ action: "assignStaff", staffId, propertyId });
  };
  const handleUnlockTech = (techId: string) => { void act({ action: "unlockTech", techId }); };
  const handleUpgradeEquipment = (propertyId: string, equipmentId: string) => {
    void act({ action: "upgradeEquipment", propertyId, equipmentId });
  };

  return (
    <div className="space-y-4">
      {/* Welcome Back Modal */}
      {offlineReport && (
        <WelcomeBackModal report={offlineReport} onClose={() => setOfflineReport(null)} />
      )}

      {/* Save failures are shown, never swallowed */}
      {actionError && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-2.5 text-[11px] text-red-300">
          <span className="flex-1">{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/70 hover:text-red-200" aria-label="Dismiss error">✕</button>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-amber-400 font-mono font-bold">{credits.toLocaleString()}</span>
          <span className="text-slate-500">Credits</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-purple-400 font-mono font-bold">{state.researchPoints}</span>
          <span className="text-slate-500">RP</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span>{season.icon}</span>
          <span className="text-slate-400">{season.name}</span>
        </div>
        {pendingActions > 0 && (
          <span className="text-[10px] text-slate-500" aria-live="polite">Saving…</span>
        )}
        <div className="ml-auto flex gap-1.5">
          {(["market", "staff", "tech"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPanel(panel === p ? "none" : p)}
              className={`rounded px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                panel === p ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
              aria-label={`Toggle ${p} panel`}
            >
              {p === "market" ? "📈 Market" : p === "staff" ? "👥 Staff" : "🔬 Tech"}
            </button>
          ))}
        </div>
      </div>

      {/* Side Panels */}
      {panel === "market" && (
        <MarketPanel state={state} credits={credits} onSell={handleSell} onClose={() => setPanel("none")} />
      )}
      {panel === "staff" && (
        <StaffPanel
          state={state}
          credits={credits}
          onHire={handleHireStaff}
          onFire={handleFireStaff}
          onAssign={handleAssignStaff}
          onClose={() => setPanel("none")}
        />
      )}
      {panel === "tech" && (
        <TechTreePanel state={state} onUnlock={handleUnlockTech} onClose={() => setPanel("none")} />
      )}

      {/* Property Selector */}
      <PropertySelector
        owned={state.properties}
        selectedId={selectedPropId}
        credits={credits}
        onSelect={setSelectedPropId}
        onBuy={handleBuyProperty}
      />

      {/* Plot Grid */}
      {selectedProp && (
        <>
          <PlotGrid
            property={selectedProp}
            state={state}
            now={now}
            unlockedCrops={unlockedCrops}
            onPlant={handlePlant}
            onHarvest={handleHarvest}
            onHarvestAll={handleHarvestAll}
            onReplantAll={handleReplantAll}
          />
          <EquipmentPanel
            property={selectedProp}
            credits={credits}
            onUpgrade={handleUpgradeEquipment}
          />
        </>
      )}

      {/* Inventory & Activity */}
      <InventoryStrip inventory={state.inventory} techUnlocked={state.techUnlocked} />
      <ActivityLog log={state.eventLog} />
    </div>
  );
}
