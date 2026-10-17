// Jefes vivos (minijefes y jefe final): los recuerda mientras viven, hace que los que tienen ataque a distancia
// lancen sus proyectiles y dice qué jefe mostrar en la barra grande y qué música toca.
import type { EnemyId, EnemyRangedAttack } from '../data/enemies';
import type { Enemy } from '../entities/Enemy';
import type { EnemyProjectileSystem } from './EnemyProjectileSystem';

export type BossMusic = 'none' | 'miniBoss' | 'finalBoss';

export class BossSystem {
    private readonly bosses: Enemy[] = [];
    /** Time until each boss may throw again. */
    private readonly cooldowns = new Map<Enemy, number>();
    /** Name of each boss, for the saved run. */
    private readonly ids = new Map<Enemy, EnemyId>();

    constructor(private readonly projectiles: EnemyProjectileSystem) {}

    public track(enemy: Enemy, id: EnemyId): void {
        if (!enemy.def.boss || this.bosses.includes(enemy)) return;
        this.bosses.push(enemy);
        this.ids.set(enemy, id);
        this.cooldowns.set(enemy, enemy.def.boss.ranged?.cooldownMs ?? 0);
    }

    /** The boss for the big health bar: the final boss if it is alive, otherwise the oldest one. */
    public get shown(): Enemy | undefined {
        return this.bosses.find((boss) => boss.def.boss?.final) ?? this.bosses[0];
    }

    /** Bosses alive now, by name (for the saved run). */
    public get aliveIds(): EnemyId[] {
        return this.bosses.flatMap((boss) => {
            const id = this.ids.get(boss);
            return id && boss.isAlive ? [id] : [];
        });
    }

    public get music(): BossMusic {
        if (this.bosses.some((boss) => boss.def.boss?.final)) return 'finalBoss';
        return this.bosses.length > 0 ? 'miniBoss' : 'none';
    }

    /** Forgets dead bosses and lets the living ones throw at the player's body (x, y). */
    public update(deltaMs: number, playerX: number, playerBodyY: number, canAttack: boolean): void {
        for (let i = this.bosses.length - 1; i >= 0; i--) {
            const boss = this.bosses[i];
            if (!boss) continue;
            // Pooled enemies are reused: once it is not alive it is no longer "this" boss.
            if (!boss.isAlive) {
                this.bosses.splice(i, 1);
                this.cooldowns.delete(boss);
                this.ids.delete(boss);
                continue;
            }
            const ranged = boss.def.boss?.ranged;
            if (ranged && canAttack) this.updateRanged(boss, ranged, deltaMs, playerX, playerBodyY);
        }
    }

    private updateRanged(boss: Enemy, ranged: EnemyRangedAttack, deltaMs: number, targetX: number, targetY: number): void {
        const left = (this.cooldowns.get(boss) ?? 0) - deltaMs;
        if (left > 0) {
            this.cooldowns.set(boss, left);
            return;
        }
        const dx = targetX - boss.x;
        const dy = targetY - boss.bodyY;
        if (dx * dx + dy * dy > ranged.range * ranged.range) {
            this.cooldowns.set(boss, 0);
            return;
        }
        this.projectiles.throwAt(ranged, boss.x, boss.bodyY, targetX, targetY, 0, true);
        this.cooldowns.set(boss, ranged.cooldownMs);
    }
}
