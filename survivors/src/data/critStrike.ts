// Critical Strike del Guerrero (Fase 19A): el "crit" que se lanzaba con Alt en el original, ahora con Espacio, R2 del mando
// o el botón táctil. Gasta una carga y da un golpe de área inmediato, cuya forma depende del tipo de arma
// (decidido por el propietario el 18-oct-2026). No es el crítico al azar de Chr (ese sigue en data/stats.ts).
// Original (reference/Server.cpp): cargas = nivel/10, +1 cada ~13 s y +1 cada ~14 golpes recibidos (ver NOTES.md).
import type { SoundKey } from '../config/assetManifest';
import type { EffectKey } from '../config/effects';
import type { LinePathDef } from './activeSpells';
import { TILE_SIZE } from '../config/gameConfig';
import type { Gender } from './appearance';
import type { MeleeFamilyId } from './weapons';

/** Shape of the strike of one weapon family. Reach is the weapon's own range plus `extraTiles` tiles. */
export interface CritShape {
    /** Extra reach beyond the weapon's range, in tiles (1 tile = TILE_SIZE px). */
    extraTiles: number;
    /** Width of the blow in degrees, centred where the player aims; 360 = all around the player. */
    arcDegrees: number;
    /** Number of blows (axes spin twice), `repeatMs` apart. */
    hits: number;
    repeatMs: number;
    /** Push given to every enemy hit (px/s). */
    knockback: number;
    /** Extra damage of this family, as in the original (long sword +10%, axe and hammer +20%). */
    damageBonus: number;
}

export const CRIT_STRIKE = {
    /** One charge more every this many ms, up to the maximum (owner, 18-oct-2026: 20 s; 19-oct-2026, closing phase 19: 15 s). */
    rechargeMs: 15_000,
    /** And one more every this many blows taken (the original: ~14), rewarding standing in the horde. */
    hitsPerCharge: 15,
    /** Damage = weapon damage × (base + Power / perLevel) × (1 + family bonus). */
    damageBase: 2,
    damagePerLevel: 30,
    /** Camera shake when it is launched. */
    shakePx: 4,
    shakeMs: 200,
    /** The effect around the player (fx.crit.strike) is drawn this far above the feet (px). */
    effectOffsetY: 24,
} as const;

/** Charges the player can hold at this Power: 1 + Power / 10 (1 at Power 1–9, 2 at 10, 3 at 20...). */
export function maxCritCharges(level: number): number {
    return 1 + Math.floor(level / 10);
}

/** Multiplier of the weapon's damage at this Power, before the family bonus. */
export function critDamageMultiplier(level: number): number {
    return CRIT_STRIKE.damageBase + level / CRIT_STRIKE.damagePerLevel;
}

/**
 * Strike of each weapon family (owner, 18-oct-2026; 31-oct-2026: the normal blows are all alike, the strike tells them
 * apart). Swords reach furthest, with a wave (CRIT_SWORD_WAVE); axes spin twice in the widest circle, with a whirlwind
 * (CRIT_AXE_WHIRL); hammers slam the ground: the circle is their wave, plus a crack HAMMER_SLAM.critCrackLength times as
 * long as the weapon's (WeaponSystem). Fencing is not in the game yet.
 */
export const CRIT_SHAPES: Record<MeleeFamilyId, CritShape> = {
    /** Short swords: a wide sweep 1 tile further than the normal swing. */
    shortSword: { extraTiles: 1, arcDegrees: 140, hits: 1, repeatMs: 0, knockback: 260, damageBonus: 0 },
    /** Long swords: the same sweep, 3 tiles further. */
    longSword: { extraTiles: 4, arcDegrees: 120, hits: 1, repeatMs: 0, knockback: 320, damageBonus: 0.1 },
    /** Axes: two spins all around the player, in the widest circle. */
    axe: { extraTiles: 3, arcDegrees: 360, hits: 2, repeatMs: 250, knockback: 240, damageBonus: 0.2 },
    /** Hammers: a wider circle, 2 tiles further, that pushes enemies far away. */
    hammer: { extraTiles: 2, arcDegrees: 360, hits: 1, repeatMs: 0, knockback: 520, damageBonus: 0.2 },
    /** Fencing (not asked yet): a long narrow thrust. */
    fencing: { extraTiles: 2, arcDegrees: 40, hits: 1, repeatMs: 0, knockback: 200, damageBonus: 0 },
};

/** Reach of a strike in pixels, from the weapon's own range. */
export function critReach(weaponRange: number, shape: CritShape): number {
    return weaponRange + shape.extraTiles * TILE_SIZE;
}

/** The original war cry: C23 for men, C24 for women. */
export const CRIT_SHOUT: Record<Gender, SoundKey> = {
    male: 'sfx.crit.m',
    female: 'sfx.crit.w',
};

/**
 * Swords' strike (owner, 31-oct-2026): a wave of golden sparks runs from the feet to the end of the blow's reach. Only a
 * picture: the damage is the swing's (`pathDamage` 0 hits nothing). Uses sprites every run loads (no extra download).
 */
export const CRIT_SWORD_WAVE: LinePathDef = {
    look: 'sparks', damageType: 'physical', bigNumbers: true,
    travelMs: 0, speed: 1400, stepEveryMs: 25, holdMs: 0, holdStepMs: 0,
    pathRadius: 0, pathDamage: 0, pathHits: 0, pathHitDelayMs: 0,
    targetRadius: 0, targetDamage: 0, targetHitDelaysMs: [],
    slows: false, knockback: 0, shakePx: 0, shakeMs: 0,
};

/**
 * Axes' strike (owner, 31-oct-2026): on every spin, dust puffs around the edge of the circle (at `dustShare` of its
 * radius) and golden sparks halfway (`sparkShare`), so the wide circle reads. Sprites every run loads: the whirlwind of
 * effect3.spr would add ~0,8 MB to the Warrior's download.
 */
export const CRIT_AXE_WHIRL = {
    dust: 'fx.earthShock.dust',
    dustCount: 10,
    dustShare: 0.85,
    spark: 'fx.lightningArrow.spark',
    sparkCount: 8,
    sparkShare: 0.5,
} as const satisfies { dust: EffectKey; dustCount: number; dustShare: number; spark: EffectKey; sparkCount: number; sparkShare: number };
