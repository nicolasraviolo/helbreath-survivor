// Ventana de la tienda (Fase 24B, scenes/ShopScene.ts), como la "Item for Sale" del original (captura del propietario,
// 22-oct-2026):
// - panel: gamedialog86.spr hoja 1, frame 2 (258x339, pergamino con bolitas de plata en las esquinas);
// - letrero: dialogtext.spr hoja 0, frame 11 ("Item for Sale", 258x31), arriba del panel;
// - botones: dialogtext.spr hoja 1, "Purchase" (frame 30) y "Cancel" (frame 16); iluminado = frame + 1.
// Todas las posiciones van en píxeles del panel original (258x339) y se multiplican por `scale`.
import { getSheetKey } from '../hb/HBSprite';
import { byDevice } from './device';
import { UI_TEXT, UI_FONT_SIZE, px } from './ui';

export const SHOP_PANEL = {
    texture: getSheetKey('ui.panel', 1),
    frame: 2,
    width: 258,
    height: 339,
    /** Bigger on phones, for fingers. */
    scale: byDevice(1.6, 1.7),
    shadeAlpha: 0.6,
} as const;

export const SHOP_BANNER = { texture: getSheetKey('ui.buttons', 0), frame: 11 } as const;

/** Panel pixels (multiplied by SHOP_PANEL.scale). */
export const SHOP_LAYOUT = {
    /** "ITEM" and "PRICE". */
    headerY: 46,
    /** Left edge of the rows' background and of the picture column. */
    left: 16,
    right: 242,
    /** Centre of the pictures; the names start at nameX. */
    iconX: 30,
    iconSize: 20,
    nameX: 46,
    /** The prices end here (right-aligned). */
    priceX: 236,
    listTop: 58,
    sectionHeight: 17,
    rowHeight: 24,
    /** What the chosen item does (and the messages), under the list. */
    detailY: 218,
    detailWidth: 220,
    goldY: 284,
    buttonsY: 308,
    /** Centres of Purchase and Cancel, from the panel's middle. */
    buttonGap: 46,
} as const;

export const SHOP_BUTTONS = {
    texture: getSheetKey('ui.buttons', 1),
    purchase: 30,
    cancel: 16,
    litOffset: 1,
    /** Purchase when the chosen item can't be bought (sold out or not enough gold). */
    disabledAlpha: 0.45,
} as const;

/** Dark ink on the parchment, as in the original. */
export const SHOP_COLORS = {
    text: '#1e2050',
    heading: '#141428',
    /** Sold out: lighter, as if switched off. */
    soldOut: '#857d6e',
    /** A price you can't pay yet. */
    tooExpensive: '#a01c1c',
    detail: '#2a1c0c',
    gold: '#4a2c00',
    /** Row chosen: a darker band with a frame. */
    selectedFill: 0x5a3c10,
    selectedAlpha: 0.18,
    selectedBorder: 0x6a4a10,
    hoverFill: 0x5a3c10,
    hoverAlpha: 0.08,
    soldOutIconAlpha: 0.4,
} as const;

const ROW_SIZE = byDevice(UI_FONT_SIZE.normal, UI_FONT_SIZE.normal - 1);

export const SHOP_HEADER_STYLE = { ...UI_TEXT, fontSize: px(ROW_SIZE), fontStyle: 'bold', color: SHOP_COLORS.heading } as const;
export const SHOP_SECTION_STYLE = { ...UI_TEXT, fontSize: px(ROW_SIZE), fontStyle: 'bold', color: SHOP_COLORS.heading } as const;
export const SHOP_ROW_STYLE = { ...UI_TEXT, fontSize: px(ROW_SIZE), color: SHOP_COLORS.text } as const;
export const SHOP_DETAIL_STYLE = { ...UI_TEXT, fontSize: px(byDevice(UI_FONT_SIZE.normal - 1, UI_FONT_SIZE.small)), color: SHOP_COLORS.detail } as const;
export const SHOP_GOLD_STYLE = { ...UI_TEXT, fontSize: px(ROW_SIZE), fontStyle: 'bold', color: SHOP_COLORS.gold } as const;
