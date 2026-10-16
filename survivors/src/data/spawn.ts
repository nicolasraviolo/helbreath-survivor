// Ritmo de aparición provisional (Fase 3). En la Fase 7 lo sustituye la línea de tiempo de data/waves.ts.
import type { EnemyId } from './enemies';

export const SPAWN = {
    /** Seconds between spawns at the start of the run… */
    initialInterval: 1.2,
    /** …shrinking linearly to this after `rampSeconds`. */
    minInterval: 0.12,
    rampSeconds: 180,
    /** Enemies created per spawn event. */
    batchSize: 2,
    /** No new spawns while this many enemies are alive. */
    maxAlive: 400,
    /** Distance beyond the visible screen edge where enemies appear, in pixels. */
    offscreenMargin: 48,
    /** Enemies farther than this × half the screen diagonal are moved back to the spawn ring… */
    relocateDistanceFactor: 1.8,
    /** …checked this often (ms). Keeps enemies stuck behind the river in play. */
    relocateEveryMs: 1000,
    /** Weighted choice of enemy type. */
    table: [
        { enemy: 'slime', weight: 4 },
        { enemy: 'bunny', weight: 3 },
        { enemy: 'ant', weight: 3 },
        { enemy: 'orc', weight: 2 },
    ] satisfies Array<{ enemy: EnemyId; weight: number }>,
} as const;
