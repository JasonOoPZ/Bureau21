"use client";

import { useEffect, useState } from "react";

const DEFAULT_TICK_MS = 30_000;

/**
 * Current time for render-time maths, safe for hydration.
 *
 * The first render uses the timestamp the server rendered with (`serverNow`),
 * so server and client markup match. After mount it follows the browser clock.
 */
export function useNow(serverNow: number, tickMs: number = DEFAULT_TICK_MS): number {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    const sync = () => setNow(Date.now());
    const first = setTimeout(sync, 0);
    const interval = setInterval(sync, tickMs);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [tickMs]);

  return now;
}
