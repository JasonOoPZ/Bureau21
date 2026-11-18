import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

// economy.ts and callsign.ts reach the Prisma client at module load. Only pure
// helpers are exercised here, so a stub is enough.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { callsignFields, callsignKey, isCallsignConflict } from "@/lib/callsign";
import { EconomyError, economyErrorResponse, isCheckViolation } from "@/lib/economy";
import { applyPassiveRegeneration, displayMaxLifeForce, maxLifeForce, pvpMinLifeForce } from "@/lib/vitals";

function knownError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError("failed", { code, clientVersion: "test", meta });
}

describe("callsign key", () => {
  it("ignores case, outer spaces and repeated inner spaces", () => {
    // Arrange
    const variants = ["Nova 21", "  nova 21 ", "NOVA   21"];

    // Act
    const keys = variants.map(callsignKey);

    // Assert
    expect(new Set(keys)).toEqual(new Set(["nova 21"]));
  });

  it("writes the display name and its unique key together", () => {
    expect(callsignFields("Vega Prime")).toEqual({ callsign: "Vega Prime", callsignLower: "vega prime" });
  });

  it("recognises a unique-index failure on callsignLower only", () => {
    expect(isCallsignConflict(knownError("P2002", { target: ["callsignLower"] }))).toBe(true);
    expect(isCallsignConflict(knownError("P2002", { target: "PilotState_callsignLower_key" }))).toBe(true);
    expect(isCallsignConflict(knownError("P2002", { target: ["userId"] }))).toBe(false);
    expect(isCallsignConflict(knownError("P2025"))).toBe(false);
    expect(isCallsignConflict(new Error("callsignLower"))).toBe(false);
  });
});

describe("Life Force maximum with allocated points", () => {
  it("adds bonusLifeForce to the level-based maximum", () => {
    expect(maxLifeForce({ level: 1 })).toBe(15);
    expect(maxLifeForce({ level: 1, bonusLifeForce: 6 })).toBe(21);
    expect(maxLifeForce({ level: 10, bonusLifeForce: 6 })).toBe(56);
  });

  it("never lets a negative bonus lower the maximum", () => {
    expect(maxLifeForce({ level: 4, bonusLifeForce: -50 })).toBe(20);
  });

  it("regenerates up to the allocated maximum, not the level-based one", () => {
    // Arrange: 21 max (15 + 6 allocated), badly hurt, three hours ago
    const now = new Date("2026-01-01T03:00:00Z");
    const state = {
      fuel: 10,
      hull: 100,
      lifeForce: 3,
      level: 1,
      bonusLifeForce: 6,
      lastFuelRegen: new Date("2026-01-01T00:00:00Z"),
    };

    // Act
    const result = applyPassiveRegeneration(state, now);

    // Assert
    expect(result.lifeForce).toBe(21);
  });

  it("uses the allocated maximum for display and the PvP minimum", () => {
    expect(displayMaxLifeForce({ level: 1, bonusLifeForce: 6, lifeForce: 4 })).toBe(21);
    // 20% of 115 = 23
    expect(pvpMinLifeForce({ level: 3, bonusLifeForce: 100 })).toBe(23);
  });
});

describe("balance CHECK violations", () => {
  it("detects Prisma P2004", () => {
    expect(isCheckViolation(knownError("P2004"))).toBe(true);
  });

  it("detects a raw-query failure carrying SQLSTATE 23514", () => {
    expect(isCheckViolation(knownError("P2010", { code: "23514", message: "check" }))).toBe(true);
  });

  it("detects an unknown request error by its Postgres message", () => {
    const error = new Prisma.PrismaClientUnknownRequestError(
      'new row for relation "PilotState" violates check constraint "PilotState_credits_nonneg"',
      { clientVersion: "test" }
    );
    expect(isCheckViolation(error)).toBe(true);
  });

  it("detects a driver error with the SQLSTATE as its code", () => {
    expect(isCheckViolation(Object.assign(new Error("db error"), { code: "23514" }))).toBe(true);
  });

  it("ignores other errors", () => {
    expect(isCheckViolation(knownError("P2002", { target: ["userId"] }))).toBe(false);
    expect(isCheckViolation(new Error("boom"))).toBe(false);
    expect(isCheckViolation("23514")).toBe(false);
  });

  it("answers a CHECK violation with 400, not 500", async () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    // Act
    const response = economyErrorResponse(knownError("P2004"));

    // Assert
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/below zero/);
  });

  it("keeps the existing mappings and rethrows unknown errors", () => {
    expect(economyErrorResponse(new EconomyError("No.", 409)).status).toBe(409);
    expect(economyErrorResponse(knownError("P2034")).status).toBe(503);
    expect(() => economyErrorResponse(new Error("boom"))).toThrow("boom");
  });
});
