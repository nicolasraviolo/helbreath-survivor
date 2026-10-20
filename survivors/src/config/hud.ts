// Barra inferior (HUD) con las piezas originales de gamedialog86.spr, hoja 6.
// Las posiciones se midieron sobre la propia imagen (ver docs/mockups/hud/ y NOTES.md).
import { getSheetKey } from '../hb/HBSprite';
import { byDevice } from './device';
import { GAME_HEIGHT } from './gameConfig';
import { px, UI_TEXT, UI_FONT_SIZE } from './ui';

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
/**
 * On phones the whole bar is drawn bigger, centred at the bottom of the screen. It still fits: the original image has
 * only empty wood in its first and last ~85 px. Everything inside the bar is laid out in the bar's own pixels.
 */
export const HUD_SCALE = byDevice(1, 1.25);
/** Top of the bar on screen: the game is drawn above it. */
export const HUD_TOP = GAME_HEIGHT - HUD_HEIGHT * HUD_SCALE;

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

export const HUD_DEPTH_TEXT = 10;
/** Numbers on the gauges: the boxes are 16 px tall, so the small size. */
export const HUD_TEXT_STYLE = {
    ...UI_TEXT,
    fontSize: px(UI_FONT_SIZE.small),
    fontStyle: 'bold',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
} as const;
export const HUD_INFO_STYLE = { ...HUD_TEXT_STYLE, color: '#e8d9a8' } as const;

/**
 * Critical Strike (Fase 19A): the original's red orb with a sword (HUD_TEXTURE frame 5, 32x32) with the charges on it;
 * right after a launch it turns into the purple one (frame 3) for a moment, as if pressed (owner, 18-oct-2026). On the
 * classic bar it sits centred in the square hole left of the buttons, where the original drew its number (Client.cpp:
 * 465,574 on 800x600). In bar pixels; dimmed while there is no charge.
 */
export const HUD_CRIT = {
    frame: 5,
    pressedFrame: 3,
    pressedMs: 350,
    x: 464,
    y: 28,
    numberX: 464,
    numberY: 28,
    emptyAlpha: 0.35,
    style: { ...HUD_TEXT_STYLE, fontSize: px(UI_FONT_SIZE.normal) },
} as const;

/**
 * Touch button of the Critical Strike (Fase 19A): the same red sword, bigger, with its charges, in the middle of the
 * corner kept free for it (TOUCH_RESERVED_CORNER, bottom right of the game area). Only on touch screens and ?ui=compact.
 */
export const HUD_CRIT_BUTTON = {
    iconScale: 2,
    radius: 42,
    color: 0x000000,
    alpha: 0.45,
    ringColor: 0xff5040,
    ringAlpha: 0.8,
    numberOffset: { x: 0, y: 0 },
    style: { ...HUD_TEXT_STYLE, fontSize: px(UI_FONT_SIZE.large), strokeThickness: 4 },
} as const;

/**
 * Active buffs (chests): bottom right, just above the bar, one line each with name and seconds left, in the game's
 * own sprite font (the spell book letters). The first buff taken is the lowest line.
 */
export const HUD_BUFF = { right: 12, bottomGap: byDevice(26, 32), lineHeight: byDevice(22, 28), scale: byDevice(1, 1.3) } as const;


/** Big health bar of the boss at the top of the screen: its name (sprite font) over a wide bar. */
export const HUD_BOSS = {
    y: byDevice(34, 38),
    width: 420,
    height: 12,
    backColor: 0x200808,
    fillColor: 0xc02020,
    borderColor: 0x8a7038,
    nameColor: 0xffd860,
    /** Gap between the name and the bar. */
    nameY: 8,
    nameScale: byDevice(1, 1.3),
    /** Bars shown at once, one under the other (bug list of 19-oct-2026, M1: one bar per boss). */
    maxShown: 3,
    /** From one boss's name and bar to the next one's. */
    rowGap: byDevice(44, 52),
} as const;

/** Countdown of the portal after the final boss (Fase 13): in the place of the boss bar, in the sprite font. */
export const HUD_PORTAL = { y: byDevice(30, 34), scale: byDevice(1.4, 1.7), color: 0x80d0ff, label: 'Enter the portal:' } as const;

/**
 * Compact HUD (phones only, Settings → HUD → Compact): no bottom bar; the gauges of the original "V2" interface
 * (dialogsv2.spr sheet 0), a bit see-through, over the map. At the top right, a stats button next to the pause one.
 * Frames: 2 = empty gauge 171x12 (its inside, 167x9 from (2, 1), is where the fill goes), 3 / 4 = red / blue fill
 * 106x11 (stretched to the gauge), 5 = green fill 167x9, 7 = helmet button 40x47 (6 = lit).
 */
