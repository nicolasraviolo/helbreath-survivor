// Helbreath Off (Fase Off-3C): el equipo, con los números del original. Desde la Off-4B solo te pones lo que llevas en
// la bolsa (botín del suelo; la tienda llega en la Off-5).
// - Números de reference/Item.cfg: tras el nombre van tipo, hueco, efecto, 6 valores, ..., precio, peso, ..., velocidad.
//   · Armas (efecto 1): los valores son los dados contra pequeños (3) y grandes (3).
//   · Armaduras (efecto 2): el primer valor es la defensa que suma (server: m_iDefenseRatio += valor 1).
//   · STR para equipar cualquier objeto = peso / 100 (el cliente original no deja ponérselo con menos).
// - Cada objeto se dibuja con el objeto igual de Survivors (`look`): su icono de item-pack.spr y su capa sobre el cuerpo.
// - 8 huecos (PLAN-OFF): arma, escudo, casco, armadura, pantalones, botas, capa y anillo. El anillo, apagado hasta que
//   haya anillos.
// - Alcance: 1 casilla para todas las armas de prueba (el original no las distingue en Item.cfg).
// Fase Off-5B: todo lo que Survivors sabe dibujar (salvo la espada única de hielo y las varitas, que irán con las
// magias), para el herrero. Cada objeto lleva su precio (Item.cfg, tras el número de dibujo) y, si lo pide, el Level
// mínimo para ponérselo (Item.cfg, el valor que va tras la velocidad: Battle Hammer 110, Winged Helmet 100...).
// Las piezas (M)/(W) del original son una sola: el dibujo cambia con el sexo (Survivors).
import type { ArmorPieceId } from '../../data/armor';
import type { Gender } from '../../data/appearance';
import { itemIcon, type SavedEquipment } from '../../data/items';
import type { ItemIconFrame } from '../../data/itemTypes';
import { isOffGoodId, OFF_GOODS, type OffGoodId } from './offGoods';
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
    /** Item.cfg price in gold (shops buy it back for OFF_SELL_SHARE of it). */
    price: number;
    /** Item.cfg minimum level to wear it; none if missing. */
    levelToEquip?: number;
}

export interface OffArmorItem {
    kind: 'armor';
    name: string;
    slot: Exclude<OffSlotId, 'weapon'>;
    /** Added to the defence (2 × DEX + the armour's). */
    defense: number;
    strToEquip: number;
    look: ArmorPieceId;
    price: number;
    levelToEquip?: number;
}

export type OffItemDef = OffWeaponItem | OffArmorItem;

