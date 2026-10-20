// Equipo permanente del personaje (Fase 20B; docs/DESIGN.md, "Progresión entre partidas"):
// - Huecos que ya funcionan: arma, escudo, casco, armadura, pantalones, botas, capa y, solo el Mago, 2 hechizos (20D:
//   Spell 1 automático, círculos 1–5; Spell 2 activo, círculos 6–10). Los demás (anillo, collar, ángel y Zem) se ven
//   vacíos en la pantalla de equipo hasta la Fase 21. Abaddon's Blood no es un hueco: es una mejora permanente (21E). El Zem funciona desde el 21D (data/consumables.ts).
// - Fase 21D, "solo lo que tienes": armas, varitas, armaduras y el Zem solo se ponen si están en el inventario (o se
//   llevan puestos). El equipo de salida (la daga, la varita MS0 y los dos hechizos de la Maga) nunca se acaba. Los
//   hechizos se saben con la Int; los que estén en MANUAL_SPELL_IDS piden además haberlos encontrado (su Manual).
//   Requisitos del original con las stats PERMANENTES y el Level (números en weapons.ts y armor.ts).
// - Fase 21B: el Mago lleva varita en el hueco Weapon (data/wands.ts); el Guerrero, armas cuerpo a cuerpo. Cada clase
//   solo ve y solo puede ponerse las suyas (classCanWear).
// - Equipo de salida: el Guerrero, la daga; el Mago, Energy Bolt y Energy Strike, que no piden nada (propietario,
//   19-oct-2026). Los huecos de hechizo y el del arma nunca se quedan vacíos.
import type { GearLayer, GearSlot } from '../hb/playerAppearance';
import { ACTIVE_SPELL_IDS, ACTIVE_SPELLS, activeSpellCooldownMs, isActiveSpellId, type ActiveSpellId } from './activeSpells';
import type { Gender } from './appearance';
import { ARMOR_PIECES, ARMOR_SLOT_NAMES, type ArmorPieceId, type ArmorSlotId } from './armor';
import { attributeColor, ATTRIBUTES, attributeDamageBonus, type ItemAttribute } from './attributes';
import type { CharacterId } from './characters';
import { CONSUMABLES, isConsumableId, ZEM_ID, type ConsumableId } from './consumables';
import type { EquipRequirement, ItemIcon, ItemIconFrame } from './itemTypes';
import { SPELL_ITEM_ICON, type OwnedItem } from './loot';
import { AUTO_SPELL_IDS, isAutoSpellId, SPELLS, type AutoSpellId } from './spells';
import type { Stats } from './stats';
import { getWand, isWandId, WAND_IDS, type WandId } from './wands';
import { getMeleeWeapon, MELEE_FAMILIES, MELEE_WEAPONS, type MeleeWeaponId } from './weapons';

export type SpellSlotId = 'spell1' | 'spell2';
export type EquipSlotId = 'weapon' | ArmorSlotId | SpellSlotId | 'zem';

/** Slots on the Equipment screen: gear on the first row, spells starting the second one. */
export const GEAR_SLOT_IDS = ['weapon', 'shield', 'helm', 'body', 'legs', 'boots', 'cape'] as const satisfies readonly EquipSlotId[];
export const SPELL_SLOT_IDS = ['spell1', 'spell2'] as const satisfies readonly SpellSlotId[];
export const EQUIP_SLOT_IDS: readonly EquipSlotId[] = [...GEAR_SLOT_IDS, ...SPELL_SLOT_IDS, 'zem'];

export const EQUIP_SLOT_NAMES: Readonly<Record<EquipSlotId, string>> = { weapon: 'Weapon', ...ARMOR_SLOT_NAMES, spell1: 'Spell 1', spell2: 'Spell 2', zem: 'Zem' };

/**
 * Second row of the Equipment screen: the spells, the slots still to come (shown empty, with their name) and the Zem
 * (Fase 21D).
 */
export const SECOND_ROW_SLOTS: ReadonlyArray<EquipSlotId | { future: string }> = [
    // Abaddon's Blood no tiene hueco: es una mejora permanente del dispositivo (Fase 21E, data/abaddon.ts).
    'spell1', 'spell2', { future: 'Ring' }, { future: 'Necklace' }, { future: 'Angel' }, 'zem',
];

export type SpellItemId = AutoSpellId | ActiveSpellId;
export type ItemId = MeleeWeaponId | WandId | ArmorPieceId | SpellItemId | ConsumableId;

/** What a saved character wears: one item per slot (a missing slot is empty). */
export type SavedEquipment = Partial<Record<EquipSlotId, ItemId>>;

