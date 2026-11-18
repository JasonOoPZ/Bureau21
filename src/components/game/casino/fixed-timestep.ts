/**
 * Fixed-timestep accumulator. Game physics advance in whole steps of
 * `stepMs`, however often the display refreshes, so a 60, 120 or 144 Hz
 * screen simulates exactly the same thing.
 */
export interface FixedTimestep {
  /**
   * Feeds the current clock reading (performance.now()). Returns how many
   * physics steps to run and `alpha`, the 0..1 progress into the next step
   * (used to interpolate rendering).
   */
  advance: (nowMs: number) => { steps: number; alpha: number };
  reset: (nowMs: number) => void;
}

export function createFixedTimestep(stepMs: number, maxStepsPerFrame: number): FixedTimestep {
  let last = 0;
  let accumulator = 0;
  let started = false;

  return {
    reset(nowMs) {
      last = nowMs;
      accumulator = 0;
      started = true;
    },
    advance(nowMs) {
      if (!started) {
        last = nowMs;
        started = true;
      }
      const elapsed = Math.max(0, nowMs - last);
      last = Math.max(last, nowMs);
      // A long gap (background tab, debugger) must not fast-forward the run.
      accumulator = Math.min(accumulator + elapsed, stepMs * maxStepsPerFrame);
      // Epsilon absorbs float drift so sub-step frames still add up to a step.
      const steps = Math.floor((accumulator + 1e-6) / stepMs);
      accumulator = Math.max(0, accumulator - steps * stepMs);
      return { steps, alpha: accumulator / stepMs };
    },
  };
}
