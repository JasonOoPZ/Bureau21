"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CROPS, PROPERTIES, SAVE_INTERVAL_MS, TECH_TREE } from "@/lib/hydroponics/config";
import type { HydroponicsGameState, StaffMember } from "@/lib/hydroponics/types";
import type { StaffRole } from "@/lib/hydroponics/config";
import type { OfflineReport } from "@/lib/hydroponics/engine";
import {
  plantCrop, harvestPlot, buyProperty, getCurrentSeason,
  inventoryKey, inventoryTotal, getInventoryCap, getSellPrice,
  uid, generateStaffName, getHireCost, getTechEffect,
  getEquipmentCost, getEquipmentEffect, canUnlockTech,
} from "@/lib/hydroponics/engine";

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

export function HydroponicsOrchestrator() {
  const [state, setState] = useState<HydroponicsGameState | null>(null);
  const [credits, setCredits] = useState(0);
  const [selectedPropId, setSelectedPropId] = useState("p1");
  const [panel, setPanel] = useState<Panel>("none");
  const [offlineReport, setOfflineReport] = useState<OfflineReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const dirtyRef = useRef(false);
  const stateRef = useRef<HydroponicsGameState | null>(null);

  // Keep stateRef in sync
  useEffect(() => { stateRef.current = state; }, [state]);

  // Load initial state
  useEffect(() => {
    fetch("/api/game/hydroponics")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setState(data.state);
        setCredits(data.credits);
        if (data.offline) setOfflineReport(data.offline);
        if (data.state.properties.length > 0) setSelectedPropId(data.state.properties[0].id);
      })
      .catch(() => setError("Failed to load hydroponics."))
      .finally(() => setLoading(false));
  }, []);

  // Tick timer for live countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-save
  useEffect(() => {
    const id = setInterval(() => {
      if (dirtyRef.current && stateRef.current) {
        dirtyRef.current = false;
        save(stateRef.current, "save", 0);
      }
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const save = useCallback(async (s: HydroponicsGameState, action: "save" | "spend" | "earn", creditsDelta: number) => {
    const updated = { ...s, lastSave: Date.now(), lastOnline: Date.now() };
    try {
      const res = await fetch("/api/game/hydroponics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, gameState: updated, creditsDelta }),
      });
      const data = await res.json();
      if (data.credits !== undefined) setCredits(data.credits);
    } catch { /* swallow save errors */ }
  }, []);

  const markDirty = useCallback((s: HydroponicsGameState) => {
    setState(s);
    stateRef.current = s;
    dirtyRef.current = true;
  }, []);

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

  // ── Handlers ──

  function handlePlant(plotId: string, cropId: string) {
    if (!state) return;
    const prop = state.properties.find((p) => p.plots.some((pl) => pl.id === plotId));
    if (!prop) return;
    const plot = prop.plots.find((pl) => pl.id === plotId);
    if (!plot || plot.cropId) return;

    const { plot: newPlot, seedCost } = plantCrop(plot, cropId, state);
    if (credits < seedCost) return;

    const s = {
      ...state,
      properties: state.properties.map((p) =>
        p.id === prop.id
          ? { ...p, plots: p.plots.map((pl) => (pl.id === plotId ? newPlot : pl)) }
          : p
      ),
      eventLog: [...state.eventLog, { timestamp: Date.now(), icon: "🌱", message: `Planted ${CROPS.find((c) => c.id === cropId)?.name} in ${PROPERTIES.find((d) => d.id === prop.id)?.name}`, type: "info" as const }].slice(-20),
    };
    markDirty(s);
    save(s, "spend", -seedCost);
  }

  function handleHarvest(plotId: string) {
    if (!state) return;
    const prop = state.properties.find((p) => p.plots.some((pl) => pl.id === plotId));
    if (!prop) return;
    const plot = prop.plots.find((pl) => pl.id === plotId);
    if (!plot) return;

    const result = harvestPlot(plot, state, now);
    if (!result) return;

    const cap = getInventoryCap(state.techUnlocked);
    if (inventoryTotal(state.inventory) + result.amount > cap) return;

    const key = inventoryKey(result.cropId, result.qualityTier);
    const s = {
      ...state,
      properties: state.properties.map((p) =>
        p.id === prop.id
          ? { ...p, plots: p.plots.map((pl) => (pl.id === plotId ? { ...pl, harvested: true, cropId: null, plantedAt: null } : pl)) }
          : p
      ),
      inventory: { ...state.inventory, [key]: (state.inventory[key] ?? 0) + result.amount },
      researchPoints: state.researchPoints + result.rp,
      totalHarvests: state.totalHarvests + 1,
      totalCropsGrown: { ...state.totalCropsGrown, [result.cropId]: (state.totalCropsGrown[result.cropId] ?? 0) + result.amount },
      eventLog: [...state.eventLog, { timestamp: Date.now(), icon: "🌾", message: `Harvested ${result.amount}× ${CROPS.find((c) => c.id === result.cropId)?.name} (${["","Schwag","Standard","Premium","Boutique","Legendary"][result.qualityTier]})`, type: "harvest" as const }].slice(-20),
    };
    markDirty(s);
    save(s, "save", 0);
  }

  function handleHarvestAll() {
    if (!state || !selectedProp) return;
    selectedProp.plots.forEach((p) => {
      if (p.cropId && p.plantedAt && !p.harvested && now - p.plantedAt >= p.growthMs) {
        handleHarvest(p.id);
      }
    });
  }

  function handleReplantAll() {
    if (!state || !selectedProp) return;
    // Find the most recently planted crop on this property
    const lastCrop = selectedProp.plots.find((p) => p.cropId)?.cropId;
    if (!lastCrop) return;
    selectedProp.plots.forEach((p) => {
      if (!p.cropId) handlePlant(p.id, lastCrop);
    });
  }

  function handleSell(cropId: string, tier: number, amount: number) {
    if (!state || amount <= 0) return;
    const key = inventoryKey(cropId, tier);
    const have = state.inventory[key] ?? 0;
    if (have < amount) return;
    const unitPrice = getSellPrice(cropId, tier, state.marketPrices, state.activeEvents);
    const total = unitPrice * amount;

    const s = {
      ...state,
      inventory: { ...state.inventory, [key]: have - amount },
      totalCreditsEarned: state.totalCreditsEarned + total,
      eventLog: [...state.eventLog, { timestamp: Date.now(), icon: "💰", message: `Sold ${amount}× ${CROPS.find((c) => c.id === cropId)?.name} for ${total.toLocaleString()} cr`, type: "sale" as const }].slice(-20),
    };
    markDirty(s);
    save(s, "earn", total);
  }

  function handleBuyProperty(propId: string) {
    if (!state) return;
    const result = buyProperty(propId, state);
    if (!result) return;
    if (credits < result.cost) return;
    markDirty(result.state);
    save(result.state, "spend", -result.cost);
    setSelectedPropId(propId);
  }

  function handleHireStaff(role: StaffRole, skillLevel: number) {
    if (!state) return;
    const cost = getHireCost(skillLevel);
    if (credits < cost) return;
    const roleDef = { gardener: 5, harvester: 10, botanist: 20, security: 20 };
    const wageDiscount = getTechEffect(state.techUnlocked, "wageDiscount");
    const newStaff: StaffMember = {
      id: uid(),
      name: generateStaffName(),
      role,
      skillLevel,
      wagePerHour: Math.round(roleDef[role] * skillLevel * (1 - wageDiscount)),
      assignedPropertyId: null,
    };
    const s = {
      ...state,
      staff: [...state.staff, newStaff],
      eventLog: [...state.eventLog, { timestamp: Date.now(), icon: "👤", message: `Hired ${newStaff.name} as ${role}`, type: "staff" as const }].slice(-20),
    };
    markDirty(s);
    save(s, "spend", -cost);
  }

  function handleFireStaff(staffId: string) {
    if (!state) return;
    const staff = state.staff.find((s) => s.id === staffId);
    const s = {
      ...state,
      staff: state.staff.filter((s) => s.id !== staffId),
      eventLog: [...state.eventLog, { timestamp: Date.now(), icon: "👤", message: `Fired ${staff?.name ?? "staff"}`, type: "staff" as const }].slice(-20),
    };
    markDirty(s);
    save(s, "save", 0);
  }

  function handleAssignStaff(staffId: string, propertyId: string | null) {
    if (!state) return;
    const s = {
      ...state,
      staff: state.staff.map((st) => (st.id === staffId ? { ...st, assignedPropertyId: propertyId } : st)),
    };
    markDirty(s);
  }

  function handleUnlockTech(techId: string) {
    if (!state) return;
    if (!canUnlockTech(techId, state.techUnlocked, state.researchPoints)) return;
    const node = TECH_TREE.find((n) => n.id === techId);
    if (!node) return;
    const s = {
      ...state,
      techUnlocked: [...state.techUnlocked, techId],
      researchPoints: state.researchPoints - node.rpCost,
      eventLog: [...state.eventLog, { timestamp: Date.now(), icon: "🔬", message: `Researched ${node.name}`, type: "tech" as const }].slice(-20),
    };
    markDirty(s);
    save(s, "save", 0);
  }

  function handleUpgradeEquipment(propertyId: string, equipmentId: string) {
    if (!state) return;
    const prop = state.properties.find((p) => p.id === propertyId);
    if (!prop) return;
    const currentLevel = prop.equipment[equipmentId] ?? 0;
    const propDef = PROPERTIES.find((d) => d.id === propertyId);
    const cost = getEquipmentCost(equipmentId, currentLevel, propDef?.tier ?? 1);
    if (credits < cost) return;
    const s = {
      ...state,
      properties: state.properties.map((p) =>
        p.id === propertyId
          ? { ...p, equipment: { ...p.equipment, [equipmentId]: currentLevel + 1 } }
          : p
      ),
      eventLog: [...state.eventLog, { timestamp: Date.now(), icon: "🔧", message: `Upgraded equipment on ${propDef?.name}`, type: "purchase" as const }].slice(-20),
    };
    markDirty(s);
    save(s, "spend", -cost);
  }

  return (
    <div className="space-y-4">
      {/* Welcome Back Modal */}
      {offlineReport && (
        <WelcomeBackModal report={offlineReport} onClose={() => setOfflineReport(null)} />
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
