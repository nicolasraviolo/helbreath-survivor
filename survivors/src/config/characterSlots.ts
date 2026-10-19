// Pantalla "Select Character" con las piezas originales (Fase 17A), medidas en reference/Client.cpp
// (UpdateScreen_OnSelectCharacter) sobre la imagen de 640x480; la escena las amplía a 800x600 como Create Character:
// - fondo: gamedialog86.spr, hoja 8 (640x480);
// - huecos y botones: dialogtext.spr, hoja 1. Huecos 107x187 (61 normal, 62 marcado); botones 176x24 (51–55 normales,
//   56–60 iluminados), en orden Start, Create New Character, Delete Character, Change Password y Log Out. El fondo ya
//   trae los botones dibujados; Change Password no se usa (se ve apagado) y Log Out vuelve al menú principal.
// - Fase 20A: encima de Change Password, el botón "Level Set." (frame 10, 74x20; iluminado 11), el que abría el reparto
//   de puntos en el original: abre la ventana Character (CharacterInfoScene).
// - Fase 20B: a su derecha, en la misma fila, "Equipment" (texto propio: el original no tenía ese botón), que abre la
//   pantalla de equipo (EquipmentScene).
import { getSheetKey } from '../hb/HBSprite';
import { byDevice } from './device';
import { SELECT_SCALE, SELECT_TEXT_STYLE } from './characterSelect';
import { UI_TEXT } from './ui';

export const SLOTS_BACKGROUND = { texture: getSheetKey('ui.panel', 8), frame: '0' } as const;
/** Same scale as Create Character (both are 640x480 images). */
export const SLOTS_SCALE = SELECT_SCALE;
export const SLOTS_TEXTURE = getSheetKey('ui.buttons', 1);

/** The four slots in a row: frame top-left corner, character feet and text, for slot i add i * step to x. */
export const SLOTS_LAYOUT = {
    step: 109,
    frame: { x: 103, y: 54, normal: 61, focused: 62 },
    character: { x: 157, y: 148 },
    /** Name, Level and EXP, in the "Name", "Lev" and "Exp" boxes of the background (Fase 20A: Level and EXP are permanent). */
    textX: 157,
    textY: [184, 200, 216],
} as const;

/** Right-hand buttons: lit frame = normal frame + 5. Position = the original's (pivot of the 176x24 frame). */
export const SLOTS_BUTTONS = {
    x: 364,
    play: { frame: 51, y: 288 },
    newCharacter: { frame: 52, y: 318 },
    delete: { frame: 53, y: 348 },
    /** Change Password: not used, covered with SLOTS_DISABLED_SHADE. */
    unused: { y: 378, width: 176, height: 24 },
    back: { frame: 55, y: 408 },
    /** "Level Set." on the left of the Change Password row (Fase 20A). */
    levelSet: { frame: 10, litFrame: 11, x: 368, y: 380 },
    /** "Equipment" on its right (Fase 20B): drawn with text, the original has no such button. */
    equipment: { x: 446, y: 380, width: 90, height: 20 },
} as const;
export const SLOTS_BUTTON_LIT_OFFSET = 5;
/** Empty slots, and in Continue the characters without a saved run. */
export const SLOTS_DIM_ALPHA = 0.45;
/** Covers Change Password (not used) under the "Level Set." button (Fase 20A), with a thin frame like the buttons'. */
export const SLOTS_DISABLED_SHADE = { color: 0x2b241b, alpha: 1, border: 0x5a4a30 } as const;
/** "Equipment" button: text and frame, lit while the pointer is over it. */
export const SLOTS_EQUIPMENT_STYLE = { ...UI_TEXT, fontSize: byDevice('14px', '16px'), fontStyle: 'bold', color: '#d8c890' } as const;
export const SLOTS_EQUIPMENT_LIT_COLOR = '#ffe890';
/** Phones: touch area bigger than the button (they are 30 px apart, so only up to ~3 px up and down). */
export const SLOTS_BUTTON_HIT_PAD = byDevice({ x: 0, y: 0 }, { x: 4, y: 3 });

/** Help text on the left of the buttons, as in the original (centred between x 98 and 357). */
export const SLOTS_HELP = { x: 228, y: 330, width: 240 } as const;

/** Characters walk in place and turn: one turn (next direction) every this many ms, like the original's 8 loops. */
export const SLOTS_TURN_MS = 6400;
/** Character size inside the slot (1 = the original). */
export const SLOTS_CHARACTER_SCALE = 1;

/** Ignore input for a moment so a key held from the previous screen does nothing. */
export const SLOTS_INPUT_DELAY_MS = 250;

/** The original wrote in dark purple, RGB(51,0,51). */
export const SLOTS_TEXT_STYLE = { ...UI_TEXT, fontSize: byDevice('14px', '17px'), color: '#330033' } as const;
export const SLOTS_NAME_STYLE = { ...SLOTS_TEXT_STYLE, fontStyle: 'bold' } as const;
export const SLOTS_HELP_STYLE = { ...SELECT_TEXT_STYLE, align: 'center' } as const;
