// Formas de moverse de los monstruos (Fase 27): para que no lleguen todos en línea recta y formen una bola.
// Cada monstruo elige una en data/enemies.ts (`movement`); sin ella va directo, como siempre. Los jefes van siempre
// directos (propietario, 23-oct-2026). Todo es cálculo barato por monstruo: nada de buscar caminos.

/**
 * - `direct`: straight at the player (the original behaviour).
 * - `flank`: comes in on a curve from one side and only goes straight when close, so packs arrive from several sides.
 * - `wander`: walks around at random (drifting roughly towards the player) until it sees the player or is hit.
 */
export type MovementStyle = 'direct' | 'flank' | 'wander';

/**
 * Flank: each monster picks a side (left or right) and an angle between `minAngleDeg` and `maxAngleDeg` when it
 * appears. Far away it walks that many degrees off the straight line; the angle shrinks to 0 between `farPx` and
 * `nearPx` from the player, so it closes in straight and still reaches you.
 */
export const FLANK = { minAngleDeg: 35, maxAngleDeg: 60, nearPx: 110, farPx: 320 } as const;

/**
 * Wander: every `minLegMs`–`maxLegMs` it picks a new heading within `spreadDeg` of the player's direction (so it
 * drifts closer instead of getting lost), or stands still for that leg with `idleChance`. It notices the player
 * within `sightPx`, or as soon as it takes a hit, and from then on chases straight for good.
 */
export const WANDER = { minLegMs: 900, maxLegMs: 2200, spreadDeg: 75, idleChance: 0.15, sightPx: 260 } as const;
