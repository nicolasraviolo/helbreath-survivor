// Aspecto de los NPCs de la ciudad (Fase 23B): el nombre encima, el aviso "Talk" y el botón táctil.
// Los datos (quién está dónde, qué dice) van en data/town.ts.
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
