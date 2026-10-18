// Aplica el daño de las armas a los enemigos (explosiones en círculo y tajos en arco): lo escala con los stats del jugador (Str o Mag), tira el crítico (Chr),
// resta vida, destello y retroceso (en Enemy), número de daño, chispas o polvo (Fase 10), sonido de golpe o de muerte, y cuenta las muertes.
import Phaser from 'phaser';
import { CRIT_DAMAGE_MULTIPLIER } from '../data/stats';
import type { CharacterStats, DamageType } from '../entities/CharacterStats';
import type { Enemy } from '../entities/Enemy';
import type { SoundKey } from '../config/assetManifest';
import type { AudioSystem } from './AudioSystem';
import type { DamageNumbers } from './DamageNumbers';
import type { HitParticles } from './HitParticles';
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

export interface ArcHit {
    damageType: DamageType;
    /** Centre of the swing. */
    x: number;
    y: number;
    radius: number;
    /** Direction of the swing in radians, and its full width. */
    angle: number;
    arc: number;
    damage: number;
    knockback: number;
}

/** Enemies this close to the centre are hit whatever the angle (they are on top of the player). */
const ARC_ALWAYS_HIT_PX = 14;

export class CombatSystem {
    private killCount = 0;

    constructor(
        private readonly enemies: EnemySystem,
        private readonly numbers: DamageNumbers,
        private readonly audio: AudioSystem,
        private readonly particles: HitParticles,
        private readonly attacker: CharacterStats,
        /** Called once per enemy killed by a weapon (drops its XP gem). */
        private readonly onKill: (enemy: Enemy) => void,
    ) {}

    public get kills(): number {
        return this.killCount;
    }

    /** Continue (saved run): the count goes on from there. */
    public restoreKills(count: number): void {
        this.killCount = count;
    }

    /**
     * Explosion: every enemy in the circle takes the area damage, the direct target also the direct damage.
     * Returns true if the main hit (the direct target, or else the first enemy hit) was critical.
     */
    public hitArea(hit: AreaHit): boolean {
        const { direct } = hit;
        let directInArea = false;
        let mainCritical: boolean | undefined;
        this.enemies.forEachInRadius(hit.x, hit.y, hit.radius, (enemy) => {
            const isDirect = enemy === direct;
            directInArea ||= isDirect;
            const critical = this.hitEnemy(enemy, hit.damageType, hit.areaDamage + (isDirect ? hit.directDamage : 0), hit.x, hit.y, hit.knockback);
            if (isDirect || (!direct && mainCritical === undefined)) mainCritical = critical;
        });
        if (direct && !directInArea) {
            mainCritical = this.hitEnemy(direct, hit.damageType, hit.directDamage, hit.x, hit.y, hit.knockback);
        }
        return mainCritical ?? false;
    }

    /** Melee swing: every enemy inside the circle sector takes the damage (`onHit` for each). Returns how many were hit. */
    public hitArc(hit: ArcHit, onHit?: (enemy: Enemy) => void): number {
        const halfArc = hit.arc / 2;
        let count = 0;
        this.enemies.forEachInRadius(hit.x, hit.y, hit.radius, (enemy) => {
            const dx = enemy.x - hit.x;
            const dy = enemy.bodyY - hit.y;
            const inside = dx * dx + dy * dy <= ARC_ALWAYS_HIT_PX * ARC_ALWAYS_HIT_PX
                || Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - hit.angle)) <= halfArc;
            if (!inside) return;
            count++;
            onHit?.(enemy);
            this.hitEnemy(enemy, hit.damageType, hit.damage, hit.x, hit.y, hit.knockback);
        });
        return count;
    }

    /** Kills one enemy outright, as if hit (debug: ?debug=bosskill). */
    public slay(enemy: Enemy): void {
        if (!enemy.kill()) return;
        this.killCount++;
        this.particles.death(enemy.x, enemy.y, enemy.bodyY);
        this.audio.play(enemy.def.deathSound);
        this.onKill(enemy);
    }

    /**
     * Kills every living enemy at once (the final boss is dead), or only those inside `area` (debug key K): they count
     * as kills and `onEach` drops their XP (by default, what a normal kill does: XP, drops, boss chests).
     * Each kind's death cry plays only once, so hundreds of deaths don't flood the sound.
     */
    public killAll(onEach: (enemy: Enemy) => void = this.onKill, area?: Phaser.Geom.Rectangle): void {
        const cries = new Set<SoundKey>();
        this.enemies.forEachAlive((enemy) => {
            if (area && !area.contains(enemy.x, enemy.y)) return;
            if (!enemy.kill()) return;
            this.killCount++;
            this.particles.death(enemy.x, enemy.y, enemy.bodyY);
            cries.add(enemy.def.deathSound);
            onEach(enemy);
        });
        for (const cry of cries) this.audio.play(cry);
    }

    /** One hit on one enemy, pushed away from (fromX, fromY). `baseDamage` is scaled by the attacker's stats. Returns true on a critical hit. */
    public hitEnemy(enemy: Enemy, type: DamageType, baseDamage: number, fromX: number, fromY: number, knockback: number): boolean {
        if (!enemy.isAlive || baseDamage <= 0) return false;
        const critical = Math.random() < this.attacker.critChance;
        const scaled = baseDamage * this.attacker.damageMultiplier(type) * (critical ? CRIT_DAMAGE_MULTIPLIER : 1);
        const damage = Math.max(1, Math.round(scaled));
        const killed = enemy.takeDamage(damage, fromX, fromY, knockback);
        this.numbers.show(enemy.x, enemy.bodyY - enemy.def.bodyOffsetY, damage, critical);
        if (killed) {
            this.killCount++;
            this.particles.death(enemy.x, enemy.y, enemy.bodyY);
            this.audio.play(enemy.def.deathSound);
            this.onKill(enemy);
        } else {
            this.particles.hit(enemy.x, enemy.bodyY, fromX, fromY);
            this.audio.play(enemy.def.hitSound);
        }
        return critical;
    }
}
