import { describe, expect, test } from "vitest";
import { createFixedTimestep } from "./fixed-timestep";

const STEP_MS = 1000 / 60;

function stepsOverOneSecond(refreshHz: number): number {
  const clock = createFixedTimestep(STEP_MS, 5);
  clock.reset(0);
  let total = 0;
  for (let frame = 1; frame <= refreshHz; frame++) {
    total += clock.advance((frame * 1000) / refreshHz).steps;
  }
  return total;
}

describe("createFixedTimestep", () => {
  test.each([30, 60, 120, 144, 240])("runs 60 physics steps per second at %i Hz", (hz) => {
    expect(stepsOverOneSecond(hz)).toBe(60);
  });

  test("caps the catch-up after a long pause instead of fast-forwarding", () => {
    const clock = createFixedTimestep(STEP_MS, 5);
    clock.reset(0);
    expect(clock.advance(10_000).steps).toBe(5);
  });

  test("reports interpolation progress between steps", () => {
    const clock = createFixedTimestep(10, 5);
    clock.reset(0);
    const { steps, alpha } = clock.advance(25);
    expect(steps).toBe(2);
    expect(alpha).toBeCloseTo(0.5);
  });

  test("ignores a clock that goes backwards", () => {
    const clock = createFixedTimestep(10, 5);
    clock.reset(100);
    expect(clock.advance(50)).toEqual({ steps: 0, alpha: 0 });
  });
});
