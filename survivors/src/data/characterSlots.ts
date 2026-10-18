// Personajes guardados (Fase 17A): los huecos de la pantalla "Select Character" del original y las reglas del nombre.
// Un personaje dura entre partidas (nombre, clase y mejor nivel); las partidas guardadas (data/saves.ts) van aparte.

/** Character slots on the select screen, as in the original. */
export const CHARACTER_SLOT_COUNT = 4;

/** Longest name; the original allowed 10 letters (an 11-byte buffer). */
export const CHARACTER_NAME_MAX_LENGTH = 10;

/** Characters a name may have: letters and digits, as in the original. */
export const CHARACTER_NAME_ALLOWED = /[A-Za-z0-9]/;
