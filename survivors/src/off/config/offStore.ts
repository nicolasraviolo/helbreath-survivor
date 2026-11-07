// Helbreath Off (Fase Off-5B): medidas de las ventanas de la tienda y el herrero (off/scenes/OffStoreScene.ts) y del
// almacén (off/scenes/OffWarehouseScene.ts). Mismo estilo que el inventario de Off (off/config/offInventory.ts): el
// pergamino "Item for Sale" de Survivors no tiene sitio para 40 objetos y el cuadro de stats.
import { byDevice } from '../../config/device';
import { UI_TEXT } from '../../config/ui';

/** Centred panel; the world goes on underneath (cities have no monsters). */
export const OFF_STORE_PANEL = {
    width: 720,
    top: 16,
    bottomGap: 8,
    padding: 10,
    background: 0x1c140c,
    alpha: 0.96,
    border: 0x8a7038,
    titleHeight: byDevice(30, 34),
    /** Space between the list and the right-hand column. */
    columnGap: 12,
} as const;

/** Buy / Sell tabs, over the list. */
export const OFF_STORE_TABS = {
    width: 90,
    height: byDevice(26, 32),
    gap: 6,
    background: 0x2e2216,
    activeBackground: 0x5a4220,
    border: 0x8a7038,
} as const;

/** The list of items: rows with picture, name, requirement and price. */
export const OFF_STORE_LIST = {
    width: 400,
    headerHeight: byDevice(20, 22),
    rowHeight: byDevice(28, 34),
    iconSize: byDevice(24, 28),
    background: 0x120c06,
    border: 0x5a4a30,
    focusFill: 0x5a4220,
    sectionColor: '#e8c060',
    /** Two clicks on the same row within this time = buy / sell it. */
    doubleClickMs: 400,
    /** Rows scrolled by one turn of the mouse wheel. */
    wheelRows: 3,
} as const;

/** Right-hand column: stat box, gold, message, buttons and help. */
export const OFF_STORE_SIDE = {
    boxHeight: byDevice(150, 168),
    gap: 8,
    goldHeight: byDevice(24, 26),
    messageHeight: byDevice(48, 54),
    buttonHeight: byDevice(30, 36),
    buttonBackground: 0x3a2a14,
    buttonBorder: 0x8a7038,
    disabledAlpha: 0.4,
} as const;

/** The warehouse: the bag (10 × 5) and the warehouse (10 × 12 = 120), side by side. */
export const OFF_WAREHOUSE_GRID = {
    columns: 10,
    bagRows: 5,
    warehouseRows: 12,
    cell: byDevice(32, 32),
    gap: 2,
    iconSize: byDevice(28, 28),
    background: 0x2e2216,
    border: 0x5a4a30,
    focusColor: 0xffd860,
    labelHeight: byDevice(22, 24),
} as const;

export const OFF_STORE_TITLE_STYLE = { ...UI_TEXT, fontSize: byDevice('19px', '22px'), fontStyle: 'bold', color: '#e8c060' } as const;
export const OFF_STORE_ROW_STYLE = { ...UI_TEXT, fontSize: byDevice('14px', '16px'), color: '#e8d9a8' } as const;
export const OFF_STORE_SMALL_STYLE = { ...UI_TEXT, fontSize: byDevice('12px', '14px'), color: '#b8a878' } as const;
export const OFF_STORE_HEADER_STYLE = { ...UI_TEXT, fontSize: byDevice('12px', '14px'), fontStyle: 'bold', color: '#b8a878' } as const;
export const OFF_STORE_BUTTON_STYLE = { ...UI_TEXT, fontSize: byDevice('15px', '17px'), fontStyle: 'bold', color: '#e8d9a8' } as const;
export const OFF_STORE_GOLD_STYLE = { ...UI_TEXT, fontSize: byDevice('15px', '17px'), fontStyle: 'bold', color: '#ffd860' } as const;
export const OFF_STORE_MESSAGE_STYLE = { ...UI_TEXT, fontSize: byDevice('13px', '15px'), color: '#ffd860' } as const;
/** A price you can't pay, or gear you can't wear yet. */
export const OFF_STORE_UNMET_COLOR = '#e05040';
