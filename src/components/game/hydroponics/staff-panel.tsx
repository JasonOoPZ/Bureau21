"use client";

import { STAFF_ROLES, STAFF_UNLOCK_TIER, PROPERTIES, STAFF_MAX_SKILL, type StaffRole } from "@/lib/hydroponics/config";
import type { StaffMember, OwnedProperty, HydroponicsGameState } from "@/lib/hydroponics/types";
import { generateStaffName, getHireCost, getMaxStaff, calcWagePerHour, getTechEffect } from "@/lib/hydroponics/engine";
import { useState } from "react";

interface Props {
  state: HydroponicsGameState;
  credits: number;
  onHire: (role: StaffRole, skillLevel: number) => void;
  onFire: (staffId: string) => void;
  onAssign: (staffId: string, propertyId: string | null) => void;
  onClose: () => void;
}

export function StaffPanel({ state, credits, onHire, onFire, onAssign, onClose }: Props) {
  const [hireRole, setHireRole] = useState<StaffRole>("gardener");
  const [hireSkill, setHireSkill] = useState(1);
  const maxStaff = getMaxStaff(state.properties);
  const maxTier = state.properties.reduce((m, p) => {
    const d = PROPERTIES.find((x) => x.id === p.id);
    return Math.max(m, d?.tier ?? 0);
  }, 0);
  const canHire = maxTier >= STAFF_UNLOCK_TIER && state.staff.length < maxStaff;
  const hireCost = getHireCost(hireSkill);
  const wageDiscount = getTechEffect(state.techUnlocked, "wageDiscount");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-cyan-300">Staff Management</h3>
          <p className="text-[9px] text-slate-500">
            {state.staff.length}/{maxStaff} staff · Unlock hiring at Tier {STAFF_UNLOCK_TIER}
          </p>
        </div>
        <button onClick={onClose} className="text-[10px] text-slate-500 hover:text-white" aria-label="Close staff panel">✕</button>
      </div>

      {/* Hire Section */}
      {canHire && (
        <div className="rounded-lg border border-cyan-900/40 bg-cyan-950/10 p-3 space-y-2">
          <p className="text-[10px] font-semibold text-cyan-200">Hire New Staff</p>
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="text-[8px] text-slate-500 block">Role</label>
              <select
                value={hireRole}
                onChange={(e) => setHireRole(e.target.value as StaffRole)}
                className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] text-white"
                aria-label="Staff role"
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r.role} value={r.role}>{r.icon} {r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-500 block">Skill (1-{STAFF_MAX_SKILL})</label>
              <input
                type="number"
                min={1}
                max={STAFF_MAX_SKILL}
                value={hireSkill}
                onChange={(e) => setHireSkill(Math.min(STAFF_MAX_SKILL, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-14 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] text-white text-center"
                aria-label="Skill level"
              />
            </div>
            <div className="text-[9px] text-slate-400">
              Cost: <span className="text-amber-400 font-mono">{hireCost.toLocaleString()} cr</span>
            </div>
            <button
              onClick={() => onHire(hireRole, hireSkill)}
              disabled={credits < hireCost}
              className="rounded bg-cyan-700/70 px-3 py-1 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-600/70 disabled:opacity-30 transition-colors"
              aria-label="Hire staff member"
            >
              Hire
            </button>
          </div>
          <p className="text-[8px] text-slate-600">
            {STAFF_ROLES.find((r) => r.role === hireRole)?.description}
          </p>
        </div>
      )}

      {maxTier < STAFF_UNLOCK_TIER && (
        <div className="rounded border border-slate-800 bg-[#0a0d11] p-3 text-[10px] text-slate-500 text-center">
          Own a Tier {STAFF_UNLOCK_TIER} property to unlock staff hiring.
        </div>
      )}

      {/* Current Staff */}
      {state.staff.length === 0 ? (
        <p className="text-[10px] text-slate-600 text-center py-4">No staff hired yet.</p>
      ) : (
        <div className="space-y-2">
          {state.staff.map((s) => {
            const roleDef = STAFF_ROLES.find((r) => r.role === s.role);
            const assignedProp = s.assignedPropertyId
              ? PROPERTIES.find((p) => p.id === s.assignedPropertyId)
              : null;
            const wage = calcWagePerHour(s, wageDiscount);

            return (
              <div key={s.id} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0a0d11] p-2.5">
                <span className="text-lg">{roleDef?.icon ?? "👤"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-slate-200 truncate">{s.name}</p>
                  <p className="text-[8px] text-slate-500">
                    {roleDef?.label} · Skill {s.skillLevel} · {wage} cr/hr
                  </p>
                </div>
                <select
                  value={s.assignedPropertyId ?? ""}
                  onChange={(e) => onAssign(s.id, e.target.value || null)}
                  className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[9px] text-white max-w-[100px]"
                  aria-label={`Assign ${s.name} to property`}
                >
                  <option value="">Unassigned</option>
                  {state.properties.map((p) => {
                    const pDef = PROPERTIES.find((x) => x.id === p.id);
                    return <option key={p.id} value={p.id}>{pDef?.name ?? p.id}</option>;
                  })}
                </select>
                <button
                  onClick={() => onFire(s.id)}
                  className="text-[9px] text-red-500/60 hover:text-red-400 transition-colors"
                  aria-label={`Fire ${s.name}`}
                >
                  Fire
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Wage Summary */}
      {state.staff.length > 0 && (
        <div className="rounded border border-slate-800 bg-[#080a0d] p-2 text-[9px] text-slate-500">
          Total wages: <span className="text-amber-400 font-mono">
            {state.staff.reduce((s, st) => s + calcWagePerHour(st, wageDiscount), 0)} cr/hr
          </span>
          {wageDiscount > 0 && <span className="text-emerald-500 ml-1">(–{Math.round(wageDiscount * 100)}% discount)</span>}
        </div>
      )}
    </div>
  );
}
