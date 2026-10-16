// Personajes jugables. Ahora se juega con el Mago (Energy Bolt); el Guerrero tendrá su arma en la Fase 6
// y la selección de personaje llega en la Fase 8 (docs/DESIGN.md).
import type { Appearance } from '../hb/playerAppearance';
import type { Stats } from './stats';

export interface CharacterDef {
    name: string;
    /** Movement speed in pixels per second, before Dex. */
    speed: number;
    /** Half the side of the square used for wall collision, centred on the feet. */
    hitboxHalfSize: number;
    /** Animation speed (frames per second; every animation has 8 frames). */
    idleFrameRate: number;
    runFrameRate: number;
    /** Death animation speed (frames per second; 8 frames, played once). */
    dieFrameRate: number;
    /** Health before Vit and level (see data/stats.ts). */
    baseHp: number;
    /** Time without taking damage after a hit, in milliseconds. */
    invulnerabilityMs: number;
    /** Stats at level 1 (decided by the owner; the original allows 10–14 each and 70 in total). */
    startStats: Stats;
    /** Points added automatically on every level up. */
    statsPerLevel: Partial<Stats>;
    /** Class bonuses from docs/DESIGN.md, as multipliers (1 = no bonus). */
    hpMultiplier: number;
    physicalDamageMultiplier: number;
    magicDamageMultiplier: number;
    /** Multiplies weapon cooldowns (0.9 = 10% shorter). */
    cooldownMultiplier: number;
    appearance: Appearance;
}

/** Guerrero: cota de malla + armadura de placas, perneras, botas altas, casco completo, espada larga y escudo de caballero (índices de sp-client/src/constants/Items.ts). */
export const WARRIOR_LOOK = {
    human: { sprite: 'player.body.wm' },
    hair: { sprite: 'player.hair.mhr', variant: 0 },
    underwear: { sprite: 'player.underwear.mpt', variant: 0 },
    hauberk: { sprite: 'gear.hauberk.m' },
    leggings: { sprite: 'gear.leggings.plate.m' },
    boots: { sprite: 'gear.boots.long.m' },
    helm: { sprite: 'gear.helm.full.m' },
    armor: { sprite: 'gear.armor.plate.m' },
    weapon: { sprite: 'gear.swords.m', startSheet: 112 },
    shield: { sprite: 'gear.shields.m', startSheet: 49 },
} as const satisfies Appearance;

/** Mago: túnica, sombrero de mago, botas altas y varita (cada varita tiene su propio archivo, así que empieza en la hoja 0). */
export const MAGE_LOOK = {
    human: { sprite: 'player.body.wm' },
    hair: { sprite: 'player.hair.mhr', variant: 0 },
    underwear: { sprite: 'player.underwear.mpt', variant: 0 },
    boots: { sprite: 'gear.boots.long.m' },
    helm: { sprite: 'gear.helm.wizard.m' },
    armor: { sprite: 'gear.armor.robe.m' },
    weapon: { sprite: 'gear.wand.m', startSheet: 0 },
} as const satisfies Appearance;

const COMMON = {
    speed: 150,
    hitboxHalfSize: 8,
    idleFrameRate: 8,
    runFrameRate: 14,
    dieFrameRate: 10,
    baseHp: 60,
    invulnerabilityMs: 600,
} as const;

export const CHARACTERS = {
    mage: {
        ...COMMON,
        name: 'Mage',
        startStats: { str: 12, vit: 10, dex: 10, int: 14, mag: 14, chr: 10 },
        // Decidido por el propietario: 3 puntos por nivel (1 Int y 2 Mag). Si resulta demasiado, se ajusta.
        statsPerLevel: { int: 1, mag: 2 },
        hpMultiplier: 1,
        physicalDamageMultiplier: 1,
        // +15% daño mágico y −10% de recarga (docs/DESIGN.md).
        magicDamageMultiplier: 1.15,
        cooldownMultiplier: 0.9,
        appearance: MAGE_LOOK,
    },
    warrior: {
        ...COMMON,
        name: 'Warrior',
        startStats: { str: 14, vit: 12, dex: 14, int: 10, mag: 10, chr: 10 },
        statsPerLevel: { str: 1, vit: 1 },
        // +20% vida y +10% daño físico (docs/DESIGN.md).
        hpMultiplier: 1.2,
        physicalDamageMultiplier: 1.1,
        magicDamageMultiplier: 1,
        cooldownMultiplier: 1,
        appearance: WARRIOR_LOOK,
    },
} as const satisfies Record<string, CharacterDef>;

export type CharacterId = keyof typeof CHARACTERS;

export const DEFAULT_CHARACTER: CharacterId = 'mage';
