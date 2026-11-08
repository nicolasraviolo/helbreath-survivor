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
import { attributeColor, type WeaponAttribute } from '../../data/attributes';
import type { AddedColor } from '../../hb/playerAppearance';
import type { Gender } from '../../data/appearance';
import { itemIcon, type SavedEquipment } from '../../data/items';
import type { ItemIconFrame } from '../../data/itemTypes';
import { isOffGoodId, OFF_GOODS, type OffGoodId } from './offGoods';
import type { MeleeWeaponId } from '../../data/weapons';
import type { OffWeaponDef } from './offCombat';
import {
    addOffEffects, hasOffRolls, offRollEffects, offRolledName, offRollsText, readOffRolls, type OffAttributeEffects, type OffRolls,
} from './offAttributes';

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
    /** Its bag / ground picture when Survivors has none for `look` (Off-7B: the Rapier, Item.cfg sprite 1, frame 6). */
    icon?: ItemIconFrame;
    /** Off-7E: held with both hands (Item.cfg slot 9), so no shield with it, as the original. */
    twoHanded?: true;
}

export interface OffArmorItem {
    kind: 'armor';
    name: string;
    slot: Exclude<OffSlotId, 'weapon'>;
    /** Added to the defence (2 × DEX + the armour's). */
    defense: number;
    /**
     * Off-7D: % of a monster's blow it takes away when the blow falls on its body part (Item.cfg effect value 2; see
     * OFF_ARMOR in offCombat.ts). Shields have none here: theirs comes from the defence (offShieldAbsorb).
     */
    absorb?: number;
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
    rapier: { kind: 'weapon', slot: 'weapon', name: 'Rapier', small: [1, 7, 0], large: [1, 10, 0], range: 1, strToEquip: 11, speed: 3, price: 300, look: 'rapier', icon: { sheet: 0, frame: 6 } },
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
    broadSword: { kind: 'weapon', slot: 'weapon', twoHanded: true, name: 'Broad Sword', small: [2, 7, 0], large: [2, 8, 0], range: 1, strToEquip: 28, speed: 6, price: 250, look: 'broadSword' },
    // 68: 3d3 / 3d3, 560, 3300, 5.
    doubleAxe: { kind: 'weapon', slot: 'weapon', name: 'Double Axe', small: [3, 3, 0], large: [3, 3, 0], range: 1, strToEquip: 33, speed: 5, price: 560, look: 'doubleAxe' },
    // 46: 2d9 / 2d10, 400, 4000, 7.
    claymore: { kind: 'weapon', slot: 'weapon', twoHanded: true, name: 'Claymore', small: [2, 9, 0], large: [2, 10, 0], range: 1, strToEquip: 40, speed: 7, price: 400, look: 'claymore' },
    // 71: 3d5 / 3d6, 700, 4400, 8.
    warAxe: { kind: 'weapon', slot: 'weapon', name: 'War Axe', small: [3, 5, 0], large: [3, 6, 0], range: 1, strToEquip: 44, speed: 8, price: 700, look: 'warAxe' },
    // 50: 2d10 / 2d11, 500, 5200, 8.
    greatSword: { kind: 'weapon', slot: 'weapon', twoHanded: true, name: 'Great Sword', small: [2, 10, 0], large: [2, 11, 0], range: 1, strToEquip: 52, speed: 8, price: 500, look: 'greatSword' },
    // 54 Flameberge: 2d11 / 2d12, 700, 6000, 10.
    flamberge: { kind: 'weapon', slot: 'weapon', twoHanded: true, name: 'Flameberge', small: [2, 11, 0], large: [2, 12, 0], range: 1, strToEquip: 60, speed: 10, price: 700, look: 'flamberge' },
    // 560 (Item2.cfg): 3d8 / 3d9, 3500, 9000, 13.
    battleAxe: { kind: 'weapon', slot: 'weapon', twoHanded: true, name: 'Battle Axe', small: [3, 8, 0], large: [3, 9, 0], range: 1, strToEquip: 90, speed: 13, price: 3500, look: 'battleAxe' },
    // 760 (Item3.cfg): 3d7 / 3d9, 6000, 9000, 12.
    hammer: { kind: 'weapon', slot: 'weapon', twoHanded: true, name: 'Hammer', small: [3, 7, 0], large: [3, 9, 0], range: 1, strToEquip: 90, speed: 12, price: 6000, look: 'hammer' },
    // 761 (Item3.cfg): 3d7+2 / 3d9+2, 9000, 12000, 14, Level 110.
    battleHammer: { kind: 'weapon', slot: 'weapon', twoHanded: true, name: 'Battle Hammer', small: [3, 7, 2], large: [3, 9, 2], range: 1, strToEquip: 120, speed: 14, price: 9000, levelToEquip: 110, look: 'battleHammer' },
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
    helmet: { kind: 'armor', slot: 'helm', name: 'Helmet', defense: 5, absorb: 10, strToEquip: 52, price: 800, look: 'helmet' },
    // 601 FullHelm: 10, 1500, 8500.
    fullHelmet: { kind: 'armor', slot: 'helm', name: 'Full Helmet', defense: 10, absorb: 20, strToEquip: 85, price: 1500, look: 'fullHelmet' },
    // 751 Wings-Helm: 15, 5000, 13000, Level 100.
    wingedHelmet: { kind: 'armor', slot: 'helm', name: 'Winged Helmet', defense: 15, absorb: 22, strToEquip: 130, price: 5000, levelToEquip: 100, look: 'wingedHelmet' },
    // 750 Horned-Helm: 17, 4000, 16000, Level 120.
    hornedHelmet: { kind: 'armor', slot: 'helm', name: 'Horned Helmet', defense: 17, absorb: 24, strToEquip: 160, price: 4000, levelToEquip: 120, look: 'hornedHelmet' },
    // 752 Wizard-Cap: 5, 1500, 1500, Level 90.
    wizardCap: { kind: 'armor', slot: 'helm', name: 'Wizard Cap', defense: 5, absorb: 10, strToEquip: 15, price: 1500, levelToEquip: 90, look: 'wizardCap' },
    // 753 Wizard-Hat: 10, 3000, 1500, Level 120.
    wizardHat: { kind: 'armor', slot: 'helm', name: 'Wizard Hat', defense: 10, absorb: 15, strToEquip: 15, price: 3000, levelToEquip: 120, look: 'wizardHat' },
    // ---- Body (Item2/Item3.cfg). ----
    // 455 LeatherArmor: 10, 500, 1500.
    leatherArmor: { kind: 'armor', slot: 'body', name: 'Leather Armor', defense: 10, absorb: 10, strToEquip: 15, price: 500, look: 'leatherArmor' },
    // 590 Robe: 12, 2000, 1000.
    robe: { kind: 'armor', slot: 'body', name: 'Robe', defense: 12, absorb: 1, strToEquip: 10, price: 2000, look: 'robe' },
    // 685 WizardRobe: 12, 3000, 1000, Level 80.
    wizardRobe: { kind: 'armor', slot: 'body', name: 'Wizard Robe', defense: 12, absorb: 1, strToEquip: 10, price: 3000, levelToEquip: 80, look: 'wizardRobe' },
    // 457 ScaleMail: 20, 900, 2000.
    scaleMail: { kind: 'armor', slot: 'body', name: 'Scale Mail', defense: 20, absorb: 20, strToEquip: 20, price: 900, look: 'scaleMail' },
    // 456 ChainMail: 30, 1200, 3000.
    chainMail: { kind: 'armor', slot: 'body', name: 'Chain Mail', defense: 30, absorb: 32, strToEquip: 30, price: 1200, look: 'chainMail' },
    // 458 PlateMail: 37, 4500, 10000.
    plateMail: { kind: 'armor', slot: 'body', name: 'Plate Mail', defense: 37, absorb: 40, strToEquip: 100, price: 4500, look: 'plateMail' },
    // ---- Legs, feet and back (Item2.cfg). ----
    // 461 ChainHose: 6, 400, 1000.
    chainHose: { kind: 'armor', slot: 'legs', name: 'Chain Hose', defense: 6, absorb: 10, strToEquip: 10, price: 400, look: 'chainHose' },
    // 462 PlateLeggings: 12, 1000, 2000.
    plateLeggings: { kind: 'armor', slot: 'legs', name: 'Plate Leggings', defense: 12, absorb: 20, strToEquip: 20, price: 1000, look: 'plateLeggings' },
    // 450 / 451: 1, 20 / 100, 200 / 500.
    shoes: { kind: 'armor', slot: 'boots', name: 'Shoes', defense: 1, strToEquip: 2, price: 20, look: 'shoes' },
    longBoots: { kind: 'armor', slot: 'boots', name: 'Long Boots', defense: 1, strToEquip: 5, price: 100, look: 'longBoots' },
    // 402: 2, 1000, 200.
    cape: { kind: 'armor', slot: 'cape', name: 'Cape', defense: 2, strToEquip: 2, price: 1000, look: 'cape' },
} as const satisfies Record<string, OffItemDef>;

