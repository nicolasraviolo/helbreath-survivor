// Esquiva física (Fase 18A). Como en el original (reference/Server.cpp, iCalculateAttackEffect):
// - el monstruo tiene puntería (Hit Ratio, el de docs/hb-wiki/monstruos.md, en data/enemies.ts);
// - el jugador tiene defensa (Defense Ratio) = 2·Dex + la de cada pieza de armadura y escudo (data/armor.ts);
// - probabilidad de que el golpe acierte = 50·puntería / defensa (en %), con un mínimo y un máximo.
// Comprimido: la puntería original va de 30 a 1.300 y aquí la defensa no pasa de ~150, así que se usa
// hitScale × puntería^hitExponent (como MONSTER_DAMAGE con los dados). Objetivo: guerrero con Plate Mail,
// Tower Shield y casco → el Orc le acierta ~30%, el Werewolf ~70% y el Ettin ~80%. La Maga casi no esquiva.
// Las flechas también se esquivan; los hechizos no (resistencia mágica, Fase 18B).
import { ENEMIES, type EnemyId } from './enemies';

export const DODGE = {
    /** Defense ratio per point of Dex (original: 2). */
    dexFactor: 2,
    /** A monster's hit ratio, compressed: hitScale × original^hitExponent. */
    hitScale: 8.3,
    hitExponent: 0.53,
    /** Original formula: hit % = hitPercentPerRatio × hit ratio / defense ratio. */
    hitPercentPerRatio: 50,
    /** A blow always has at least this chance to land, and never more than the maximum: nobody is untouchable. */
    minHitChance: 0.25,
    maxHitChance: 0.95,
} as const;

/** Monsters the stats panel and the armor cards compare against (a weak one and a strong one). */
export const DODGE_REFERENCE: readonly EnemyId[] = ['orc', 'ettin'];

/** The player's defense ratio: Dex plus the armor worn. */
export function playerDefenseRatio(dex: number, armorDefenseRatio: number): number {
    return DODGE.dexFactor * dex + armorDefenseRatio;
}

/** Chance (0..1) that a blow of a monster with this original hit ratio lands on a player with this defense ratio. */
export function hitChance(hitRatio: number, defenseRatio: number): number {
    if (defenseRatio <= 0) return DODGE.maxHitChance;
    const compressed = DODGE.hitScale * hitRatio ** DODGE.hitExponent;
    const chance = (DODGE.hitPercentPerRatio * compressed) / defenseRatio / 100;
    return Math.min(DODGE.maxHitChance, Math.max(DODGE.minHitChance, chance));
}

/** Chance (0..1) of dodging a blow of this monster (stats panel and armor cards). */
export function dodgeChance(enemy: EnemyId, defenseRatio: number): number {
    return 1 - hitChance(ENEMIES[enemy].hitRatio, defenseRatio);
}
