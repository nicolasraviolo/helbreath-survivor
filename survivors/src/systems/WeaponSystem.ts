// Armas del jugador: les da el contexto cada frame, mueve los proyectiles de los hechizos (con pool), detecta impactos
// y lanza las explosiones (algunas con retraso, como Fire Strike), cuyo daño aplica CombatSystem una sola vez.
// También los tajos cuerpo a cuerpo (animación, estela y daño).
import Phaser from 'phaser';
import { MELEE_ORIGIN_OFFSET_Y } from '../config/gameConfig';
import { SWING_SOUND_MS } from '../data/audio';
import type { EffectKey } from '../config/effects';
import { CAST_SOUND, type SpellBurst, type SpellDef } from '../data/spells';
import { MELEE_HIT_SOUND, MELEE_SWING_SOUND } from '../data/weapons';
import { Effect } from '../entities/Effect';
import type { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Slash } from '../entities/Slash';
import { Pool, type Poolable } from '../utils/Pool';
import type { Weapon, WeaponContext } from '../weapons/Weapon';
import type { AudioSystem } from './AudioSystem';
import type { CombatSystem } from './CombatSystem';
import type { EnemySystem } from './EnemySystem';
import type { ScreenShake } from './ScreenShake';

/** Owner animation asked by a weapon: a melee swing or a cast. */
export type OwnerAction = 'melee' | 'cast';

/** An explosion waiting to be drawn (Fire Strike: 4 explosions 0–140 ms apart). */
class PendingBurst implements Poolable {
    public poolIndex = -1;
    public burst!: SpellBurst;
    public x = 0;
    public y = 0;
    public waitMs = 0;
}

export class WeaponSystem {
    private readonly weapons: Weapon[] = [];
    private readonly projectiles: Pool<Projectile>;
    private readonly effects: Pool<Effect>;
    private readonly finishedProjectiles: Projectile[] = [];
    private readonly finishedEffects: Effect[] = [];
    private readonly context: WeaponContext & { x: number; y: number; cooldownMultiplier: number };
    private readonly slash: Slash;
    private readonly bursts = new Pool(() => new PendingBurst());
    private readonly finishedBursts: PendingBurst[] = [];
    private readonly nearest: Enemy[] = [];
    /** Plays the owner's swing or cast animation (set by the game scene). */
    private onOwnerAction: (action: OwnerAction, angle: number, durationMs: number) => void = () => undefined;

    constructor(
        scene: Phaser.Scene,
        private readonly enemies: EnemySystem,
        private readonly combat: CombatSystem,
        private readonly audio: AudioSystem,
        private readonly screenShake: ScreenShake,
    ) {
        this.projectiles = new Pool(() => new Projectile(scene));
        this.effects = new Pool(() => new Effect(scene));
        this.slash = new Slash(scene);
        this.context = {
            x: 0,
            y: 0,
            cooldownMultiplier: 1,
            audio,
            findNearestEnemy: (maxDistance) => enemies.findNearest(this.context.x, this.context.y, maxDistance),
            findNearestEnemies: (maxDistance, count) => enemies.findNearestSeveral(this.context.x, this.context.y, maxDistance, count, this.nearest),
            launchProjectile: (def, fromX, fromY, toX, toY, maxDistance) => {
                this.projectiles.acquire().launch(def, fromX, fromY, toX, toY, maxDistance);
            },
            castSpell: (angle, durationMs) => {
                this.onOwnerAction('cast', angle, durationMs);
                audio.play(CAST_SOUND, durationMs);
            },
            swingMelee: (def, angle, durationMs) => {
                this.onOwnerAction('melee', angle, durationMs);
                this.slash.show(this.context.x, this.context.y - MELEE_ORIGIN_OFFSET_Y, def.range, angle, Phaser.Math.DegToRad(def.arcDegrees));
            },
            hitMelee: (def, angle) => {
                // As in the original: the swing sound plays when the blow lands (frame 2), squeezed to the attack length.
                audio.play(MELEE_SWING_SOUND, SWING_SOUND_MS);
                const hits = combat.hitArc({
                    damageType: 'physical',
                    x: this.context.x,
                    y: this.context.y - MELEE_ORIGIN_OFFSET_Y,
                    radius: def.range,
                    angle,
                    arc: Phaser.Math.DegToRad(def.arcDegrees),
                    damage: def.damage,
                    knockback: def.knockback,
                }, (enemy) => this.spawnEffect('fx.hit', enemy.x, enemy.bodyY));
                if (hits > 0) audio.play(MELEE_HIT_SOUND);
            },
        };
    }

