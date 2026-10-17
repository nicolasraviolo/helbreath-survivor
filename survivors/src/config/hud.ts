// Barra inferior (HUD) con las piezas originales de gamedialog86.spr, hoja 6.
// Las posiciones se midieron sobre la propia imagen (ver docs/mockups/hud/ y NOTES.md).
import { getSheetKey } from '../hb/HBSprite';
import { GAME_HEIGHT } from './gameConfig';
import { px, UI_FONT, UI_FONT_SIZE } from './ui';

/** Texture with every piece of the bottom bar. */
export const HUD_TEXTURE = getSheetKey('ui.panel', 6);

/** Frames of HUD_TEXTURE. */
export const HUD_FRAME = {
    /** Full bar, 800x51, with HP, MP and XP drawn full. */
    panel: 14,
    /** Grey empty gauge (104x16), drawn over the missing part of HP / MP. */
    gaugeEmpty: 12,
    /** Grey empty XP gauge (170x11). */
    xpEmpty: 13,
    /** Lit versions of the 6 buttons (36x44): character, inventory, magic, skills, chat, system. */
    firstButtonLit: 6,
} as const;

export const HUD_HEIGHT = 51;
export const HUD_TOP = GAME_HEIGHT - HUD_HEIGHT;

/** Gauges, relative to the bar's top-left corner. */
export const HUD_HP = { x: 102, y: 10, width: 104, height: 16 } as const;
export const HUD_MP = { x: 102, y: 32, width: 104, height: 16 } as const;
export const HUD_XP = { x: 226, y: 8, width: 170, height: 11 } as const;
/** Text box under the XP gauge. */
export const HUD_INFO = { x: 226, y: 22, width: 170, height: 24 } as const;

/** The 6 square buttons: first x, step between them, top and size. */
export const HUD_BUTTONS = { x: 492, step: 37, y: 7, width: 36, height: 44, count: 6 } as const;
/** Index of the system (floppy disk) button, which opens the pause menu. */
export const HUD_MENU_BUTTON = 5;
/** Index of the character (helmet) button, which shows the stats panel. */
export const HUD_CHARACTER_BUTTON = 0;

/** Stats panel, above the bar on the left. */
export const HUD_STATS_PANEL = { x: 8, width: 250, padding: 10, marginY: 8, columnWidth: 78, gap: 6 } as const;
export const HUD_STATS_STYLE = {
    fontFamily: UI_FONT,
    fontSize: px(UI_FONT_SIZE.normal),
    color: '#e8d9a8',
    lineSpacing: 2,
} as const;
export const HUD_STATS_TITLE_STYLE = { ...HUD_STATS_STYLE, color: '#ffe080' } as const;

export const HUD_DEPTH_TEXT = 10;
/** Numbers on the gauges: the boxes are 16 px tall, so the small size. */
export const HUD_TEXT_STYLE = {
    fontFamily: UI_FONT,
    fontSize: px(UI_FONT_SIZE.small),
    fontStyle: 'bold',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
} as const;
export const HUD_INFO_STYLE = { ...HUD_TEXT_STYLE, color: '#e8d9a8' } as const;

/**
 * Active buffs (chests): bottom right, just above the bar, one line each with name and seconds left, in the game's
 * own sprite font (the spell book letters). The first buff taken is the lowest line.
 */
export const HUD_BUFF = { right: 12, bottomGap: 26, lineHeight: 22 } as const;

/** Pause overlay. */
export const PAUSE_SHADE_ALPHA = 0.55;

/** Big health bar of the boss at the top of the screen: its name (sprite font) over a wide bar. */
export const HUD_BOSS = {
    y: 34,
    width: 420,
    height: 12,
    backColor: 0x200808,
    fillColor: 0xc02020,
    borderColor: 0x8a7038,
    nameColor: 0xffd860,
    /** Gap between the name and the bar. */
    nameY: 8,
} as const;

/** Event of GameScene that the HUD listens to, to show a warning in the middle of the screen. */
export const ANNOUNCE_EVENT = 'announce';

/** Warnings of the timeline ("The Ettin approaches!"): sprite font, big, in the middle; fade out at the end. */
export const HUD_ANNOUNCE = { y: 150, scale: 2, color: 0xff5040, showMs: 3500, fadeMs: 1000 } as const;

/** End-of-run screen (scenes/GameOverScene.ts). Buttons from dialogtext.spr sheet 1: normal frame, lit = next frame. */
export const GAME_OVER = {
    shadeAlpha: 0.7,
    titleY: 120,
    titleScale: 2.5,
    victoryColor: 0xffd860,
    defeatColor: 0xd83030,
    statsY: 220,
    buttonsY: 440,
    buttonGap: 90,
    buttonScale: 1.6,
    buttonTexture: getSheetKey('ui.buttons', 1),
    restartFrame: 36,
    changeFrame: 20,
    hintY: 500,
    /** Ignore input for a moment, so the key or click that killed the boss doesn't choose a button. */
    inputDelayMs: 800,
} as const;
