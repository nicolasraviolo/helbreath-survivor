// Puntería del jugador (revisión del original, bloque B, 31-oct-2026): sus golpes y hechizos pueden fallar.
// Como en el original (reference/Server.cpp, iCalculateAttackEffect y bCheckResistingMagicSuccess):
// - golpe: acierto % = 50 · puntería del jugador / Defense Ratio del monstruo;
// - hechizo: acierto % = 50 · puntería mágica / Magic Resistance del monstruo.
// En el original la puntería es maestría del arma + 50 + Dex (y Mag para la magia); aquí no hay maestría, así que
// puntería = base + Dex (o + Mag). La defensa del monstruo va comprimida (scale × original^exponent), como la
// esquiva en data/defense.ts, para que con Dex o Mag ~30 (puntería 150):
//   Orc ~95% · Werewolf ~75% · Ettin ~65% · demonios ~63% (golpes); Orc ~95% · Werewolf ~75% · Ettin ~70% (hechizos).
// Nunca menos de minHitChance (que no frustre) ni más de maxHitChance. Si falla no pasa nada: ni número, ni texto
// "Miss", ni sonido, ni empujón (decisión del propietario). El Critical Strike y el hechizo activo de la Maga
// (números grandes) no fallan nunca: en el original el crit suma +100 de puntería.
// Panel de stats: un % GENERAL (nunca contra un monstruo concreto), contra un monstruo "típico" (reference*).
import type { DamageType } from '../entities/CharacterStats';

export const ACCURACY = {
    /** Hit ratio of the player's blows: base + perDex × Dex. */
    base: 120,
    perDex: 1,
    /** Monster defense, compressed: scale × Defense Ratio^exponent. */
    defenseScale: 21,
    defenseExponent: 0.295,
    /** Original formula: hit % = hitPercentPerRatio × hit ratio / defense. */
    hitPercentPerRatio: 50,
    minHitChance: 0.5,
    maxHitChance: 0.95,
    /** Defense Ratio of a "typical" monster for the general Accuracy % (Troll / Cyclops ~100–110, Werewolf 200). */
    referenceDefenseRatio: 150,
} as const;

export const SPELL_ACCURACY = {
    /** Magic hit ratio of the player's spells: base + perMag × Mag. */
    base: 120,
    perMag: 1,
    /** Monster magic resistance, compressed: scale × Magic Resistance^exponent. */
    resistScale: 10.2,
    resistExponent: 0.5,
    hitPercentPerRatio: 50,
    minHitChance: 0.5,
    maxHitChance: 0.95,
    /** Magic Resistance of a "typical" monster for the general Spell accuracy % (Ogre / Cannibal Plant 84). */
    referenceMagicResist: 84,
} as const;

/** What the player brings against a monster's defense: Dex for blows, Mag for spells. */
export interface PlayerAccuracy {
    dex: number;
    mag: number;
}

/** Chance (0..1) that one of the player's hits of this type lands on a monster with these defenses. */
export function playerHitChance(type: DamageType, player: PlayerAccuracy, defenseRatio: number, magicResist: number): number {
    if (type === 'magic') {
        const s = SPELL_ACCURACY;
        const ratio = s.base + s.perMag * player.mag;
        const resist = s.resistScale * Math.max(1, magicResist) ** s.resistExponent;
        return clamp((s.hitPercentPerRatio * ratio) / resist / 100, s.minHitChance, s.maxHitChance);
    }
    const a = ACCURACY;
    const ratio = a.base + a.perDex * player.dex;
    const defense = a.defenseScale * Math.max(1, defenseRatio) ** a.defenseExponent;
    return clamp((a.hitPercentPerRatio * ratio) / defense / 100, a.minHitChance, a.maxHitChance);
}

/** General chance (0..1) that a blow lands, against a typical monster (stats panel). */
export function generalAccuracy(player: PlayerAccuracy): number {
    return playerHitChance('physical', player, ACCURACY.referenceDefenseRatio, 1);
}

/** General chance (0..1) that a spell lands, against a typical monster (stats panel). */
export function generalSpellAccuracy(player: PlayerAccuracy): number {
    return playerHitChance('magic', player, 1, SPELL_ACCURACY.referenceMagicResist);
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}