export type OffItemId = keyof typeof OFF_ITEMS;

/**
 * One piece of gear as it is kept (Off-7B): its id, or its id with its attributes ("longSword:sharp:hittingProbability4",
 * off/data/offAttributes.ts). Normal items are only their id, so saves from before read as they are.
 */
export type OffGearKey = OffItemId | `${OffItemId}:${string}`;
export type OffEquipment = Partial<Record<OffSlotId, OffGearKey>>;

export function isOffItemId(id: string): id is OffItemId {
    return Object.prototype.hasOwnProperty.call(OFF_ITEMS, id);
}

export function offItem(id: OffItemId): OffItemDef {
    return OFF_ITEMS[id];
}

/** Weapon or armour: which attribute lists it rolls from. */
export function offGearKind(id: OffItemId): 'weapon' | 'armor' {
    return OFF_ITEMS[id].kind;
}

/** The id of a gear key. */
export function offGearId(key: OffGearKey): OffItemId {
    return key.split(':')[0] as OffItemId;
}

/** The attributes of a gear key (none for a plain id). */
export function offGearRolls(key: OffGearKey): OffRolls {
    const [id, ...parts] = key.split(':');
    if (parts.length === 0 || !id || !isOffItemId(id)) return {};
    return readOffRolls(offGearKind(id), parts);
}

