// Línea de tiempo de la partida (Fase 7, sustituye a data/spawn.ts). Sigue la tabla "Oleadas" de docs/DESIGN.md.
// - WAVES: qué enemigos salen en cada tramo, cada cuánto y cuántos a la vez como máximo.
// - EVENTS: momentos concretos (minijefes, jefe final, "te rodean") con su aviso en pantalla.
//   Desde que sale el jefe final (Fase 13) no salen monstruos de las oleadas: solo sus esbirros (BOSS_MINIONS en enemies.ts).
// - PORTAL: al matar al jefe final mueren todos los monstruos y suelta su cofre; al abrirlo se abre un portal y entrar en
//   él (o esperar) gana la partida. Toda la XP del suelo vuela sola hacia el jugador y los niveles que dé suben
//   sin cartas (Fase 13C); la pantalla de victoria dice el nivel alcanzado.
// Todos los números son un borrador: se ajustan jugando.
import { ESSENTIAL_ENEMIES, type EnemyId } from './enemies';
import { DEFAULT_MAP, MAPS_DATA, type MapDef } from './maps';

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

export type WaveEventKind = 'boss' | 'finalBoss' | 'surround' | 'stampede';

export interface WaveEventDef {
    atMinute: number;
    kind: WaveEventKind;
    enemy: EnemyId;
    /** Surround: how many enemies form the ring. Stampede: how many charge. */
    count?: number;
    /** Shown in the middle of the screen with the game's sprite font. */
    message: string;
}

// Bleeding Isle (Fase 13B, 18-oct-2026): solo los esenciales (ESSENTIAL_ENEMIES, de más débil a más fuerte) y, desde
// la mitad, los propios del mapa (MAPS_DATA.bisle.localEnemies) con poco peso: salen menos, pero pegan más.
// El resto de monstruos de enemies.ts (Bunny, Troll, Werewolf, Lich, Gargoyle…) queda para otros mapas.
// Al final del archivo se comprueba que cada oleada solo use monstruos permitidos en el mapa.
export const WAVES: readonly WaveDef[] = [
    { fromMinute: 0, enemies: [{ enemy: 'slime', weight: 5 }, { enemy: 'ant', weight: 4 }, { enemy: 'snake', weight: 2 }], startInterval: 1.2, endInterval: 0.6, batchSize: 2, maxAlive: 200 },
    { fromMinute: 1.5, enemies: [{ enemy: 'ant', weight: 2 }, { enemy: 'snake', weight: 3 }, { enemy: 'orc', weight: 4 }, { enemy: 'orcMage', weight: 1 }], startInterval: 0.8, endInterval: 0.45, batchSize: 2, maxAlive: 260 },
    { fromMinute: 3.5, enemies: [{ enemy: 'orc', weight: 2 }, { enemy: 'orcMage', weight: 1 }, { enemy: 'zombie', weight: 4 }, { enemy: 'scorpion', weight: 3 }], startInterval: 0.6, endInterval: 0.35, batchSize: 2, maxAlive: 300 },
    { fromMinute: 5.5, enemies: [{ enemy: 'scorpion', weight: 2 }, { enemy: 'skeleton', weight: 4 }, { enemy: 'clayGolem', weight: 3 }, { enemy: 'cyclops', weight: 1 }], startInterval: 0.5, endInterval: 0.3, batchSize: 2, maxAlive: 320 },
    { fromMinute: 7.5, enemies: [{ enemy: 'skeleton', weight: 2 }, { enemy: 'clayGolem', weight: 2 }, { enemy: 'stoneGolem', weight: 3 }, { enemy: 'frog', weight: 2 }, { enemy: 'cyclops', weight: 1 }, { enemy: 'cannibalPlant', weight: 1 }], startInterval: 0.45, endInterval: 0.25, batchSize: 2, maxAlive: 340 },
    { fromMinute: 9.5, enemies: [{ enemy: 'stoneGolem', weight: 3 }, { enemy: 'frog', weight: 3 }, { enemy: 'skeleton', weight: 1 }, { enemy: 'cyclops', weight: 1 }, { enemy: 'cannibalPlant', weight: 1 }, { enemy: 'ogre', weight: 1 }, { enemy: 'mountainGiant', weight: 1 }], startInterval: 0.4, endInterval: 0.22, batchSize: 2, maxAlive: 360 },
];

export const WAVE_EVENTS: readonly WaveEventDef[] = [
    { atMinute: 3, kind: 'surround', enemy: 'snake', count: 28, message: 'You are surrounded!' },
    { atMinute: 4.5, kind: 'stampede', enemy: 'orc', count: 18, message: 'Orc stampede!' },
    { atMinute: 5, kind: 'boss', enemy: 'ettin', message: 'The Ettin approaches!' },
    { atMinute: 7, kind: 'surround', enemy: 'skeleton', count: 24, message: 'The dead rise around you!' },
    { atMinute: 8, kind: 'boss', enemy: 'demon', message: 'A Demon has risen!' },
    { atMinute: 9.5, kind: 'stampede', enemy: 'frog', count: 18, message: 'The frogs stampede!' },
    { atMinute: 10.5, kind: 'surround', enemy: 'stoneGolem', count: 26, message: 'You are surrounded!' },
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
    /**
     * Stampede: a block of `rows` lines of monsters, `spacing` px apart, appears off one side of the screen, in line
     * with the player, and runs straight across at `speedFactor` × its speed. It is narrower than the screen: step
     * aside or cut through it. When it has crossed, the monsters chase as usual.
     */
    stampede: { rows: 3, spacing: 40, speedFactor: 3.5 },
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

// Comprobación al cargar: las oleadas solo usan esenciales y monstruos del mapa, y los eventos de jefe, sus jefes.
// Las oleadas son de DEFAULT_MAP; con varios mapas (Fase 19) cada mapa tendrá las suyas.
{
    const map: MapDef = MAPS_DATA[DEFAULT_MAP];
    const allowed = new Set<EnemyId>([...ESSENTIAL_ENEMIES, ...map.localEnemies]);
    for (const wave of WAVES) {
        for (const { enemy } of wave.enemies) {
            if (!allowed.has(enemy)) throw new Error(`data/waves.ts: ${enemy} is not an essential or ${map.name} monster`);
        }
    }
    for (const event of WAVE_EVENTS) {
        const ok = event.kind === 'boss' || event.kind === 'finalBoss' ? map.bosses.includes(event.enemy) : allowed.has(event.enemy);
        if (!ok) throw new Error(`data/waves.ts: event ${event.message} uses ${event.enemy}, not a ${map.name} monster`);
    }
}