export const OFF_ITEMS = {
    // ---- Weapons. Item.cfg number: dice against small / large, price, weight (STR = weight / 100), speed, level. ----
    // 1: 1d5 / 1d4, 25, 200, 0.
    dagger: { kind: 'weapon', slot: 'weapon', name: 'Dagger', small: [1, 5, 0], large: [1, 4, 0], range: 1, strToEquip: 2, speed: 0, price: 25, look: 'dagger' },
    // 8: 1d6 / 1d5, 50, 800, 2.
    shortSword: { kind: 'weapon', slot: 'weapon', name: 'Short Sword', small: [1, 6, 0], large: [1, 5, 0], range: 1, strToEquip: 8, speed: 2, price: 50, look: 'shortSword' },
    // 34: 1d7 / 1d10, 300, 1100, 3.
    rapier: { kind: 'weapon', slot: 'weapon', name: 'Rapier', small: [1, 7, 0], large: [1, 10, 0], range: 1, strToEquip: 11, speed: 3, price: 300, look: 'rapier' },
    // 59: 1d6 / 1d7, 100, 1400, 3.
    lightAxe: { kind: 'weapon', slot: 'weapon', name: 'Light Axe', small: [1, 6, 0], large: [1, 7, 0], range: 1, strToEquip: 14, speed: 3, price: 100, look: 'lightAxe' },
    // 17: 1d9 / 1d10, 180, 1400, 6.
    longSword: { kind: 'weapon', slot: 'weapon', name: 'Long Sword', small: [1, 9, 0], large: [1, 10, 0], range: 1, strToEquip: 14, speed: 6, price: 180, look: 'longSword' },
    // 62 Tomahoc: 2d3 / 2d4, 180, 1700, 4.
    tomahawk: { kind: 'weapon', slot: 'weapon', name: 'Tomahawk', small: [2, 3, 0], large: [2, 4, 0], range: 1, strToEquip: 17, speed: 4, price: 180, look: 'tomahawk' },
    // 25: 1d10 / 1d12, 200, 1800, 6.
    scimitar: { kind: 'weapon', slot: 'weapon', name: 'Scimitar', small: [1, 10, 0], large: [1, 12, 0], range: 1, strToEquip: 18, speed: 6, price: 200, look: 'scimitar' },
    // 28: 1d12 / 2d7, 250, 2200, 6.
    falchion: { kind: 'weapon', slot: 'weapon', name: 'Falchion', small: [1, 12, 0], large: [2, 7, 0], range: 1, strToEquip: 22, speed: 6, price: 250, look: 'falchion' },
    // 38: 2d7 / 2d8, 250, 2800, 6.
    broadSword: { kind: 'weapon', slot: 'weapon', name: 'Broad Sword', small: [2, 7, 0], large: [2, 8, 0], range: 1, strToEquip: 28, speed: 6, price: 250, look: 'broadSword' },
    // 68: 3d3 / 3d3, 560, 3300, 5.
    doubleAxe: { kind: 'weapon', slot: 'weapon', name: 'Double Axe', small: [3, 3, 0], large: [3, 3, 0], range: 1, strToEquip: 33, speed: 5, price: 560, look: 'doubleAxe' },
    // 46: 2d9 / 2d10, 400, 4000, 7.
    claymore: { kind: 'weapon', slot: 'weapon', name: 'Claymore', small: [2, 9, 0], large: [2, 10, 0], range: 1, strToEquip: 40, speed: 7, price: 400, look: 'claymore' },
    // 71: 3d5 / 3d6, 700, 4400, 8.
    warAxe: { kind: 'weapon', slot: 'weapon', name: 'War Axe', small: [3, 5, 0], large: [3, 6, 0], range: 1, strToEquip: 44, speed: 8, price: 700, look: 'warAxe' },
    // 50: 2d10 / 2d11, 500, 5200, 8.
    greatSword: { kind: 'weapon', slot: 'weapon', name: 'Great Sword', small: [2, 10, 0], large: [2, 11, 0], range: 1, strToEquip: 52, speed: 8, price: 500, look: 'greatSword' },
    // 54 Flameberge: 2d11 / 2d12, 700, 6000, 10.
    flamberge: { kind: 'weapon', slot: 'weapon', name: 'Flameberge', small: [2, 11, 0], large: [2, 12, 0], range: 1, strToEquip: 60, speed: 10, price: 700, look: 'flamberge' },
    // 560 (Item2.cfg): 3d8 / 3d9, 3500, 9000, 13.
    battleAxe: { kind: 'weapon', slot: 'weapon', name: 'Battle Axe', small: [3, 8, 0], large: [3, 9, 0], range: 1, strToEquip: 90, speed: 13, price: 3500, look: 'battleAxe' },
    // 760 (Item3.cfg): 3d7 / 3d9, 6000, 9000, 12.
    hammer: { kind: 'weapon', slot: 'weapon', name: 'Hammer', small: [3, 7, 0], large: [3, 9, 0], range: 1, strToEquip: 90, speed: 12, price: 6000, look: 'hammer' },
    // 761 (Item3.cfg): 3d7+2 / 3d9+2, 9000, 12000, 14, Level 110.
    battleHammer: { kind: 'weapon', slot: 'weapon', name: 'Battle Hammer', small: [3, 7, 2], large: [3, 9, 2], range: 1, strToEquip: 120, speed: 14, price: 9000, levelToEquip: 110, look: 'battleHammer' },
    // ---- Shields. Item.cfg number: defence, price, weight. ----
    // 79: 8, 100, 800.
    woodShield: { kind: 'armor', slot: 'shield', name: 'Wood Shield', defense: 8, strToEquip: 8, price: 100, look: 'woodShield' },
    // 80: 10, 150, 1000.
    leatherShield: { kind: 'armor', slot: 'shield', name: 'Leather Shield', defense: 10, strToEquip: 10, price: 150, look: 'leatherShield' },
    // 81: 13, 250, 1800 (Off-4A: monsters drop it).
    targeShield: { kind: 'armor', slot: 'shield', name: 'Targe Shield', defense: 13, strToEquip: 18, price: 250, look: 'targeShield' },
    // 84: 22, 700, 2500.
    ironShield: { kind: 'armor', slot: 'shield', name: 'Iron Shield', defense: 22, strToEquip: 25, price: 700, look: 'ironShield' },
    // 86: 30, 1500, 3200.
    knightShield: { kind: 'armor', slot: 'shield', name: 'Knight Shield', defense: 30, strToEquip: 32, price: 1500, look: 'knightShield' },
    // 87: 35, 1800, 4000.
    towerShield: { kind: 'armor', slot: 'shield', name: 'Tower Shield', defense: 35, strToEquip: 40, price: 1800, look: 'towerShield' },
    // ---- Helms (Item2/Item3.cfg). ----
    // 600 Helm: 5, 800, 5200.
    helmet: { kind: 'armor', slot: 'helm', name: 'Helmet', defense: 5, strToEquip: 52, price: 800, look: 'helmet' },
    // 601 FullHelm: 10, 1500, 8500.
    fullHelmet: { kind: 'armor', slot: 'helm', name: 'Full Helmet', defense: 10, strToEquip: 85, price: 1500, look: 'fullHelmet' },
    // 751 Wings-Helm: 15, 5000, 13000, Level 100.
    wingedHelmet: { kind: 'armor', slot: 'helm', name: 'Winged Helmet', defense: 15, strToEquip: 130, price: 5000, levelToEquip: 100, look: 'wingedHelmet' },
    // 750 Horned-Helm: 17, 4000, 16000, Level 120.
    hornedHelmet: { kind: 'armor', slot: 'helm', name: 'Horned Helmet', defense: 17, strToEquip: 160, price: 4000, levelToEquip: 120, look: 'hornedHelmet' },
    // 752 Wizard-Cap: 5, 1500, 1500, Level 90.
    wizardCap: { kind: 'armor', slot: 'helm', name: 'Wizard Cap', defense: 5, strToEquip: 15, price: 1500, levelToEquip: 90, look: 'wizardCap' },
    // 753 Wizard-Hat: 10, 3000, 1500, Level 120.
    wizardHat: { kind: 'armor', slot: 'helm', name: 'Wizard Hat', defense: 10, strToEquip: 15, price: 3000, levelToEquip: 120, look: 'wizardHat' },
    // ---- Body (Item2/Item3.cfg). ----
    // 455 LeatherArmor: 10, 500, 1500.
    leatherArmor: { kind: 'armor', slot: 'body', name: 'Leather Armor', defense: 10, strToEquip: 15, price: 500, look: 'leatherArmor' },
    // 590 Robe: 12, 2000, 1000.
    robe: { kind: 'armor', slot: 'body', name: 'Robe', defense: 12, strToEquip: 10, price: 2000, look: 'robe' },
    // 685 WizardRobe: 12, 3000, 1000, Level 80.
    wizardRobe: { kind: 'armor', slot: 'body', name: 'Wizard Robe', defense: 12, strToEquip: 10, price: 3000, levelToEquip: 80, look: 'wizardRobe' },
    // 457 ScaleMail: 20, 900, 2000.
    scaleMail: { kind: 'armor', slot: 'body', name: 'Scale Mail', defense: 20, strToEquip: 20, price: 900, look: 'scaleMail' },
    // 456 ChainMail: 30, 1200, 3000.
    chainMail: { kind: 'armor', slot: 'body', name: 'Chain Mail', defense: 30, strToEquip: 30, price: 1200, look: 'chainMail' },
    // 458 PlateMail: 37, 4500, 10000.
    plateMail: { kind: 'armor', slot: 'body', name: 'Plate Mail', defense: 37, strToEquip: 100, price: 4500, look: 'plateMail' },
    // ---- Legs, feet and back (Item2.cfg). ----
    // 461 ChainHose: 6, 400, 1000.
    chainHose: { kind: 'armor', slot: 'legs', name: 'Chain Hose', defense: 6, strToEquip: 10, price: 400, look: 'chainHose' },
    // 462 PlateLeggings: 12, 1000, 2000.
    plateLeggings: { kind: 'armor', slot: 'legs', name: 'Plate Leggings', defense: 12, strToEquip: 20, price: 1000, look: 'plateLeggings' },
    // 450 / 451: 1, 20 / 100, 200 / 500.
    shoes: { kind: 'armor', slot: 'boots', name: 'Shoes', defense: 1, strToEquip: 2, price: 20, look: 'shoes' },
    longBoots: { kind: 'armor', slot: 'boots', name: 'Long Boots', defense: 1, strToEquip: 5, price: 100, look: 'longBoots' },
    // 402: 2, 1000, 200.
    cape: { kind: 'armor', slot: 'cape', name: 'Cape', defense: 2, strToEquip: 2, price: 1000, look: 'cape' },
} as const satisfies Record<string, OffItemDef>;

