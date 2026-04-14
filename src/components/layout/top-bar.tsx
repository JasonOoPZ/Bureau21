import { SignOutButton } from "@/components/auth/sign-out-button";
import { topNavLinks } from "@/lib/navigation";
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

export async function TopBar({ session }: TopBarProps) {
  const isAdmin = session.user.role === "admin";

  let customQuicklinks: QuickLink[] = [];
  try {
    const pilot = await prisma.pilotState.findUnique({
      where: { userId: session.user.id },
    });
    const raw = (pilot as Record<string, unknown> | null)?.customQuicklinks;
    if (typeof raw === "string" && raw !== "[]") {
      customQuicklinks = JSON.parse(raw);
    }
  } catch {
    /* ignore */
  }

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
          <div className="hidden text-right sm:block">
            <p className="truncate text-[11px] text-slate-300">{session.user.name ?? session.user.email}</p>
            <p className={`text-[10px] uppercase tracking-wider ${isAdmin ? "text-amber-300" : "text-cyan-400"}`}>
              {session.user.role}
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