/** The key of that item with those attributes (the plain id when it has none). */
export function offGearKey(id: OffItemId, rolls: Readonly<OffRolls> = {}): OffGearKey {
    const text = offRollsText(rolls);
    return text ? `${id}:${text.slice(1)}` : id;
}

/** Whether a text is a gear key we know, written as we write it (unknown attributes make it not one). */
export function isOffGearKey(text: string): text is OffGearKey {
    const id = text.split(':')[0] ?? '';
    if (!isOffItemId(id)) return false;
    return offGearKey(id, offGearRolls(text as OffGearKey)) === text;
}

/**
 * A text read back (a save, ?offbag=) as a gear key: a known id, its attributes cleaned (unknown ones left out, values
 * into their range). Undefined if the id is unknown.
 */
export function readOffGearKey(text: string): OffGearKey | undefined {
    const id = text.split(':')[0] ?? '';
    if (!isOffItemId(id)) return undefined;
    return offGearKey(id, offGearRolls(text as OffGearKey));
}

/** The same for anything kept in the bag. */
export function readOffBagKey(text: string): OffBagItemKey | undefined {
    return isOffGoodId(text) ? text : readOffGearKey(text);
}

/** A gear key with attributes: a special item (green name, as the original). */
export function isOffSpecial(key: OffBagItemKey): boolean {
    return isOffGearKey(key) && hasOffRolls(offGearRolls(key));
}

/** The item's def, from its key. */
export function offGearDef(key: OffGearKey): OffItemDef {
    return OFF_ITEMS[offGearId(key)];
}

/** What a piece's attributes add. */
export function offGearEffects(key: OffGearKey): OffAttributeEffects {
    const id = offGearId(key);
    return offRollEffects(offGearKind(id), offGearRolls(key));
}

/** What all the worn gear's attributes add together. */
export function offEquipmentEffects(equipment: Readonly<OffEquipment>): OffAttributeEffects {
    const effects: OffAttributeEffects = {};
    for (const key of Object.values(equipment)) addOffEffects(effects, offGearEffects(key));
    return effects;
}

/** STR it asks for: its own, less a Light attribute's share (original: −4 % of the weight per point). */
export function offStrToEquip(key: OffGearKey): number {
    const light = offGearEffects(key).light ?? 0;
    return Math.max(1, Math.floor(offGearDef(key).strToEquip * (1 - light)));
}

