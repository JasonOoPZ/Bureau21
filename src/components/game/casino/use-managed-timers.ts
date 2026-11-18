"use client";

import { useEffect, useMemo, useRef } from "react";

type TimerId = ReturnType<typeof setTimeout>;

export interface ManagedTimers {
  /** setTimeout that is cancelled on unmount and never fires afterwards. */
  after: (fn: () => void, ms: number) => TimerId | null;
  /** setInterval that is cancelled on unmount. */
  every: (fn: () => void, ms: number) => TimerId | null;
  clear: (id: TimerId | null) => void;
  isMounted: () => boolean;
}

/**
 * Timers owned by a component. Everything scheduled through it is cleared on
 * unmount, including timers scheduled from inside other timers or after an
 * awaited fetch, so no callback sets state on an unmounted component.
 */
export function useManagedTimers(): ManagedTimers {
  const timeouts = useRef(new Set<TimerId>());
  const intervals = useRef(new Set<TimerId>());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const pendingTimeouts = timeouts.current;
    const pendingIntervals = intervals.current;
    return () => {
      mounted.current = false;
      pendingTimeouts.forEach((id) => clearTimeout(id));
      pendingIntervals.forEach((id) => clearInterval(id));
      pendingTimeouts.clear();
      pendingIntervals.clear();
    };
  }, []);

  return useMemo<ManagedTimers>(
    () => ({
      after(fn, ms) {
        if (!mounted.current) return null;
        const id = setTimeout(() => {
          timeouts.current.delete(id);
          fn();
        }, ms);
        timeouts.current.add(id);
        return id;
      },
      every(fn, ms) {
        if (!mounted.current) return null;
        const id = setInterval(fn, ms);
        intervals.current.add(id);
        return id;
      },
      clear(id) {
        if (id === null) return;
        clearTimeout(id);
        clearInterval(id);
        timeouts.current.delete(id);
        intervals.current.delete(id);
      },
      isMounted: () => mounted.current,
    }),
    []
  );
}
