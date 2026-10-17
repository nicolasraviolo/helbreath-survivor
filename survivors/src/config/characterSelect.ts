// Pantalla "Create New Character" con las piezas originales:
// - fondo: gamedialog86.spr, hoja 9 (640x480, con título, flechas y botones +/- ya dibujados);
// - botones: dialogtext.spr, hoja 1 (74x20, cada uno en versión normal y, en el frame siguiente, iluminada).
// Las posiciones se midieron sobre la imagen original de 640x480; la escena las amplía a 800x600.
import { getSheetKey } from '../hb/HBSprite';
import type { CharacterId } from '../data/characters';
import { byDevice } from './device';
import { GAME_WIDTH } from './gameConfig';
import { UI_TEXT } from './ui';

export const SELECT_BACKGROUND = { texture: getSheetKey('ui.panel', 9), frame: '0', width: 640, height: 480 } as const;
/** The 640x480 background is drawn at this scale to fill the 800x600 screen. */
export const SELECT_SCALE = GAME_WIDTH / SELECT_BACKGROUND.width;

export const SELECT_BUTTON_TEXTURE = getSheetKey('ui.buttons', 1);
/** Normal frame of each button; the lit version is the next frame. */
export const SELECT_BUTTON_FRAME = {
    cancel: 16,
    create: 24,
    magician: 65,
    warrior: 67,
} as const;

/** Bottom buttons (top-left corner, 640x480 coordinates). */
export const SELECT_CLASS_BUTTONS: ReadonlyArray<{ id: CharacterId; frame: number; x: number; y: number }> = [
    { id: 'warrior', frame: SELECT_BUTTON_FRAME.warrior, x: 50, y: 449 },
    { id: 'mage', frame: SELECT_BUTTON_FRAME.magician, x: 136, y: 449 },
];
/**
 * Extra touch area around each button, in 640x480 pixels (Fase 11). On phones the 74x20 buttons are tiny:
 * the area grows a lot upwards and downwards and only a little sideways (Warrior and Magician are 12 px apart).
 */
export const SELECT_BUTTON_HIT_PAD = byDevice({ x: 0, y: 0 }, { x: 5, y: 14 });
export const SELECT_CREATE_BUTTON = { x: 378, y: 449 } as const;
export const SELECT_CANCEL_BUTTON = { x: 494, y: 449 } as const;

/** Left panel. */
export const SELECT_TEXT_CENTER_X = 180;
export const SELECT_LABEL_X = 86;
export const SELECT_NAME = { titleY: 92, labelY: 115, box: { x: 192, y: 107, width: 107, height: 17 } } as const;
export const SELECT_LOOK = { titleY: 140, firstRowY: 163, step: 16 } as const;
export const SELECT_LOOK_ROWS = ['Gender', 'Skin Color', 'Hair Style', 'Hair Color', 'Underwear Color'] as const;
export const SELECT_STATS = { titleY: 258, firstRowY: 283, step: 16, valueX: 212 } as const;
export const SELECT_FOOTER_Y = 395;

/** Top right panel: big preview, oval mirror and three value boxes. */
export const SELECT_PREVIEW = { x: 418, y: 226, scale: 1.6 } as const;
export const SELECT_MIRROR = { x: 501, y: 176, scale: 1, turnMs: 900 } as const;
export const SELECT_VALUES = { labelX: 534, valueX: 558, firstRowY: 197, step: 16 } as const;

/** Bottom right panel: class description. */
export const SELECT_DESCRIPTION = { x: 478, y: 380, width: 200 } as const;

/** Ignore input for a moment so a key held from the previous screen does nothing. */
export const SELECT_INPUT_DELAY_MS = 250;

/** Text sizes are in screen pixels (after scaling). The original's boxes are small: on phones they grow only a little. */
export const SELECT_TEXT_STYLE = { ...UI_TEXT, fontSize: byDevice('15px', '18px'), color: '#1e1408' } as const;
/** Class description: a long last line ("+1 Int and +2 Mag every level") must fit the bottom-right box. */
export const SELECT_DESCRIPTION_STYLE = { ...SELECT_TEXT_STYLE, fontSize: byDevice('15px', '17px') } as const;
export const SELECT_DISABLED_STYLE = { ...SELECT_TEXT_STYLE, color: '#54452e' } as const;
export const SELECT_VALUE_STYLE = { ...UI_TEXT, fontSize: byDevice('14px', '17px'), fontStyle: 'bold', color: '#1e1408' } as const;
export const SELECT_NAME_STYLE = { ...UI_TEXT, fontSize: byDevice('15px', '17px'), fontStyle: 'bold', color: '#ffffff' } as const;
/** Greys out the look arrows, which don't work yet. */
export const SELECT_DISABLED_ARROWS = { x: 235, width: 44, alpha: 0.45, color: 0x8a7a60 } as const;