export interface ItemInfo {
    name: string;
    slot: EquipSlotId;
    equip: EquipRequirement;
    /** Spells have no picture yet: the screen writes their name. */
    icon?: ItemIcon;
}

export const START_EQUIPMENT: Readonly<Record<CharacterId, Readonly<SavedEquipment>>> = {
    warrior: { weapon: 'dagger' },
    mage: { weapon: 'magicWandMS0', spell1: 'energyBolt', spell2: 'energyStrike' },
};

/** Slots each class can change on the Equipment screen. */
const CLASS_SLOTS: Readonly<Record<CharacterId, readonly EquipSlotId[]>> = {
    warrior: [...GEAR_SLOT_IDS, 'zem'],
    mage: EQUIP_SLOT_IDS,
};

/** The Mage's starting spells ask for nothing (owner, 19-oct-2026), like the Warrior's dagger. */
const FREE_SPELLS: ReadonlySet<ItemId> = new Set(Object.values(START_EQUIPMENT.mage));

/**
 * Spells that must be found (their Manual drops) besides having the Int (owner, 20-oct-2026). None of today's: the
 * ones to come (Blizzard, Lightning Strike, Bloody Shock Wave, Earth Shock Wave...) go here. Only these drop as loot.
 */
export const MANUAL_SPELL_IDS: ReadonlySet<SpellItemId> = new Set<SpellItemId>([]);

/**
 * Items that never run out and are never kept in the inventory (Fase 21D): the class's starting equipment and the
 * spells known with the Int alone.
 */
export function isFreeItem(classId: CharacterId, id: ItemId): boolean {
    if (Object.values(START_EQUIPMENT[classId]).includes(id)) return true;
    return isSpellItemId(id) && !MANUAL_SPELL_IDS.has(id);
}

/** Whether the normal loot roll may give it: never the Zem (it has its own boss roll), and only spells that need finding. */
export function isLootDrop(id: ItemId): boolean {
    if (isConsumableId(id)) return false;
    return !isSpellItemId(id) || MANUAL_SPELL_IDS.has(id);
}

export function isMeleeWeaponId(id: string): id is MeleeWeaponId {
    return Object.prototype.hasOwnProperty.call(MELEE_WEAPONS, id);
}

export function isArmorPieceId(id: string): id is ArmorPieceId {
    return Object.prototype.hasOwnProperty.call(ARMOR_PIECES, id);
}

export function isSpellItemId(id: string): id is SpellItemId {
    return isAutoSpellId(id) || isActiveSpellId(id);
}

export function isItemId(id: string): id is ItemId {
    return isMeleeWeaponId(id) || isWandId(id) || isArmorPieceId(id) || isSpellItemId(id) || isConsumableId(id);
}

/** Name, slot, requirement and picture; undefined for weapons that are only data (no requirement or picture yet). */
export function itemInfo(id: ItemId): ItemInfo | undefined {
    if (isSpellItemId(id)) {
        const auto = isAutoSpellId(id);
        const spell = auto ? SPELLS[id] : ACTIVE_SPELLS[id];
        return { name: spell.name, slot: auto ? 'spell1' : 'spell2', equip: FREE_SPELLS.has(id) ? {} : { int: spell.int } };
    }
    if (isMeleeWeaponId(id)) {
        const weapon = getMeleeWeapon(id);
        return weapon.equip && weapon.icon ? { name: weapon.name, slot: 'weapon', equip: weapon.equip, icon: weapon.icon } : undefined;
    }
    if (isWandId(id)) {
        const wand = getWand(id);
        return { name: wand.name, slot: 'weapon', equip: wand.equip, icon: wand.icon };
    }
    if (isConsumableId(id)) return { name: CONSUMABLES[id].name, slot: 'zem', equip: {}, icon: CONSUMABLES[id].icon };
    const piece = ARMOR_PIECES[id];
    return { name: piece.name, slot: piece.slot, equip: piece.equip, icon: piece.icon };
}

export function canChangeSlot(classId: CharacterId, slot: EquipSlotId): boolean {
    return CLASS_SLOTS[classId].includes(slot);
}

/** Whether the class may put that item on at all (requirements apart): its slot, and wands only for the Mage. */
export function classCanWear(classId: CharacterId, id: ItemId): boolean {
    const slot = itemInfo(id)?.slot;
    if (!slot || !canChangeSlot(classId, slot)) return false;
    if (slot !== 'weapon') return true;
    return isWandId(id) === (classId === 'mage');
}

/** Whether a slot can be left empty (the Warrior always holds a weapon, the Mage two spells). */
export function canEmptySlot(slot: EquipSlotId): boolean {
    return slot !== 'weapon' && slot !== 'spell1' && slot !== 'spell2';
}

