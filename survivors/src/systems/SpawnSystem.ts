// Hace aparecer enemigos siguiendo la línea de tiempo de data/waves.ts: en cada tramo, los suyos, justo fuera
// del borde de la pantalla y cada vez más rápido; y en su minuto, los eventos (minijefes, jefe final, "te rodean",
// estampida: un bloque de monstruos que cruza la pantalla en línea recta).
// Descarta puntos sobre muros, agua o fuera de la zona de juego.
// Fase 13: desde que sale el jefe final no salen más monstruos de las oleadas (solo los esbirros que llama él).
// Los monstruos se descargan por oleadas (AssetStreamer): uno que aún no está listo no aparece, y un evento cuyo
// monstruo no está listo espera (normalmente unos segundos como mucho) a que lo esté.
// Un jefe nunca se pierde: si no hay sitio libre fuera de la pantalla, se busca más cerca del jugador, y si aun así
// no hay, su evento sigue pendiente y se reintenta en el siguiente fotograma.
import Phaser from 'phaser';
import { ENEMY_WALL_HALF_SIZE } from '../config/gameConfig';
import type { EnemyId } from '../data/enemies';
import { SPAWN, WAVE_EVENTS, WAVES, type WaveDef, type WaveEventDef } from '../data/waves';
import type { Enemy } from '../entities/Enemy';
import type { HBMap } from '../hb/HBMap';
import { canStandAt } from '../utils/collision';
import type { EnemySystem } from './EnemySystem';

const MAX_ATTEMPTS = 12;
const MS_PER_MINUTE = 60000;
/** Boss fallback search: rings from the spawn ring towards the player, and points tried on each one. */
const FALLBACK_RINGS = 8;
const FALLBACK_POINTS_PER_RING = 16;

export class SpawnSystem {
    private elapsedMs = 0;
    private timerMs = 0;
    private relocateTimerMs = 0;
    /** Index of the next event of WAVE_EVENTS still to happen. */
    private nextEvent = 0;
    /** Continue: bosses that were alive, brought back when the calm ends. */
    private bossesToReturn: EnemyId[] = [];
    /** The final boss has appeared: the waves are over. */
    private wavesOver = false;
    /** Debug: an event waiting for its monster to download (runFirstEvent). */
    private debugEvent: WaveEventDef | undefined;
    public enabled = true;

    constructor(
        private readonly camera: Phaser.Cameras.Scene2D.Camera,
        private readonly enemies: EnemySystem,
        private readonly map: HBMap,
        private readonly area: Phaser.Geom.Rectangle,
        /** Called when an event happens, with the enemies it created (the boss first). */
        private readonly onEvent: (event: WaveEventDef, spawned: readonly Enemy[]) => void,
        /** False while a monster's sprite is still downloading. */
        private readonly isReady: (id: EnemyId) => boolean,
        /** Asks for a monster to be loaded first (its event is due). */
        private readonly hurry: (id: EnemyId) => void,
    ) {}

    /** Run time in milliseconds. */
    public get elapsed(): number {
        return this.elapsedMs;
    }

    /** The wave playing now. */
    public get wave(): WaveDef {
        const minutes = this.elapsedMs / MS_PER_MINUTE;
        let current = WAVES[0];
        for (const wave of WAVES) {
            if (wave.fromMinute <= minutes) current = wave;
        }
        if (!current) throw new Error('data/waves.ts has no waves');
        return current;
    }

    public get waveNumber(): number {
        return WAVES.indexOf(this.wave) + 1;
    }

    public update(deltaMs: number): void {
        if (!this.enabled) return;
        this.elapsedMs += deltaMs;
        this.runDueEvents();
        this.runDebugEvent();
        this.relocateStragglers(deltaMs);
        this.timerMs -= deltaMs;
        if (this.timerMs > 0) return;
        this.returnBosses();
        const wave = this.wave;
        this.timerMs = this.currentInterval() * 1000;
        // Con un jefe vivo no sale nadie de las oleadas: el jugador limpia la pantalla y se centra en él.
        if (!this.wavesOver && !this.enemies.bossAlive && this.enemies.alive < wave.maxAlive) {
            this.spawnMany(wave.batchSize);
        }
    }

