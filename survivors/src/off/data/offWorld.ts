// Helbreath Off (Fase Off-1): el mundo donde se anda y el personaje de prueba.
// - Los sitios (Traveler Zone, y desde la Off-5A las ciudades) están en off/data/offPlaces.ts.
// - Se anda casilla a casilla como el original (decisión del 6-nov-2026). El original corría a 180 ms por casilla con
//   su velocidad por defecto (sp-client Player.ts); al propietario le pareció muy rápido (6-nov-2026): 250 ms.
// - Correr o andar es un interruptor (R o R3 del mando), como el original, que empezaba corriendo.
// - Mientras no haya creación de personaje: un novato genérico, hombre, con la ropa de inicio y una Dagger (Off-2).
import type { CharacterLook } from '../../data/appearance';
import { CHARACTERS, type CharacterDef } from '../../data/characters';
import { MELEE_WEAPONS } from '../../data/weapons';

/** Time to cross one tile, in milliseconds. */
export const OFF_STEP_MS = { run: 250, walk: 400 } as const;

/** Tiles the character crosses during one cycle of the walk or run animation (8 frames). */
export const TILES_PER_ANIMATION_CYCLE = 2;
const FRAMES_PER_CYCLE = 8;

/** Animation speed that keeps the feet in time with the steps. */
function frameRateFor(stepMs: number): number {
    return FRAMES_PER_CYCLE / ((stepMs * TILES_PER_ANIMATION_CYCLE) / 1000);
}

export const OFF_MOVEMENT = {
    /** Run mode when Off opens (the original started running); R / R3 switch it, and it is kept while the page is open. */
    startRunning: true,
    /** A click on a blocked tile goes to the nearest free tile within this many tiles (sp-client findMovableLocation). */
    clickSearchRadius: 50,
    /** The stick aims at a tile this far away, so a blocked step can go round the obstacle like a click does. */
    stickTargetTiles: 20,
} as const;

/** The novice's look: a man with the default body, hair and underwear. */
export const OFF_NOVICE_LOOK: CharacterLook = { gender: 'male', skin: 0, hairStyle: 0, hairColor: 7, underwear: 0 };

/** The novice: the Warrior's body settings, starting clothes (shirt, trousers, boots) and a Dagger (Fase Off-2). */
export const OFF_NOVICE: CharacterDef = {
    ...CHARACTERS.warrior,
    playerName: 'Novice',
    runFrameRate: frameRateFor(OFF_STEP_MS.run),
    walkFrameRate: frameRateFor(OFF_STEP_MS.walk),
    appearance: {
        hauberk: { sprite: 'gear.shirt.m' },
        leggings: { sprite: 'gear.trousers.m' },
        boots: { sprite: 'gear.boots.long.m' },
        weapon: { sprite: MELEE_WEAPONS.dagger.sprite.key, startSheet: MELEE_WEAPONS.dagger.sprite.startSheet },
    },
};
