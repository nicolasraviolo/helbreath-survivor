// Helbreath Off (Fase Off-3C): el equipo. Objetos de prueba con los números del original hasta que haya inventario,
// botín y tienda (Off-4; decisión del 7-nov-2026: el cuadro de stats se prueba con objetos de prueba).
// - Números de reference/Item.cfg: tras el nombre van tipo, hueco, efecto, 6 valores, ..., precio, peso, ..., velocidad.
//   · Armas (efecto 1): los valores son los dados contra pequeños (3) y grandes (3).
//   · Armaduras (efecto 2): el primer valor es la defensa que suma (server: m_iDefenseRatio += valor 1).
//   · STR para equipar cualquier objeto = peso / 100 (el cliente original no deja ponérselo con menos).
// - Cada objeto se dibuja con el objeto igual de Survivors (`look`): su icono de item-pack.spr y su capa sobre el cuerpo.
// - 8 huecos (PLAN-OFF): arma, escudo, casco, armadura, pantalones, botas, capa y anillo. El anillo, apagado hasta que
//   haya anillos.
// - Alcance: 1 casilla para todas las armas de prueba (el original no las distingue en Item.cfg).
import type { ArmorPieceId } from '../../data/armor';
import type { SavedEquipment } from '../../data/items';
import type { MeleeWeaponId } from '../../data/weapons';
import type { OffWeaponDef } from './offCombat';

/** Slots that hold something, in the order of the Equipment screen. */
export const OFF_GEAR_SLOT_IDS = ['weapon', 'shield', 'helm', 'body', 'legs', 'boots', 'cape'] as const;
export type OffSlotId = (typeof OFF_GEAR_SLOT_IDS)[number];
/** Shown greyed under the others until there are items for them. */
export const OFF_FUTURE_SLOTS = ['Ring'] as const;

export interface OffWeaponItem extends OffWeaponDef {
    kind: 'weapon';
    slot: 'weapon';
    look: MeleeWeaponId;
}

export interface OffArmorItem {
    kind: 'armor';
    name: string;
    slot: Exclude<OffSlotId, 'weapon'>;
    /** Added to the defence (2 × DEX + the armour's). */
    defense: number;
    strToEquip: number;
    look: ArmorPieceId;
}

export type OffItemDef = OffWeaponItem | OffArmorItem;

export const OFF_ITEMS = {
    // Item.cfg 1: 1d5 / 1d4, weight 200, speed 0.
    dagger: { kind: 'weapon', slot: 'weapon', name: 'Dagger', small: [1, 5, 0], large: [1, 4, 0], range: 1, strToEquip: 2, speed: 0, look: 'dagger' },
    // Item.cfg 8: 1d6 / 1d5, weight 800, speed 2.
    shortSword: { kind: 'weapon', slot: 'weapon', name: 'Short Sword', small: [1, 6, 0], large: [1, 5, 0], range: 1, strToEquip: 8, speed: 2, look: 'shortSword' },
    // Item.cfg 59: 1d6 / 1d7, weight 1400, speed 3.
    lightAxe: { kind: 'weapon', slot: 'weapon', name: 'Light Axe', small: [1, 6, 0], large: [1, 7, 0], range: 1, strToEquip: 14, speed: 3, look: 'lightAxe' },
    // Item.cfg 17: 1d9 / 1d10, weight 1400, speed 6.
    longSword: { kind: 'weapon', slot: 'weapon', name: 'Long Sword', small: [1, 9, 0], large: [1, 10, 0], range: 1, strToEquip: 14, speed: 6, look: 'longSword' },
    // Item.cfg 79: defence 8, weight 800.
    woodShield: { kind: 'armor', slot: 'shield', name: 'Wood Shield', defense: 8, strToEquip: 8, look: 'woodShield' },
    // Item.cfg 600 Helm(M): defence 5, weight 5200 (heavy: a test of a requirement not met).
    helmet: { kind: 'armor', slot: 'helm', name: 'Helmet', defense: 5, strToEquip: 52, look: 'helmet' },
    // Item.cfg 455 LeatherArmor(M): defence 10, weight 1500.
    leatherArmor: { kind: 'armor', slot: 'body', name: 'Leather Armor', defense: 10, strToEquip: 15, look: 'leatherArmor' },
    // Item.cfg 461 ChainHose(M): defence 6, weight 1000.
    chainHose: { kind: 'armor', slot: 'legs', name: 'Chain Hose', defense: 6, strToEquip: 10, look: 'chainHose' },
    // Item.cfg 450 / 451: defence 1, weight 200 / 500.
    shoes: { kind: 'armor', slot: 'boots', name: 'Shoes', defense: 1, strToEquip: 2, look: 'shoes' },
    longBoots: { kind: 'armor', slot: 'boots', name: 'Long Boots', defense: 1, strToEquip: 5, look: 'longBoots' },
    // Item.cfg 402: defence 2, weight 200.
    cape: { kind: 'armor', slot: 'cape', name: 'Cape', defense: 2, strToEquip: 2, look: 'cape' },
} as const satisfies Record<string, OffItemDef>;

