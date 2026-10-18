// Métricas anónimas (Fase 14A): al terminar cada partida se envía un resumen pequeño a nuestro servidor de Cloudflare
// (metrics-server/), solo para ajustar la dificultad. Sin cookies ni identificadores: nada que diga quién juega.
// El servidor importa este mismo tipo, así que lo que manda el juego y lo que guarda el servidor no pueden separarse.
// Se puede apagar en Settings ("Anonymous Stats"). En `pnpm dev` no se envía nada salvo con ?metrics=send.

/** Address of the metrics server (Cloudflare Worker). */
export const METRICS_URL = 'https://helbreath-survivors-metrics.nicolasraviolo.workers.dev/run';

/** One line under the checkbox in Settings. */
export const METRICS_NOTICE = 'Only used to tune the difficulty. Nothing personal, nothing else.';

/** The FPS is sampled this often while the run is not paused. */
export const METRICS_FPS_SAMPLE_MS = 1000;
/** Only the monsters that did the most damage are sent. */
export const METRICS_DAMAGE_SOURCES = 10;

/** A boss of the run: when it came, when it died (-1 = still alive) and its strongest blow (after armor). */
export interface BossReport {
    name: string;
    spawnMs: number;
    killMs: number;
    maxHit: number;
}

/** What RunMetrics collects during the run; kept in the saved run so Continue does not lose it. */
export interface RunMetricsState {
    /** Cards picked on level up and how many times each ("stat:str", "spellLink:fireBall", ...). */
    cards: Record<string, number>;
    /** Level reached at the end of minute 1, 2, 3... */
    levelByMinute: number[];
    /** Damage taken from each monster (after armor). */
    damageBy: Record<string, number>;
    /** Lowest health reached, in % of the maximum (100 = never hurt). */
    minHpPct: number;
    bosses: BossReport[];
}

/** 'quit' = left to the main menu from the pause (the run stays saved; if it is continued, it sends again). */
export type RunResult = 'win' | 'death' | 'quit';
export type RunDevice = 'mobile' | 'desktop';

/** What the game sends at the end of a run. Kept small: the server rejects anything bigger than MAX_PAYLOAD_BYTES. */
export interface RunReport {
    /** GAME_VERSION ("Phase 14"). */
    version: string;
    map: string;
    character: string;
    device: RunDevice;
    result: RunResult;
    durationMs: number;
    level: number;
    kills: number;
    /** Name of the monster whose blow killed the player (empty on a win). */
    killer: string;
    /** Melee weapon, spell, armor pieces and passives at the end of the run. */
    gear: string[];
    cards: Record<string, number>;
    levelByMinute: number[];
    damageBy: Record<string, number>;
    minHpPct: number;
    bosses: BossReport[];
    potions: number;
    /** Zem used (Fase 20) and critical strikes done (Fase 19): always 0 until those phases. */
    zemUsed: number;
    crits: number;
    /** Mean FPS while playing, and the 10th percentile (how bad the slow moments are). */
    fpsAvg: number;
    fpsLow: number;
    /** The run was saved and continued (cards before that may be missing in old saves). */
    resumed: boolean;
}

export const MAX_PAYLOAD_BYTES = 8192;
