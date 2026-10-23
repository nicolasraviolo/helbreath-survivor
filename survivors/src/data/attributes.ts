// Atributos de las armas y, desde la Fase 24A, de las armaduras (Fase 21B; decididos por el propietario el 20-oct-2026, docs/DECISIONES.md):
// - Solo armas: las del Guerrero y las varitas de la Maga. Poison nunca sale en una varita.
// - Probabilidad al caer (hasta la Fase 24A): Ancient 1%, Poison 5%, Sharp 10% (el resto, normal). Desde la 24A, siempre uno.
// - Sharp +10% de daño y Ancient +20% (el original sumaba +1 o +2 al dado, ≈ +11% y +22%). En la Maga, a sus hechizos.
// - Las cartas Xelima también suben las armas Ancient (el original no lo dejaba; el propietario prefirió ignorarlo).
// - Poison, como el veneno de los jugadores del original (reference/Server.cpp:33105, PoisonEffect): al golpear envenena
//   si el monstruo no lo estaba; cada tic quita 1d(nivel) y tiene un 10% de curarse solo (no dura un tiempo fijo). A
//   diferencia del jugador, PUEDE MATAR (propietario, 20-oct-2026; como el Poison Cloud del original con los monstruos).
//   El nivel es número NUESTRO: parte del golpe que envenenó. Mientras dura, la nube verde del original encima
//   (effect9 hoja 15, Client.cpp:42148). Números verdes.
// - Color del arma (Server.cpp:48721 y Client.cpp:702): el original tiñe el DIBUJO del arma según el atributo, sumando
//   un poco a cada píxel (en la mano, el icono y el suelo): Sharp "Heavy-blue", Poisoning "Green", Ancient "Violet".
// Fase 24A (propietario, 21-oct-2026): ya no caen armas ni armaduras básicas (se compran al herrero, 24C). Todo lo que
// cae trae un atributo: las armas, Sharp, Poison o Ancient (con los mismos pesos 10/5/1 de antes); las armaduras, uno de
// los "stats" de las armaduras del original con sus nombres (docs/hb-wiki/armaduras.md, "Armor Attributes"):
// HP Recovery, MP Recovery, Defense Ratio y Magic Resistance. Valores fijos nuestros. MP Recovery solo en la ropa de la
// Maga; desde la Fase 26A rellena el maná un 30% más deprisa.
import type { ArmorSetId } from './armor';
import type { AddedColor } from '../hb/playerAppearance';

export type WeaponAttribute = 'sharp' | 'poison' | 'ancient';
export type ArmorAttribute = 'hpRecovery' | 'mpRecovery' | 'defenseRatio' | 'magicResistance';
export type ItemAttribute = WeaponAttribute | ArmorAttribute;

export const WEAPON_ATTRIBUTES: readonly WeaponAttribute[] = ['sharp', 'poison', 'ancient'];
export const ARMOR_ATTRIBUTES: readonly ArmorAttribute[] = ['hpRecovery', 'defenseRatio', 'magicResistance', 'mpRecovery'];
export const ITEM_ATTRIBUTES: readonly ItemAttribute[] = [...WEAPON_ATTRIBUTES, ...ARMOR_ATTRIBUTES];

