// Helbreath Off (Fase Off-6A): medidas del libro de magias (off/scenes/OffSpellBookScene.ts). Mismo estilo que la
// tienda (off/config/offStore.ts): lista a la izquierda; a la derecha, el cuadro de la magia marcada y las teclas 1–8.
import { byDevice } from '../../config/device';

export const OFF_SPELL_BOOK_PANEL = {
    width: 660,
    /** Width of the spell list; the right-hand column takes the rest. */
    listWidth: 320,
} as const;

/** The eight keys (1–8, two columns since Off-6C) and the gamepad's four under the spell's box. */
export const OFF_SPELL_BOOK_KEYS = {
    rowHeight: byDevice(24, 28),
    /** Width of the "1" label at the start of each key cell. */
    labelWidth: 22,
    /** Width of the "RT + A" label in the gamepad cells (Off-6C). */
    padLabelWidth: 44,
    background: 0x120c06,
    border: 0x5a4a30,
    /** The key that holds the marked spell. */
    markedFill: 0x5a4220,
    emptyColor: '#7a6a48',
} as const;
