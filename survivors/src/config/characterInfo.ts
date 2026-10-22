// Ventana "Character Info" del original (Fase 20A): dialogtext.spr hoja 0, frame 0 (270x376). Se abre desde Select
// Character (botón "Level Set.", donde estaba Change Password) para ver el personaje y repartir los puntos de Level,
// y en partida con la tecla C (pausa la partida; ahí solo se mira).
// Medidas tomadas de la imagen (recuadros oscuros) y de reference/Client.cpp (DrawDialogBox_Character, 32648):
// la escena las amplía ×1,45 (más que Select Character, ×1,25: así los + y − de 12 px se ven y se pulsan mejor).
// - + y −: gamedialog86.spr hoja 3, frames 5 y 6 (botoncitos naranjas de 12x12, los del reparto de puntos original).
// - Botones: dialogtext.spr hoja 1 (74x20; el frame siguiente es el iluminado): Ok 0, Cancel 16.
import { getSheetKey } from '../hb/HBSprite';
import type { StatId } from '../data/stats';
import { byDevice } from './device';
import { UI_TEXT } from './ui';

export const CHARACTER_INFO_TEXTURE = getSheetKey('ui.buttons', 0);
export const CHARACTER_INFO_FRAME = 0;
/** Size of the original image; the scene draws it at CHARACTER_INFO_SCALE. */
export const CHARACTER_INFO_SIZE = { width: 270, height: 376 } as const;
export const CHARACTER_INFO_SCALE = 1.45;

/** Where the window's top-left corner goes: centred in the menu; on the left in a run, with the details panel beside it. */
export const CHARACTER_INFO_POSITION = {
    menu: { x: 204, y: 12 },
    run: { x: 12, y: 12 },
} as const;

export interface InfoBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Dark boxes of the image (in its own 270x376 pixels). */
export const CHARACTER_INFO_BOXES = {
    /** Two lines: name, and class (with the Power in a run). */
    name: { x: 14, y: 49, width: 241, height: 33 },
    level: { x: 176, y: 104, width: 75, height: 15 },
    exp: { x: 176, y: 122, width: 75, height: 15 },
    nextExp: { x: 176, y: 140, width: 75, height: 15 },
    health: { x: 176, y: 170, width: 75, height: 15 },
    mana: { x: 176, y: 188, width: 75, height: 15 },
    stamina: { x: 176, y: 206, width: 75, height: 15 },
    maxLoad: { x: 176, y: 237, width: 75, height: 14 },
    kills: { x: 176, y: 255, width: 75, height: 14 },
} as const satisfies Record<string, InfoBox>;

/** The six stat boxes, as the original lays them out: Str Int Vit on top, Dex Mag Chr under them. */
export const CHARACTER_INFO_STAT_BOXES: Readonly<Record<StatId, InfoBox>> = {
    str: { x: 51, y: 281, width: 33, height: 16 },
    int: { x: 134, y: 281, width: 33, height: 16 },
    vit: { x: 218, y: 281, width: 33, height: 16 },
    dex: { x: 51, y: 300, width: 33, height: 15 },
    mag: { x: 134, y: 300, width: 33, height: 15 },
    chr: { x: 218, y: 300, width: 33, height: 15 },
};
/** Keyboard / gamepad order: two rows of three, as drawn. */
export const CHARACTER_INFO_STAT_GRID: readonly (readonly StatId[])[] = [['str', 'int', 'vit'], ['dex', 'mag', 'chr']];

/** Feet of the character standing in the equipment box on the left. */
export const CHARACTER_INFO_DOLL = { x: 67, y: 240 } as const;

/** "Points left: N", on the parchment under the stats. */
export const CHARACTER_INFO_POINTS_Y = 330;

/**
 * + and − buttons, always as a pair on the box's right edge: − inside the box (only while that stat has an unconfirmed
 * point), + just outside it. The right column only has 13 px before the window's border, so they can't be bigger
 * than the original 12 px; while there are points to assign, the value sits in the part of the box the − leaves free.
 */
