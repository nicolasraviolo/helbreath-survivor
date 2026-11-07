// Helbreath Off (Fase Off-4B): medidas de la ventana Inventory (off/scenes/OffInventoryScene.ts). Es un panel a la
// derecha, encima del mundo que sigue andando (no tapa al personaje, que va en el centro), tan alto como lo que lleva.
// Colores y letras, los de Equipment (config/equipment.ts y off/config/offEquipment.ts).
import { byDevice } from '../../config/device';
import { UI_TEXT } from '../../config/ui';

export const OFF_INVENTORY_PANEL = {
    /** From the right edge of the screen. */
    right: 8,
    top: 8,
    /** Space kept above the HUD bar (or the screen's bottom with the compact HUD). */
    bottomGap: 8,
    padding: 8,
    background: 0x1c140c,
    alpha: 0.94,
    border: 0x8a7038,
    titleHeight: byDevice(28, 32),
    /** Room for the result line ("Not enough Str...") and the help line, under the buttons. */
    messageHeight: byDevice(30, 34),
    helpHeight: byDevice(18, 20),
} as const;

/** The bag: 10 × 5 cells (OFF_LOOT.bagSize = 50), one item per cell, filled in order. */
export const OFF_INVENTORY_GRID = {
    columns: 10,
    rows: 5,
    cell: byDevice(32, 34),
    gap: 2,
    /** Largest side of an item picture inside a cell. */
    iconSize: byDevice(28, 30),
    background: 0x2e2216,
    border: 0x5a4a30,
    focusColor: 0xffd860,
    /** Gear the character could not put on (not enough Str): the cell's tint. */
    unmetColor: 0x5a1e14,
    /** Two clicks on the same cell within this time = use it. */
    doubleClickMs: 400,
} as const;

/** Gold and potion count, under the grid. */
export const OFF_INVENTORY_INFO = { gap: 6, height: byDevice(22, 24) } as const;

/** Stat box of the marked item (off/ui/offItemBox.ts), under the info line. */
export const OFF_INVENTORY_BOX = { gap: 4, height: byDevice(132, 150) } as const;

/** Use, Drop and Equipment buttons at the bottom of the panel. */
export const OFF_INVENTORY_BUTTONS = {
    height: byDevice(28, 34),
    gap: 8,
    background: 0x3a2a14,
    border: 0x8a7038,
    disabledAlpha: 0.4,
} as const;

export const OFF_INVENTORY_TITLE_STYLE = { ...UI_TEXT, fontSize: byDevice('18px', '21px'), fontStyle: 'bold', color: '#e8c060' } as const;
export const OFF_INVENTORY_INFO_STYLE = { ...UI_TEXT, fontSize: byDevice('14px', '16px'), color: '#e8d9a8' } as const;
export const OFF_INVENTORY_BUTTON_STYLE = { ...UI_TEXT, fontSize: byDevice('15px', '17px'), fontStyle: 'bold', color: '#e8d9a8' } as const;
export const OFF_INVENTORY_HELP_STYLE = { ...UI_TEXT, fontSize: byDevice('12px', '13px'), color: '#b8a878' } as const;
/** The result of the last action ("Not enough Str..."), over the help line. */
export const OFF_INVENTORY_MESSAGE_STYLE = { ...UI_TEXT, fontSize: byDevice('13px', '15px'), color: '#ffd860' } as const;