/** Who wants to wear something: what its requirements are checked against. */
export interface OffWearer {
    str: number;
    level: number;
}

/** Whether it can be worn: 'ok', or what falls short (the STR is told first). */
export type OffWearCheck = 'ok' | 'str' | 'level';

export function offWearCheck(key: OffGearKey, who: OffWearer): OffWearCheck {
    const item: OffItemDef = offGearDef(key);
    if (offStrToEquip(key) > who.str) return 'str';
    if ((item.levelToEquip ?? 0) > who.level) return 'level';
    return 'ok';
}

/** "Str 130 · Level 100" (the level only when it asks for one). */
export function offNeedsText(key: OffGearKey): string {
    const item: OffItemDef = offGearDef(key);
    const str = offStrToEquip(key);
    return item.levelToEquip ? `Str ${str} · Level ${item.levelToEquip}` : `Str ${str}`;
}

/** What a new character wears. */
export const OFF_START_EQUIPMENT: Readonly<OffEquipment> = { weapon: 'dagger' };

/** The gear in the bag for that slot (Off-4B), each one once (the same attributes = the same), lightest STR first. */
export function offBagGearFor(bag: readonly OffBagItemKey[], slot: OffSlotId): OffGearKey[] {
    const keys = new Set<OffGearKey>();
    for (const key of bag) {
        if (isOffGearKey(key) && offGearDef(key).slot === slot) keys.add(key);
    }
    return [...keys].sort((a, b) => offStrToEquip(a) - offStrToEquip(b));
}

/**
 * Every slot can be emptied. Off-6A (owner, 7-nov-2026): the weapon too, as in the original, because spells need an
 * empty hand (before, the weapon slot was never empty).
 */
export function canEmptyOffSlot(_slot: OffSlotId): boolean {
    return true;
}

/**
 * Bare hands (Off-6A), with no weapon held. The original's numbers for them are not clear in Server.cpp: 1d2 and the
 * fastest speed are ours.
 */
export const OFF_FISTS: OffWeaponDef = { name: 'Fists', small: [1, 2, 0], large: [1, 2, 0], range: 1, strToEquip: 0, speed: 0 };

/** The weapon held, or bare hands. */
export function offWeapon(equipment: Readonly<OffEquipment>): OffWeaponDef {
    const key = equipment.weapon;
    const item = key ? offGearDef(key) : undefined;
    return item?.kind === 'weapon' ? item : OFF_FISTS;
}

/** Off-7D: % of a blow the worn piece on that body part takes away (0 = nothing there). */
export function offPartAbsorb(equipment: Readonly<OffEquipment>, slot: OffSlotId): number {
    const key = equipment[slot];
    const item = key ? offGearDef(key) : undefined;
    return item?.kind === 'armor' ? item.absorb ?? 0 : 0;
}

/** Off-7D: % of a blow a piece takes away; a shield's (server: defence − defence / 3) only when its skill roll works. */
export function offItemAbsorb(item: OffArmorItem): number {
    return item.slot === 'shield' ? item.defense - Math.floor(item.defense / 3) : item.absorb ?? 0;
}

/** Off-7D: % of a blow the worn shield takes away when the shield skill roll works. */
export function offShieldAbsorb(equipment: Readonly<OffEquipment>): number {
    const key = equipment.shield;
    const item = key ? offGearDef(key) : undefined;
    return item?.kind === 'armor' ? offItemAbsorb(item) : 0;
}

/** Defence the worn armour adds. */
export function offArmorDefense(equipment: Readonly<OffEquipment>): number {
    let total = 0;
    for (const key of Object.values(equipment)) {
        const item = offGearDef(key);
        if (item.kind === 'armor') total += item.defense;
    }
    return total;
}

/** The same equipment as Survivors items, to draw it (paper doll, icons, layers on the body). */
export function offEquipmentLook(equipment: Readonly<OffEquipment>): SavedEquipment {
    const look: SavedEquipment = {};
    for (const slot of OFF_GEAR_SLOT_IDS) {
        const key = equipment[slot];
        if (key) look[slot] = offGearDef(key).look;
    }
    return look;
}

