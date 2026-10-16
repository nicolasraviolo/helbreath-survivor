// Hace aparecer enemigos en un anillo justo fuera de la pantalla, cada vez más rápido.
// Descarta puntos sobre muros, agua o fuera de la zona de juego.
import Phaser from 'phaser';
import { ENEMY_WALL_HALF_SIZE } from '../config/gameConfig';
import type { EnemyId } from '../data/enemies';
import { SPAWN } from '../data/spawn';
import type { HBMap } from '../hb/HBMap';
import { canStandAt } from '../utils/collision';
import type { EnemySystem } from './EnemySystem';

const MAX_ATTEMPTS = 12;
const TOTAL_WEIGHT = SPAWN.table.reduce((sum, entry) => sum + entry.weight, 0);

export class SpawnSystem {
    private elapsedMs = 0;
    private timerMs = 0;
    private relocateTimerMs = 0;
    public enabled = true;

    constructor(
        private readonly camera: Phaser.Cameras.Scene2D.Camera,
        private readonly enemies: EnemySystem,
        private readonly map: HBMap,
        private readonly area: Phaser.Geom.Rectangle,
    ) {}

    /** Run time in milliseconds, used for the spawn ramp. */
    public get elapsed(): number {
        return this.elapsedMs;
    }

    public update(deltaMs: number): void {
        if (!this.enabled) return;
        this.elapsedMs += deltaMs;
        this.relocateStragglers(deltaMs);
        this.timerMs -= deltaMs;
        if (this.timerMs > 0) return;
        this.timerMs = this.currentInterval() * 1000;
        if (this.enemies.alive < SPAWN.maxAlive) {
            this.spawnMany(SPAWN.batchSize);
        }
    }

    /** Seconds between spawn events right now: linear ramp from initial to minimum. */
    public currentInterval(): number {
        const t = Math.min(1, this.elapsedMs / 1000 / SPAWN.rampSeconds);
        return Phaser.Math.Linear(SPAWN.initialInterval, SPAWN.minInterval, t);
    }

    public spawnMany(count: number): number {
        let spawned = 0;
        for (let i = 0; i < count; i++) {
            const point = this.findSpawnPoint();
            if (!point) continue;
            this.enemies.spawn(pickEnemy(), point.x, point.y);
            spawned++;
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

    /** Random point on a circle just outside the visible screen, on walkable ground. */
    private findSpawnPoint(): { x: number; y: number } | undefined {
        const view = this.camera.worldView;
        const radius = Math.hypot(view.width, view.height) / 2 + SPAWN.offscreenMargin;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const x = view.centerX + Math.cos(angle) * radius;
            const y = view.centerY + Math.sin(angle) * radius;
            if (canStandAt(this.map, this.area, x, y, ENEMY_WALL_HALF_SIZE)) {
                return { x, y };
            }
        }
        return undefined;
    }
}

function pickEnemy(): EnemyId {
    let roll = Math.random() * TOTAL_WEIGHT;
    for (const entry of SPAWN.table) {
        roll -= entry.weight;
        if (roll < 0) return entry.enemy;
    }
    return SPAWN.table[0].enemy;
}
