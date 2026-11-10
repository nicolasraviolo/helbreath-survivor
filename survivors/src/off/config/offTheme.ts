// Helbreath Off, Fase Off-12A: el estilo nuevo de las ventanas (maqueta v3 aprobada por el propietario el 10-nov-2026).
// Fondo oscuro, bordes de bronce, esquinas doradas y dorado para lo marcado; Alegreya para títulos y nombres y
// Alegreya Sans para el texto. Todas las ventanas rediseñadas sacan de aquí colores, letras y medidas; las piezas que
// los usan están en off/ui/offUi.ts y el muestrario en ?off=uikit (off/scenes/OffUiKitScene.ts).
// No importa config/ui.ts (que importa este archivo para esperar a las letras al arrancar).
import { TEXT_RESOLUTION } from '../../config/device';

export const OFF_THEME_TITLE_FONT_NAME = 'Alegreya';
export const OFF_THEME_TEXT_FONT_NAME = 'Alegreya Sans';
const TITLE_FONT = `"${OFF_THEME_TITLE_FONT_NAME}", Georgia, serif`;
const TEXT_FONT = `"${OFF_THEME_TEXT_FONT_NAME}", "Trebuchet MS", sans-serif`;

/** The faces main.ts imports, for config/ui.ts to wait for them before the game starts. */
export const OFF_THEME_FONT_FACES: readonly string[] = [
    `500 16px "${OFF_THEME_TITLE_FONT_NAME}"`,
    `400 14px "${OFF_THEME_TEXT_FONT_NAME}"`,
    `500 14px "${OFF_THEME_TEXT_FONT_NAME}"`,
];

/** Fill and line colours (numbers, for Graphics). */
export const OFF_THEME_COLOR = {
    /** The window itself. */
    window: 0x14100b,
    /** A framed panel inside the window (equipment, item card). */
    card: 0x1a140d,
    /** An item cell or key, and the bag's well. */
    cell: 0x0d0a07,
    well: 0x0a0805,
    cellLine: 0x2a2218,
    /** Divider lines and plain borders. */
    line: 0x4a3c26,
    /** Frame border (bronze) and its dark outer line. */
    bronze: 0x8a6a36,
    outline: 0x2a2014,
    /** Corners, selection, the main button. */
    gold: 0xd8b46a,
    goldLight: 0xf0d08a,
    /** Marked row or cell, and the open tab. */
    marked: 0x2a2114,
    tabOn: 0x3a2e1c,
    button: 0x211a10,
    buttonHover: 0x2e2416,
    /** A cell holding something you can't wear yet. */
    unmet: 0x3a1a12,
    /** Empty part of a bar. */
    barBack: 0x2a2218,
    health: 0xc0453a,
    mana: 0x4a78c8,
    stamina: 0x5aa04a,
    exp: 0xd8b46a,
} as const;

/** Text colours (strings, for Text styles). */
export const OFF_THEME_INK = {
    text: '#ece2c8',
    /** Labels and secondary text. */
    dim: '#a8997a',
    /** "(now …)" comparisons and fine print. */
    note: '#7a6d55',
    /** Empty slots and keys. */
    faint: '#5d4f37',
    gold: '#d8b46a',
    /** Section labels like CIRCLE 3 inside lists. */
    bronze: '#8a6a36',
    /** Bonuses, met requirements, special item names (as the original). */
    good: '#8fd07a',
    /** Unmet requirements, Drop. */
    bad: '#e07a5f',
    /** Text on the gold button. */
    onGold: '#2a1e0c',
} as const;

/** Gamepad face buttons (Xbox colours), for the A/B/X/Y badges. */
export const OFF_THEME_PAD = {
    A: 0x6fbf4f,
    B: 0xd9534f,
    X: 0x4a8fd8,
    Y: 0xe0b840,
} as const;
export type OffPadButton = keyof typeof OFF_THEME_PAD;

/** Text kinds: font, size, colour and letter spacing. `minSize` is how far a text may shrink to fit its box. */
export const OFF_THEME_TEXT = {
    /** Character name in the window header. */
    title: { font: TITLE_FONT, size: 22, color: OFF_THEME_INK.text, spacing: 0, minSize: 18 },
    /** Item or spell name in a card. */
    name: { font: TITLE_FONT, size: 17, color: OFF_THEME_INK.text, spacing: 0, minSize: 13 },
    /** Big numbers (stat values, key numbers). */
    number: { font: TITLE_FONT, size: 18, color: OFF_THEME_INK.text, spacing: 0, minSize: 14 },
    /** Normal text: rows, buttons, tabs. */
    body: { font: TEXT_FONT, size: 14, color: OFF_THEME_INK.text, spacing: 0, minSize: 12 },
    /** Secondary lines (header subtitle, bar values, hints). */
    small: { font: TEXT_FONT, size: 12, color: OFF_THEME_INK.dim, spacing: 0, minSize: 11 },
    /** Section labels in capitals (EQUIPMENT, KEYS). */
    label: { font: TEXT_FONT, size: 11, color: OFF_THEME_INK.gold, spacing: 1.3, minSize: 10 },
    /** The letter of a gamepad badge. */
    badge: { font: TEXT_FONT, size: 11, color: '#120d07', spacing: 0, minSize: 11 },
} as const;
export type OffTextKind = keyof typeof OFF_THEME_TEXT;

/** Sharp text at the screen's real density, like the rest of the UI. */
export const OFF_THEME_TEXT_RESOLUTION = TEXT_RESOLUTION;

/** Common measures, in game pixels (800 × 600). */
export const OFF_THEME_SIZE = {
    /** Frame: bronze border, dark outer line this far outside it, gold corners of this length (big = the window). */
    border: 1,
    outlineGap: 3,
    corner: 9,
    cornerBig: 14,
    cornerThickness: 2,
    /** Inner padding of a framed panel. */
    padding: 10,
    tabHeight: 30,
    buttonHeight: 28,
    buttonWidth: 86,
    /** Gold bar on the left of an open tab or a marked row. */
    markBar: 3,
    /** Stat row (label left, value right) and list row. */
    rowHeight: 21,
    listRowHeight: 27,
    cell: 32,
    cellGap: 2,
    /** Equipment slot (icon + name). */
    slot: 52,
    barHeight: 4,
    /** Space between a bar's label line and the bar. */
    barGap: 3,
    badge: 18,
    /** Divider: the small diamond in the middle and the gap around it. */
    diamond: 3,
    diamondGap: 7,
    /** Gap between label and value when a row is tight. */
    rowGap: 8,
} as const;
