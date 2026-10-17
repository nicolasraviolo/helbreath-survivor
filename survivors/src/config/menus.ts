// Menús de la Fase 8 (principal, pausa, ajustes, créditos y logros), con piezas del original:
// - fondo del menú principal: new-dialog.spr hoja 1, frame 0 (640x480, "Helbreath The Heldenian", la pantalla de login).
//   Trae dibujados los botones Log In / New Account / Exit y una línea de texto abajo: el panel y la franja los tapan;
// - paneles: gamedialog86.spr hoja 3, frame 3 (338x202, marco con esquinas de plata y un castillo de fondo);
// - opciones: la fuente dibujada del original (hb/SpriteText.ts), gris claro y dorada la elegida;
// - flechas ◄ ► para cambiar un valor: gamedialog86.spr hoja 1, frame 7 (la de la derecha es la misma, volteada).
import { getSheetKey } from '../hb/HBSprite';
import { GAME_HEIGHT, GAME_WIDTH } from './gameConfig';
import { UI_FONT, UI_FONT_SIZE, px } from './ui';

export const MENU_BACKGROUND = { texture: getSheetKey('ui.title', 1), frame: 0, width: 640 } as const;
/** The 640x480 background is drawn at this scale to fill the 800x600 screen. */
export const MENU_BACKGROUND_SCALE = GAME_WIDTH / MENU_BACKGROUND.width;

export const MENU_PANEL = { texture: getSheetKey('ui.panel', 3), frame: 3, width: 338, height: 202 } as const;

/** Main menu: panel on the right, over the original's drawn buttons. */
export const MAIN_MENU = {
    panelX: 585,
    panelY: 318,
    panelScale: 1.1,
    itemSpacing: 42,
    /** Black strip over the original's "Multiplayer Online Game…" line, with our own footer. */
    footerHeight: 42,
    footerText: 'Unofficial fan project  ·  free and non-profit',
} as const;

/** Pause, Settings, Credits and Achievements: a big panel in the middle of the screen. */
export const MENU_OVERLAY = {
    /** Darkens whatever is underneath (the paused game or the main menu). */
    shadeAlpha: 0.6,
    panelX: GAME_WIDTH / 2,
    panelY: 280,
    panelScale: 1.5,
    /** Credits has more lines: a bigger panel. */
    creditsPanelScale: 1.9,
    /** Title in the sprite font, from the panel's top edge. */
    titleOffsetY: 34,
    titleScale: 2,
    /** First option / text line, from the panel's top edge. */
    contentOffsetY: 100,
    itemSpacing: 40,
    /** Options with a value (Settings): label at the left, value at the right, this far from the centre. */
    valueColumnHalfWidth: 215,
} as const;

/** Options in the sprite font. */
export const MENU_ITEM = {
    scale: 1.6,
    color: 0xe8dcc0,
    selectedColor: 0xffd860,
    titleColor: 0xffd860,
    /** Height of the clickable area of each option (screen pixels). */
    hitHeight: 34,
    /** Rows with a value: from the left edge of "◄" to the right edge of "►" (screen pixels). */
    valueBoxWidth: 120,
    /** Clickable width of each arrow, a bit wider than the arrow itself so it's easy to hit. */
    arrowHitWidth: 34,
} as const;

/** Arrow buttons of the value rows: gamedialog86.spr sheet 1, frame 7 (orange "◄", 15x15); flipped for "►". */
export const MENU_ARROW = {
    texture: getSheetKey('ui.panel', 1),
    frame: 7,
    size: 15,
    scale: 1.6,
    /** Arrows of the rows that aren't highlighted are a bit faded. */
    idleAlpha: 0.7,
} as const;

/** Ignore input for a moment so the key / button that opened a menu does nothing in it. */
export const MENU_INPUT_DELAY_MS = 200;

/** Plain text on the panels (Credits, Achievements). */
export const MENU_TEXT_STYLE = {
    fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.normal), color: '#f0e6c8', align: 'center', lineSpacing: 4,
    stroke: '#000000', strokeThickness: 3,
} as const;
export const MENU_FOOTER_STYLE = { fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.normal), color: '#c8b88a' } as const;
export const MENU_HINT_STYLE = { fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.small), color: '#c8b88a' } as const;

/** Bottom of the main menu screen. */
export const MAIN_MENU_FOOTER_Y = GAME_HEIGHT - MAIN_MENU.footerHeight / 2;