export type CompactHudLayout = 'top' | 'bottom';
/** Where the gauges go: a column at the top left, or a row along the bottom. */
export const HUD_COMPACT_LAYOUT: CompactHudLayout = 'bottom';

export const HUD_COMPACT = {
    texture: getSheetKey('ui.v2', 0),
    gaugeFrame: 2,
    hpFillFrame: 3,
    mpFillFrame: 4,
    xpFillFrame: 5,
    /** Inside of the gauge frame, where the fill is drawn (gauge pixels). */
    fill: { x: 2, y: 1, width: 167, height: 9 },
    /** The gauges let the map show through a little (the numbers stay solid). */
    gaugeAlpha: 0.75,
    /** Level, time and kills: this far from the gauges. */
    infoGap: 4,
    statsButton: { x: 700, y: 40, frame: 7, litFrame: 6, scale: 1.2 },
    /** Column at the top left. Stats panel under it; boss bar between it and the buttons. */
    top: { x: 10, y: 10, gaugeScale: 1.5, gaugeStep: 22, statsPanelY: 112, bossCenterX: 470, bossWidth: 360 },
    /**
     * Row along the bottom edge, gauges side by side. `reserve` is the strip kept free at the bottom for them and the
     * info line: buffs, the stats panel and the level-up hint go above it.
     */
    bottom: { x: 16, gaugeScale: 1.45, gap: 12, marginBottom: 8, reserve: 62 },
} as const;

/** Event of GameScene that the HUD listens to, to show a warning in the middle of the screen. */
export const ANNOUNCE_EVENT = 'announce';
/** Emitted on the game scene by the pause menu's "Quit to menu", just before stopping it (Fase 14A: anonymous stats). */
export const QUIT_RUN_EVENT = 'quit-run';

/** Warnings of the timeline ("The Ettin approaches!"): sprite font, big, in the middle; fade out at the end. */
export const HUD_ANNOUNCE = { y: 150, scale: byDevice(2, 2.4), color: 0xff5040, showMs: 3500, fadeMs: 1000 } as const;

/**
 * "Achievement unlocked" notice (Fase 14B): a small dark box at the bottom left of the game area (the buffs are at the
 * right), sliding in. If several come at once, they show one after the other.
 */
export const HUD_ACHIEVEMENT = {
    left: 12,
    /** Bottom edge of the box, this far above the bottom of the game area. */
    bottomGap: byDevice(14, 18),
    padX: byDevice(10, 14),
    padY: byDevice(6, 8),
    lineGap: 2,
    backColor: 0x000000,
    backAlpha: 0.75,
    borderColor: 0xc8a040,
    header: 'Achievement unlocked!',
    headerStyle: { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.small), color: '#ffd860', stroke: '#000000', strokeThickness: 3 },
    nameStyle: { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3 },
    /** Slides in from the left edge, stays, then fades out. */
    slideMs: 250,
    showMs: 3500,
    fadeMs: 600,
} as const;

/** End-of-run screen (scenes/GameOverScene.ts). Buttons from dialogtext.spr sheet 1: normal frame, lit = next frame. */
export const GAME_OVER = {
    shadeAlpha: 0.7,
    titleY: 120,
    titleScale: 2.5,
    victoryColor: 0xffd860,
    defeatColor: 0xd83030,
    statsY: 220,
    /** "Achievements: ..." unlocked this run, between the title and the stats (Fase 14B). */
    achievementsY: 182,
    achievementsColor: '#ffd860',
    achievementsWrap: 700,
    /** Character Level block (Fase 20A): "+N EXP · Level N", the bar towards the next Level and a note under it. */
    expY: 362,
    expBarY: 390,
    expBarWidth: 300,
    expBarHeight: 8,
    expBarBack: 0x2a2014,
    expBarFill: 0xd8b048,
    expBarBorder: 0x8a7038,
    expNoteY: 400,
    expLevelUpColor: '#60e060',
    expNoteColor: '#c8b888',
    /** Loot found this run (Fase 21A): "Loot" and a row of item pictures (with "+N" past the maximum). */
    lootY: 448,
    lootIconSize: 34,
    lootGap: 8,
    lootMax: 12,
    lootLabelColor: '#ffd860',
    lootNoneColor: '#a89870',
    lootSlotFill: 0x2e2216,
    lootSlotBorder: 0x8a7038,
    buttonsY: 510,
    /** Distance between the centres of two buttons. */
    buttonGap: 140,
    buttonScale: 1.6,
    buttonTexture: getSheetKey('ui.buttons', 1),
    restartFrame: 36,
    changeFrame: 20,
    logOutFrame: 8,
    /** Ignore input for a moment, so the key or click that killed the boss doesn't choose a button. */
    inputDelayMs: 800,
} as const;
