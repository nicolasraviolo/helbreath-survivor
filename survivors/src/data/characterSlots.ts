// Personajes guardados (Fase 17A): los huecos de la pantalla "Select Character" del original y las reglas del nombre.
// Un personaje dura entre partidas (nombre, clase y mejor nivel); las partidas guardadas (data/saves.ts) van aparte.
// Personajes fijos (22-oct-2026, decidido por el propietario): cada cuenta trae ya un Guerrero y una Maga con nombre y
// aspecto fijos, como en otros juegos del estilo. No se crean ni se borran. Los huecos que sobran salen bloqueados
// ("Locked", con una silueta) para los personajes que se desbloqueen más adelante.
import type { CharacterLook } from './appearance';
import type { CharacterId } from './characters';

/** Character slots on the select screen, as in the original. */
export const CHARACTER_SLOT_COUNT = 4;

/** Longest name; the original allowed 10 letters (an 11-byte buffer). */
export const CHARACTER_NAME_MAX_LENGTH = 10;

/** Characters a name may have: letters and digits, as in the original. */
export const CHARACTER_NAME_ALLOWED = /[A-Za-z0-9]/;

export interface FixedCharacter {
    name: string;
    classId: CharacterId;
    look: CharacterLook;
}

/** The characters every account has, in slot order. The slots after them are locked. */
export const FIXED_CHARACTERS: readonly FixedCharacter[] = [
    { name: 'Gorn', classId: 'warrior', look: { gender: 'male', skin: 2, hairStyle: 2, hairColor: 0, underwear: 5 } },
    { name: 'Kaila', classId: 'mage', look: { gender: 'female', skin: 1, hairStyle: 4, hairColor: 2, underwear: 3 } },
];

/** True for the slots kept for characters unlocked later. */
export function isLockedSlot(slot: number): boolean {
    return slot >= FIXED_CHARACTERS.length;
}
