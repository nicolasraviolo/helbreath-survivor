// Gestiona todos los enemigos: un pool por tipo, la rejilla de vecinos, la separación entre ellos
// y los golpes que dan al jugador.
import Phaser from 'phaser';
import { ENEMY_SEPARATION_MAX, ENEMY_SEPARATION_PER_PX, SPATIAL_CELL_SIZE } from '../config/gameConfig';
import { ENEMIES, type EnemyId } from '../data/enemies';
import { Enemy, type EnemyWorld } from '../entities/Enemy';
import { Pool } from '../utils/Pool';
import type { AudioSystem } from './AudioSystem';
import { SpatialGrid } from '../utils/SpatialGrid';

export class EnemySystem {
    private readonly pools = new Map<EnemyId, Pool<Enemy>>();
    private readonly grid = new SpatialGrid<Enemy>(SPATIAL_CELL_SIZE);
    private readonly finished: Enemy[] = [];
    private aliveCount = 0;

    /** Damage of the monster blows that landed on the player during the last update. */
    private landed = 0;
    /** A boss blow was among them (the screen shakes harder). */
    private landedBoss = 0;
    /** Shoots an archer's arrow at the player (set by the game scene). */
    private onShoot: (enemy: Enemy, damage: number) => void = () => undefined;

    constructor(scene: Phaser.Scene, audio: AudioSystem) {
        for (const id of Object.keys(ENEMIES) as EnemyId[]) {
            this.pools.set(id, new Pool(() => new Enemy(scene, ENEMIES[id], audio)));
        }
    }

    public setShootHandler(handler: (enemy: Enemy, damage: number) => void): void {
        this.onShoot = handler;
    }

    /** Strongest blow that landed on the player this frame (monster attacks), or 0. */
    public get landedDamage(): number {
        return this.landed;
    }

    /** True if a boss blow landed on the player this frame. */
    public get landedFromBoss(): boolean {
        return this.landedBoss > 0;
    }

    /** Strongest boss blow that landed this frame, or 0 (to measure the bosses: ?debug=sim). */
    public get landedBossDamage(): number {
        return this.landedBoss;
    }

    public spawn(id: EnemyId, x: number, y: number): Enemy {
        const enemy = this.getPool(id).acquire();
        enemy.spawn(x, y);
        return enemy;
    }

    /** Enemies still chasing (not dying or fading). Counted during the last update. */
    public get alive(): number {
        return this.aliveCount;
    }

    /** Enemy objects created so far, active or waiting in the pools. */
    public get pooled(): number {
        let total = 0;
        for (const pool of this.pools.values()) total += pool.size;
        return total;
    }

    public update(deltaMs: number, world: EnemyWorld): void {
        this.rebuildGrid();
        this.applySeparation();

        this.aliveCount = 0;
        this.landed = 0;
        this.landedBoss = 0;
        for (const pool of this.pools.values()) {
            for (const enemy of pool.active) {
                const finished = enemy.update(deltaMs, world);
                // Several blows in the same frame count as the strongest (the player is then briefly invulnerable).
                this.landed = Math.max(this.landed, enemy.landedDamage);
                if (enemy.def.boss) this.landedBoss = Math.max(this.landedBoss, enemy.landedDamage);
                enemy.landedDamage = 0;
                if (enemy.shotDamage > 0) {
                    this.onShoot(enemy, enemy.shotDamage);
                    enemy.shotDamage = 0;
                }
                if (finished) {
                    this.finished.push(enemy);
                } else if (enemy.isAlive) {
                    this.aliveCount++;
                }
            }
            // Released after the loop: releasing reorders `active` while we iterate it.
            for (const enemy of this.finished) pool.release(enemy);
            this.finished.length = 0;
        }
    }

    /**
     * Moves living enemies farther than `maxDistance` from (x, y) to a new point (usually stuck
     * behind the river or left behind). Returns how many were moved.
     */
    public relocateFarAway(x: number, y: number, maxDistance: number, findPoint: () => { x: number; y: number } | undefined): number {
        let moved = 0;
        const maxSq = maxDistance * maxDistance;
        for (const pool of this.pools.values()) {
            for (const enemy of pool.active) {
                if (!enemy.isAlive) continue;
                const dx = enemy.x - x;
                const dy = enemy.y - y;
                if (dx * dx + dy * dy <= maxSq) continue;
                const point = findPoint();
                if (!point) return moved;
                enemy.x = point.x;
                enemy.y = point.y;
                moved++;
            }
        }
        return moved;
    }

