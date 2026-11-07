// Helbreath Off (Fase Off-6A): medidas del libro de magias (off/scenes/OffSpellBookScene.ts). Mismo estilo que la
// tienda (off/config/offStore.ts): lista a la izquierda; a la derecha, el cuadro de la magia marcada y las teclas 1–8.
import { byDevice } from '../../config/device';

export const OFF_SPELL_BOOK_PANEL = {
    width: 660,
    /** Width of the spell list; the right-hand column takes the rest. */
    listWidth: 320,
} as const;

/** The eight key rows (1–8) under the spell's box. */
export const OFF_SPELL_BOOK_KEYS = {
    rowHeight: byDevice(24, 28),
    /** Width of the "F1" label at the start of each row. */
    labelWidth: 34,
    background: 0x120c06,
    border: 0x5a4a30,
    /** The key that holds the marked spell. */
    markedFill: 0x5a4220,
    emptyColor: '#7a6a48',
} as const;
