// Helbreath Off (Fase Off-2): los pits de Traveler Zone. Cada pit es un rectángulo del mapa con un tipo de monstruo y
// un máximo de vivos; cuando muere uno, sale otro al rato (servidor original: spot-mob-generator).
// - Slimes: las 6 zonas reales del mapa "Beginners Zone" (el mismo default.amd de 170×170) en
//   https://helbreathnemesis.com/portal/index.php?action=map&id=1 (pasado de píxeles a casillas: px / 0,919 / 3,2).
//   Allí también hay dos pits de Guards (las dos plazas de piedra): fuera de momento.
// - Rabbits: en ese mapa no había; los colocamos nosotros (decisión del propietario, 6-nov-2026), en dos praderas sin
//   rocas al este y al noroeste del inicio. Sin búsqueda de caminos (como el original) el novato se atasca en los
//   anillos de roca del sur, así que esas zonas no sirven.
// - El máximo de cada pit no sale en esa página: lo ponemos nosotros.
import type { TileRect } from '../../data/maps';
import type { SpriteKey } from '../../config/assetManifest';
import { OFF_MONSTERS, type OffMonsterId } from './offMonsters';

export interface OffPitDef {
    monster: OffMonsterId;
    /** Tiles where its monsters appear (and wander). */
    area: TileRect;
    /** Monsters alive at once. */
    max: number;
}

/** Tiles from the Nemesis map: x1..x2, y1..y2 inclusive. */
function rect(x1: number, y1: number, x2: number, y2: number): TileRect {
    return { x: x1, y: y1, width: x2 - x1 + 1, height: y2 - y1 + 1 };
}

/** Traveler Zone's pits (each place lists its own: off/data/offPlaces.ts). */
export const TRAVELER_PITS: readonly OffPitDef[] = [
    { monster: 'slime', area: rect(100, 80, 112, 87), max: 4 },
    { monster: 'slime', area: rect(85, 89, 98, 97), max: 4 },
    { monster: 'slime', area: rect(66, 96, 79, 103), max: 4 },
    { monster: 'slime', area: rect(58, 85, 70, 92), max: 4 },
    { monster: 'slime', area: rect(103, 120, 116, 128), max: 4 },
    { monster: 'slime', area: rect(117, 117, 130, 124), max: 4 },
    { monster: 'rabbit', area: rect(104, 91, 116, 99), max: 4 },
    { monster: 'rabbit', area: rect(60, 73, 72, 81), max: 4 },
];

// Fase Off-5C: los 8 pits de cada ciudad, en los sitios del original (helbreathnemesis.com, mapas 10 Aresden y
// 11 Elvine; casilla = px × 0,6) pero repartidos de nuevo para que haya escalera (propietario, 7-nov-2026): 1 Slime,
// 2 Giant Ant, 2 Snake, 2 Orc y 1 Giant Scorpion, más difíciles cuanto más lejos del teleport. El Scorpion se queda en
// su sitio del original. En el original no había Orcs ni Ants en la ciudad. El máximo de cada pit es nuestro: 8 (6 el
// del Scorpion), el doble de lo primero (propietario, 7-nov-2026).

/** Monsters alive at once in a city pit (the Scorpion's, fewer). */
const CITY_PIT_MAX = 8;
const SCORPION_PIT_MAX = 6;

/** Aresden's pits, nearest to the teleport (140,207) first. */
export const ARESDEN_PITS: readonly OffPitDef[] = [
    { monster: 'slime', area: rect(130, 239, 142, 247), max: CITY_PIT_MAX },
    { monster: 'giantAnt', area: rect(181, 238, 190, 244), max: CITY_PIT_MAX },
    { monster: 'giantAnt', area: rect(40, 172, 52, 179), max: CITY_PIT_MAX },
    { monster: 'snake', area: rect(216, 238, 226, 244), max: CITY_PIT_MAX },
    { monster: 'snake', area: rect(28, 190, 40, 197), max: CITY_PIT_MAX },
    { monster: 'orc', area: rect(245, 197, 257, 205), max: CITY_PIT_MAX },
    { monster: 'orc', area: rect(110, 47, 122, 55), max: CITY_PIT_MAX },
    { monster: 'giantScorpion', area: rect(93, 28, 109, 49), max: SCORPION_PIT_MAX },
];

