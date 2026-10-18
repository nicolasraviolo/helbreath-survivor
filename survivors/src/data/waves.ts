// Línea de tiempo de la partida (Fase 7, sustituye a data/spawn.ts). Sigue la tabla "Oleadas" de docs/DESIGN.md.
// - WAVES: qué enemigos salen en cada tramo, cada cuánto y cuántos a la vez como máximo.
// - EVENTS: momentos concretos (minijefes, jefe final, "te rodean") con su aviso en pantalla.
//   Desde que sale el jefe final (Fase 13) no salen monstruos de las oleadas: solo sus esbirros (BOSS_MINIONS en enemies.ts).
// - PORTAL: al matar al jefe final mueren todos los monstruos y suelta su cofre; al abrirlo se abre un portal y entrar en
//   él (o esperar) gana la partida. La XP que quede en el suelo se pierde.
// Todos los números son un borrador: se ajustan jugando.
import type { EnemyId } from './enemies';

export interface WaveDef {
    /** Minute this wave starts (it lasts until the next one). */
    fromMinute: number;
    enemies: ReadonlyArray<{ enemy: EnemyId; weight: number }>;
    /** Seconds between spawn events at the start of the wave, going down to `endInterval` by its end. */
    startInterval: number;
    endInterval: number;
    /** Enemies created per spawn event. */
    batchSize: number;
    /** No new spawns while this many enemies are alive. */
    maxAlive: number;
}

export type WaveEventKind = 'boss' | 'finalBoss' | 'surround';

export interface WaveEventDef {
    atMinute: number;
    kind: WaveEventKind;
    enemy: EnemyId;
    /** Surround: how many enemies form the ring. */
    count?: number;
    /** Shown in the middle of the screen with the game's sprite font. */
    message: string;
}

// El Dark Elf está desactivado (18-oct-2026, pedido del propietario): sus flechas eran molestas y desequilibradas.
// Sus datos siguen en enemies.ts; en su lugar salen esqueletos.
export const WAVES: readonly WaveDef[] = [
    { fromMinute: 0, enemies: [{ enemy: 'slime', weight: 4 }, { enemy: 'bunny', weight: 3 }, { enemy: 'ant', weight: 3 }], startInterval: 1.2, endInterval: 0.6, batchSize: 2, maxAlive: 200 },
    { fromMinute: 2, enemies: [{ enemy: 'orc', weight: 3 }, { enemy: 'snake', weight: 3 }, { enemy: 'scorpion', weight: 2 }, { enemy: 'frog', weight: 2 }, { enemy: 'ant', weight: 1 }], startInterval: 0.8, endInterval: 0.45, batchSize: 2, maxAlive: 260 },
    { fromMinute: 4, enemies: [{ enemy: 'skeleton', weight: 4 }, { enemy: 'zombie', weight: 3 }, { enemy: 'direBoar', weight: 2 }, { enemy: 'orc', weight: 1 }], startInterval: 0.6, endInterval: 0.35, batchSize: 2, maxAlive: 300 },
    { fromMinute: 6, enemies: [{ enemy: 'troll', weight: 3 }, { enemy: 'ogre', weight: 2 }, { enemy: 'stalker', weight: 3 }, { enemy: 'werewolf', weight: 2 }, { enemy: 'skeleton', weight: 1 }], startInterval: 0.5, endInterval: 0.3, batchSize: 2, maxAlive: 320 },
    { fromMinute: 8, enemies: [{ enemy: 'cyclops', weight: 2 }, { enemy: 'lich', weight: 3 }, { enemy: 'hellhound', weight: 3 }, { enemy: 'skeleton', weight: 3 }], startInterval: 0.45, endInterval: 0.25, batchSize: 2, maxAlive: 340 },
    { fromMinute: 10, enemies: [{ enemy: 'gargoyle', weight: 3 }, { enemy: 'hellclaw', weight: 2 }, { enemy: 'tigerworm', weight: 2 }, { enemy: 'minotaur', weight: 3 }], startInterval: 0.4, endInterval: 0.22, batchSize: 2, maxAlive: 360 },
];

export const WAVE_EVENTS: readonly WaveEventDef[] = [
    { atMinute: 3, kind: 'surround', enemy: 'snake', count: 28, message: 'You are surrounded!' },
    { atMinute: 5, kind: 'boss', enemy: 'ettin', message: 'The Ettin approaches!' },
    { atMinute: 7, kind: 'surround', enemy: 'werewolf', count: 24, message: 'The werewolves hunt you!' },
    { atMinute: 8, kind: 'boss', enemy: 'demon', message: 'A Demon has risen!' },
    { atMinute: 10.5, kind: 'surround', enemy: 'hellhound', count: 30, message: 'You are surrounded!' },
    { atMinute: 12, kind: 'finalBoss', enemy: 'fireWyvern', message: 'The Fire Wyvern awakens!' },
];

/** Shared spawning rules. */
export const SPAWN = {
    /**
     * Distance beyond the visible screen edge where enemies appear, in pixels: close, because monsters walk slowly
     * (real speeds), but enough that tall ones (feet at the bottom edge) don't pop in.
     */
    offscreenMargin: 72,
    /** Ring of a "surround" event: this many pixels from the player (just inside the screen edge). */
    surroundRadius: 230,
    /** Enemies farther than this × half the screen diagonal are moved back to the spawn ring… */
    relocateDistanceFactor: 1.8,
    /** …checked this often (ms). Keeps enemies stuck behind the river in play. Bosses are never moved. */
    relocateEveryMs: 1000,
} as const;

/** End of the run (Fase 13): what happens once the final boss is dead. */
export const PORTAL = {
    /** The portal opens this long after the player picks up the final boss's chest (ms). */
    openDelayMs: 1000,
    /** The run is won when the player steps in, or when this time runs out (ms). */
    durationMs: 30000,
    /** The player is "in" when their feet are this close to the centre of the portal (px). */
    enterRadius: 26,
    /** It opens this far to one side of the chest (px): the player is standing there, and must walk in on purpose. */
    besideChestX: 90,
    /** Continue after the final boss: its chest (or the portal, if it was open) appears this far to the right of the player (px). */
    resumeOffsetX: 120,
    /** Shown when the final boss dies, and when the portal opens. */
    bossDeadMessage: 'Open the chest to leave!',
    message: 'A portal has opened!',
} as const;
