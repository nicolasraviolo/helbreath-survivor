// Aspecto de los NPCs de la ciudad (Fase 23B): el nombre encima, el aviso "Talk" y el botón táctil.
// Los datos (quién está dónde, qué dice) van en data/town.ts.
import { byDevice } from './device';
import { px, UI_FONT_SIZE, UI_TEXT } from './ui';

export const TOWN_NPC_LOOK = {
    /** Name: light blue like the original's NPC names, with a dark outline so it reads on any ground. */
    nameStyle: { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.small), fontStyle: 'bold', color: '#a8e0ff', stroke: '#000000', strokeThickness: 3 },
    /** Gap between the top of the sprite and the bottom of the name (px). */
    nameGap: 2,
    /** "Talk" over the name of the NPC you can talk to, blinking softly. */
    talkStyle: { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: '#ffd860', stroke: '#000000', strokeThickness: 4 },
    talkGap: 0,
    talkPulseMs: 500,
    talkPulseAlpha: 0.55,
} as const;

/** Touch "Talk" button: in the bottom-right corner (TOUCH_RESERVED_CORNER), only while an NPC is close. */
export const TOWN_TALK_BUTTON = {
    radius: 42,
    color: 0x000000,
    alpha: 0.45,
    ringColor: 0xffd860,
    ringAlpha: 0.8,
    style: { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: '#ffd860', stroke: '#000000', strokeThickness: 3 },
} as const;

/**
 * The talk panel (NpcDialogScene): options a bit closer than in the other panels so Tom's three (Buy, Sell, Upgrade)
 * and Back fit inside the frame (Fase 24C).
 */
export const NPC_DIALOG_LIST = {
    itemSpacing: byDevice(36, 44),
    /** First option, from the content row (under the NPC's line). */
    offsetY: byDevice(48, 58),
} as const;

/**
 * "Level Up" in the bottom-right corner of the town while the character has points to assign (24-oct-2026, owner),
 * in the calligraphic title letters (SpriteText 'calligraphy'). A click or tap opens the Character window.
 * On touch screens it sits above the "Talk" button corner (TOUCH_RESERVED_CORNER).
 */
export const TOWN_LEVEL_UP = {
    text: 'Level Up',
    color: 0xffd860,
    scale: byDevice(2, 2.4),
    /** Gap from the right and bottom edges of the screen (px). */
    right: 16,
    bottom: 14,
    /** Touch: gap above the reserved corner. */
    touchGap: 6,
    /** Soft beat (it grows a little and back). Not a fade: half-transparent, its black shadow muddies it on the grass. */
    pulseMs: 700,
    pulseScale: 1.08,
} as const;