/** Elvine's pits, nearest to the teleport (237,140) first. */
export const ELVINE_PITS: readonly OffPitDef[] = [
    { monster: 'slime', area: rect(254, 177, 266, 185), max: CITY_PIT_MAX },
    { monster: 'giantAnt', area: rect(239, 212, 251, 220), max: CITY_PIT_MAX },
    { monster: 'giantAnt', area: rect(151, 34, 163, 41), max: CITY_PIT_MAX },
    { monster: 'snake', area: rect(130, 242, 142, 250), max: CITY_PIT_MAX },
    { monster: 'snake', area: rect(51, 212, 61, 218), max: CITY_PIT_MAX },
    { monster: 'orc', area: rect(41, 182, 50, 188), max: CITY_PIT_MAX },
    { monster: 'orc', area: rect(44, 57, 56, 65), max: CITY_PIT_MAX },
    { monster: 'giantScorpion', area: rect(123, 23, 139, 44), max: SCORPION_PIT_MAX },
];

// Fase Off-7A: Promiseland (`2ndmiddle.amd`, 250×250), los 12 pits del original en
// https://www.helbreathnemesis.com/portal/index.php?action=largemap&id=4 (imagen de 800 px para 250 casillas:
// casilla = px / 3,2). Elvine llega por la puerta de arriba (y 21) y Aresden por la de abajo (y 228); los dos tienen
// Orcs, Scorpions, Skeletons y Zombies cerca, los Golems al este y el Troll y el Cyclops en el centro. El máximo de cada
// pit es nuestro, como en las ciudades: 8, y menos en los de monstruos grandes.

/** Monsters alive at once in Promiseland's pits of big monsters (golems, Troll, Cyclops). */
const BIG_PIT_MAX = 5;

/** Promiseland's pits. */
export const PROMISELAND_PITS: readonly OffPitDef[] = [
    { monster: 'orc', area: rect(49, 38, 61, 56), max: CITY_PIT_MAX },
    { monster: 'orc', area: rect(170, 180, 182, 198), max: CITY_PIT_MAX },
    { monster: 'giantScorpion', area: rect(47, 82, 63, 103), max: CITY_PIT_MAX },
    { monster: 'giantScorpion', area: rect(47, 155, 63, 176), max: CITY_PIT_MAX },
    { monster: 'skeleton', area: rect(155, 46, 163, 72), max: CITY_PIT_MAX },
    { monster: 'skeleton', area: rect(86, 191, 94, 217), max: CITY_PIT_MAX },
    { monster: 'zombie', area: rect(122, 65, 129, 81), max: CITY_PIT_MAX },
    { monster: 'zombie', area: rect(135, 193, 142, 210), max: CITY_PIT_MAX },
    { monster: 'clayGolem', area: rect(199, 101, 209, 127), max: BIG_PIT_MAX },
    { monster: 'stoneGolem', area: rect(197, 140, 214, 166), max: BIG_PIT_MAX },
    { monster: 'troll', area: rect(108, 110, 122, 136), max: BIG_PIT_MAX },
    { monster: 'cyclops', area: rect(125, 108, 145, 138), max: BIG_PIT_MAX },
];

/** Sprites of the monsters of some pits (only those are loaded with the place). */
export function pitSprites(pits: readonly OffPitDef[]): SpriteKey[] {
    return [...new Set(pits.map((pit) => OFF_MONSTERS[pit.monster].base.sprite))];
}

/**
 * Refilling a pit (server MobGenerator): while it has fewer than `max`, each check has a 1 in 3 chance of a new one.
 * How often the server checked is not in the code we have: every `checkMs` is ours.
 */
export const OFF_PIT_RESPAWN = {
    checkMs: 2000,
    chance: 1 / 3,
    /** Wandering may take a monster this many tiles out of its pit (ours: the original walked between waypoints). */
    wanderMargin: 2,
} as const;