export type OffItemId = keyof typeof OFF_ITEMS;
export type OffEquipment = Partial<Record<OffSlotId, OffItemId>>;

export function isOffItemId(id: string): id is OffItemId {
    return Object.prototype.hasOwnProperty.call(OFF_ITEMS, id);
}

export function offItem(id: OffItemId): OffItemDef {
    return OFF_ITEMS[id];
}

/** Who wants to wear something: what its requirements are checked against. */
export interface OffWearer {
    str: number;
    level: number;
}

/** Whether it can be worn: 'ok', or what falls short (the STR is told first). */
export type OffWearCheck = 'ok' | 'str' | 'level';

export function offWearCheck(id: OffItemId, who: OffWearer): OffWearCheck {
    const item: OffItemDef = OFF_ITEMS[id];
    if (item.strToEquip > who.str) return 'str';
    if ((item.levelToEquip ?? 0) > who.level) return 'level';
    return 'ok';
}

/** "Str 130 · Level 100" (the level only when it asks for one). */
export function offNeedsText(id: OffItemId): string {
    const item: OffItemDef = OFF_ITEMS[id];
    return item.levelToEquip ? `Str ${item.strToEquip} · Level ${item.levelToEquip}` : `Str ${item.strToEquip}`;
}

/** What a new character wears (the weapon slot is never empty). */
export const OFF_START_EQUIPMENT: Readonly<OffEquipment> = { weapon: 'dagger' };