    public get activeProjectiles(): number {
        return this.projectiles.active.length;
    }

    public add(weapon: Weapon): void {
        this.weapons.push(weapon);
    }

    /** Swaps a weapon for another one in the same place (the melee weapon in hand). */
    public replace(oldWeapon: Weapon, newWeapon: Weapon): void {
        const index = this.weapons.indexOf(oldWeapon);
        if (index >= 0) this.weapons[index] = newWeapon;
        else this.weapons.push(newWeapon);
    }

    /** Plays a one-shot effect (also used for the footstep dust, so it shares the effect pool). */
    public spawnEffect(key: EffectKey, x: number, y: number): void {
        this.effects.acquire().play(key, x, y);
    }

    public setOwnerActionHandler(handler: (action: OwnerAction, angle: number, durationMs: number) => void): void {
        this.onOwnerAction = handler;
    }

    public setCooldownMultiplier(value: number): void {
        this.context.cooldownMultiplier = value;
    }

    /** Fires the weapons from the owner's feet at (x, y), unless `firing` is false (the owner is dead). */
    public update(deltaMs: number, x: number, y: number, firing: boolean): void {
        this.context.x = x;
        this.context.y = y;
        if (firing) {
            for (const weapon of this.weapons) weapon.update(deltaMs, this.context);
        }

        for (const projectile of this.projectiles.active) {
            const stillFlying = projectile.update(deltaMs);
            const hit = this.enemies.findTouching(projectile.x, projectile.y, projectile.def.projectileRadius);
            if (hit || !stillFlying) {
                this.explode(projectile.def, projectile.x, projectile.y, hit);
                projectile.deactivate();
                this.finishedProjectiles.push(projectile);
            }
        }
        this.slash.update(deltaMs);
        for (const pending of this.bursts.active) {
            pending.waitMs -= deltaMs;
            if (pending.waitMs <= 0) {
                this.drawBurst(pending.burst, pending.x, pending.y);
                this.finishedBursts.push(pending);
            }
        }
        for (const pending of this.finishedBursts) this.bursts.release(pending);
        this.finishedBursts.length = 0;
        for (const effect of this.effects.active) {
            if (!effect.update()) this.finishedEffects.push(effect);
        }
        // Released after the loops: releasing reorders `active` while we iterate it.
        for (const projectile of this.finishedProjectiles) this.projectiles.release(projectile);
        for (const effect of this.finishedEffects) this.effects.release(effect);
        this.finishedProjectiles.length = 0;
        this.finishedEffects.length = 0;
    }

    /** Impact: the damage lands once; the explosions are drawn now or after their delay. */
    private explode(def: SpellDef, x: number, y: number, direct: Enemy | undefined): void {
        // The original hit spark on the enemy the spell hits, as with the melee blows.
        if (direct?.isAlive) this.spawnEffect('fx.hit', direct.x, direct.bodyY);
        for (const burst of def.bursts) {
            if (burst.delayMs <= 0) {
                this.drawBurst(burst, x, y);
                continue;
            }
            const pending = this.bursts.acquire();
            pending.burst = burst;
            pending.x = x;
            pending.y = y;
            pending.waitMs = burst.delayMs;
        }
        const critical = this.combat.hitArea({
            damageType: 'magic',
            x,
            y,
            radius: def.areaRadius,
            areaDamage: def.areaDamage,
            direct,
            directDamage: def.directDamage,
            knockback: def.knockback,
        });
        if (critical && def.impactShakePx) this.screenShake.criticalExplosion(def.impactShakePx);
    }

    private drawBurst(burst: SpellBurst, x: number, y: number): void {
        this.effects.acquire().play(burst.effect, x + burst.dx, y + burst.dy);
        if (burst.sound) this.audio.play(burst.sound);
    }
}
