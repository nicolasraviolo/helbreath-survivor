// Pantalla Equipment (Fase 20B): a la izquierda la ventana Character original (dialogtext hoja 0, con el muñeco vestido
// y las stats permanentes), en la misma posición y escala que en partida (config/characterInfo.ts); a la derecha un
// panel con los huecos y la lista de objetos del hueco elegido, con sus dibujos de item-pack.spr.
import { getSheetKey } from '../hb/HBSprite';
import { byDevice } from './device';
import { UI_TEXT } from './ui';

/** Texture of the item pictures (one sheet per kind of item; frame = the item). */
export function itemPackTexture(sheet: number): string {
    return getSheetKey('item.pack', sheet);
}

/** Right-hand panel, beside the Character window. */
export const EQUIPMENT_PANEL = {
    x: 415,
    y: 12,
    width: 373,
    height: 545,
    padding: 10,
    background: 0x1c140c,
    alpha: 1,
    border: 0x8a7038,
} as const;

/** Slot boxes: a row with the slots that work and, under it, the ones still empty (spells, ring...). */
export const EQUIPMENT_SLOTS = {
    top: 40,
    size: 46,
    gap: 6,
    /** Space for the slot's name under its box. */
    labelHeight: 28,
    rowGap: 6,
    /** Largest side of an item picture inside a box. */
    iconSize: 40,
    background: 0x2e2216,
    border: 0x5a4a30,
    selectedBorder: 0xe8c060,
    futureAlpha: 0.35,
} as const;

/** Item list of the chosen slot. */
export const EQUIPMENT_LIST = {
    top: 200,
    rowHeight: 32,
    /** Rows shrink down to this when there are too many for the panel (Fase 21B). */
    minRowHeight: 22,
    /** Space kept between the last row and the Ok button. */
    bottomGap: 6,
    iconSize: 28,
    /** Row of the item worn now. */
    wornColor: 0x4a3818,
    focusColor: 0xffd860,
} as const;

/** Close button (dialogtext.spr sheet 1, "Ok", lit = frame + 1), at the bottom of the panel. */
export const EQUIPMENT_OK = { texture: getSheetKey('ui.buttons', 1), frame: 0, litOffset: 1, width: 74, height: 20, bottom: 12, scale: 1.45 } as const;

export const EQUIPMENT_TITLE_STYLE = { ...UI_TEXT, fontSize: byDevice('18px', '21px'), fontStyle: 'bold', color: '#e8c060' } as const;
export const EQUIPMENT_LABEL_STYLE = { ...UI_TEXT, fontSize: byDevice('11px', '13px'), color: '#c8b88a' } as const;
/** Spell name written inside its slot box (spells have no picture yet, Fase 20D). */
export const EQUIPMENT_SPELL_NAME_STYLE = { ...UI_TEXT, fontSize: byDevice('10px', '12px'), color: '#e8d9a8', align: 'center' } as const;
export const EQUIPMENT_ROW_STYLE = { ...UI_TEXT, fontSize: byDevice('15px', '17px'), color: '#e8d9a8' } as const;
export const EQUIPMENT_DETAIL_STYLE = { ...UI_TEXT, fontSize: byDevice('13px', '15px'), color: '#b8a878' } as const;
/** Requirement not met. */
export const EQUIPMENT_UNMET_COLOR = '#ff6050';
export const EQUIPMENT_MET_COLOR = '#9ccf7a';
/** "×N" after an item the character keeps in its inventory (Fase 21A). */
export const EQUIPMENT_OWNED_COLOR = '#ffd860';