/**
 * The weapon's colour in the hand (Off-7B): Sharp, Poison and Ancient are tinted as in Survivors (and the original).
 * Critical has no colour.
 */
export function offWeaponTint(equipment: Readonly<OffEquipment>): { weapon?: WeaponAttribute } {
    const key = equipment.weapon;
    const primary = key ? offGearRolls(key).primary : undefined;
    return primary === 'sharp' || primary === 'poison' || primary === 'ancient' ? { weapon: primary } : {};
}

/**
 * The colour added to an item's picture in the bag, the windows and on the ground (Off-7B): Sharp, Poison and Ancient,
 * as Survivors (ownedItemColor). Undefined = its own colours.
 */
export function offItemTint(key: OffBagItemKey | undefined): AddedColor | undefined {
    if (key === undefined || !isOffGearKey(key)) return undefined;
    const primary = offGearRolls(key).primary;
    return primary === 'sharp' || primary === 'poison' || primary === 'ancient' ? attributeColor(primary) : undefined;
}

/** Off-7E: whether that gear is a weapon held with both hands. */
export function offTwoHanded(key: OffGearKey): boolean {
    const item = offGearDef(key);
    return item.kind === 'weapon' && item.twoHanded === true;
}

/**
 * Off-7E: the slot that has to come off when `key` goes on, as the original: a two-handed weapon takes off the shield,
 * and a shield takes off a two-handed weapon. Undefined when both hands are fine.
 */
export function offHandsClash(equipment: OffEquipment, key: OffGearKey): 'weapon' | 'shield' | undefined {
    const slot = offGearDef(key).slot;
    if (slot === 'weapon' && offTwoHanded(key) && equipment.shield) return 'shield';
    if (slot === 'shield' && equipment.weapon && offTwoHanded(equipment.weapon)) return 'weapon';
    return undefined;
}

/** Equipment read back from a save: unknown items and items in the wrong slot are dropped (no weapon = bare hands). */
export function readOffEquipment(value: unknown): OffEquipment {
    const equipment: OffEquipment = { ...OFF_START_EQUIPMENT };
    if (typeof value !== 'object' || value === null) return equipment;
    for (const slot of OFF_GEAR_SLOT_IDS) {
        const text: unknown = (value as Record<string, unknown>)[slot];
        const key = typeof text === 'string' ? readOffGearKey(text) : undefined;
        if (key && offGearDef(key).slot === slot) equipment[slot] = key;
        else if (canEmptyOffSlot(slot)) delete equipment[slot];
    }
    return equipment;
}

/** Anything the bag holds (Off-4A): gear or goods (potions, Slime Jelly). */
export type OffBagItemId = OffItemId | OffGoodId;

export function isOffBagItemId(id: string): id is OffBagItemId {
    return isOffItemId(id) || isOffGoodId(id);
}

/** Anything kept in the bag or the warehouse (Off-7B): gear with its attributes, or a good. */
export type OffBagItemKey = OffGearKey | OffGoodId;

/** The plain id of what a bag key holds (its attributes left out). */
export function offBagKeyId(key: OffBagItemKey): OffBagItemId {
    return isOffGoodId(key) ? key : offGearId(key);
}

export function isOffBagItemKey(text: string): text is OffBagItemKey {
    return isOffGoodId(text) || isOffGearKey(text);
}

/** Name of anything in the bag ("Sharp Long Sword" for a special one). */
export function offBagItemName(key: OffBagItemKey): string {
    if (isOffGoodId(key)) return OFF_GOODS[key].name;
    const id = offGearId(key);
    return offRolledName(offGearKind(id), OFF_ITEMS[id].name, offGearRolls(key));
}

/** Its picture (item-ground / item-pack sheet and frame), for that gender. */
export function offBagItemPicture(key: OffBagItemKey, gender: Gender): ItemIconFrame | undefined {
    if (isOffGoodId(key)) return OFF_GOODS[key].picture;
    const item = offGearDef(key);
    return (item.kind === 'weapon' ? item.icon : undefined) ?? itemIcon(item.look, gender);
}

/** Average of some dice (to tell which weapon hits harder). */
export function diceAverage([count, sides, bonus]: readonly [number, number, number]): number {
    return (count * (sides + 1)) / 2 + bonus;
}
