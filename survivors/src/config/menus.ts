// Menús de la Fase 8 (principal, pausa, ajustes, créditos y logros), con piezas del original:
// - fondo del menú principal: new-dialog.spr hoja 1, frame 0 (640x480, "Helbreath The Heldenian", la pantalla de login).
//   Trae dibujados los botones Log In / New Account / Exit y una línea de texto abajo: el panel y la franja los tapan;
// - paneles: gamedialog86.spr hoja 3, frame 3 (338x202, marco con esquinas de plata y un castillo de fondo);
// - opciones: la fuente dibujada del original (hb/SpriteText.ts), gris claro y dorada la elegida;
// - flechas ◄ ► para cambiar un valor: gamedialog86.spr hoja 1, frame 7 (la de la derecha es la misma, volteada).
import { getSheetKey } from '../hb/HBSprite';
import { byDevice } from './device';
import { GAME_HEIGHT, GAME_WIDTH } from './gameConfig';
import { UI_TEXT, UI_FONT_SIZE, px } from './ui';

export const MENU_BACKGROUND = { texture: getSheetKey('ui.title', 1), frame: 0, width: 640 } as const;
/** The 640x480 background is drawn at this scale to fill the 800x600 screen. */
export const MENU_BACKGROUND_SCALE = GAME_WIDTH / MENU_BACKGROUND.width;

export const MENU_PANEL = { texture: getSheetKey('ui.panel', 3), frame: 3, width: 338, height: 202 } as const;

/** Main menu: panel on the right, over the original's drawn buttons. Bigger on phones. */
export const MAIN_MENU = {
    panelX: byDevice(585, 575),
    panelY: byDevice(318, 330),
    panelScale: byDevice(1.1, 1.3),
    /** Space between options. Six fit inside the panel's frame like this. */
    itemSpacing: byDevice(32, 37),
    /** Most options that fit at itemSpacing; with more (Continue and Install, Fase 12) they get closer to stay inside the frame. */
    itemsAtFullSpacing: 6,
    /** Black strip over the original's "Multiplayer Online Game…" line, with our own footer. */
    footerHeight: 42,
    footerText: 'Unofficial fan project  ·  free and non-profit',
    /** The version (config/version.ts) goes after the footer text, separated like this. */
    footerSeparator: '  ·  ',
} as const;

/** Pause, Settings, Credits, Achievements and How to play: a big panel in the middle of the screen. */
export const MENU_OVERLAY = {
    /** Darkens whatever is underneath (the paused game or the main menu). */
    shadeAlpha: 0.6,
    panelX: GAME_WIDTH / 2,
    panelY: 280,
    panelScale: byDevice(1.5, 1.75),
    /** Credits has more lines: a bigger panel. */
    creditsPanelScale: byDevice(1.9, 2.05),
    /** Title in the sprite font, from the panel's top edge. */
    titleOffsetY: 34,
    titleScale: byDevice(2, 2.4),
    /** First option / text line, from the panel's top edge. */
    contentOffsetY: byDevice(100, 104),
    itemSpacing: byDevice(40, 50),
    /** Options with a value (Settings): label at the left, value at the right, this far from the centre. */
    valueColumnHalfWidth: byDevice(215, 270),
} as const;

/** Options in the sprite font. Bigger on phones, with bigger areas for fingers. */
export const MENU_ITEM = {
    scale: byDevice(1.6, 2),
    color: 0xe8dcc0,
    selectedColor: 0xffd860,
    titleColor: 0xffd860,
    /** Height of the clickable area of each option (screen pixels). */
    hitHeight: byDevice(34, 46),
    /** Rows with a value: from the left edge of "◄" to the right edge of "►" (screen pixels). */
    valueBoxWidth: byDevice(120, 170),
    /** Clickable width of each arrow, a bit wider than the arrow itself so it's easy to hit. */
    arrowHitWidth: byDevice(34, 50),
} as const;

/** Arrow buttons of the value rows: gamedialog86.spr sheet 1, frame 7 (orange "◄", 15x15); flipped for "►". */
export const MENU_ARROW = {
    texture: getSheetKey('ui.panel', 1),
    frame: 7,
    size: 15,
    scale: byDevice(1.6, 2),
    /** Arrows of the rows that aren't highlighted are a bit faded. */
    idleAlpha: 0.7,
} as const;

