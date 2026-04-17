import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { StarterCharacterPortrait } from "@/components/game/starter-character-portrait";
import { HerbUseButton } from "@/components/game/herb-use-button";
import { getOrCreatePilotState } from "@/lib/game-state";
import { calculateATK, calculateDEF, xpForLevel, GAME_CONSTANTS, getConfidenceCap, getCombatBonuses } from "@/lib/constants";
import { getStarterCharacter } from "@/lib/starter-characters";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

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

function StatBar({
  label,
  value,
  max,
  color = "cyan",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor =
    color === "emerald"
      ? "bg-emerald-500"
      : color === "amber"
      ? "bg-amber-500"
      : color === "red"
      ? "bg-red-500"
      : "bg-cyan-500";
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200">
          {value} / {max}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800">
        <div
          className={`h-1.5 rounded-full ${barColor} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/60 px-2 py-1">
      <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <span className="font-mono text-[12px] text-cyan-200">{value}</span>
    </div>
  );
}

export default async function HousePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const character = getStarterCharacter(pilot.characterSlug);

  const equipped = pilot.inventory.filter((i) => i.equipped);
  const weaponItem = equipped.find((i) => i.type === "weapon");
  const shieldItem = equipped.find((i) => i.type === "shield");
  const engineItem = equipped.find((i) => i.type === "engine");
  const armorItem = equipped.find((i) => i.type === "armor");

  const { weaponBonus, armorBonus } = getCombatBonuses(pilot.inventory);
  const atk = calculateATK(pilot.strength, pilot.atkSplit, weaponBonus);
  const def = calculateDEF(pilot.strength, pilot.atkSplit, armorBonus);
  const maxXp = xpForLevel(pilot.level);
  const maxLF = Math.max(GAME_CONSTANTS.STARTING_LIFE_FORCE, pilot.level * 5);

  const missions = await prisma.mission.findMany({ where: { pilotId: pilot.id } });

  // Parallel: recent logs, aggregate stats, and daily stats all at once
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [battleLogs, battleAgg, totalXpAgg, totalCreditsAgg, dailyLogs] = await Promise.all([
    prisma.battleLog.findMany({
      where: { pilotId: pilot.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.battleLog.groupBy({
      by: ["result"],
      where: { pilotId: pilot.id },
      _count: { result: true },
    }),
    prisma.battleLog.aggregate({
      where: { pilotId: pilot.id },
      _sum: { xpGained: true },
    }),
    prisma.battleLog.aggregate({
      where: { pilotId: pilot.id },
      _sum: { creditsGained: true },
    }),
    prisma.battleLog.findMany({
      where: { pilotId: pilot.id, createdAt: { gte: todayStart } },
      select: { result: true, xpGained: true, creditsGained: true },
    }),
  ]);

  // Extract aggregated battle stats
  const totalWins = battleAgg.find((g) => g.result === "win")?._count.result ?? 0;
  const totalLosses = battleAgg.find((g) => g.result === "loss")?._count.result ?? 0;
  const totalStalemates = battleAgg.find((g) => g.result === "stalemate")?._count.result ?? 0;
  const totalBattles = battleAgg.reduce((s, g) => s + g._count.result, 0);
  const totalXpEarned = totalXpAgg._sum.xpGained ?? 0;
  const totalCreditsEarned = totalCreditsAgg._sum.creditsGained ?? 0;

  // Today's battle stats
  const dailyWins = dailyLogs.filter((l) => l.result === "win").length;
  const dailyLosses = dailyLogs.filter((l) => l.result === "loss").length;
  const dailyXp = dailyLogs.reduce((s, l) => s + l.xpGained, 0);
  const dailyCredits = dailyLogs.reduce((s, l) => s + l.creditsGained, 0);

  const currentTime = new Date();
  const accountAgeDays = Math.floor(
    (currentTime.getTime() - new Date(pilot.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-5xl space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">
              ← Hub
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Character Sheet</span>
          </div>

          {/* Main grid */}
          <div className="grid gap-3 md:grid-cols-[260px_minmax(0,1fr)]">
            {/* LEFT — Portrait + identity */}
            <div className="space-y-3">
              <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                <div className="flex justify-center">
                  <StarterCharacterPortrait slug={pilot.characterSlug} size="lg" />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-lg font-semibold text-cyan-200">{pilot.callsign}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {character.title}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    {character.summary}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1 border-t border-slate-800 pt-3 text-[11px]">
                  <span className="text-slate-500">Role</span>
                  <span className="text-right capitalize text-slate-300">{session.user.role}</span>
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

              {/* Equipment */}
              <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-slate-500">
                  Equipped Loadout
                </p>
                {[
                  { label: "Weapon", item: weaponItem },
                  { label: "Armor", item: armorItem },
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
                <Link
                  href="/inventory"
                  className="mt-2 block text-center text-[10px] text-cyan-600 hover:text-cyan-300"
                >
                  Manage Inventory →
                </Link>
              </section>
            </div>

            {/* RIGHT */}
            <div className="space-y-3">
              {/* Personal Stats */}
              <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 underline decoration-slate-700 underline-offset-4">
                  Personal Stats
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-6 gap-y-1 text-[11px]">
                  <span className="font-semibold text-slate-400">Level:</span>
                  <span className="text-slate-200">{pilot.level}</span>
                  <span className="font-semibold text-slate-400">Experience:</span>
                  <span className="text-slate-200">{pilot.xp}/{maxXp}</span>

                  <span className="font-semibold text-slate-400">Life Force:</span>
                  <span className="text-slate-200">{pilot.lifeForce}/{maxLF}</span>
                  <span className="font-semibold text-slate-400">Motivation:</span>
                  <span className="text-slate-200">{pilot.motivation}/{GAME_CONSTANTS.MOTIVATION_CAP_FREE}</span>

                  <span className="font-semibold text-slate-400">Credits:</span>
                  <span className="text-amber-300">{pilot.credits.toLocaleString()}</span>
                  <span className="font-semibold text-slate-400">Sovereigns:</span>
                  <span className="text-purple-300">{pilot.tokens.toLocaleString()}</span>

                  <span className="font-semibold text-slate-400">Account Age:</span>
                  <span className="text-slate-200">{accountAgeDays} days</span>
                  <span className="font-semibold text-slate-400">Sector:</span>
                  <span className="text-slate-200">{pilot.currentSector}</span>

                  <span className="font-semibold text-slate-400">Kills:</span>
                  <span className="text-slate-200">{pilot.kills}</span>
                  <span className="font-semibold text-slate-400">Bounty:</span>
                  <span className="text-amber-300">{pilot.bounty} Cr</span>

                  <span className="font-semibold text-slate-400">Fuel:</span>
                  <span className="text-slate-200">{pilot.fuel}/10</span>
                  <span className="font-semibold text-slate-400">Hull:</span>
                  <span className="text-slate-200">{pilot.hull}/100</span>

                  <span className="font-semibold text-slate-400">Herbs:</span>
                  <span className="text-emerald-300">{pilot.herbs ?? 0}</span>
                  <span className="font-semibold text-slate-400">Ore:</span>
                  <span className="text-slate-200">{pilot.ore}</span>

                  <span className="font-semibold text-slate-400">Gym Streak:</span>
                  <span className="text-slate-200">{pilot.gymStreak}d</span>
                  <span className="font-semibold text-slate-400">Gender:</span>
                  <span className="capitalize text-slate-200">{pilot.gender}</span>
                </div>
              </section>

              {/* Progress bars */}
              <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">
                  Pilot Status
                </p>
                <div className="space-y-3">
                  <StatBar
                    label={`Level ${pilot.level} — XP`}
                    value={pilot.xp}
                    max={maxXp}
                    color="cyan"
                  />
                  <StatBar
                    label="Life Force"
                    value={pilot.lifeForce}
                    max={maxLF}
                    color="emerald"
                  />
                  <StatBar
                    label="Motivation"
                    value={pilot.motivation}
                    max={GAME_CONSTANTS.MOTIVATION_CAP_FREE}
                    color="amber"
                  />
                </div>
              </section>

              {/* Consumables */}
              <HerbUseButton
                initialHerbs={pilot.herbs ?? 0}
                initialLf={pilot.lifeForce}
                maxLf={maxLF}
              />

              {/* Battle Stats */}
              <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 underline decoration-slate-700 underline-offset-4">
                    Battle Stats
                  </p>
                  <Link
                    href="/battle"
                    className="text-[10px] text-cyan-600 hover:text-cyan-300"
                  >
                    → Battle Arena
                  </Link>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-6 gap-y-1 text-[11px]">
                  <span className="font-semibold text-slate-400">ATK/DEF Split:</span>
                  <span className="text-slate-200">{pilot.atkSplit}%</span>
                  <span className="font-semibold text-slate-400">Battle Timer:</span>
                  <span className="text-slate-200">{GAME_CONSTANTS.BATTLE_GAUGE_DEFAULT_MINUTES} min</span>

                  <span className="font-semibold text-slate-400">ATK:</span>
                  <span className="text-cyan-200">{atk}</span>
                  <span className="font-semibold text-slate-400">DEF:</span>
                  <span className="text-cyan-200">{def}</span>

                  <span className="font-semibold text-slate-400">Strength:</span>
                  <span className="text-slate-200">{pilot.strength.toFixed(2)}</span>
                  <span className="font-semibold text-slate-400">Speed:</span>
                  <span className="text-slate-200">{pilot.speed.toFixed(2)}</span>

                  <span className="font-semibold text-slate-400">Endurance:</span>
                  <span className="text-slate-200">{pilot.endurance.toFixed(4)}</span>
                  <span className="font-semibold text-slate-400">Panic:</span>
                  <span className="text-slate-200">{pilot.panic.toFixed(4)}</span>

                  <span className="font-semibold text-slate-400">Confidence:</span>
                  <span className="text-slate-200">{pilot.confidence}/{getConfidenceCap(pilot.characterSlug)}</span>
                  <span className="font-semibold text-slate-400">Battles:</span>
                  <span className="text-slate-200">{totalWins}/{totalLosses}/{totalStalemates}/{totalBattles}</span>
                </div>
                <div className="mt-2 border-t border-slate-800 pt-2">
                  <Link
                    href="/gym"
                    className="text-[10px] text-cyan-600 hover:text-cyan-300"
                  >
                    → Train at Gym
                  </Link>
                </div>
              </section>

              {/* Daily Battle Stats */}
              <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 underline decoration-slate-700 underline-offset-4">
                  Daily Battle Stats
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-6 gap-y-1 text-[11px]">
                  <span className="font-semibold text-slate-400">Wins:</span>
                  <span className="text-emerald-300">{dailyWins}</span>
                  <span className="font-semibold text-slate-400">Losses:</span>
                  <span className="text-red-400">{dailyLosses}</span>

                  <span className="font-semibold text-slate-400">Total Today:</span>
                  <span className="text-slate-200">{dailyLogs.length}</span>
                  <span className="font-semibold text-slate-400">Success Rate:</span>
                  <span className="text-slate-200">{dailyLogs.length > 0 ? Math.round((dailyWins / dailyLogs.length) * 100) : 0}%</span>

                  <span className="font-semibold text-slate-400">EXP Earned:</span>
                  <span className="text-cyan-200">{dailyXp}</span>
                  <span className="font-semibold text-slate-400">Credits Earned:</span>
                  <span className="text-amber-300">{dailyCredits}</span>
                </div>
              </section>

              {/* Economy */}
              <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                    Economy
                  </p>
                  <Link
                    href="/bank"
                    className="text-[10px] text-cyan-600 hover:text-cyan-300"
                  >
                    → Bank
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded border border-amber-900/40 bg-amber-950/20 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-amber-600">Credits</p>
                    <p className="mt-1 text-2xl font-bold text-amber-300">
                      {pilot.credits.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded border border-purple-900/40 bg-purple-950/20 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-purple-500">Sovereigns</p>
                    <p className="mt-1 text-2xl font-bold text-purple-300">{pilot.tokens.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                  <span className="font-semibold text-slate-400">Total XP Earned:</span>
                  <span className="text-cyan-200">{totalXpEarned.toLocaleString()}</span>
                  <span className="font-semibold text-slate-400">Total Credits Earned:</span>
                  <span className="text-amber-300">{totalCreditsEarned.toLocaleString()}</span>
                </div>
              </section>

              {/* Missions */}
              <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-slate-500">
                  Active Contracts
                </p>
                {missions.length === 0 ? (
                  <p className="text-[11px] text-slate-600">No active contracts.</p>
                ) : (
                  missions.map((m) => (
                    <div key={m.id} className="mb-2 last:mb-0">
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={m.completed ? "text-emerald-400" : "text-slate-300"}
                        >
                          {m.completed ? "✓ " : ""}
                          {m.title}
                        </span>
                        <span className="text-slate-500">
                          {m.currentCount}/{m.targetCount}
                        </span>
                      </div>
                      <div className="mt-0.5 h-1 w-full rounded-full bg-slate-800">
                        <div
                          className={`h-1 rounded-full ${
                            m.completed ? "bg-emerald-500" : "bg-cyan-600"
                          } transition-all`}
                          style={{
                            width: `${Math.min(
                              100,
                              (m.currentCount / m.targetCount) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      {!m.completed && (
                        <p className="mt-0.5 text-[10px] text-slate-600">
                          {m.description} · +{m.rewardXp} XP, +{m.rewardCredits} Cr
                        </p>
                      )}
                    </div>
                  ))
                )}
              </section>

              {/* Battle history */}
              {battleLogs.length > 0 && (
                <section className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                      Recent Battles
                    </p>
                    <Link
                      href="/battle"
                      className="text-[10px] text-cyan-600 hover:text-cyan-300"
                    >
                      → Fight
                    </Link>
                  </div>
                  {battleLogs.map((log) => (
                    <div
                      key={log.id}
                      className="mb-1 flex items-center justify-between rounded border border-slate-800/60 bg-slate-900/30 px-2 py-1.5"
                    >
                      <div>
                        <span
                          className={`mr-2 text-[10px] font-bold uppercase ${
                            log.result === "win" ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {log.result}
                        </span>
                        <span className="text-[11px] text-slate-300">
                          vs {log.opponentName}
                        </span>
                      </div>
                      <div className="text-right text-[10px] text-slate-500">
                        +{log.xpGained} XP · {log.roundsCount}r
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
