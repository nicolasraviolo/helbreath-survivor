// Clases jugables. Desde el 22-oct-2026 cada cuenta trae un personaje fijo de cada una (data/characterSlots.ts).
// El Mago dispara Energy Bolt; el Guerrero lleva un arma cuerpo a cuerpo y armadura (Fase 6, data/weapons.ts y data/armor.ts).
// Stats iniciales fijos por clase (decidido por el propietario el 16-oct-2026). Desde la Fase 17B el sexo, la piel y el
// pelo van aparte (data/appearance.ts; fijos por personaje desde el 22-oct-2026): el aspecto de aquí es la ropa de salida, que se dibuja para su sexo.
import type { SpriteKey } from '../config/assetManifest';
import type { Appearance } from '../hb/playerAppearance';
import type { Stats } from './stats';
import type { ArmorSetId } from './armor';
import type { AutoSpellId } from './spells';
import type { MeleeWeaponId } from './weapons';

/** Weapon the class starts with: a spell that shoots projectiles, or a melee weapon held in the hand. */
export type StartWeapon = { kind: 'spell'; id: AutoSpellId } | { kind: 'melee'; id: MeleeWeaponId };

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
    /**
     * Clothes at level 1, drawn for the character's gender (body, hair and underwear come from its look).
     * The melee weapon layer is replaced by the weapon in hand.
     */
    appearance: Appearance;
    startWeapon: StartWeapon;
    /** Which pieces of data/armor.ts the class can wear (their cards only show up for it). */
    armorSet: ArmorSetId;
    /**
     * Effects only this class uses (Fase 22B): downloaded with the map, after RUN_SPRITES (config/assetManifest.ts).
     * Big ones that depend on what is equipped (Meteor Strike) are downloaded during the run instead (ON_DEMAND_SPRITES).
     */
    runSprites: readonly SpriteKey[];
}

/** Guerrero al empezar: camisa, pantalón, botas altas y daga. La armadura se gana con las cartas (data/armor.ts). */
export const WARRIOR_LOOK = {
    human: { sprite: 'player.body.wm' },
    hair: { sprite: 'player.hair.mhr', variant: 0 },
    underwear: { sprite: 'player.underwear.mpt', variant: 0 },
    hauberk: { sprite: 'gear.shirt.m' },
    leggings: { sprite: 'gear.trousers.m' },
    boots: { sprite: 'gear.boots.long.m' },
    weapon: { sprite: 'gear.swords.m', startSheet: 0 },
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

/**
 * Maga (pedida por el propietario el 16-oct-2026) al empezar: corpiño, falda, botas y varita.
 * La túnica y el gorro se ganan con las cartas (data/armor.ts). La varita es fija: solo estética (no evoluciona).
 */
export const MAGE_FEMALE_LOOK = {
    human: { sprite: 'player.body.ww' },
    hair: { sprite: 'player.hair.whr', variant: 0 },
    underwear: { sprite: 'player.underwear.wpt', variant: 0 },
    hauberk: { sprite: 'gear.bodice.w' },
    leggings: { sprite: 'gear.skirt.w' },
    boots: { sprite: 'gear.boots.long.w' },
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
        description: ['Master of the arcane arts.', '', '+15% magic damage', '-10% weapon cooldown', '+1 Int and +1 Mag every level'],
        startStats: { str: 12, vit: 10, dex: 10, int: 14, mag: 14, chr: 10 },
        // Fase 13C (18-oct-2026, con OK del propietario): 2 puntos por nivel como el Guerrero (antes 1 Int y 2 Mag).
        statsPerLevel: { int: 1, mag: 1 },
        hpMultiplier: 1,
        physicalDamageMultiplier: 1,
        // +15% daño mágico y −10% de recarga (docs/DESIGN.md).
        magicDamageMultiplier: 1.15,
        cooldownMultiplier: 0.9,
        appearance: MAGE_FEMALE_LOOK,
        startWeapon: { kind: 'spell', id: 'energyBolt' },
        armorSet: 'mage',
        // Explosions of Fire Ball and the other spells (config/effects.ts, fx.explosion1–3).
        runSprites: ['fx.effect3'],
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
        startWeapon: { kind: 'melee', id: 'dagger' },
        armorSet: 'warrior',
        runSprites: [],
    },
} as const satisfies Record<string, CharacterDef>;

export type CharacterId = keyof typeof CHARACTERS;

export const DEFAULT_CHARACTER: CharacterId = 'mage';

/** Registry key (game.registry) with the CharacterId chosen on the selection screen. */
export const CHOSEN_CHARACTER_KEY = 'chosenCharacter';

export function isCharacterId(value: unknown): value is CharacterId {
    return typeof value === 'string' && value in CHARACTERS;
}
