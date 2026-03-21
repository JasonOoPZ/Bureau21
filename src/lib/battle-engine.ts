import { CharacterStats, Item, BattleResult } from '@/types/game';
import { calcATK, calcDEF } from '@/lib/constants';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(): number {
  return Math.random();
}

export function runBattle(
  attacker: CharacterStats,
  defender: CharacterStats,
  weapon: Item | null,
  armor: Item | null
): BattleResult {
  const wpnBonus = weapon ? weapon.atk_bonus : 0;
  const armBonus = armor ? armor.def_bonus : 0;

  const atkATK = calcATK(attacker.strength, attacker.atk_def_split, wpnBonus);
  const atkDEF = calcDEF(attacker.strength, attacker.atk_def_split, 0);
  const defATK = calcATK(defender.strength, defender.atk_def_split, 0);
  const defDEF = calcDEF(defender.strength, defender.atk_def_split, armBonus);

  let atkLF = attacker.life_force;
  let defLF = defender.life_force;
  const log: string[] = [];
  let turn = 0;

  log.push(
    `⚔️ ${attacker.username} (LF:${atkLF} ATK:${atkATK} DEF:${atkDEF}) vs ${defender.username} (LF:${defLF} ATK:${defATK} DEF:${defDEF})`
  );

  while (atkLF > 0 && defLF > 0 && turn < 100) {
    turn++;
    const atkGoesFirst = attacker.speed >= defender.speed;

    const takeTurn = (
      actorName: string,
      actorATK: number,
      actorEndurance: number,
      actorPanic: number,
      targetName: string,
      targetDEF: number,
      targetCurrentLF: number
    ): { damage: number; rest: boolean; panic: boolean } => {
      if (randFloat() < actorEndurance) {
        log.push(`Turn ${turn}: ${actorName} rests to recover endurance.`);
        return { damage: 0, rest: true, panic: false };
      }
      if (actorPanic > 0 && randFloat() < actorPanic / 100) {
        const panicDmg = targetCurrentLF;
        log.push(
          `Turn ${turn}: ${actorName} PANICS and unleashes ${panicDmg} damage on ${targetName}!`
        );
        return { damage: panicDmg, rest: false, panic: true };
      }
      const dmg = Math.max(1, actorATK - targetDEF + randInt(-2, 2));
      log.push(
        `Turn ${turn}: ${actorName} deals ${dmg} damage to ${targetName}.`
      );
      return { damage: dmg, rest: false, panic: false };
    };

    if (atkGoesFirst) {
      const r1 = takeTurn(
        attacker.username,
        atkATK,
        attacker.endurance,
        attacker.panic,
        defender.username,
        defDEF,
        defLF
      );
      defLF = Math.max(0, defLF - r1.damage);
      if (defLF <= 0) break;

      const r2 = takeTurn(
        defender.username,
        defATK,
        defender.endurance,
        defender.panic,
        attacker.username,
        atkDEF,
        atkLF
      );
      atkLF = Math.max(0, atkLF - r2.damage);
    } else {
      const r1 = takeTurn(
        defender.username,
        defATK,
        defender.endurance,
        defender.panic,
        attacker.username,
        atkDEF,
        atkLF
      );
      atkLF = Math.max(0, atkLF - r1.damage);
      if (atkLF <= 0) break;

      const r2 = takeTurn(
        attacker.username,
        atkATK,
        attacker.endurance,
        attacker.panic,
        defender.username,
        defDEF,
        defLF
      );
      defLF = Math.max(0, defLF - r2.damage);
    }
  }

  const attackerWon = defLF <= 0 && atkLF > 0;
  const winnerId = attackerWon ? attacker.id : defender.id;

  const levelDiff = defender.level - attacker.level;
  const xpGained = Math.max(
    1,
    Math.floor(defender.level * 10 * (1 + levelDiff * 0.1))
  );

  let creditsStolen = 0;
  if (attackerWon) {
    creditsStolen = Math.floor(defender.credits_hand * (0.1 + randFloat() * 0.2));
  }

  const alignmentChange =
    defender.level * (defender.alignment >= 0 ? -1 : 1);

  log.push(
    attackerWon
      ? `🏆 ${attacker.username} wins! Gained ${xpGained} XP and ${creditsStolen} credits.`
      : `💀 ${defender.username} survives! ${attacker.username} is defeated.`
  );

  return {
    winner_id: winnerId,
    log_entries: log,
    xp_gained: attackerWon ? xpGained : 0,
    credits_stolen: creditsStolen,
    alignment_change: attackerWon ? alignmentChange : 0,
    attacker_survived: atkLF > 0,
    defender_survived: defLF > 0,
  };
}
