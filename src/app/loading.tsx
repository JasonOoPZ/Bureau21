import { StatusScreen } from "@/components/layout/status-screen";

const SIGNAL_BAR_DELAYS_MS = [0, 150, 300, 450];

export default function Loading() {
  return (
    <StatusScreen code="Uplink" title="Docking" tone="info">
      <div role="status" aria-live="polite" className="space-y-3">
        <p>Syncing station data...</p>
        <div aria-hidden="true" className="flex h-5 items-end gap-1">
          {SIGNAL_BAR_DELAYS_MS.map((delayMs) => (
            <span
              key={delayMs}
              className="h-full w-1.5 origin-bottom rounded-sm bg-cyan-400/70 motion-safe:animate-pulse"
              style={{ animationDelay: `${delayMs}ms` }}
            />
          ))}
        </div>
      </div>
    </StatusScreen>
  );
}
