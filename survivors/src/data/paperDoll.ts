// Equipo dibujado sobre el cuerpo en la ventana Character (M17), como DrawDialogBox_Character del original
// (reference/Client.cpp:32648). Dibujos grandes y quietos de item-equipm.spr (hombre) e item-equipw.spr (mujer):
// - Cada objeto del original dice su dibujo en Item*.cfg: "Spr" (grupo) y "SFrame" (frame), los mismos números que el
//   icono del inventario. El grupo se convierte en hoja del archivo con SPR_TO_SHEET (el de mujer es otro reparto).
// - Cuerpo (hoja 0, frame por piel), pelo (hoja 9, oculto con casco) y ropa interior (hoja 10) siempre.
// - Posiciones: puntos de la ventana original (270×376, sin pivote) donde el original ponía cada pieza; el pivote de
//   cada frame hace el resto.
// - Se parte de las mismas capas que el muñeco animado (ropa de la clase + equipo, data/items.ts → equipmentLook), así
//   que la ropa de salida (camisa, pantalón, corpiño, falda, botas, varita) también sale.
import type { SpriteKey } from '../config/assetManifest';
import type { ItemAttribute } from './attributes';
import type { AddedColor, GearLayer, GearSlot } from '../hb/playerAppearance';
import { gearForGender, type CharacterLook, type Gender } from './appearance';
import type { CharacterDef } from './characters';
import { equipmentLook, isMeleeWeaponId, type EquipSlotId, type SavedEquipment } from './items';
import { getMeleeWeapon } from './weapons';

export const PAPER_DOLL_SPRITES: Record<Gender, SpriteKey> = { male: 'item.equip.m', female: 'item.equip.w' };

/** A picture of the original's Item.cfg: group ("Spr") and frame ("SFrame"). */
interface CfgPicture {
    spr: number;
    frame: number;
}

/** Item.cfg group → sheet of item-equipm / item-equipw (reference/Client.cpp:3559-3611). */
const SPR_TO_SHEET: Record<Gender, Readonly<Record<number, number>>> = {
    male: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 7: 6, 8: 7, 9: 8, 15: 11, 17: 12, 20: 13, 21: 14 },
    female: { 1: 1, 2: 2, 3: 3, 5: 4, 10: 5, 11: 6, 12: 7, 13: 8, 15: 11, 17: 12, 20: 13, 21: 14 },
};
const BODY_SHEET = 0;
const HAIR_SHEET = 9;
const UNDERWEAR_SHEET = 10;
/** Body frame by skin (light, tanned, dark): the original's player types are dark, light, tanned. */
const BODY_FRAME_BY_SKIN = [1, 2, 0];

/** Pictures of the clothes, by the sprite drawn in the game (already for its gender). Numbers of reference/Item*.cfg. */
const CLOTHES: Partial<Record<SpriteKey, CfgPicture>> = {
    'gear.shirt.m': { spr: 7, frame: 0 }, 'gear.shirt.w': { spr: 11, frame: 1 },
    'gear.hauberk.m': { spr: 7, frame: 1 }, 'gear.hauberk.w': { spr: 11, frame: 2 },
    'gear.bodice.w': { spr: 13, frame: 0 },
    'gear.trousers.m': { spr: 8, frame: 0 }, 'gear.trousers.w': { spr: 12, frame: 1 },
    'gear.skirt.w': { spr: 12, frame: 0 },
    'gear.leggings.chain.m': { spr: 8, frame: 2 }, 'gear.leggings.chain.w': { spr: 12, frame: 3 },
    'gear.leggings.plate.m': { spr: 8, frame: 3 }, 'gear.leggings.plate.w': { spr: 12, frame: 4 },
    'gear.armor.leather.m': { spr: 9, frame: 0 }, 'gear.armor.leather.w': { spr: 13, frame: 2 },
    'gear.armor.chain.m': { spr: 9, frame: 1 }, 'gear.armor.chain.w': { spr: 13, frame: 3 },
    'gear.armor.scale.m': { spr: 9, frame: 2 }, 'gear.armor.scale.w': { spr: 13, frame: 4 },
    'gear.armor.plate.m': { spr: 9, frame: 3 }, 'gear.armor.plate.w': { spr: 13, frame: 5 },
    'gear.armor.robe.m': { spr: 9, frame: 5 }, 'gear.armor.robe.w': { spr: 13, frame: 6 },
    'gear.shoes.m': { spr: 5, frame: 0 }, 'gear.shoes.w': { spr: 5, frame: 0 },
    'gear.boots.long.m': { spr: 5, frame: 1 }, 'gear.boots.long.w': { spr: 5, frame: 1 },
    'gear.cape.m': { spr: 20, frame: 2 }, 'gear.cape.w': { spr: 20, frame: 2 },
    'gear.helm.basic.m': { spr: 21, frame: 0 }, 'gear.helm.basic.w': { spr: 21, frame: 0 },
    'gear.helm.full.m': { spr: 21, frame: 1 }, 'gear.helm.full.w': { spr: 21, frame: 1 },
    'gear.helm.horned.m': { spr: 21, frame: 2 }, 'gear.helm.horned.w': { spr: 21, frame: 2 },
    'gear.helm.winged.m': { spr: 21, frame: 3 }, 'gear.helm.winged.w': { spr: 21, frame: 3 },
    'gear.helm.wizardCap.m': { spr: 21, frame: 4 }, 'gear.helm.wizardCap.w': { spr: 21, frame: 4 },
    'gear.helm.wizard.m': { spr: 21, frame: 5 }, 'gear.helm.wizardHat.w': { spr: 21, frame: 5 },
    // Wands (Fase 21B, data/wands.ts): Magic Wand and Wizard Staff, Berserk Wand, Kloness Wand.
    'gear.wand.m': { spr: 17, frame: 1 }, 'gear.wand.w': { spr: 17, frame: 1 },
    'gear.wand.berserk.m': { spr: 17, frame: 4 }, 'gear.wand.berserk.w': { spr: 17, frame: 4 },
    'gear.wand.kloness.m': { spr: 17, frame: 5 }, 'gear.wand.kloness.w': { spr: 17, frame: 5 },
};
const SHIELD_SPR = 3;
/** msh/wsh.spr have 7 sheets per shield, in the Item.cfg frame order. */
const SHIELD_SHEETS_PER_FRAME = 7;
const SWORD_SPR = 1;