    /** Seconds between spawn events right now: goes from the wave's start interval to its end interval. */
    public currentInterval(): number {
        const wave = this.wave;
        const next = WAVES[WAVES.indexOf(wave) + 1];
        if (!next) return wave.endInterval;
        const minutes = this.elapsedMs / MS_PER_MINUTE;
        const t = Phaser.Math.Clamp((minutes - wave.fromMinute) / (next.fromMinute - wave.fromMinute), 0, 1);
        return Phaser.Math.Linear(wave.startInterval, wave.endInterval, t);
    }

    public spawnMany(count: number): number {
        let spawned = 0;
        for (let i = 0; i < count; i++) {
            const enemy = pickEnemy(this.wave, this.isReady);
            const point = enemy && this.findSpawnPoint();
            if (!enemy || !point) continue;
            this.enemies.spawn(enemy, point.x, point.y);
            spawned++;
        }
        return spawned;
    }

    /**
     * Continue (saved run): the clock goes on from `elapsedMs`; the events before it already happened, and nothing
     * appears for `calmMs`. Then the bosses that were alive come back (with their warning) and the wave goes on.
     */
    public resumeAt(elapsedMs: number, calmMs: number, bosses: readonly EnemyId[]): void {
        this.elapsedMs = elapsedMs;
        const minutes = elapsedMs / MS_PER_MINUTE;
        this.nextEvent = WAVE_EVENTS.findIndex((event) => event.atMinute > minutes);
        if (this.nextEvent < 0) this.nextEvent = WAVE_EVENTS.length;
        this.wavesOver = WAVE_EVENTS.some((event) => event.kind === 'finalBoss' && event.atMinute <= minutes);
        this.timerMs = calmMs;
        this.bossesToReturn = [...bosses];
    }

    /** Continue: bosses still waiting for the calm to end (they count as alive when saving again). */
    public get bossesWaiting(): readonly EnemyId[] {
        return this.bossesToReturn;
    }

    private returnBosses(): void {
        const minutes = this.elapsedMs / MS_PER_MINUTE;
        const waiting: EnemyId[] = [];
        for (const id of this.bossesToReturn) {
            // Its sprite may still be downloading right after loading the game: it comes with a later spawn.
            if (!this.isReady(id)) {
                this.hurry(id);
                waiting.push(id);
                continue;
            }
            // Its own event, for the warning (the last one with this monster that already happened).
            const event = [...WAVE_EVENTS].reverse().find((e) => e.enemy === id && isBossEvent(e) && e.atMinute <= minutes);
            const point = this.findBossPoint();
            // No room anywhere yet: it tries again with the next spawn.
            if (!point) {
                waiting.push(id);
                continue;
            }
            const boss = this.enemies.spawn(id, point.x, point.y);
            if (event) this.onEvent(event, [boss]);
        }
        this.bossesToReturn = waiting;
    }

    /** Debug: moves the clock forward (the events in between happen right away). */
    public skip(ms: number): void {
        this.elapsedMs += ms;
        this.runDueEvents();
    }

    /** Debug: jumps to the next boss event (or to the final boss's one). */
    public skipToNextBoss(finalOnly = false): void {
        const next = WAVE_EVENTS.slice(this.nextEvent).find((event) => (finalOnly ? event.kind === 'finalBoss' : isBossEvent(event)));
        if (next) this.skip(Math.max(0, next.atMinute * MS_PER_MINUTE - this.elapsedMs));
    }

    /** Debug: runs the first event of this kind out of the timeline, as soon as its monster is downloaded. */
    public runFirstEvent(kind: WaveEventDef['kind']): void {
        this.debugEvent = WAVE_EVENTS.find((e) => e.kind === kind);
        this.runDebugEvent();
    }