export interface AttributeDef {
    /** Weapon attributes go before the item's name ("Sharp Long Sword"); armor ones only in its description. */
    kind: 'weapon' | 'armor';
    name: string;
    /** Weight in the roll of a dropped item of its kind (every drop has one attribute). */
    weight: number;
    /** Extra damage of the weapon (0.1 = +10%); for a wand, of the spells. */
    damageBonus: number;
    /** Whether a wand can have it (weapon attributes). */
    onWands: boolean;
    /** Armor attributes only on that set's pieces (MP Recovery: the Mage's clothes). */
    onlySet?: ArmorSetId;
    /** Armor: extra health healed by itself (0.3 = +30% of the Vit regeneration). */
    hpRecovery?: number;
    /** Armor: extra mana regeneration (no effect yet: mana is not spent). */
    mpRecovery?: number;
    /** Armor: defense ratio added (more dodge, data/defense.ts). */
    defenseRatio?: number;
    /** Armor: magic resistance added (data/defense.ts). */
    magicResistance?: number;
    /** Line on the loot card and the Equipment screen. */
    description: string;
    /** Colour of the name (cards, Equipment) and of the frame on the end screen. */
    color: number;
    /**
     * Weapons: added to every pixel of the weapon's picture (in hand, icon, ground): the original's weapon colour minus its
     * base RGB(100,100,100) (reference/Client.cpp:705-709). Armor isn't tinted.
     */
    pictureAdd?: readonly [number, number, number];
}

export const ATTRIBUTES: Readonly<Record<ItemAttribute, AttributeDef>> = {
    ancient: {
        kind: 'weapon', name: 'Ancient', weight: 1, damageBonus: 0.2, onWands: true, description: 'Ancient: +20% damage', color: 0xff90e0, pictureAdd: [20, 0, 20],
    },
    poison: {
        kind: 'weapon', name: 'Poison', weight: 5, damageBonus: 0, onWands: false, description: 'Poison: poisons the monsters you hit', color: 0x60e060,
        pictureAdd: [-30, 0, -30],
    },
    sharp: {
        kind: 'weapon', name: 'Sharp', weight: 10, damageBonus: 0.1, onWands: true, description: 'Sharp: +10% damage', color: 0x80c8ff, pictureAdd: [-58, -47, 11],
    },
    hpRecovery: {
        kind: 'armor', name: 'HP Recovery', weight: 30, damageBonus: 0, onWands: false, hpRecovery: 0.3,
        description: 'HP Recovery +30%', color: 0xff8070,
    },
    defenseRatio: {
        kind: 'armor', name: 'Defense Ratio', weight: 30, damageBonus: 0, onWands: false, defenseRatio: 10,
        description: 'Defense Ratio +10 (dodge)', color: 0xffd060,
    },
    magicResistance: {
        kind: 'armor', name: 'Magic Resistance', weight: 25, damageBonus: 0, onWands: false, magicResistance: 8,
        description: 'Magic Resistance +8', color: 0xc090ff,
    },
    mpRecovery: {
        kind: 'armor', name: 'MP Recovery', weight: 15, damageBonus: 0, onWands: false, onlySet: 'mage', mpRecovery: 0.3,
        description: 'MP Recovery +30%', color: 0x70b0ff,
    },
};

/** Poison on a monster (original: PoisonEffect, Server.cpp:33105). */
export const POISON = {
    /** Time between ticks (the original's DEF_POISONTIME isn't in the reference: our number). */
    tickMs: 1000,
    /** Poison level = this share of the blow that poisoned; each tick takes 1d(level), about half of it. */
    levelShare: 0.4,
    /** Chance of being cured after each tick (the original's minimum, 10%, for a monster without resistance). */
    cureChance: 0.1,
    /** Green numbers of each tick. */
    numberColor: '#60e060',
    /** The original's poison cloud over the poisoned one, drawn 70% opaque (Client.cpp:42148, PutTransSprite70). */
    cloudAlpha: 0.7,
} as const;

export function isItemAttribute(value: unknown): value is ItemAttribute {
    return typeof value === 'string' && (ITEM_ATTRIBUTES as readonly string[]).includes(value);
}

export function attributeDamageBonus(attribute: ItemAttribute | undefined): number {
    return attribute ? ATTRIBUTES[attribute].damageBonus : 0;
}

/** The colour added to a weapon's picture with that attribute (undefined without one). */
export function attributeColor(attribute: ItemAttribute | undefined): AddedColor | undefined {
    const add = attribute ? ATTRIBUTES[attribute].pictureAdd : undefined;
    return attribute && add ? { id: `attr-${attribute}`, add } : undefined;
}
