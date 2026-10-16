// Aplica el daño de las armas a los enemigos: lo escala con los stats del jugador (Str o Mag), tira el crítico (Chr),
// resta vida, destello y retroceso (en Enemy), número de daño, sonido de golpe o de muerte, y cuenta las muertes.
import { CRIT_DAMAGE_MULTIPLIER } from '../data/stats';
import type { CharacterStats, DamageType } from '../entities/CharacterStats';
import type { Enemy } from '../entities/Enemy';
import type { AudioSystem } from './AudioSystem';
import type { DamageNumbers } from './DamageNumbers';
import type { EnemySystem } from './EnemySystem';

export interface AreaHit {
    damageType: DamageType;
    x: number;
    y: number;
    radius: number;
    /** Base damage to every enemy in the area. */
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
        private readonly attacker: CharacterStats,
        /** Called once per enemy killed by a weapon (drops its XP gem). */
        private readonly onKill: (enemy: Enemy) => void,
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
            this.hitEnemy(enemy, hit.damageType, hit.areaDamage + (isDirect ? hit.directDamage : 0), hit.x, hit.y, hit.knockback);
        });
        if (direct && !directInArea) {
            this.hitEnemy(direct, hit.damageType, hit.directDamage, hit.x, hit.y, hit.knockback);
        }
    }

    /** One hit on one enemy, pushed away from (fromX, fromY). `baseDamage` is scaled by the attacker's stats. */
    public hitEnemy(enemy: Enemy, type: DamageType, baseDamage: number, fromX: number, fromY: number, knockback: number): void {
        if (!enemy.isAlive || baseDamage <= 0) return;
        const critical = Math.random() < this.attacker.critChance;
        const scaled = baseDamage * this.attacker.damageMultiplier(type) * (critical ? CRIT_DAMAGE_MULTIPLIER : 1);
        const damage = Math.max(1, Math.round(scaled));
        const killed = enemy.takeDamage(damage, fromX, fromY, knockback);
        this.numbers.show(enemy.x, enemy.bodyY - enemy.def.bodyOffsetY, damage, critical);
        if (killed) {
            this.killCount++;
            this.audio.play(enemy.def.deathSound);
            this.onKill(enemy);
        } else {
            this.audio.play(enemy.def.hitSound);
        }
    }
}
