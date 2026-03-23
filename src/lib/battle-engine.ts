import { calculateATK, calculateDEF, GAME_CONSTANTS } from "@/lib/constants";

export interface BotTemplate {
  name: string;
  slug: string;
  description: string;
  diffMult: number;
  levelReq: number;
  xpReward: number;
  creditReward: number;
}

export const NPC_BOTS: BotTemplate[] = [
  {
    name: "Scrap Drone",
    slug: "scrap-drone",
    description: "An automated salvage bot with corroded plating.",
    diffMult: 0.4,
    levelReq: 1,
    xpReward: 25,
    creditReward: 15,
  },
  {
    name: "Bandit Scout",
    slug: "bandit-scout",
    description: "A lightly armed raider probing the fringe lanes.",
    diffMult: 0.7,
    levelReq: 2,
    xpReward: 55,
    creditReward: 35,
  },
  {
    name: "Station Enforcer",
    slug: "station-enforcer",
    description: "A rogue security unit with reinforced armor plating.",
    diffMult: 1.1,
    levelReq: 4,
    xpReward: 100,
    creditReward: 70,
  },
  {
    name: "Void Raider",
    slug: "void-raider",
    description: "A seasoned deep-space marauder hunting lone pilots.",
    diffMult: 1.6,
    levelReq: 7,
    xpReward: 175,
    creditReward: 130,
  },
  {
    name: "Syndicate Hunter",
    slug: "syndicate-hunter",
    description: "A contract killer dispatched by a rival syndicate.",
    diffMult: 2.4,
    levelReq: 12,
    xpReward: 280,
    creditReward: 220,
  },
  {
    name: "Voidborn Sentinel",
    slug: "voidborn-sentinel",
    description: "An ancient automated guardian from a derelict deep-space platform.",
    diffMult: 3.2,
    levelReq: 15,
    xpReward: 420,
    creditReward: 350,
  },
  {
    name: "Apex Marauder",
    slug: "apex-marauder",
    description: "An elite outer-ring raider with hardened exo-armor and plasma cannons.",
    diffMult: 4.0,
    levelReq: 18,
    xpReward: 580,
    creditReward: 480,
  },
  {
    name: "Void Titan",
    slug: "void-titan",
    description: "A legendary war machine rumored to have survived three sector wars.",
    diffMult: 5.0,
    levelReq: 22,
    xpReward: 800,
    creditReward: 650,
  },
];

export const OUTER_RING_SLUGS = ["voidborn-sentinel", "apex-marauder", "void-titan"];
export interface BattleFighter {
  name: string;
  lf: number;
  maxLf: number;
  atk: number;
  def: number;
  speed: number;
}

export interface BattleRoundLog {
  round: number;
  attacker: string;
  defender: string;
  damage: number;
  crit: boolean;
  defenderLfAfter: number;
}

export interface BattleOutcome {
  winner: "player" | "bot";
  rounds: BattleRoundLog[];
  totalRounds: number;
  xpGained: number;
  creditsGained: number;
  playerLfAfter: number;
  confidenceDelta: number;
  logText: string;
}

function maxLF(level: number): number {
  return Math.max(GAME_CONSTANTS.STARTING_LIFE_FORCE, level * 5);
}

function buildBot(bot: BotTemplate, playerLevel: number): BattleFighter {
  const effectiveLevel = Math.max(1, Math.round(playerLevel * bot.diffMult));
  const str = GAME_CONSTANTS.STARTING_STRENGTH * bot.diffMult * (1 + playerLevel * 0.08);
  const atk = Math.max(1, calculateATK(str, 60, 0));
  const def = Math.max(0, calculateDEF(str, 60, 0));
  return {
    name: bot.name,
    lf: Math.round(maxLF(effectiveLevel) * bot.diffMult),
    maxLf: Math.round(maxLF(effectiveLevel) * bot.diffMult),
    atk,
    def,
    speed: GAME_CONSTANTS.STARTING_SPEED * bot.diffMult,
  };
}

function rollDamage(atk: number, def: number): { damage: number; crit: boolean } {
  const variance = Math.floor(Math.random() * 5) - 2; // -2 to +2
  const crit = Math.random() < 0.07;
  let damage = Math.max(1, atk - def + variance);
  if (crit) damage = Math.floor(damage * 2);
  return { damage, crit };
}

