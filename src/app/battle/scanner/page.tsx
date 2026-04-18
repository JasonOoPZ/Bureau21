import { authOptions } from "@/auth";
import { ScannerClient } from "@/components/game/scanner-client";
import { TopBar } from "@/components/layout/top-bar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ScannerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const syndicates = await prisma.syndicate.findMany({
    select: { id: true, name: true, tag: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/battle" className="text-[11px] text-slate-500 hover:text-cyan-300">← Combat Arena</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-red-400">Pilot Scanner</span>
          </div>

          {/* ── Scanner Banner ── */}
          <div className="relative overflow-hidden rounded-xl border border-emerald-900/40 bg-gradient-to-r from-[#080f08] via-[#0a110a] to-[#080f08]">
            <div className="absolute inset-0 opacity-[0.06]" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(52,211,153,0.08) 8px, rgba(52,211,153,0.08) 9px)" }} />
            <div className="relative flex items-center gap-4 p-5">
              {/* Radar Sweep SVG */}
              <div className="shrink-0">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                  <circle cx="24" cy="24" r="20" stroke="#34d399" strokeWidth="0.5" opacity="0.3" />
                  <circle cx="24" cy="24" r="14" stroke="#34d399" strokeWidth="0.5" opacity="0.3" />
                  <circle cx="24" cy="24" r="8" stroke="#34d399" strokeWidth="0.5" opacity="0.4" />
                  <circle cx="24" cy="24" r="2" fill="#34d399" opacity="0.8" />
                  <line x1="24" y1="24" x2="24" y2="4" stroke="#34d399" strokeWidth="1" opacity="0.6" />
                  <path d="M24 24 L36 8" stroke="#10b981" strokeWidth="1.5" opacity="0.5" />
                  <path d="M24 4 A20 20 0 0 1 36 8" fill="rgba(52,211,153,0.15)" stroke="none" />
                  <circle cx="18" cy="14" r="1.5" fill="#34d399" opacity="0.7" />
                  <circle cx="32" cy="20" r="1" fill="#6ee7b7" opacity="0.5" />
                  <circle cx="14" cy="28" r="1" fill="#6ee7b7" opacity="0.4" />
                  <circle cx="34" cy="32" r="1.2" fill="#34d399" opacity="0.6" />
                  <line x1="4" y1="24" x2="44" y2="24" stroke="#34d399" strokeWidth="0.3" opacity="0.2" />
                  <line x1="24" y1="4" x2="24" y2="44" stroke="#34d399" strokeWidth="0.3" opacity="0.2" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-wider text-emerald-300">Pilot Scanner</h1>
                <p className="text-[11px] text-slate-500">Long-Range Pilot Detection & Analysis Array</p>
              </div>
              <div className="ml-auto hidden sm:block text-right">
                <div className="text-[10px] uppercase tracking-widest text-slate-600">Mode</div>
                <div className="text-sm font-bold text-emerald-400">Scanning</div>
              </div>
            </div>
          </div>

          <ScannerClient syndicates={syndicates} />
        </div>
      </main>
    </>
  );
}
