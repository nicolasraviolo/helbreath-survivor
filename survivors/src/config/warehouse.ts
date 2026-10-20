// Pantalla Warehouse (Fase 21D, scenes/WarehouseScene.ts): dos paneles, a la izquierda el inventario del personaje y a
// la derecha el baúl compartido, con los colores y letras de la pantalla Equipment (config/equipment.ts).
import { UI_TEXT } from './ui';
import { byDevice } from './device';

/** The two panels, side by side. */
export const WAREHOUSE_PANELS = {
    y: 46,
    height: 470,
    gap: 12,
    /** Left edge of the left panel (the right one is mirrored). */
    x: 12,
    padding: 10,
    background: 0x1c140c,
    border: 0x8a7038,
} as const;

/** Rows of each list: one per kind of item, with "×N". The list scrolls when they don't fit. */
export const WAREHOUSE_LIST = {
    /** Below the panel's heading. */
    top: 38,
    rowHeight: 30,
    iconSize: 26,
    focusColor: 0xffd860,
    /** Row under the pointer or chosen with the keys. */
    hoverColor: 0x3a2c18,
} as const;

/** Darker than Equipment's: the two panels cover most of Select Character, and the help text sits on it. */
export const WAREHOUSE_SHADE_ALPHA = 0.85;
export const WAREHOUSE_TITLE_Y = 12;
export const WAREHOUSE_HELP_Y = 522;
/** Close button, like Equipment's Ok, centred at the bottom. */
export const WAREHOUSE_OK_Y = 560;

export const WAREHOUSE_HEADING_STYLE = { ...UI_TEXT, fontSize: byDevice('15px', '17px'), fontStyle: 'bold', color: '#e8c060' } as const;
export const WAREHOUSE_HELP_STYLE = { ...UI_TEXT, fontSize: byDevice('13px', '15px'), color: '#e8d9a8', align: 'center' } as const;
/** "Mage only" / "Warrior only" after an item the marked character's class can't use. */
export const WAREHOUSE_OTHER_CLASS_COLOR = '#c88a60';
export const WAREHOUSE_FULL_COLOR = '#ff6050';