export function resolveBattle(
  pilot: {
    callsign: string;
    level: number;
    lifeForce: number;
    strength: number;
    speed: number;
    confidence: number;
    atkSplit: number;
    inventory: { type: string; bonusType: string; bonusAmt: number; equipped: boolean }[];
  },
  botSlug: string
): BattleOutcome {
  const botTemplate = NPC_BOTS.find((b) => b.slug === botSlug);
  if (!botTemplate) throw new Error("Unknown bot: " + botSlug);

  const weaponBonus =
    pilot.inventory.filter((i) => i.equipped && i.type === "weapon").reduce((sum, i) => sum + (i.bonusType === "credits" ? Math.floor(i.bonusAmt / 10) : 0), 0);
  const shieldBonus =
    pilot.inventory.filter((i) => i.equipped && i.type === "shield").reduce((sum, i) => sum + i.bonusAmt, 0);

  const playerATK = Math.max(1, calculateATK(pilot.strength, pilot.atkSplit, weaponBonus));
  const playerDEF = Math.max(0, calculateDEF(pilot.strength, pilot.atkSplit, Math.floor(shieldBonus / 2)));
  const playerMaxLf = maxLF(pilot.level);

  const player: BattleFighter = {
    name: pilot.callsign,
    lf: Math.min(pilot.lifeForce, playerMaxLf),
    maxLf: playerMaxLf,
    atk: playerATK,
    def: playerDEF,
    speed: pilot.speed,
  };

  const bot = buildBot(botTemplate, pilot.level);
  const rounds: BattleRoundLog[] = [];

  let playerLf = player.lf;
  let botLf = bot.lf;

  // Player goes first if speed advantage, otherwise alternates normally
  const playerFirst = player.speed >= bot.speed;

  for (let round = 1; round <= 20; round++) {
    if (playerLf <= 0 || botLf <= 0) break;

    if (playerFirst || round % 2 === 1) {
      // Player attacks bot
      const { damage, crit } = rollDamage(player.atk, bot.def);
      botLf = Math.max(0, botLf - damage);
      rounds.push({
        round,
        attacker: player.name,
        defender: bot.name,
        damage,
        crit,
        defenderLfAfter: botLf,
      });
      if (botLf <= 0) break;

      // Bot attacks player
      const { damage: botDmg, crit: botCrit } = rollDamage(bot.atk, player.def);
      playerLf = Math.max(0, playerLf - botDmg);
      rounds.push({
        round,
        attacker: bot.name,
        defender: player.name,
        damage: botDmg,
        crit: botCrit,
        defenderLfAfter: playerLf,
      });
    } else {
      // Bot attacks first this round
      const { damage: botDmg, crit: botCrit } = rollDamage(bot.atk, player.def);
      playerLf = Math.max(0, playerLf - botDmg);
      rounds.push({
        round,
        attacker: bot.name,
        defender: player.name,
        damage: botDmg,
        crit: botCrit,
        defenderLfAfter: playerLf,
      });
      if (playerLf <= 0) break;

      const { damage, crit } = rollDamage(player.atk, bot.def);
      botLf = Math.max(0, botLf - damage);
      rounds.push({
        round,
        attacker: player.name,
        defender: bot.name,
        damage,
        crit,
        defenderLfAfter: botLf,
      });
    }
  }

  const playerWon = botLf <= 0;
  const xpGained = playerWon ? botTemplate.xpReward : Math.floor(botTemplate.xpReward * 0.2);
  const creditsGained = playerWon ? botTemplate.creditReward : 0;
  const confidenceDelta = playerWon
    ? Math.min(2, GAME_CONSTANTS.CONFIDENCE_CAP - pilot.confidence)
    : -3;

  const logLines = rounds.map((r) => {
    const critTag = r.crit ? " [CRIT]" : "";
    return `Round ${r.round} — ${r.attacker} hits ${r.defender} for ${r.damage} dmg${critTag}. ${r.defender} LF: ${r.defenderLfAfter}`;
  });

  logLines.push(
    playerWon
      ? `⚡ ${player.name} wins! +${xpGained} XP, +${creditsGained} credits.`
      : `✗ ${bot.name} wins. +${xpGained} XP (participation).`
  );

  return {
    winner: playerWon ? "player" : "bot",
    rounds,
    totalRounds: rounds.length,
    xpGained,
    creditsGained,
    playerLfAfter: Math.max(1, playerLf), // player never dies permanently — LF floors at 1
    confidenceDelta,
    logText: logLines.join("\n"),
  };
}

export function getAvailableBots(playerLevel: number): BotTemplate[] {
  return NPC_BOTS.filter((b) => playerLevel >= b.levelReq);
}