/** Yes/no box of Settings (Fase 12C). The original has none: drawn in the colours of the menu options. */
export const MENU_CHECKBOX = {
    size: byDevice(22, 30),
    border: byDevice(2, 3),
    tickWidth: byDevice(3, 4),
    fill: 0x000000,
    fillAlpha: 0.45,
} as const;

/** Settings (Fase 12C): the big panel, rows a bit closer so all of them fit inside its frame. */
export const SETTINGS_MENU = {
    /** First row, from the usual content row. */
    firstRowOffset: byDevice(-10, -22),
    itemSpacing: byDevice(38, 40),
    /** Width of the value column (checkbox or "◄ Compact ►"). */
    valueBoxWidth: byDevice(150, 210),
} as const;

/** Small fullscreen button in a corner of the main menu (Fase 12C; before, it was an option of the list). */
export const FULLSCREEN_BUTTON = {
    /** Centre, from the top-right corner of the screen. */
    margin: byDevice(28, 40),
    size: byDevice(26, 40),
    /** Length of each corner bracket, as a share of the size. */
    corner: 0.35,
    lineWidth: byDevice(3, 4),
    color: 0xe8dcc0,
    hoverColor: 0xffd860,
    /** Dark square behind it, so it shows over the background picture. */
    backAlpha: 0.5,
} as const;

/** Ignore input for a moment so the key / button that opened a menu does nothing in it. */
export const MENU_INPUT_DELAY_MS = 200;

/** Plain text on the panels (Credits, the count line of Achievements). */
export const MENU_TEXT_STYLE = {
    ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), color: '#f0e6c8', align: 'center', lineSpacing: 4,
    stroke: '#000000', strokeThickness: 3,
} as const;
export const MENU_FOOTER_STYLE = { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), color: '#c8b88a' } as const;

/** Bottom of the main menu screen. */
export const MAIN_MENU_FOOTER_Y = GAME_HEIGHT - MAIN_MENU.footerHeight / 2;

/** How to play (scenes/HowToPlayScene.ts): the Credits-size panel, a page selector, text or two columns, and Back. */
export const HOW_TO_PLAY = {
    /** Space between the page selector row and the first line of content. */
    contentGap: byDevice(34, 40),
    lineSpacing: byDevice(29, 34),
    /** Paragraph lines wrap at this width. */
    wrapWidth: byDevice(560, 640),
    /** Left edge of the control column and of the action column, from the panel's centre. */
    controlX: byDevice(-240, -290),
    actionX: byDevice(-20, -10),
    /** "◄ Keyboard ►" needs a wider box than the Settings values. */
    pageBoxWidth: byDevice(200, 250),
    controlColor: '#ffd860',
    actionColor: '#f0e6c8',
} as const;

/**
 * Achievements (scenes/AchievementsScene.ts, Fase 14B): the Credits-size panel, a "3 / 14 unlocked" line, the list in
 * two columns (unlocked first), a page selector and Back. Locked ones are greyed out.
 */
export const ACHIEVEMENTS_SCREEN = {
    columns: 2,
    rowsPerPage: byDevice(4, 3),
    /** Centre of each column, from the panel's centre. */
    columnX: byDevice(155, 170),
    columnWidth: byDevice(290, 320),
    /** Space between the count line and the first row. */
    countGap: byDevice(30, 36),
    rowHeight: byDevice(44, 56),
    pageBoxWidth: byDevice(130, 160),
    countColor: '#c8b88a',
    nameColor: '#ffd860',
    descriptionColor: '#f0e6c8',
    lockedNameColor: '#8a8070',
    lockedDescriptionColor: '#6f675a',
} as const;

/** Xbox-style gamepad icons drawn on How to play (letters in the Xbox colours). */
export const PAD_ICON = {
    radius: byDevice(11, 14),
    gap: byDevice(8, 10),
    fill: 0x202020,
    outline: 0xc8b88a,
    letterColor: { A: '#6cc04a', B: '#e04a3a', Y: '#f0c030' },
    /** Start, stick and d-pad are drawn in this colour. */
    shapeColor: 0xe8dcc0,
} as const;