type DollPlace = 'body' | 'back' | 'shield' | 'weapon' | 'head';

/** Where the original put each piece, in pixels of the window (reference/Client.cpp, DrawDialogBox_Character). */
const PLACES: Record<Gender, Record<DollPlace, { x: number; y: number }>> = {
    male: { body: { x: 171, y: 290 }, back: { x: 41, y: 137 }, shield: { x: 90, y: 170 }, weapon: { x: 57, y: 186 }, head: { x: 72, y: 135 } },
    female: { body: { x: 171, y: 290 }, back: { x: 45, y: 143 }, shield: { x: 84, y: 175 }, weapon: { x: 60, y: 191 }, head: { x: 72, y: 139 } },
};

/** Drawing order of the equipment and where each one goes (body, hair and underwear go first). */
const ORDER: ReadonlyArray<[GearSlot, DollPlace]> = [
    ['cape', 'back'], ['leggings', 'body'], ['hauberk', 'body'], ['boots', 'body'], ['armor', 'body'],
    ['shield', 'shield'], ['weapon', 'weapon'], ['helm', 'head'],
];

export interface PaperDollPiece {
    sheet: number;
    frame: number;
    /** Point in the window's pixels. */
    x: number;
    y: number;
    /** Colour multiplied over it (Wizard Robe), as in the game. */
    tint?: number;
    /** Hair only: index in HAIR_COLORS, added as in the original. */
    hairColor?: number;
    /** The weapon's attribute colour, added as in the game (Fase 21B). */
    added?: AddedColor;
}

function picture(slot: GearSlot, layer: GearLayer, equipment: Readonly<SavedEquipment>): CfgPicture | undefined {
    if (slot === 'weapon' && equipment.weapon && isMeleeWeaponId(equipment.weapon)) {
        // The sword's icon frame is the Item.cfg's SFrame, the same as its picture here.
        const icon = getMeleeWeapon(equipment.weapon).icon;
        return icon ? { spr: SWORD_SPR, frame: icon.frame } : undefined;
    }
    if (slot === 'shield') return { spr: SHIELD_SPR, frame: Math.floor((layer.startSheet ?? 0) / SHIELD_SHEETS_PER_FRAME) };
    return CLOTHES[layer.sprite];
}

/** Every picture of the character's window, from the bottom one to the top one. */
export function paperDollPieces(
    def: CharacterDef, look: CharacterLook, equipment: Readonly<SavedEquipment>, attributes: Readonly<Partial<Record<EquipSlotId, ItemAttribute>>> = {},
): PaperDollPiece[] {
    const { gender } = look;
    const places = PLACES[gender];
    const layers: Partial<Record<GearSlot, GearLayer>> = { ...def.appearance };
    for (const [slot, layer] of equipmentLook(equipment, attributes)) layers[slot] = layer;
    const body = places.body;
    const pieces: PaperDollPiece[] = [{ sheet: BODY_SHEET, frame: BODY_FRAME_BY_SKIN[look.skin] ?? 1, ...body }];
    if (!layers.helm) pieces.push({ sheet: HAIR_SHEET, frame: look.hairStyle, ...body, hairColor: look.hairColor });
    pieces.push({ sheet: UNDERWEAR_SHEET, frame: look.underwear, ...body });

    const add = (slot: GearSlot, place: DollPlace): void => {
        const layer = layers[slot];
        if (!layer) return;
        const sprite = gearForGender(layer.sprite, gender);
        const pic = picture(slot, { ...layer, sprite }, equipment);
        const sheet = pic && SPR_TO_SHEET[gender][pic.spr];
        if (!pic || sheet === undefined) return;
        pieces.push({
            sheet, frame: pic.frame, ...places[place], ...(layer.tint !== undefined ? { tint: layer.tint } : {}), ...(layer.added ? { added: layer.added } : {}),
        });
    };
    // The original draws a woman's boots under a skirt (right after the cape).
    const skirt = gender === 'female' && layers.leggings !== undefined && gearForGender(layers.leggings.sprite, gender) === 'gear.skirt.w';
    for (const [slot, place] of ORDER) {
        if (skirt && slot === 'boots') continue;
        add(slot, place);
        if (skirt && slot === 'cape') add('boots', 'body');
    }
    return pieces;
}
