import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { HERO_TEMPLATES, PACK_FREE_COOLDOWN_HOURS } from "@/lib/hero-data";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import HeroesClient from "@/components/game/heroes-client";
import { PixelBanner } from "@/components/layout/pixel-banner";

export default async function HeroesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const heroRecords = await prisma.playerHero.findMany({
    where: { pilotId: pilot.id },
    orderBy: [{ active: "desc" }, { level: "desc" }, { createdAt: "asc" }],
  });

  const heroes = heroRecords.map((h) => ({
    ...h,
    createdAt: h.createdAt.toISOString(),
    template: HERO_TEMPLATES.find((t) => t.slug === h.heroSlug) ?? null,
  }));

  const cooldownMs = PACK_FREE_COOLDOWN_HOURS * 60 * 60 * 1000;
  const lastAt = pilot.lastPackAt?.getTime() ?? 0;
  const now = new Date().getTime();
  const elapsed = now - lastAt;
  const freePackAvailable = elapsed >= cooldownMs;
  const freePackCooldownMs = freePackAvailable ? 0 : cooldownMs - elapsed;

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-[#0a0d11] text-white">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-2">
          <PixelBanner scene="heroes" title="Battle Support Corps" subtitle="AI souls bonded to combat hulls. Active mechas boost your stats every time you fight." />

        <HeroesClient
          initialHeroes={heroes}
          pilotCredits={pilot.credits}
          freePackAvailable={freePackAvailable}
          freePackCooldownMs={freePackCooldownMs}
        />
        </div>
      </main>
    </>
  );
}
