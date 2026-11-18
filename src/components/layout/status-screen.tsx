import type { ReactNode } from "react";

type StatusTone = "alert" | "warn" | "info";

interface StatusScreenProps {
  /** Short station-console code shown above the title, e.g. "SIGNAL LOST". */
  code: string;
  title: string;
  tone?: StatusTone;
  children: ReactNode;
  actions?: ReactNode;
}

const TONE_STYLES: Record<StatusTone, { text: string; border: string; dot: string }> = {
  alert: { text: "text-red-300", border: "border-red-900/60", dot: "bg-red-400" },
  warn: { text: "text-amber-300", border: "border-amber-900/60", dot: "bg-amber-400" },
  info: { text: "text-cyan-300", border: "border-cyan-900/60", dot: "bg-cyan-400" },
};

export const statusActionClass =
  "rounded border border-cyan-800/70 bg-cyan-950/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200 transition-colors hover:border-cyan-500 hover:bg-cyan-900/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 active:bg-cyan-900/60";

export const statusSecondaryActionClass =
  "rounded border border-slate-700 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400";

/** Full-page console panel shared by the error, not-found, and loading screens. */
export function StatusScreen({ code, title, tone = "info", children, actions }: StatusScreenProps) {
  const style = TONE_STYLES[tone];

  return (
    <main className="t-main-bg flex min-h-screen items-center justify-center bg-black px-3 py-10">
      <section
        aria-labelledby="status-title"
        className={`t-panel-alt w-full max-w-md rounded-md border bg-[#0a0d11] ${style.border}`}
      >
        <header className="t-border flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full motion-safe:animate-pulse ${style.dot}`} />
          <span className={`font-display text-[10px] uppercase tracking-[0.28em] ${style.text}`}>{code}</span>
          <span className="t-text-faint ml-auto text-[10px] uppercase tracking-[0.2em] text-slate-600">Bureau 21</span>
        </header>
        <div className="space-y-4 px-4 py-6">
          <h1 id="status-title" className="t-text font-display text-lg uppercase tracking-[0.14em] text-slate-100">
            {title}
          </h1>
          <div className="t-text-muted space-y-2 text-[13px] leading-relaxed text-slate-400">{children}</div>
          {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
        </div>
      </section>
    </main>
  );
}
