// Varitas de la Maga (Fase 21B; decidido por el propietario el 20-oct-2026). Van en el hueco Weapon, como las armas
// del Guerrero, y son las del original (reference/Item.cfg y Item3.cfg; docs/hb-wiki/armas.md, "Wands"):
// - Requisito: solo el Level del original. No piden Str ni Int.
// - Mana Save: el % del original. Desde la Fase 26A abarata el Spell 2 (Equipment.manaSave → ActiveSpellSystem).
// - Daño: en el original las varitas no suben el daño. Solo Berserk Wand (+40%) y Kloness Wand (+20%), números del
//   propietario, que además caen muy poco (`rare`, ver LOOT_RARE_KEEP_CHANCE en data/loot.ts).
// - Sharp y Ancient suben el daño de los hechizos; Poison no sale nunca en una varita (data/attributes.ts).
// - Dibujo en el cuerpo: el "Appr" del Item.cfg (reference/Client.cpp:3847): 34 BerserkWand, 36 mstaff2 (todas las
//   Magic Wand y Wizard Staff), 39 KlonessWand. Icono: item-pack hoja 16 (Spr 17 − 1), frame = SFrame.
import type { SpriteKey } from '../config/assetManifest';
import type { EquipRequirement, ItemIcon } from './itemTypes';

export interface WandDef {
    name: string;
    /** Mana saved on each active spell, as in the original (0.2 = 20%; Fase 26A, Equipment.manaSave). */
    manaSave: number;
    /** Extra magic damage while held (0.4 = +40%). Only the Berserk and Kloness wands have it. */
    magicDamageBonus: number;
    /** Too strong: drops much less often than the rest. */
    rare?: boolean;
    sprite: SpriteKey;
    equip: EquipRequirement;
    icon: ItemIcon;
}

const MAGIC_WAND_ICON: ItemIcon = { sheet: 16, frame: 1 };

export const WANDS = {
    magicWandMS0: { name: 'Magic Wand (MS0)', manaSave: 0, magicDamageBonus: 0, sprite: 'gear.wand.m', equip: {}, icon: MAGIC_WAND_ICON },
    magicWandMS10: { name: 'Magic Wand (MS10)', manaSave: 0.1, magicDamageBonus: 0, sprite: 'gear.wand.m', equip: { level: 15 }, icon: MAGIC_WAND_ICON },
    magicWandMS20: { name: 'Magic Wand (MS20)', manaSave: 0.2, magicDamageBonus: 0, sprite: 'gear.wand.m', equip: { level: 35 }, icon: MAGIC_WAND_ICON },
    wizardStaffMS10: { name: 'Wizard Staff (MS10)', manaSave: 0.1, magicDamageBonus: 0, sprite: 'gear.wand.m', equip: { level: 60 }, icon: MAGIC_WAND_ICON },
    wizardStaffMS20: { name: 'Wizard Staff (MS20)', manaSave: 0.2, magicDamageBonus: 0, sprite: 'gear.wand.m', equip: { level: 70 }, icon: MAGIC_WAND_ICON },
    klonessWandMS10: {
        name: 'Kloness Wand (MS10)', manaSave: 0.1, magicDamageBonus: 0.2, rare: true, sprite: 'gear.wand.kloness.m', equip: { level: 120 },
        icon: { sheet: 16, frame: 5 },
    },
    klonessWandMS20: {
        name: 'Kloness Wand (MS20)', manaSave: 0.2, magicDamageBonus: 0.2, rare: true, sprite: 'gear.wand.kloness.m', equip: { level: 120 },
        icon: { sheet: 16, frame: 5 },
    },
    berserkWandMS10: {
        name: 'Berserk Wand (MS10)', manaSave: 0.1, magicDamageBonus: 0.4, rare: true, sprite: 'gear.wand.berserk.m', equip: { level: 120 },
        icon: { sheet: 16, frame: 4 },
    },
    berserkWandMS20: {
        name: 'Berserk Wand (MS20)', manaSave: 0.2, magicDamageBonus: 0.4, rare: true, sprite: 'gear.wand.berserk.m', equip: { level: 120 },
        icon: { sheet: 16, frame: 4 },
    },
} as const satisfies Record<string, WandDef>;

export type WandId = keyof typeof WANDS;

/** From the weakest to the strongest (the ladder of the Equipment screen and the loot). */
export const WAND_IDS = Object.keys(WANDS) as WandId[];

export function getWand(id: WandId): WandDef {
    return WANDS[id];
}

export function isWandId(id: string): id is WandId {
    return Object.prototype.hasOwnProperty.call(WANDS, id);
}