export type OffItemId = keyof typeof OFF_ITEMS;
export type OffEquipment = Partial<Record<OffSlotId, OffItemId>>;

export function isOffItemId(id: string): id is OffItemId {
    return Object.prototype.hasOwnProperty.call(OFF_ITEMS, id);
}

export function offItem(id: OffItemId): OffItemDef {
    return OFF_ITEMS[id];
}

/** What a new character wears (the weapon slot is never empty). */
export const OFF_START_EQUIPMENT: Readonly<OffEquipment> = { weapon: 'dagger' };

/** Until the inventory (Off-4): every test item can be chosen in its slot. */
export function offItemsFor(slot: OffSlotId): OffItemId[] {
    return (Object.keys(OFF_ITEMS) as OffItemId[]).filter((id) => OFF_ITEMS[id].slot === slot).sort((a, b) => OFF_ITEMS[a].strToEquip - OFF_ITEMS[b].strToEquip);
}

export function canEmptyOffSlot(slot: OffSlotId): boolean {
    return slot !== 'weapon';
}

/** The weapon held (the Dagger if the saved one is missing). */
export function offWeapon(equipment: Readonly<OffEquipment>): OffWeaponItem {
    const id = equipment.weapon;
    const item = id ? OFF_ITEMS[id] : undefined;
    return item?.kind === 'weapon' ? item : OFF_ITEMS.dagger;
}

/** Defence the worn armour adds. */
export function offArmorDefense(equipment: Readonly<OffEquipment>): number {
    let total = 0;
    for (const id of Object.values(equipment)) {
        const item = OFF_ITEMS[id];
        if (item.kind === 'armor') total += item.defense;
    }
    return total;
}

/** The same equipment as Survivors items, to draw it (paper doll, icons, layers on the body). */
export function offEquipmentLook(equipment: Readonly<OffEquipment>): SavedEquipment {
    const look: SavedEquipment = {};
    for (const slot of OFF_GEAR_SLOT_IDS) {
        const id = equipment[slot];
        if (id) look[slot] = OFF_ITEMS[id].look;
    }
    return look;
}

/** Equipment read back from a save: unknown items and items in the wrong slot are dropped; always a weapon. */
export function readOffEquipment(value: unknown): OffEquipment {
    const equipment: OffEquipment = { ...OFF_START_EQUIPMENT };
    if (typeof value !== 'object' || value === null) return equipment;
    for (const slot of OFF_GEAR_SLOT_IDS) {
        const id: unknown = (value as Record<string, unknown>)[slot];
        if (typeof id === 'string' && isOffItemId(id) && OFF_ITEMS[id].slot === slot) equipment[slot] = id;
        else if (canEmptyOffSlot(slot)) delete equipment[slot];
    }
    return equipment;
}

/** Average of some dice (to tell which weapon hits harder). */
export function diceAverage([count, sides, bonus]: readonly [number, number, number]): number {
    return (count * (sides + 1)) / 2 + bonus;
}