function requirementOrder(id: ItemId): number {
    const req = itemInfo(id)?.equip;
    return req ? (req.level ?? 0) * 1000 + ((req.mag ?? 0) + (req.int ?? 0)) * 10 + (req.str ?? 0) : 0;
}

/** Everything the class can put in that slot, from the easiest requirement to the hardest. */
export function catalog(classId: CharacterId, slot: EquipSlotId): ItemId[] {
    if (!canChangeSlot(classId, slot)) return [];
    let ids: ItemId[];
    if (slot === 'spell1') {
        ids = [...AUTO_SPELL_IDS];
    } else if (slot === 'spell2') {
        ids = [...ACTIVE_SPELL_IDS];
    } else if (slot === 'zem') {
        ids = [ZEM_ID];
    } else if (slot === 'weapon' && classId === 'mage') {
        ids = [...WAND_IDS];
    } else if (slot === 'weapon') {
        ids = Object.values(MELEE_FAMILIES).filter((family) => family.enabled).flatMap((family): ItemId[] => [...family.links]);
    } else {
        ids = (Object.keys(ARMOR_PIECES) as ArmorPieceId[]).filter((id) => ARMOR_PIECES[id].slot === slot);
    }
    return ids.filter((id) => itemInfo(id) !== undefined).sort((a, b) => requirementOrder(a) - requirementOrder(b));
}

export interface RequirementCheck {
    label: string;
    met: boolean;
}

/** Each requirement of the item ("Str 40", "Level 100"...) and whether the character meets it. */
export function requirementChecks(id: ItemId, stats: Readonly<Stats>, level: number): RequirementCheck[] {
    const req = itemInfo(id)?.equip;
    if (!req) return [];
    const checks: RequirementCheck[] = [];
    if (req.str !== undefined) checks.push({ label: `Str ${req.str}`, met: stats.str >= req.str });
    if (req.int !== undefined) checks.push({ label: `Int ${req.int}`, met: stats.int >= req.int });
    if (req.mag !== undefined) checks.push({ label: `Mag ${req.mag}`, met: stats.mag >= req.mag });
    if (req.level !== undefined) checks.push({ label: `Level ${req.level}`, met: level >= req.level });
    return checks;
}

export function canEquip(id: ItemId, stats: Readonly<Stats>, level: number): boolean {
    return requirementChecks(id, stats, level).every((check) => check.met);
}

/** Picture of the item for that gender (clothes have their own picture for women). */
export function itemIcon(id: ItemId, gender: Gender): ItemIconFrame | undefined {
    const icon = itemInfo(id)?.icon;
    if (!icon) return undefined;
    return gender === 'female' && icon.female ? icon.female : icon;
}

/** Picture of any item, spells included (they use the original's "Manual" until they have their own; Fase 21A). */
export function itemPicture(id: ItemId, gender: Gender): ItemIconFrame | undefined {
    return isSpellItemId(id) ? SPELL_ITEM_ICON : itemIcon(id, gender);
}

/**
 * Layers the equipment draws on the body (men's sprites: CharacterSprite turns them into women's ones). The weapon gets
 * its attribute's colour (Fase 21B).
 */
export function equipmentLook(equipment: Readonly<SavedEquipment>, attributes: Readonly<Partial<Record<EquipSlotId, ItemAttribute>>> = {}): Array<[GearSlot, GearLayer]> {
    const layers: Array<[GearSlot, GearLayer]> = [];
    const added = attributeColor(attributes.weapon);
    const colour = added ? { added } : {};
    for (const id of Object.values(equipment)) {
        if (isSpellItemId(id) || isConsumableId(id)) continue;
        if (isWandId(id)) {
            layers.push(['weapon', { sprite: getWand(id).sprite, ...colour }]);
        } else if (isMeleeWeaponId(id)) {
            const sprite = getMeleeWeapon(id).sprite;
            if (sprite) layers.push(['weapon', { sprite: sprite.key, startSheet: sprite.startSheet, ...colour }]);
        } else {
            layers.push(...(Object.entries(ARMOR_PIECES[id].look) as Array<[GearSlot, GearLayer]>));
        }
    }
    return layers;
}

/** A saved equipment read back: unknown items, items in the wrong slot and slots the class can't change are dropped. */
export function readEquipment(value: unknown, classId: CharacterId): SavedEquipment {
    const equipment: SavedEquipment = { ...START_EQUIPMENT[classId] };
    if (typeof value !== 'object' || value === null) return equipment;
    for (const slot of EQUIP_SLOT_IDS) {
        const id: unknown = (value as Record<string, unknown>)[slot];
        if (typeof id !== 'string' || !isItemId(id)) {
            if (canEmptySlot(slot)) delete equipment[slot];
            continue;
        }
        if (itemInfo(id)?.slot === slot && classCanWear(classId, id)) equipment[slot] = id;
    }
    return equipment;
}

