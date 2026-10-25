// Magias pasivas de la partida (Fase 28): cartas para las dos clases que se consiguen y se suben de rango con las cartas
// de Power, y se pierden al terminar la partida (siguen con Continue).
// Decidido por el propietario (25-oct-2026): como mucho MAX_MAGICS_PER_RUN magias distintas por partida; el daño crece
// con el rango y con el daño del personaje (Xelima, Str en el Guerrero y Mag en la Maga, como sus armas); en vez de
// hadas (no existen en Helbreath), los Tutelary Angels del Angelic Pendant. Las combinaciones, más adelante.
// El aura, Eye of the Storm, solo frena, sin daño (propietario, 25-oct-2026: el aura de daño y las dagas eran el mismo
// papel; ahora el aura es control y las dagas, daño). Bloques: 28A el aura, 28B las dagas que giran (dagas, no espadas: propietario, 25-oct-2026), 28C los angelitos. Las que aún no funcionan tienen `ready: false`
// y no salen en las cartas.
import type { CharacterDef } from './characters';
import type { DamageType } from '../entities/CharacterStats';
import type { PassiveIcon } from './passives';

export type MagicId = 'aura' | 'daggers' | 'angels';

/** One rank of a magic: base damage of each hit (before the character's multipliers) and its reach. */
export interface MagicRank {
    /** 0 = it doesn't hurt (the aura only slows). */
    damage: number;
    /** Aura: share of their speed the monsters inside lose (0.25 = they go at 75%). Bosses lose AURA_BOSS_SLOW_SHARE of it. */
    slow?: number;
    /**
     * Aura: radius of the ring around the player's feet, in px (left and right; up and down, AURA_RING_Y_SHARE of it).
     * Daggers: radius of their circle around the player (up and down, DAGGER_ORBIT_Y_SHARE of it).
     */
    radiusPx: number;
    /** Daggers: how many circle at once. */
    count?: number;
    /** Daggers: turns per second. */
    turnsPerSecond?: number;
}

export interface MagicDef {
    name: string;
    /** One line for the card. */
    effect: string;
    icon: PassiveIcon;
    /** False until its block is done: it never shows up in the cards. */
    ready: boolean;
    /** Index 0 = rank 1. maxRank = ranks.length. */
    ranks: readonly MagicRank[];
    /** Aura: time between two slows. Daggers: time before the same monster can be hit again by any dagger. */
    hitEveryMs: number;
    /** Push on each hit (small: the aura only nudges them). */
    knockback: number;
}

/** At most this many different magics in one run (owner, 25-oct-2026). */
export const MAX_MAGICS_PER_RUN = 2;

export const MAGICS = {
    aura: {
        name: 'Eye of the Storm', effect: 'Howling winds slow the monsters around you',
        // Necklace of Efreet (item-pack.spr hoja 15, frame 41; sp-client constants/Items.ts).
        icon: { kind: 'item', sheet: 15, frame: 41 },
        ready: true,
        // No damage: from -25% to -50% of speed (walking, attacks and animation, like the ice). The ring grows a lot:
        // at rank 5, twice the first size (104 px; owner, 25-oct-2026: "too small").
        ranks: [
            { damage: 0, slow: 0.25, radiusPx: 62 },
            { damage: 0, slow: 0.3, radiusPx: 98 },
            { damage: 0, slow: 0.35, radiusPx: 134 },
            { damage: 0, slow: 0.42, radiusPx: 170 },
            { damage: 0, slow: 0.5, radiusPx: 208 },
        ],
        hitEveryMs: 500,
        knockback: 0,
    },
    daggers: {
        name: 'Spinning Daggers', effect: 'Glowing daggers circle around you',
        // Dagger (item-pack.spr hoja 0, frame 0, como en data/weapons.ts).
        icon: { kind: 'item', sheet: 0, frame: 0 },
        ready: true,
        // Rank 1: 2 daggers of 9 per hit before multipliers (like a Dagger swing), the same monster every 0,4 s at most.
        // With 6–12 (first try) the Mage's simulated run didn't change at all (25-oct-2026): raised ×1,5.
        ranks: [
            { damage: 9, radiusPx: 58, count: 2, turnsPerSecond: 0.55 },
            { damage: 11, radiusPx: 62, count: 3, turnsPerSecond: 0.6 },
            { damage: 13, radiusPx: 70, count: 3, turnsPerSecond: 0.65 },
            { damage: 15, radiusPx: 74, count: 4, turnsPerSecond: 0.7 },
            { damage: 18, radiusPx: 80, count: 5, turnsPerSecond: 0.75 },
        ],
        hitEveryMs: 400,
        knockback: 60,
    },
    angels: {
        name: 'Tutelary Angels', effect: 'Little angels attack nearby monsters',
        // Angelic Pendant (STR) (item-pack.spr hoja 19, frame 10).
        icon: { kind: 'item', sheet: 19, frame: 10 },
        ready: false,
        ranks: [{ damage: 0, radiusPx: 0 }],
        hitEveryMs: 1000,
        knockback: 0,
    },
} as const satisfies Record<MagicId, MagicDef>;

