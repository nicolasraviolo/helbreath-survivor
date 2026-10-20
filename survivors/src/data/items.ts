// Equipo permanente del personaje (Fase 20B; docs/DESIGN.md, "Progresión entre partidas"):
// - Huecos que ya funcionan: arma, escudo, casco, armadura, pantalones, botas, capa y, solo el Mago, 2 hechizos (20D:
//   Spell 1 automático, círculos 1–5; Spell 2 activo, círculos 6–10). Los demás (anillo, collar, ángel, Zem y Abaddon's
//   Blood) se ven vacíos en la pantalla de equipo hasta la Fase 21.
// - Catálogo libre (decidido el 19-oct-2026, provisional hasta el botín de la Fase 21): se puede poner cualquier objeto
//   cuyo requisito cumplan las stats PERMANENTES y el Level (números del original, en weapons.ts y armor.ts).
// - El Mago no cambia de arma: su varita es fija (solo se ve); lucha con los hechizos.
// - Equipo de salida: el Guerrero, la daga; el Mago, Energy Bolt y Energy Strike, que no piden nada (propietario,
//   19-oct-2026). Los huecos de hechizo y el del arma nunca se quedan vacíos.
import type { GearLayer, GearSlot } from '../hb/playerAppearance';
import { ACTIVE_SPELL_IDS, ACTIVE_SPELLS, isActiveSpellId, type ActiveSpellId } from './activeSpells';
import type { Gender } from './appearance';
import { ARMOR_PIECES, ARMOR_SLOT_NAMES, type ArmorPieceId, type ArmorSlotId } from './armor';
import type { CharacterId } from './characters';
import type { EquipRequirement, ItemIcon, ItemIconFrame } from './itemTypes';
import { AUTO_SPELL_IDS, isAutoSpellId, SPELLS, type AutoSpellId } from './spells';
import type { Stats } from './stats';
import { getMeleeWeapon, MELEE_FAMILIES, MELEE_WEAPONS, type MeleeWeaponId } from './weapons';

export type SpellSlotId = 'spell1' | 'spell2';
export type EquipSlotId = 'weapon' | ArmorSlotId | SpellSlotId;

/** Slots on the Equipment screen: gear on the first row, spells starting the second one. */
export const GEAR_SLOT_IDS = ['weapon', 'shield', 'helm', 'body', 'legs', 'boots', 'cape'] as const satisfies readonly EquipSlotId[];
export const SPELL_SLOT_IDS = ['spell1', 'spell2'] as const satisfies readonly SpellSlotId[];
export const EQUIP_SLOT_IDS: readonly EquipSlotId[] = [...GEAR_SLOT_IDS, ...SPELL_SLOT_IDS];

export const EQUIP_SLOT_NAMES: Readonly<Record<EquipSlotId, string>> = { weapon: 'Weapon', ...ARMOR_SLOT_NAMES, spell1: 'Spell 1', spell2: 'Spell 2' };

/** Slots shown empty after the spell slots until they work (Fase 21). */
export const FUTURE_SLOT_NAMES = ['Ring', 'Necklace', 'Angel', 'Zem', "Abaddon's Blood"] as const;

export type SpellItemId = AutoSpellId | ActiveSpellId;
export type ItemId = MeleeWeaponId | ArmorPieceId | SpellItemId;

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
    mage: { spell1: 'energyBolt', spell2: 'energyStrike' },
};

/** Slots each class can change on the Equipment screen. */
const CLASS_SLOTS: Readonly<Record<CharacterId, readonly EquipSlotId[]>> = {
    warrior: GEAR_SLOT_IDS,
    mage: EQUIP_SLOT_IDS.filter((slot) => slot !== 'weapon'),
};

/** The Mage's starting spells ask for nothing (owner, 19-oct-2026), like the Warrior's dagger. */
const FREE_SPELLS: ReadonlySet<ItemId> = new Set(Object.values(START_EQUIPMENT.mage));

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
    return isMeleeWeaponId(id) || isArmorPieceId(id) || isSpellItemId(id);
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
    const piece = ARMOR_PIECES[id];
    return { name: piece.name, slot: piece.slot, equip: piece.equip, icon: piece.icon };
}

export function canChangeSlot(classId: CharacterId, slot: EquipSlotId): boolean {
    return CLASS_SLOTS[classId].includes(slot);
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

/** Layers the equipment draws on the body (men's sprites: CharacterSprite turns them into women's ones). */
export function equipmentLook(equipment: Readonly<SavedEquipment>): Array<[GearSlot, GearLayer]> {
    const layers: Array<[GearSlot, GearLayer]> = [];
    for (const id of Object.values(equipment)) {
        if (isSpellItemId(id)) continue;
        if (isMeleeWeaponId(id)) {
            const sprite = getMeleeWeapon(id).sprite;
            if (sprite) layers.push(['weapon', { sprite: sprite.key, startSheet: sprite.startSheet }]);
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
        if (itemInfo(id)?.slot === slot && canChangeSlot(classId, slot)) equipment[slot] = id;
    }
    return equipment;
}
