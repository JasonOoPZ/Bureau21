"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StatusScreen, statusActionClass, statusSecondaryActionClass } from "@/components/layout/status-screen";

interface ErrorPageProps {
  error: Error & { digest?: string };
  /** Re-fetches and re-renders the failed segment (Next.js 16.3+). */
  retry?: () => void;
  /** Older recovery prop: re-renders without re-fetching. Used as a fallback. */
  reset?: () => void;
}

export default function ErrorPage({ error, retry, reset }: ErrorPageProps) {
  useEffect(() => {
    // Surface the failure in the browser console and any attached error reporter.
    console.error(error);
  }, [error]);

  const recover = retry ?? reset;

  return (
    <StatusScreen
      code="System Fault"
      title="Something broke on our end"
      tone="alert"
      actions={
        <>
          {recover ? (
            <button type="button" onClick={() => recover()} className={statusActionClass}>
              Try again
            </button>
          ) : null}
          <Link href="/lobby" className={statusSecondaryActionClass}>
            Back to lobby
          </Link>
        </>
      }
    >
      <p>The station hit an unexpected fault while loading this deck. Your pilot and credits are safe.</p>
      <p>Try again in a moment. If it keeps happening, head back to the lobby.</p>
      {error.digest ? (
        <p className="t-text-faint font-mono text-[11px] text-slate-600">Fault reference: {error.digest}</p>
      ) : null}
    </StatusScreen>
  );
}
