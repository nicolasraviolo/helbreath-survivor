// Aplica el daño de las armas a los enemigos: resta vida, destello y retroceso (en Enemy), número de daño,
// sonido de golpe o de muerte, y cuenta las muertes.
import type { Enemy } from '../entities/Enemy';
import type { AudioSystem } from './AudioSystem';
import type { DamageNumbers } from './DamageNumbers';
import type { EnemySystem } from './EnemySystem';

export interface AreaHit {
    x: number;
    y: number;
    radius: number;
    /** Damage to every enemy in the area. */
    areaDamage: number;
    /** Enemy hit directly, which also takes `directDamage` (it may be dead or gone already). */
    direct: Enemy | undefined;
    directDamage: number;
    knockback: number;
}

export class CombatSystem {
    private killCount = 0;

    constructor(
        private readonly enemies: EnemySystem,
        private readonly numbers: DamageNumbers,
        private readonly audio: AudioSystem,
    ) {}

    public get kills(): number {
        return this.killCount;
    }

    /** Explosion: every enemy in the circle takes the area damage, the direct target also the direct damage. */
    public hitArea(hit: AreaHit): void {
        const { direct } = hit;
        let directInArea = false;
        this.enemies.forEachInRadius(hit.x, hit.y, hit.radius, (enemy) => {
            const isDirect = enemy === direct;
            directInArea ||= isDirect;
            this.hitEnemy(enemy, hit.areaDamage + (isDirect ? hit.directDamage : 0), hit.x, hit.y, hit.knockback);
        });
        if (direct && !directInArea) {
            this.hitEnemy(direct, hit.directDamage, hit.x, hit.y, hit.knockback);
        }
    }

    /** One hit on one enemy, pushed away from (fromX, fromY). */
    public hitEnemy(enemy: Enemy, damage: number, fromX: number, fromY: number, knockback: number): void {
        if (!enemy.isAlive || damage <= 0) return;
        const killed = enemy.takeDamage(damage, fromX, fromY, knockback);
        this.numbers.show(enemy.x, enemy.bodyY - enemy.def.bodyOffsetY, damage);
        if (killed) {
            this.killCount++;
            this.audio.play(enemy.def.deathSound);
        } else {
            this.audio.play(enemy.def.hitSound);
        }
    }
}
