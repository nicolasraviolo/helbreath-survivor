// Barracks (31-oct-2026, propietario): mapa de entrenamiento para probar el daño y las builds. Como los Barracks del
// original (elvbrk11.amd), con sus muñecos (Dummy, tipo 34 del servidor). No hay oleadas, ni XP, ni oro, ni botín, ni
// logros, ni guardado; el jugador no muere. Se entra por la puerta del edificio de los Barracks de la ciudad
// (TOWN.barracksDoor) y se sale con la pausa → Back to Town, que deja al personaje delante de esa puerta.
// Casillas medidas con un script sobre el .amd: la arena es un rombo de ~105×90; x 63–84, y 75–88 está todo libre.
import type { EnemyId } from './enemies';
import type { TilePoint } from './town';

export interface TrainingDef {
    /** Where the player appears (tile). */
    spawn: TilePoint;
    /** The quiet Dummies: they never move nor attack. */
    dummy: EnemyId;
    /** Tile of each quiet Dummy: a small group in front of the player. */
    dummies: readonly TilePoint[];
    /** A Dummy whose health falls under this share of its maximum is filled again at once (so it never dies). */
    refillBelow: number;
    /** If a single huge blow kills one anyway, it stands up again at its spot after this long (ms). */
    respawnMs: number;
    /** The town's Barracks door counts as stepped on when the feet are this close to its centre (px). */
    doorRadiusPx: number;
    /** The Attack-Dummies: they keep their spot, chase a player who comes near and hit softly. */
    attackDummy: EnemyId;
    /** Their spots: a small group in another corner of the arena, away from the quiet ones. */
    attackDummies: readonly TilePoint[];
    /** A dead Attack-Dummy stands up again at its spot after this long (ms). */
    attackRespawnMs: number;
    /** The damage panel's "DPS now" counts the damage of this last stretch of time (ms). */
    dpsWindowMs: number;
}

/** The Barracks map (MAPS_DATA). */
export const BARRACKS_MAP = 'barracks' as const;

/** Registry key: true while coming back from the Barracks, so the town puts the character in front of its door. */
export const BARRACKS_EXIT_KEY = 'barracksExit';

export const TRAINING: TrainingDef = {
    spawn: { x: 67, y: 82 },
    dummy: 'trainingDummy',
    dummies: [
        { x: 75, y: 79 },
        { x: 77, y: 81 },
        { x: 78, y: 83 },
        { x: 77, y: 85 },
        { x: 75, y: 87 },
    ],
    refillBelow: 0.25,
    respawnMs: 1500,
    doorRadiusPx: 22,
    // Zona libre de 14×12 en x 41–54, y 68–79 (script sobre el .amd), ~21 casillas a la izquierda de la llegada.
    attackDummy: 'attackDummy',
    attackDummies: [
        { x: 45, y: 72 },
        { x: 49, y: 73 },
        { x: 46, y: 77 },
    ],
    attackRespawnMs: 3000,
    dpsWindowMs: 5000,
};
