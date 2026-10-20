// Atributos de las armas (Fase 21B; decididos por el propietario el 20-oct-2026, docs/DECISIONES.md):
// - Solo armas: las del Guerrero y las varitas de la Maga. Poison nunca sale en una varita.
// - Probabilidad al caer: Ancient 1%, Poison 5%, Sharp 10% (el resto, normal).
// - Sharp +10% de daño y Ancient +20% (el original sumaba +1 o +2 al dado, ≈ +11% y +22%). En la Maga, a sus hechizos.
// - Las cartas Xelima también suben las armas Ancient (el original no lo dejaba; el propietario prefirió ignorarlo).
// - Poison, como el veneno de los jugadores del original (reference/Server.cpp:33105, PoisonEffect): al golpear envenena
//   si el monstruo no lo estaba; cada tic quita 1d(nivel) y tiene un 10% de curarse solo (no dura un tiempo fijo). A
//   diferencia del jugador, PUEDE MATAR (propietario, 20-oct-2026; como el Poison Cloud del original con los monstruos).
//   El nivel es número NUESTRO: parte del golpe que envenenó. Mientras dura, la nube verde del original encima
//   (effect9 hoja 15, Client.cpp:42148). Números verdes.
// - Color del arma (Server.cpp:48721 y Client.cpp:702): el original tiñe el DIBUJO del arma según el atributo, sumando
//   un poco a cada píxel (en la mano, el icono y el suelo): Sharp "Heavy-blue", Poisoning "Green", Ancient "Violet".
import type { AddedColor } from '../hb/playerAppearance';

export type ItemAttribute = 'sharp' | 'poison' | 'ancient';

export const ITEM_ATTRIBUTES: readonly ItemAttribute[] = ['sharp', 'poison', 'ancient'];

export interface AttributeDef {
    /** Written before the item's name ("Sharp Long Sword"). */
    name: string;
    /** Chance that a dropped weapon comes with it (0..1). */
    chance: number;
    /** Extra damage of the weapon (0.1 = +10%); for a wand, of the spells. */
    damageBonus: number;
    /** Whether a wand can have it. */
    onWands: boolean;
    /** Line on the loot card and the Equipment screen. */
    description: string;
    /** Colour of the name (cards, Equipment) and of the frame on the end screen. */
    color: number;
    /**
     * Added to every pixel of the weapon's picture (in hand, icon, ground): the original's weapon colour minus its base
     * RGB(100,100,100) (reference/Client.cpp:705-709).
     */
    pictureAdd: readonly [number, number, number];
}

export const ATTRIBUTES: Readonly<Record<ItemAttribute, AttributeDef>> = {
    ancient: {
        name: 'Ancient', chance: 0.01, damageBonus: 0.2, onWands: true, description: 'Ancient: +20% damage', color: 0xff90e0, pictureAdd: [20, 0, 20],
    },
    poison: {
        name: 'Poison', chance: 0.05, damageBonus: 0, onWands: false, description: 'Poison: poisons the monsters you hit', color: 0x60e060,
        pictureAdd: [-30, 0, -30],
    },
    sharp: {
        name: 'Sharp', chance: 0.1, damageBonus: 0.1, onWands: true, description: 'Sharp: +10% damage', color: 0x80c8ff, pictureAdd: [-58, -47, 11],
    },
};

/** From the rarest to the most common: the order of the drop roll. */
export const ATTRIBUTE_ROLL_ORDER: readonly ItemAttribute[] = ['ancient', 'poison', 'sharp'];

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
    return attribute ? { id: `attr-${attribute}`, add: ATTRIBUTES[attribute].pictureAdd } : undefined;
}