    private runDebugEvent(): void {
        const event = this.debugEvent;
        if (!event) return;
        if (!this.isReady(event.enemy)) {
            this.hurry(event.enemy);
            return;
        }
        const spawned = this.runEvent(event);
        if (!spawned) return;
        this.debugEvent = undefined;
        this.onEvent(event, spawned);
    }

    private runDueEvents(): void {
        const minutes = this.elapsedMs / MS_PER_MINUTE;
        let event = WAVE_EVENTS[this.nextEvent];
        while (event && event.atMinute <= minutes) {
            if (!this.isReady(event.enemy)) {
                this.hurry(event.enemy);
                return;
            }
            // A boss with no room to appear yet: the event stays pending and is tried again next frame.
            const spawned = this.runEvent(event);
            if (!spawned) return;
            this.nextEvent++;
            this.onEvent(event, spawned);
            event = WAVE_EVENTS[this.nextEvent];
        }
    }

    /** Runs an event; undefined when it is a boss that found no room to appear (the caller tries again later). */
    private runEvent(event: WaveEventDef): Enemy[] | undefined {
        if (event.kind === 'surround') {
            const view = this.camera.worldView;
            return this.spawnRing([event.enemy], event.count ?? 0, view.centerX, view.centerY, SPAWN.surroundRadius);
        }
        if (event.kind === 'stampede') return this.spawnStampede(event.enemy, event.count ?? 0);
        const point = this.findBossPoint();
        if (!point) return undefined;
        // The waves stop only once the final boss is really on the map.
        if (event.kind === 'finalBoss') this.wavesOver = true;
        return [this.enemies.spawn(event.enemy, point.x, point.y)];
    }

    /**
     * Where a boss appears: on the usual spawn ring if possible; if not (walls or water all around the screen edge),
     * on rings closer and closer to the player, so it always finds a place unless the whole screen is blocked.
     */
    private findBossPoint(): { x: number; y: number } | undefined {
        const point = this.findSpawnPoint();
        if (point) return point;
        const view = this.camera.worldView;
        const outer = Math.hypot(view.width, view.height) / 2 + SPAWN.offscreenMargin;
        const turn = Math.random() * Math.PI * 2;
        for (let ring = 0; ring < FALLBACK_RINGS; ring++) {
            const radius = outer * (1 - ring / FALLBACK_RINGS);
            for (let i = 0; i < FALLBACK_POINTS_PER_RING; i++) {
                const angle = turn + (i / FALLBACK_POINTS_PER_RING) * Math.PI * 2;
                const x = view.centerX + Math.cos(angle) * radius;
                const y = view.centerY + Math.sin(angle) * radius;
                if (canStandAt(this.map, this.area, x, y, ENEMY_WALL_HALF_SIZE)) return { x, y };
            }
        }
        return undefined;
    }

    /**
     * A closed ring of `count` enemies around (x, y), each one picked at random among `enemies` (those already
     * downloaded). Used by "surround" events (around the player) and by bosses calling their minions.
     */
    public spawnRing(enemies: readonly EnemyId[], count: number, x: number, y: number, radius: number): Enemy[] {
        const ready = enemies.filter((id) => this.isReady(id));
        const spawned: Enemy[] = [];
        if (ready.length === 0) return spawned;
        const turn = Math.random() * Math.PI * 2;
        for (let i = 0; i < count; i++) {
            const angle = turn + (i / count) * Math.PI * 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            const id = ready[Math.floor(Math.random() * ready.length)];
            if (id && canStandAt(this.map, this.area, px, py, ENEMY_WALL_HALF_SIZE)) spawned.push(this.enemies.spawn(id, px, py));
        }
        return spawned;
    }

