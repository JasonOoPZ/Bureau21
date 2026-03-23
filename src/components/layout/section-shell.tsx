import { TopBar } from "@/components/layout/top-bar";
import type { Session } from "next-auth";
import Link from "next/link";

interface SectionShellProps {
  session: Session;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  backLabel?: string;
  backHref?: string;
}

export function SectionShell({
  session,
  eyebrow,
  title,
  description,
  bullets,
  backLabel = "Return to House",
  backHref = "/house",
}: SectionShellProps) {
  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4 sm:px-4">
        <div className="mx-auto max-w-5xl rounded-md border border-slate-800 bg-[#0a0d11] p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">{eyebrow}</p>
          <h1 className="font-display mt-2 text-3xl uppercase text-slate-100">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">{description}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-[1.4fr_0.8fr]">
            <section className="rounded-md border border-slate-800 bg-[#0d1218] p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Mapped Next</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {bullets.map((bullet) => (
                  <li key={bullet} className="border-b border-slate-900 pb-2 last:border-b-0 last:pb-0">
                    {bullet}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-md border border-slate-800 bg-[#0d1218] p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Status</p>
              <p className="mt-3 text-sm text-cyan-200">
                This section is now mapped to the Bureau21 navigation plan and can be implemented incrementally.
              </p>
              <Link
                href={backHref}
                className="mt-5 inline-flex rounded border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200 transition hover:border-cyan-400 hover:text-cyan-100"
              >
                {backLabel}
              </Link>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