export const MAGIC_IDS = ['aura', 'daggers', 'angels'] as const satisfies readonly MagicId[];

/** Radius of the aura's ring (config/effects.ts) at scale 1, left to right (measured in the game): stretched to the rank's radius. */
export const AURA_RING_RADIUS_PX = 40;

/** The ring is drawn in perspective: up and down it reaches this share of its radius (measured in the game). */
export const AURA_RING_Y_SHARE = 0.55;

/** Bosses, mini-bosses and Champions lose only this share of the aura's slow (like the ice, which slows them less). */
export const AURA_BOSS_SLOW_SHARE = 0.5;

/** The slow lasts this long after its last touch: a bit longer than hitEveryMs, so it never flickers inside the ring. */
export const AURA_SLOW_MS = 700;

/**
 * Look of the monsters the aura slows: greyish white, for the wind (owner, 25-oct-2026), not the ice's blue. A tint
 * alone can only darken (dark monsters didn't change at all), so like the elites' red they are drawn from a copy of
 * their sheet with a flat white silhouette added in ADD mode (hb/glowTexture.ts, `fill`), and lightly tinted grey-blue.
 */
export const AURA_SLOW_LOOK = {
    glowTint: 0xffffff,
    glowAlpha: 0.4,
    tint: 0xdde2e8,
} as const;

/** ?debug=aura starts the run with the Damage Aura at this rank. */
export const AURA_DEBUG_RANK = 3;

/** Opacity of the aura's ring: half see-through, so it doesn't take over the scene (owner, 25-oct-2026). */
export const AURA_RING_ALPHA = 0.5;

/** ?debug=daggers starts the run with the Spinning Daggers at this rank. */
export const DAGGER_DEBUG_RANK = 3;

/** The daggers' circle is drawn in perspective, like the aura's ring: up and down it reaches this share of its radius. */
export const DAGGER_ORBIT_Y_SHARE = 0.6;

/** The daggers fly at the height of the player's chest (px above the feet), not on the ground. */
export const DAGGER_LIFT_PX = 30;

/** Reach of a dagger's blade (px): monsters whose body is this close to it get hit. */
export const DAGGER_HIT_RADIUS_PX = 18;

/**
 * Look of the daggers (owner, 25-oct-2026: "some kind of glow" so they aren't mistaken for the equipped dagger).
 * The blade is the Dagger on the ground (item-ground.spr, same sheet and frame as its icon), turned so the tip points
 * outwards (`tipAngleDeg` = where the tip points in the picture, measured in the game), and tinted light blue. Behind
 * it, a halo: a soft spot of light along the blade (ADD mode), breathing between `haloAlpha` min and max. (A copy of
 * the picture as the halo barely showed: the dagger is dark, and ADD over dark adds almost nothing.)
 */
export const DAGGER_LOOK = {
    sheet: 0,
    frame: 0,
    /** The picture on the ground is small (~16 px): bigger, so it reads at a glance. */
    scale: 1.8,
    tipAngleDeg: -45,
    /** The blade itself, lightly tinted towards this colour (ADD), so even without the halo it isn't a plain dagger. */
    bladeGlowColor: 0x66ccff,
    bladeGlowAlpha: 1,
    haloColor: 0x55c8ff,
    /** Size of the halo's spot along the blade and across it (px). */
    haloLengthPx: 46,
    haloWidthPx: 22,
    haloAlpha: { min: 0.55, max: 1 },
    /** One breath of the halo, in ms. */
    haloPulseMs: 700,
} as const;

export function getMagic(id: MagicId): MagicDef {
    return MAGICS[id];
}

export function magicMaxRank(id: MagicId): number {
    return getMagic(id).ranks.length;
}

/** Stats of a magic at a rank (1..max); undefined at rank 0. */
export function magicRank(id: MagicId, rank: number): MagicRank | undefined {
    if (rank <= 0) return undefined;
    const ranks = getMagic(id).ranks;
    return ranks[Math.min(rank, ranks.length) - 1];
}

/** The magics hit like the class's own weapon: physical for the Warrior (Str), magic for the Mage (Mag). */
export function magicDamageType(def: CharacterDef): DamageType {
    return def.startWeapon.kind === 'spell' ? 'magic' : 'physical';
}
