import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { StarterCharacterPortrait } from "@/components/game/starter-character-portrait";
import { calculateATK, calculateDEF, xpForLevel, GAME_CONSTANTS, getConfidenceCap } from "@/lib/constants";
import { getStarterCharacter } from "@/lib/starter-characters";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";

export default async function PilotProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const { id } = await params;

  const pilot = await prisma.pilotState.findFirst({
    where: { userId: id },
    include: { inventory: true, user: { select: { role: true, createdAt: true } } },
  });

  if (!pilot) notFound();

  const character = getStarterCharacter(pilot.characterSlug);

  const equipped = pilot.inventory.filter((i) => i.equipped);
  const weaponItem = equipped.find((i) => i.type === "weapon");
  const shieldItem = equipped.find((i) => i.type === "shield");
  const engineItem = equipped.find((i) => i.type === "engine");

  const weaponBonus = weaponItem ? Math.floor(weaponItem.bonusAmt / 10) : 0;
  const shieldBonus = shieldItem ? Math.floor(shieldItem.bonusAmt / 2) : 0;
  const atk = calculateATK(pilot.strength, pilot.atkSplit, weaponBonus);
  const def = calculateDEF(pilot.strength, pilot.atkSplit, shieldBonus);
  const maxXp = xpForLevel(pilot.level);
  const maxLF = Math.max(GAME_CONSTANTS.STARTING_LIFE_FORCE, pilot.level * 5);

  const battleLogs = await prisma.battleLog.findMany({
    where: { pilotId: pilot.id },
    select: { result: true, xpGained: true },
  });
  const totalWins = battleLogs.filter((l) => l.result === "win").length;
  const totalLosses = battleLogs.filter((l) => l.result === "loss").length;
  const totalStalemates = battleLogs.filter((l) => l.result === "stalemate").length;

  const accountAgeDays = Math.floor(
    (Date.now() - new Date(pilot.user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const isOnline =
    (Date.now() - new Date(pilot.lastActionAt).getTime()) / 1000 < 300;

  const TIER_COLORS: Record<number, string> = {
    1: "text-slate-300",
    2: "text-cyan-300",
    3: "text-amber-300",
  };
  const TYPE_ICONS: Record<string, string> = {
    weapon: "⚔",
    shield: "🛡",
    engine: "⚡",
  };

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">
              ← Hub
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Pilot Profile</span>
          </div>

          {/* Profile card */}
          <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
            {/* LEFT — Portrait */}
            <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
              <div className="flex justify-center">
                <StarterCharacterPortrait slug={pilot.characterSlug} size="lg" />
              </div>
              <div className="mt-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-lg font-semibold text-cyan-200">{pilot.callsign}</p>
                  {isOnline && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]" />
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  {character.title}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  {character.summary}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1 border-t border-slate-800 pt-3 text-[11px]">
                <span className="text-slate-500">Level</span>
                <span className="text-right text-slate-300">{pilot.level}</span>
                <span className="text-slate-500">Role</span>
                <span className="text-right capitalize text-slate-300">{pilot.user.role}</span>
                <span className="text-slate-500">Sector</span>
                <span className="text-right text-slate-300">{pilot.currentSector}</span>
                <span className="text-slate-500">Account Age</span>
                <span className="text-right text-slate-300">{accountAgeDays}d</span>
                <span className="text-slate-500">Kills</span>
                <span className="text-right text-slate-300">{pilot.kills}</span>
                <span className="text-slate-500">Bounty</span>
                <span className="text-right text-amber-300">{pilot.bounty} Cr</span>
              </div>
            </section>

            {/* RIGHT — Stats */}
            <div className="space-y-3">
              {/* Combat overview */}
              <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 underline decoration-slate-700 underline-offset-4">
                  Combat Profile
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-6 gap-y-1 text-[11px]">
                  <span className="font-semibold text-slate-400">ATK:</span>
                  <span className="text-cyan-200">{atk}</span>
                  <span className="font-semibold text-slate-400">DEF:</span>
                  <span className="text-cyan-200">{def}</span>

                  <span className="font-semibold text-slate-400">Strength:</span>
                  <span className="text-slate-200">{pilot.strength.toFixed(2)}</span>
                  <span className="font-semibold text-slate-400">Speed:</span>
                  <span className="text-slate-200">{pilot.speed.toFixed(2)}</span>

                  <span className="font-semibold text-slate-400">Confidence:</span>
                  <span className="text-slate-200">{pilot.confidence}/{getConfidenceCap(pilot.characterSlug)}</span>
                  <span className="font-semibold text-slate-400">Gym Streak:</span>
                  <span className="text-slate-200">{pilot.gymStreak}d</span>
                </div>
              </section>

              {/* Battle record */}
              <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 underline decoration-slate-700 underline-offset-4">
                  Battle Record
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-6 gap-y-1 text-[11px]">
                  <span className="font-semibold text-slate-400">Wins:</span>
                  <span className="text-emerald-300">{totalWins}</span>
                  <span className="font-semibold text-slate-400">Losses:</span>
                  <span className="text-red-400">{totalLosses}</span>

                  <span className="font-semibold text-slate-400">Stalemates:</span>
                  <span className="text-slate-200">{totalStalemates}</span>
                  <span className="font-semibold text-slate-400">Total:</span>
                  <span className="text-slate-200">{battleLogs.length}</span>

                  <span className="font-semibold text-slate-400">Win Rate:</span>
                  <span className="text-slate-200">
                    {battleLogs.length > 0 ? Math.round((totalWins / battleLogs.length) * 100) : 0}%
                  </span>
                  <span className="font-semibold text-slate-400">K/D:</span>
                  <span className="text-slate-200">
                    {totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : totalWins.toFixed(2)}
                  </span>
                </div>
              </section>

              {/* Equipped gear */}
              <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-slate-500">
                  Equipped Loadout
                </p>
                {[
                  { label: "Weapon", item: weaponItem },
                  { label: "Shield", item: shieldItem },
                  { label: "Engine", item: engineItem },
                ].map(({ label, item }) => (
                  <div
                    key={label}
                    className="mb-1 flex items-center justify-between rounded border border-slate-800 bg-slate-900/40 px-2 py-1.5"
                  >
                    <span className="text-[10px] uppercase tracking-wide text-slate-600">
                      {label}
                    </span>
                    {item ? (
                      <span className={`text-[11px] font-medium ${TIER_COLORS[item.tier]}`}>
                        {TYPE_ICONS[item.type]} {item.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-700">— empty —</span>
                    )}
                  </div>
                ))}
              </section>

              {/* Status */}
              <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">
                  Status
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-6 gap-y-1 text-[11px]">
                  <span className="font-semibold text-slate-400">Life Force:</span>
                  <span className="text-emerald-300">{pilot.lifeForce}/{maxLF}</span>
                  <span className="font-semibold text-slate-400">XP:</span>
                  <span className="text-cyan-200">{pilot.xp}/{maxXp}</span>

                  <span className="font-semibold text-slate-400">Gender:</span>
                  <span className="capitalize text-slate-200">{pilot.gender}</span>
                  <span className="font-semibold text-slate-400">Status:</span>
                  <span className={isOnline ? "text-emerald-300" : "text-slate-600"}>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