export const CHARACTER_INFO_PLUS_MINUS = {
    texture: getSheetKey('ui.panel', 3),
    plusFrame: 5,
    minusFrame: 6,
    size: 12,
    /** Gap between the box's right edge and the +. */
    plusGap: 1,
    /** Touch area beyond the picture (image pixels): up and down, and outwards (− leftwards, + rightwards). */
    hitPadY: byDevice(3, 5),
    hitPadOut: byDevice(3, 8),
} as const;

/**
 * Fase 25: on phones (compact UI) the 12 px + and − are too small for a finger, and the window has no room for bigger
 * ones. So, while points can be assigned, a panel to the right of the window shows the chosen stat (tap its box) with
 * two big − and + buttons. Game pixels; the window ends at x ≈ 596.
 */
export const CHARACTER_INFO_BIG_STEPPER = {
    centerX: 698,
    nameY: 318,
    valueY: 360,
    buttonsY: 440,
    buttonSize: 84,
    /** Between the centres of − and +. */
    buttonGap: 96,
    /** Touch area beyond each button, on every side. */
    hitPad: 6,
    radius: 10,
    fill: 0x2e2216,
    pressedFill: 0x5a4628,
    border: 0xd8b048,
    borderWidth: 3,
    glyphColor: '#ffd860',
    glyphSize: 84,
    nameSize: 26,
    valueSize: 40,
    /** A button that can't be used now (no points left, nothing to take back) is dimmed. */
    disabledAlpha: 0.3,
} as const;

/** Bottom buttons (dialogtext.spr sheet 1, 74x20; lit frame = frame + 1), at the original's places. */
export const CHARACTER_INFO_BUTTONS = {
    texture: getSheetKey('ui.buttons', 1),
    y: 340,
    ok: { x: 180, frame: 0 },
    cancel: { x: 15, frame: 16 },
    litOffset: 1,
} as const;

/** Frame around the stat chosen with keys or gamepad. */
export const CHARACTER_INFO_FOCUS = { color: 0xffd860, width: 2 } as const;

/** Ignore input for a moment so the key that opened the window does not press anything. */
export const CHARACTER_INFO_INPUT_DELAY_MS = 250;
export const CHARACTER_INFO_SHADE_ALPHA = 0.6;

/** Light text on the dark boxes; changed (not yet confirmed) values in red, as the original. */
export const CHARACTER_INFO_VALUE_STYLE = { ...UI_TEXT, fontSize: byDevice('14px', '17px'), color: '#e8d9a8' } as const;
export const CHARACTER_INFO_PENDING_COLOR = '#ff6050';
export const CHARACTER_INFO_NAME_STYLE = { ...CHARACTER_INFO_VALUE_STYLE, fontSize: byDevice('16px', '19px'), fontStyle: 'bold' } as const;
/** "Points left", on the parchment: dark, green while there are points. */
export const CHARACTER_INFO_POINTS_STYLE = { ...UI_TEXT, fontSize: byDevice('16px', '19px'), fontStyle: 'bold', color: '#2d1919' } as const;
export const CHARACTER_INFO_POINTS_COLOR = '#0a5a0a';
/** What the chosen stat does, under the window. */
export const CHARACTER_INFO_HELP_STYLE = {
    ...UI_TEXT, fontSize: byDevice('15px', '18px'), color: '#e8d9a8', stroke: '#000000', strokeThickness: 3, align: 'center',
} as const;
export const CHARACTER_INFO_HELP_GAP = 4;

/** In a run: the details panel (damage, dodge, passives...) to the right of the window. */
export const CHARACTER_INFO_DETAILS = {
    gap: 12,
    width: byDevice(360, 370),
    padding: 10,
    background: 0x1c140c,
    alpha: 0.92,
    border: 0x8a7038,
    style: { ...UI_TEXT, fontSize: byDevice('15px', '18px'), color: '#e8d9a8', lineSpacing: 2 },
} as const;