    /**
     * Stampede: a block of monsters off a random side of the screen, in line with the player, that runs straight across
     * to the other side (SPAWN.stampede).
     */
    private spawnStampede(id: EnemyId, count: number): Enemy[] {
        const { rows, spacing, speedFactor } = SPAWN.stampede;
        const view = this.camera.worldView;
        const margin = SPAWN.offscreenMargin;
        // Direction of the run: one of the four sides, towards the opposite one.
        const side = Math.floor(Math.random() * 4);
        const dirX = side === 0 ? 1 : side === 1 ? -1 : 0;
        const dirY = side === 2 ? 1 : side === 3 ? -1 : 0;
        const startX = dirX > 0 ? view.x - margin : dirX < 0 ? view.right + margin : view.centerX;
        const startY = dirY > 0 ? view.y - margin : dirY < 0 ? view.bottom + margin : view.centerY;
        // It crosses the screen plus both margins and its own depth.
        const travel = (dirX !== 0 ? view.width : view.height) + margin * 2 + rows * spacing;
        const perRow = Math.ceil(count / rows);
        const spawned: Enemy[] = [];
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / perRow);
            const across = ((i % perRow) - (perRow - 1) / 2) * spacing;
            // Rows go backwards from the edge; across the line, a little jitter so it doesn't look like a grid.
            const back = row * spacing;
            const jitter = (Math.random() - 0.5) * spacing * 0.5;
            const x = startX - dirX * back + (dirX === 0 ? across : jitter);
            const y = startY - dirY * back + (dirY === 0 ? across : jitter);
            if (!canStandAt(this.map, this.area, x, y, ENEMY_WALL_HALF_SIZE)) continue;
            const enemy = this.enemies.spawn(id, x, y);
            enemy.charge(dirX, dirY, speedFactor, (travel / (enemy.speedPxPerSecond * speedFactor)) * 1000);
            spawned.push(enemy);
        }
        return spawned;
    }

    /** Every so often, enemies too far from the screen reappear on the spawn ring. */
    private relocateStragglers(deltaMs: number): void {
        this.relocateTimerMs -= deltaMs;
        if (this.relocateTimerMs > 0) return;
        this.relocateTimerMs = SPAWN.relocateEveryMs;
        const view = this.camera.worldView;
        const maxDistance = (Math.hypot(view.width, view.height) / 2) * SPAWN.relocateDistanceFactor;
        this.enemies.relocateFarAway(view.centerX, view.centerY, maxDistance, () => this.findSpawnPoint());
    }

    /**
     * Random point just outside the edge of the visible screen (on its rectangle, not on a circle through the corners:
     * monsters walk slowly, as in the original, so they must appear close), on walkable ground.
     */
    private findSpawnPoint(): { x: number; y: number } | undefined {
        const view = this.camera.worldView;
        const margin = SPAWN.offscreenMargin;
        const width = view.width + margin * 2;
        const height = view.height + margin * 2;
        const left = view.x - margin;
        const top = view.y - margin;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            // A point along the rectangle's perimeter, each side as likely as its length.
            let along = Math.random() * (width + height) * 2;
            let x: number;
            let y: number;
            if (along < width) {
                x = left + along;
                y = top;
            } else if ((along -= width) < height) {
                x = left + width;
                y = top + along;
            } else if ((along -= height) < width) {
                x = left + width - along;
                y = top + height;
            } else {
                x = left;
                y = top + height - (along - width);
            }
            if (canStandAt(this.map, this.area, x, y, ENEMY_WALL_HALF_SIZE)) {
                return { x, y };
            }
        }
        return undefined;
    }
}

/** Events that bring a boss (not the surround and stampede ones). */
function isBossEvent(event: WaveEventDef): boolean {
    return event.kind === 'boss' || event.kind === 'finalBoss';
}

/** A random enemy of the wave by weight, among those already loaded; undefined if none is ready yet. */
function pickEnemy(wave: WaveDef, isReady: (id: EnemyId) => boolean): EnemyId | undefined {
    const ready = wave.enemies.filter((entry) => isReady(entry.enemy));
    const total = ready.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;
    for (const entry of ready) {
        roll -= entry.weight;
        if (roll < 0) return entry.enemy;
    }
    return ready[0]?.enemy;
}
