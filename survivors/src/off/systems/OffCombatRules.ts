// Helbreath Off (Fase Off-2): las fórmulas del combate del servidor original (ver off/data/offCombat.ts).
import Phaser from 'phaser';
import { OFF_COMBAT, type OffWeaponDef } from '../data/offCombat';

/** `count` dice of `sides` sides, added (server iDice). 0 sides or count gives 0. */
export function rollDice(count: number, sides: number): number {
    let total = 0;
    for (let i = 0; i < count; i++) if (sides > 0) total += Phaser.Math.Between(1, sides);
    return total;
}

/** Chance (0..1) that an attack lands: hit / defence × 50 %, defence halved from behind, within the limits. */
export function offHitChance(hitRatio: number, defenseRatio: number, fromBehind: boolean): number {
    const defense = Math.max(1, fromBehind ? Math.floor(defenseRatio / 2) : defenseRatio);
    const percent = Phaser.Math.Clamp(Math.floor((hitRatio / defense) * 50), OFF_COMBAT.minHitPercent, OFF_COMBAT.maxHitPercent);
    return percent / 100;
}

/** True when attacker and target look the same way: the blow comes from behind (server cAttackerDir == cTargetDir). */
export function isFromBehind(attackerFacing: number, targetFacing: number): boolean {
    return attackerFacing === targetFacing;
}

/** A weapon's damage: its dice for the target's size, then +1 % per 5 STR (never under 1). */
export function rollWeaponDamage(weapon: OffWeaponDef, size: 'small' | 'large', str: number): number {
    const [count, sides, bonus] = size === 'small' ? weapon.small : weapon.large;
    return strDamage(rollDice(count, sides) + bonus, str);
}

/** The dice's result with the STR bonus. */
function strDamage(base: number, str: number): number {
    return Math.max(1, Math.floor(base * (1 + str / 500)));
}

/**
 * Least and most damage of a normal blow with that STR (crits apart), against any monster: the lowest of the small and
 * large dice to the highest (Fase Off-3C: the owner wanted this instead of the dice, which were hard to read).
 */
export function weaponDamageRange(weapon: Pick<OffWeaponDef, 'small' | 'large'>, str: number): { min: number; max: number } {
    const low = ([count, , bonus]: readonly [number, number, number]) => count + bonus;
    const high = ([count, sides, bonus]: readonly [number, number, number]) => count * sides + bonus;
    return {
        min: strDamage(Math.min(low(weapon.small), low(weapon.large)), str),
        max: strDamage(Math.max(high(weapon.small), high(weapon.large)), str),
    };
}

/** A monster's damage on the player: its dice, minus 1d(VIT/10) − 1 (it can reach 0). */
export function rollMonsterDamage(dice: readonly [number, number], vit: number): number {
    const reduction = Math.max(0, rollDice(1, Math.floor(vit / 10)) - 1);
    return Math.max(0, rollDice(dice[0], dice[1]) - reduction);
}

/** Tiles between two tiles counting diagonals as one (server: the larger of the two distances). */
export function tileDistance(ax: number, ay: number, bx: number, by: number): number {
    return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}
