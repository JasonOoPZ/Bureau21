"use client";

import { useCallback, useEffect, useState } from "react";

const CREDITS_BUMP_MS = 400;

/**
 * Drives the short "credits changed" pulse shared by the casino games.
 * Returns the flag for the `animate-credits-bump` class and a trigger.
 */
export function useCreditsBump(): [boolean, () => void] {
  const [creditsBump, setCreditsBump] = useState(false);

  useEffect(() => {
    if (!creditsBump) return;
    const t = setTimeout(() => setCreditsBump(false), CREDITS_BUMP_MS);
    return () => clearTimeout(t);
  }, [creditsBump]);

  const bumpCredits = useCallback(() => setCreditsBump(true), []);
  return [creditsBump, bumpCredits];
}
