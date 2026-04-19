import { authOptions } from "@/auth";
import { SettingsClient } from "@/components/game/settings-client";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { walletAddress: true },
  });

  const pilotAny = pilot as Record<string, unknown>;
  let customQuicklinks: { href: string; label: string }[] = [];
  try {
    customQuicklinks = JSON.parse((pilotAny.customQuicklinks as string) ?? "[]");
  } catch {
    customQuicklinks = [];
  }

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Settings</span>
          </div>

          {/* Page heading */}
          <PixelBanner scene="station" title="Settings" subtitle="Customize your Bureau 21 interface theme and navigation quicklinks." />

          <SettingsClient
            currentTheme={(pilotAny.theme as string) ?? "original"}
            currentQuicklinks={customQuicklinks}
            currentCallsign={pilot.callsign}
            walletAddress={user?.walletAddress ?? null}
          />
        </div>
      </main>
    </>
  );
}