/** The gear in the bag for that slot (Off-4B), each kind once, lightest STR first. */
export function offBagGearFor(bag: readonly OffBagItemId[], slot: OffSlotId): OffItemId[] {
    const ids = new Set<OffItemId>();
    for (const id of bag) {
        if (isOffItemId(id) && OFF_ITEMS[id].slot === slot) ids.add(id);
    }
    return [...ids].sort((a, b) => OFF_ITEMS[a].strToEquip - OFF_ITEMS[b].strToEquip);
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

/** Anything the bag holds (Off-4A): gear or goods (potions, Slime Jelly). */
export type OffBagItemId = OffItemId | OffGoodId;

export function isOffBagItemId(id: string): id is OffBagItemId {
    return isOffItemId(id) || isOffGoodId(id);
}

/** Name of anything in the bag. */
export function offBagItemName(id: OffBagItemId): string {
    return isOffItemId(id) ? OFF_ITEMS[id].name : OFF_GOODS[id].name;
}

/** Its picture (item-ground / item-pack sheet and frame), for that gender. */
export function offBagItemPicture(id: OffBagItemId, gender: Gender): ItemIconFrame | undefined {
    return isOffItemId(id) ? itemIcon(OFF_ITEMS[id].look, gender) : OFF_GOODS[id].picture;
}

/** Average of some dice (to tell which weapon hits harder). */
export function diceAverage([count, sides, bonus]: readonly [number, number, number]): number {
    return (count * (sides + 1)) / 2 + bonus;
}