    /** Closest living enemy to (x, y) within `maxDistance`, or undefined. */
    public findNearest(x: number, y: number, maxDistance: number): Enemy | undefined {
        let best: Enemy | undefined;
        let bestSq = maxDistance * maxDistance;
        for (const pool of this.pools.values()) {
            for (const enemy of pool.active) {
                if (!enemy.isAlive) continue;
                const dx = enemy.x - x;
                const dy = enemy.y - y;
                const distSq = dx * dx + dy * dy;
                if (distSq < bestSq) {
                    bestSq = distSq;
                    best = enemy;
                }
            }
        }
        return best;
    }

    /** Up to `count` living enemies within `maxDistance` of (x, y), nearest first, written into `out`. */
    public findNearestSeveral(x: number, y: number, maxDistance: number, count: number, out: Enemy[]): Enemy[] {
        out.length = 0;
        const distances: number[] = [];
        const maxSq = maxDistance * maxDistance;
        for (const pool of this.pools.values()) {
            for (const enemy of pool.active) {
                if (!enemy.isAlive) continue;
                const dx = enemy.x - x;
                const dy = enemy.y - y;
                const distSq = dx * dx + dy * dy;
                if (distSq >= maxSq) continue;
                // Insertion into a short sorted list (count is tiny: 3 for Triple Energy Bolt).
                let i = distances.length;
                while (i > 0 && (distances[i - 1] ?? 0) > distSq) i--;
                if (i >= count) continue;
                distances.splice(i, 0, distSq);
                out.splice(i, 0, enemy);
                if (out.length > count) {
                    out.pop();
                    distances.pop();
                }
            }
        }
        return out;
    }

    /** First living enemy whose body (at its `bodyY`) touches the circle (x, y, radius), or undefined. */
    public findTouching(x: number, y: number, radius: number): Enemy | undefined {
        let found: Enemy | undefined;
        this.grid.forEachNear(x, y, radius + SPATIAL_CELL_SIZE, (enemy) => {
            if (found || !enemy.isAlive) return;
            const reach = radius + enemy.def.radius;
            const dx = enemy.x - x;
            const dy = enemy.bodyY - y;
            if (dx * dx + dy * dy <= reach * reach) found = enemy;
        });
        return found;
    }

    /** Calls `visit` for every living enemy whose body (at its `bodyY`) is inside the circle. */
    public forEachInRadius(x: number, y: number, radius: number, visit: (enemy: Enemy) => void): void {
        this.grid.forEachNear(x, y, radius + SPATIAL_CELL_SIZE, (enemy) => {
            if (!enemy.isAlive) return;
            const reach = radius + enemy.def.radius;
            const dx = enemy.x - x;
            const dy = enemy.bodyY - y;
            if (dx * dx + dy * dy <= reach * reach) visit(enemy);
        });
    }

    /** Visits every living enemy. */
    public forEachAlive(visit: (enemy: Enemy) => void): void {
        for (const pool of this.pools.values()) {
            for (const enemy of pool.active) {
                if (enemy.isAlive) visit(enemy);
            }
        }
    }

    private getPool(id: EnemyId): Pool<Enemy> {
        const pool = this.pools.get(id);
        if (!pool) throw new Error(`No pool for enemy ${id}`);
        return pool;
    }

    private rebuildGrid(): void {
        this.grid.clear();
        for (const pool of this.pools.values()) {
            for (const enemy of pool.active) {
                if (enemy.isAlive) this.grid.insert(enemy);
            }
        }
    }

    /** Pushes overlapping enemies apart so they surround the player instead of stacking. */
    private applySeparation(): void {
        for (const pool of this.pools.values()) {
            for (const enemy of pool.active) {
                enemy.pushX = 0;
                enemy.pushY = 0;
                if (!enemy.isAlive) continue;
                const r = enemy.def.radius;
                this.grid.forEachNear(enemy.x, enemy.y, r * 2, (other) => {
                    if (other === enemy) return;
                    const minDistance = r + other.def.radius;
                    let dx = enemy.x - other.x;
                    let dy = enemy.y - other.y;
                    let distSq = dx * dx + dy * dy;
                    if (distSq >= minDistance * minDistance) return;
                    if (distSq === 0) {
                        // Exactly on top of each other: pick a stable direction from the pool index.
                        dx = enemy.poolIndex % 2 === 0 ? 1 : -1;
                        dy = 0;
                        distSq = 1;
                    }
                    const distance = Math.sqrt(distSq);
                    const strength = (minDistance - distance) * ENEMY_SEPARATION_PER_PX;
                    enemy.pushX += (dx / distance) * strength;
                    enemy.pushY += (dy / distance) * strength;
                });
                const length = Math.hypot(enemy.pushX, enemy.pushY);
                if (length > ENEMY_SEPARATION_MAX) {
                    enemy.pushX = (enemy.pushX / length) * ENEMY_SEPARATION_MAX;
                    enemy.pushY = (enemy.pushY / length) * ENEMY_SEPARATION_MAX;
                }
            }
        }
    }
}
