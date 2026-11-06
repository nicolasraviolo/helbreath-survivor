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
import type { OffMonsterId } from './offMonsters';

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

export const OFF_PITS: readonly OffPitDef[] = [
    { monster: 'slime', area: rect(100, 80, 112, 87), max: 4 },
    { monster: 'slime', area: rect(85, 89, 98, 97), max: 4 },
    { monster: 'slime', area: rect(66, 96, 79, 103), max: 4 },
    { monster: 'slime', area: rect(58, 85, 70, 92), max: 4 },
    { monster: 'slime', area: rect(103, 120, 116, 128), max: 4 },
    { monster: 'slime', area: rect(117, 117, 130, 124), max: 4 },
    { monster: 'rabbit', area: rect(104, 91, 116, 99), max: 4 },
    { monster: 'rabbit', area: rect(60, 73, 72, 81), max: 4 },
];

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
