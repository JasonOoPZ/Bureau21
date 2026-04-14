import { SignOutButton } from "@/components/auth/sign-out-button";
import { StarterCharacterPortrait } from "@/components/game/starter-character-portrait";
import { topNavLinks } from "@/lib/navigation";
import { GAME_CONSTANTS, xpForLevel, getConfidenceCap } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import Link from "next/link";

interface TopBarProps {
  session: Session;
}

interface QuickLink {
  href: string;
  label: string;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-[5px] w-full rounded-full bg-slate-800">
      <div
        className={`h-[5px] rounded-full ${color} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export async function TopBar({ session }: TopBarProps) {
  const isAdmin = session.user.role === "admin";

  const pilot = await prisma.pilotState.findUnique({
    where: { userId: session.user.id },
  });

  let customQuicklinks: QuickLink[] = [];
  try {
    const raw = (pilot as Record<string, unknown> | null)?.customQuicklinks;
    if (typeof raw === "string" && raw !== "[]") {
      customQuicklinks = JSON.parse(raw);
    }
  } catch {
    /* ignore */
  }

  const maxXp = pilot ? xpForLevel(pilot.level) : 100;
  const maxLF = pilot ? Math.max(GAME_CONSTANTS.STARTING_LIFE_FORCE, pilot.level * 5) : 15;
  const confCap = pilot ? getConfidenceCap(pilot.characterSlug) : GAME_CONSTANTS.CONFIDENCE_CAP;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-black/90 px-4 py-2 backdrop-blur sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/lobby" className="font-display shrink-0 text-sm uppercase tracking-[0.22em] text-cyan-300">
            Bureau 21 Grid
          </Link>
          <nav className="hidden items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300 lg:flex">
            {topNavLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition hover:text-cyan-300">
                {link.label}
              </Link>
            ))}
            {customQuicklinks.length > 0 && (
              <>
                <span className="text-slate-700">|</span>
                {customQuicklinks.map((link, i) => (
                  <Link
                    key={`ql-${i}`}
                    href={link.href}
                    className="text-amber-400 transition hover:text-amber-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
            {isAdmin ? (
              <Link href="/admin" className="text-amber-300 transition hover:text-amber-200">
                Admin
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {pilot && (
            <Link href="/house" className="flex items-center gap-2.5">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-700 bg-slate-900">
                <StarterCharacterPortrait slug={pilot.characterSlug} size="sm" />
              </div>
              <div className="hidden w-28 space-y-1 sm:block">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] uppercase tracking-wider text-emerald-500">LF</span>
                  <span className="text-[8px] text-slate-500">{pilot.lifeForce}/{maxLF}</span>
                </div>
                <MiniBar value={pilot.lifeForce} max={maxLF} color="bg-emerald-500" />

                <div className="flex items-center justify-between">
                  <span className="text-[8px] uppercase tracking-wider text-cyan-500">EXP</span>
                  <span className="text-[8px] text-slate-500">{pilot.xp}/{maxXp}</span>
                </div>
                <MiniBar value={pilot.xp} max={maxXp} color="bg-cyan-500" />

                <div className="flex items-center justify-between">
                  <span className="text-[8px] uppercase tracking-wider text-purple-400">CONF</span>
                  <span className="text-[8px] text-slate-500">{pilot.confidence}/{confCap}</span>
                </div>
                <MiniBar value={pilot.confidence} max={confCap} color="bg-purple-500" />

                <div className="flex items-center justify-between">
                  <span className="text-[8px] uppercase tracking-wider text-amber-500">MOT</span>
                  <span className="text-[8px] text-slate-500">{pilot.motivation}/{GAME_CONSTANTS.MOTIVATION_CAP_FREE}</span>
                </div>
                <MiniBar value={pilot.motivation} max={GAME_CONSTANTS.MOTIVATION_CAP_FREE} color="bg-amber-500" />
              </div>
            </Link>
          )}
          <div className="hidden text-right sm:block">
            <p className="truncate text-[11px] text-slate-300">{pilot?.callsign ?? session.user.name ?? session.user.email}</p>
            <p className={`text-[10px] uppercase tracking-wider ${isAdmin ? "text-amber-300" : "text-cyan-400"}`}>
              Lv.{pilot?.level ?? 1} · {session.user.role}
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
