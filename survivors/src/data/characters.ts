// Personajes jugables, elegidos en la pantalla "Create New Character" (scenes/CharacterSelectScene.ts).
// De momento los dos disparan Energy Bolt; el Guerrero tendrá su arma en la Fase 6 (docs/DESIGN.md).
// Nombre, aspecto y stats iniciales son fijos por ahora (decidido por el propietario el 16-oct-2026).
import type { Appearance } from '../hb/playerAppearance';
import type { Stats } from './stats';

export interface CharacterDef {
    /** Class name. */
    name: string;
    /** Fixed character name shown on the selection screen. */
    playerName: string;
    /** Lines shown on the selection screen. */
    description: readonly string[];
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

/** Mago (versión masculina, sin uso ahora): túnica, sombrero de mago, botas altas y varita (cada varita tiene su propio archivo, así que empieza en la hoja 0). */
export const MAGE_LOOK = {
    human: { sprite: 'player.body.wm' },
    hair: { sprite: 'player.hair.mhr', variant: 0 },
    underwear: { sprite: 'player.underwear.mpt', variant: 0 },
    boots: { sprite: 'gear.boots.long.m' },
    helm: { sprite: 'gear.helm.wizard.m' },
    armor: { sprite: 'gear.armor.robe.m' },
    weapon: { sprite: 'gear.wand.m', startSheet: 0 },
} as const satisfies Appearance;

/** Maga (pedida por el propietario el 16-oct-2026): el mismo equipo en versión femenina, con Wizard Cap en vez de Wizard Hat. */
export const MAGE_FEMALE_LOOK = {
    human: { sprite: 'player.body.ww' },
    hair: { sprite: 'player.hair.whr', variant: 0 },
    underwear: { sprite: 'player.underwear.wpt', variant: 0 },
    boots: { sprite: 'gear.boots.long.w' },
    helm: { sprite: 'gear.helm.wizardCap.w' },
    armor: { sprite: 'gear.armor.robe.w' },
    weapon: { sprite: 'gear.wand.w', startSheet: 0 },
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
        playerName: 'NMs',
        description: ['Master of the arcane arts.', '', '+15% magic damage', '-10% weapon cooldown', '+1 Int and +2 Mag every level'],
        startStats: { str: 12, vit: 10, dex: 10, int: 14, mag: 14, chr: 10 },
        // Decidido por el propietario: 3 puntos por nivel (1 Int y 2 Mag). Si resulta demasiado, se ajusta.
        statsPerLevel: { int: 1, mag: 2 },
        hpMultiplier: 1,
        physicalDamageMultiplier: 1,
        // +15% daño mágico y −10% de recarga (docs/DESIGN.md).
        magicDamageMultiplier: 1.15,
        cooldownMultiplier: 0.9,
        appearance: MAGE_FEMALE_LOOK,
    },
    warrior: {
        ...COMMON,
        name: 'Warrior',
        playerName: 'NkII',
        description: ['Tough fighter in heavy armor.', '', '+20% health', '+10% physical damage', '+1 Str and +1 Vit every level'],
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

/** Registry key (game.registry) with the CharacterId chosen on the selection screen. */
export const CHOSEN_CHARACTER_KEY = 'chosenCharacter';

export function isCharacterId(value: unknown): value is CharacterId {
    return typeof value === 'string' && value in CHARACTERS;
}
