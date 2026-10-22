// Ventana del herrero (Fase 24C, scenes/SmithScene.ts), con piezas del original:
// - panel: gamedialog86.spr hoja 2, frame 0 (270x381, con un martillo de fondo);
// - letreros: dialogtext.spr hoja 0, "Item for Sale" (frame 11, 258x31) en Buy y "Exchange Item" (frame 9, 270x31) en Sell;
// - botones: dialogtext.spr hoja 1, "Purchase" (30), "Sell" (38) y "Cancel" (16); iluminado = frame + 1.
// Colores y letras, los de la tienda (config/shop.ts). Posiciones en píxeles del panel original, × `scale`.
import { getSheetKey } from '../hb/HBSprite';
import { byDevice } from './device';

export const SMITH_PANEL = {
    texture: getSheetKey('ui.panel', 2),
    frame: 0,
    width: 270,
    height: 381,
    /** The panel is taller than the shop's: a bit smaller so it fits the 600 px screen. */
    scale: byDevice(1.5, 1.55),
    shadeAlpha: 0.6,
} as const;

export const SMITH_BANNERS = {
    texture: getSheetKey('ui.buttons', 0),
    buy: { frame: 11, width: 258 },
    sell: { frame: 9, width: 270 },
} as const;

/** Panel pixels (multiplied by SMITH_PANEL.scale). */
export const SMITH_LAYOUT = {
    /** "Buy" and "Sell": their centres, and the line under the chosen one. */
    tabsY: 46,
    tabX: { buy: 105, sell: 165 },
    tabUnderline: 26,
    /** "ITEM" and "PRICE". */
    headerY: 66,
    left: 14,
    right: 246,
    iconX: 28,
    iconSize: 20,
    nameX: 44,
    priceX: 240,
    listTop: 76,
    /** Rows shown at once (section titles count as rows); the rest scrolls. */
    visibleRows: 8,
    rowHeight: 23,
    /** ▲ and ▼ when there is more above or below, right of the list. */
    arrowX: 257,
    /** What the chosen item does, its requirements and the messages, under the list. */
    detailY: 264,
    detailWidth: 236,
    goldY: 338,
    buttonsY: 362,
    buttonGap: 46,
    /** A finger dragging the list this far moves it one row. */
    dragRowPx: 23,
} as const;

export const SMITH_BUTTONS = {
    texture: getSheetKey('ui.buttons', 1),
    purchase: 30,
    sell: 38,
    cancel: 16,
    litOffset: 1,
    disabledAlpha: 0.45,
} as const;

/**
 * Colours that differ from the shop's: the hammer panel is grey, so the shop's light "sold out" grey can't be read.
 * - requirement line: green when met, red when not;
 * - cantWear: the name of what the character can't put on yet (dark red), and its picture a bit faded;
 * - tabOff: the tab not chosen.
 */
export const SMITH_COLORS = {
    met: '#1d5a1d',
    unmet: '#a01c1c',
    cantWear: '#8c2a20',
    cantWearIconAlpha: 0.6,
    tabOff: '#3e352c',
} as const;
