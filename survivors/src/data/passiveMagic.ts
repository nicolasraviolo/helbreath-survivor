// Magias pasivas de la partida (Fase 28): cartas para las dos clases que se consiguen y se suben de rango con las cartas
// de Power, y se pierden al terminar la partida (siguen con Continue).
// Decidido por el propietario (25-oct-2026): como mucho MAX_MAGICS_PER_RUN magias distintas por partida; el daño crece
// con el rango y con el daño del personaje (Xelima, Str en el Guerrero y Mag en la Maga, como sus armas); en vez de
// hadas (no existen en Helbreath), los Tutelary Angels del Angelic Pendant. Las combinaciones, más adelante.
// Bloques: 28A el aura, 28B las espadas que giran, 28C los angelitos. Las que aún no funcionan tienen `ready: false`
// y no salen en las cartas.
import type { CharacterDef } from './characters';
import type { DamageType } from '../entities/CharacterStats';
import type { PassiveIcon } from './passives';

export type MagicId = 'aura' | 'swords' | 'angels';

/** One rank of a magic: base damage of each hit (before the character's multipliers) and its reach. */
export interface MagicRank {
    damage: number;
    /** Aura: radius of the ring around the player's feet, in px (left and right; up and down, AURA_RING_Y_SHARE of it). */
    radiusPx: number;
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
    /** Time between two hits of the same magic. */
    hitEveryMs: number;
    /** Push on each hit (small: the aura only nudges them). */
    knockback: number;
}

/** At most this many different magics in one run (owner, 25-oct-2026). */
export const MAX_MAGICS_PER_RUN = 2;

export const MAGICS = {
    aura: {
        name: 'Damage Aura', effect: 'Hurts the monsters around you',
        // Necklace of Efreet (item-pack.spr hoja 15, frame 41; sp-client constants/Items.ts).
        icon: { kind: 'item', sheet: 15, frame: 41 },
        ready: true,
        // Rank 1 ≈ 6 damage per second to every monster inside (a Dagger does ~20 to the ones in its swing).
        ranks: [
            { damage: 3, radiusPx: 62 },
            { damage: 4, radiusPx: 72 },
            { damage: 5, radiusPx: 82 },
            { damage: 6, radiusPx: 92 },
            { damage: 8, radiusPx: 104 },
        ],
        hitEveryMs: 500,
        knockback: 20,
    },
    swords: {
        name: 'Spinning Swords', effect: 'Swords circle around you',
        // Short Sword (item-pack.spr hoja 0, frame 1).
        icon: { kind: 'item', sheet: 0, frame: 1 },
        ready: false,
        ranks: [{ damage: 0, radiusPx: 0 }],
        hitEveryMs: 1000,
        knockback: 0,
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

export const MAGIC_IDS = ['aura', 'swords', 'angels'] as const satisfies readonly MagicId[];

/** Radius of the aura's ring (config/effects.ts) at scale 1, left to right (measured in the game): stretched to the rank's radius. */
export const AURA_RING_RADIUS_PX = 40;

/** The ring is drawn in perspective: up and down it reaches this share of its radius (measured in the game). */
export const AURA_RING_Y_SHARE = 0.55;

/** ?debug=aura starts the run with the Damage Aura at this rank. */
export const AURA_DEBUG_RANK = 3;

/** Opacity of the aura's ring (it is under every monster: fully opaque would hide the ground too much). */
export const AURA_RING_ALPHA = 0.85;

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
