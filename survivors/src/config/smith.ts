// Ventana del herrero (Fase 24C, scenes/SmithScene.ts), con piezas del original:
// - panel: gamedialog86.spr hoja 2, frame 0 (270x381, con un martillo de fondo);
// - letreros: dialogtext.spr hoja 0, "Item for Sale" (frame 11, 258x31) en Buy, "Exchange Item" (frame 9, 270x31) en
//   Sell e "Item Upgrade" (frame 5) en Upgrade (Fase 24D);
// - botones: dialogtext.spr hoja 1, "Purchase" (30), "Sell" (38), "Upgrade" (46) y "Cancel" (16); iluminado = frame + 1.
// Colores y letras, los de la tienda (config/shop.ts). Posiciones en píxeles del panel original, × `scale`.
import { getSheetKey } from '../hb/HBSprite';
import type { SoundKey } from './assetManifest';
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
    upgrade: { frame: 5, width: 258 },
} as const;

/** Panel pixels (multiplied by SMITH_PANEL.scale). */
export const SMITH_LAYOUT = {
    /** "Buy", "Sell" and "Upgrade": their centres, and the line under the chosen one (as wide as its word). */
    tabsY: 46,
    tabX: { buy: 80, sell: 135, upgrade: 192 },
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
    upgrade: 46,
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

/** Sound of an upgrade done (Fase 24D): the one of putting an item on (E28). */
export const SMITH_UPGRADE_SOUND: SoundKey = 'sfx.itemEquip';
