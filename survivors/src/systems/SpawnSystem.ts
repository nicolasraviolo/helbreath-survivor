// Hace aparecer enemigos siguiendo la línea de tiempo de data/waves.ts: en cada tramo, los suyos, justo fuera
// del borde de la pantalla y cada vez más rápido; y en su minuto, los eventos (minijefes, jefe final, "te rodean").
// Descarta puntos sobre muros, agua o fuera de la zona de juego.
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

export class SpawnSystem {
    private elapsedMs = 0;
    private timerMs = 0;
    private relocateTimerMs = 0;
    /** Index of the next event of WAVE_EVENTS still to happen. */
    private nextEvent = 0;
    public enabled = true;

    constructor(
        private readonly camera: Phaser.Cameras.Scene2D.Camera,
        private readonly enemies: EnemySystem,
        private readonly map: HBMap,
        private readonly area: Phaser.Geom.Rectangle,
        /** Called when an event happens, with the enemies it created (the boss first). */
        private readonly onEvent: (event: WaveEventDef, spawned: readonly Enemy[]) => void,
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
        this.relocateStragglers(deltaMs);
        this.timerMs -= deltaMs;
        if (this.timerMs > 0) return;
        const wave = this.wave;
        this.timerMs = this.currentInterval() * 1000;
        if (this.enemies.alive < wave.maxAlive) {
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
            const point = this.findSpawnPoint();
            if (!point) continue;
            this.enemies.spawn(pickEnemy(this.wave), point.x, point.y);
            spawned++;
        }
        return spawned;
    }

    /** Debug: moves the clock forward (the events in between happen right away). */
    public skip(ms: number): void {
        this.elapsedMs += ms;
        this.runDueEvents();
    }

    /** Debug: jumps to the next boss event. */
    public skipToNextBoss(): void {
        const next = WAVE_EVENTS.slice(this.nextEvent).find((event) => event.kind !== 'surround');
        if (next) this.skip(Math.max(0, next.atMinute * MS_PER_MINUTE - this.elapsedMs));
    }

    private runDueEvents(): void {
        const minutes = this.elapsedMs / MS_PER_MINUTE;
        let event = WAVE_EVENTS[this.nextEvent];
        while (event && event.atMinute <= minutes) {
            this.nextEvent++;
            this.onEvent(event, this.runEvent(event));
            event = WAVE_EVENTS[this.nextEvent];
        }
    }

    private runEvent(event: WaveEventDef): Enemy[] {
        if (event.kind === 'surround') return this.spawnRing(event.enemy, event.count ?? 0);
        const point = this.findSpawnPoint();
        return point ? [this.enemies.spawn(event.enemy, point.x, point.y)] : [];
    }

    /** A closed ring of enemies around the player (the centre of the camera). */
    private spawnRing(enemy: EnemyId, count: number): Enemy[] {
        const view = this.camera.worldView;
        const spawned: Enemy[] = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = view.centerX + Math.cos(angle) * SPAWN.surroundRadius;
            const y = view.centerY + Math.sin(angle) * SPAWN.surroundRadius;
            if (canStandAt(this.map, this.area, x, y, ENEMY_WALL_HALF_SIZE)) spawned.push(this.enemies.spawn(enemy, x, y));
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

function pickEnemy(wave: WaveDef): EnemyId {
    const total = wave.enemies.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;
    for (const entry of wave.enemies) {
        roll -= entry.weight;
        if (roll < 0) return entry.enemy;
    }
    const first = wave.enemies[0];
    if (!first) throw new Error('A wave in data/waves.ts has no enemies');
    return first.enemy;
}