/** What an item gives, in a few words ("Damage 35", "Defense 14%, Magic resistance 8", "Circle 3, casts itself"). */
export function describeItem(id: ItemId): string {
    if (isActiveSpellId(id)) {
        const def = ACTIVE_SPELLS[id];
        return `Circle ${def.circle}, skill button, ${Math.round(activeSpellCooldownMs(def, 0) / 1000)} s recharge (less with Mag)`;
    }
    if (isSpellItemId(id)) {
        const spell = SPELLS[id];
        const shots = spell.shots > 1 ? ` ×${spell.shots}` : '';
        return `Circle ${spell.circle}, casts itself, damage ${spell.directDamage} + ${spell.areaDamage} area${shots}`;
    }
    if (isMeleeWeaponId(id)) return `Damage ${getMeleeWeapon(id).damage}`;
    if (isConsumableId(id)) return CONSUMABLES[id].description;
    if (isWandId(id)) {
        const bonus = getWand(id).magicDamageBonus;
        return bonus > 0 ? `Magic damage +${Math.round(bonus * 100)}%` : 'No extra damage';
    }
    const piece = ARMOR_PIECES[id];
    const parts = [`Defense ${Math.round(piece.defense * 100)}%`];
    if ('magicResistance' in piece) parts.push(`Magic resistance ${piece.magicResistance}`);
    if ('magicDamageBonus' in piece) parts.push(`Magic damage +${Math.round(piece.magicDamageBonus * 100)}%`);
    return parts.join(', ');
}

/** The number that says whether an item is better than another of its slot (Fase 21A, loot card). */
export interface ItemPower {
    label: string;
    value: number;
    /** Written after the number ("%" for defense). */
    unit: string;
    /** Written before the number ("+" for a wand's extra magic damage). */
    prefix?: string;
}

export function itemPower(id: ItemId): ItemPower {
    if (isActiveSpellId(id)) return { label: 'Circle', value: ACTIVE_SPELLS[id].circle, unit: '' };
    if (isSpellItemId(id)) {
        const spell = SPELLS[id];
        return { label: 'Damage', value: (spell.directDamage + spell.areaDamage) * spell.shots, unit: '' };
    }
    if (isMeleeWeaponId(id)) return { label: 'Damage', value: getMeleeWeapon(id).damage, unit: '' };
    if (isWandId(id)) return { label: 'Magic', value: Math.round(getWand(id).magicDamageBonus * 100), unit: '%', prefix: '+' };
    if (isConsumableId(id)) return { label: 'Uses', value: 1, unit: '' };
    return { label: 'Defense', value: Math.round(ARMOR_PIECES[id].defense * 100), unit: '%' };
}

// ---- Atributos (Fase 21B, data/attributes.ts) ----

/** Only weapons and wands have attributes, and wands are never Poison. */
export function canHaveAttribute(id: ItemId, attribute: ItemAttribute): boolean {
    if (isWandId(id)) return ATTRIBUTES[attribute].onWands;
    return isMeleeWeaponId(id);
}

/** Name with its attribute in front ("Sharp Long Sword"). */
export function ownedItemName(item: Readonly<OwnedItem>): string {
    const name = itemInfo(item.id)?.name ?? item.id;
    return item.attribute ? `${ATTRIBUTES[item.attribute].name} ${name}` : name;
}

/**
 * itemPower counting the attribute: a weapon's damage grows by it; a wand's "+% magic damage" becomes the total extra
 * of the wand and the attribute together (Berserk +40% and Sharp: ×1.4 × 1.1 → +54%).
 */
export function ownedItemPower(item: Readonly<OwnedItem>): ItemPower {
    const power = itemPower(item.id);
    const bonus = attributeDamageBonus(item.attribute);
    if (bonus === 0) return power;
    if (isMeleeWeaponId(item.id)) return { ...power, value: Math.round(power.value * (1 + bonus)) };
    if (isWandId(item.id)) return { ...power, value: Math.round(((1 + power.value / 100) * (1 + bonus) - 1) * 100) };
    return power;
}

/** A wand's Mana Save, for the grey "(soon)" line (Fase 21B: kept for when the spells cost mana). */
export function wandManaSave(id: ItemId): number | undefined {
    return isWandId(id) ? getWand(id).manaSave : undefined;
}
