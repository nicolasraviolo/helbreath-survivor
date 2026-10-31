// Formas de moverse de los monstruos (Fase 27): para que no lleguen todos en línea recta y formen una bola.
// Cada monstruo elige una en data/enemies.ts (`movement`); sin ella va directo, como siempre. Los jefes van siempre
// directos (propietario, 23-oct-2026). Todo es cálculo barato por monstruo: nada de buscar caminos.

/**
 * - `direct`: straight at the player (the original behaviour).
 * - `flank`: comes in on a curve from one side and only goes straight when close, so packs arrive from several sides.
 * - `wander`: walks around at random (drifting roughly towards the player) until it sees the player or is hit.
 * - `charge`: walks straight at the player, but now and then stops, shows a "!" and rushes in a straight line (27B).
 * - `keepAway`: monsters that hit from afar walk up to their range, then back off if the player comes too close (27C).
 * - `guard`: stays at its post (where it appeared) and only chases a player who comes near it, then goes back (the
 *   Guards of the rescues, Fase 29A; DEF_MOVETYPE_GUARD of the original server).
 * - `still`: never moves nor attacks; if pushed, it walks back to its spot (the training Dummies of the Barracks).
 */
export type MovementStyle = 'direct' | 'flank' | 'wander' | 'charge' | 'keepAway' | 'guard' | 'still';

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

/**
 * Charge (Fase 27B): when it is between `minPx` and `maxPx` from the player and its pause is over, it stops for
 * `windupMs` with a "!" over its head, aimed at where the player stood when the "!" appeared. Then it rushes that way
 * at `speedFactor` times its speed and runs `overshootPx` past that point (so if you stepped aside it misses and has to
 * turn back). Next charge after `minCooldownMs`–`maxCooldownMs`; the first one comes at a random moment within
 * `maxCooldownMs` of appearing, so a pack doesn't charge all at once.
 */
export const CHARGE = {
    minPx: 70,
    maxPx: 220,
    windupMs: 600,
    speedFactor: 2.2,
    overshootPx: 110,
    minCooldownMs: 3000,
    maxCooldownMs: 4500,
} as const;

/**
 * The "!" over a charging monster: colour, size and gap above its head (px). `shown: false` hides it (the owner
 * asked to remove it on 27-oct-2026); the monster still stops for a moment before it charges.
 */
export const CHARGE_WARNING = { shown: false, text: '!', color: '#ffd020', fontSizePx: 26, gapAboveHeadPx: 4, maxShown: 40 } as const;

/**
 * Keep away (Fase 27C), for monsters that hit from afar (Mage-Orc, Lich, Dark Elf). While waiting for its next attack:
 * if the player is closer than `tooCloseShare` of its attack range, it backs off at `backPace` of its speed (slower
 * than the player, so a Warrior who chases it still catches it); otherwise it sidesteps around the player at
 * `strafePace`, swapping side now and then (every `minStrafeMs`–`maxStrafeMs`, with `swapChance`).
 */
export const KEEP_AWAY = {
    tooCloseShare: 0.6,
    backPace: 0.7,
    strafePace: 0.35,
    minStrafeMs: 1500,
    maxStrafeMs: 3000,
    swapChance: 0.5,
} as const;

/**
 * Guard (Fase 29A): it attacks when the player comes within `aggroPx` of its post, or for `provokedMs` after it takes a
 * hit while the player is within `leashPx` of the post (a Mage shooting from afar). Otherwise it walks back and stands
 * at its post (within `homePx`) facing `restDirection` (4 = south).
 */
export const GUARD_POST = { aggroPx: 230, leashPx: 420, provokedMs: 5000, homePx: 6, restDirection: 4 } as const;
