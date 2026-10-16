// Armas del jugador: les da el contexto cada frame, mueve los proyectiles (con pool), detecta impactos
// y lanza las explosiones, cuyo daño aplica CombatSystem. También los tajos cuerpo a cuerpo (animación, estela y daño).
import Phaser from 'phaser';
import { MELEE_ORIGIN_OFFSET_Y } from '../config/gameConfig';
import { SWING_SOUND_MS } from '../data/audio';
import type { EffectKey } from '../config/effects';
import { MELEE_HIT_SOUND, MELEE_SWING_SOUND, type ProjectileWeaponDef } from '../data/weapons';
import { Effect } from '../entities/Effect';
import type { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Slash } from '../entities/Slash';
import { Pool } from '../utils/Pool';
import type { Weapon, WeaponContext } from '../weapons/Weapon';
import type { AudioSystem } from './AudioSystem';
import type { CombatSystem } from './CombatSystem';
import type { EnemySystem } from './EnemySystem';

export class WeaponSystem {
    private readonly weapons: Weapon[] = [];
    private readonly projectiles: Pool<Projectile>;
    private readonly effects: Pool<Effect>;
    private readonly finishedProjectiles: Projectile[] = [];
    private readonly finishedEffects: Effect[] = [];
    private readonly context: WeaponContext & { x: number; y: number; cooldownMultiplier: number };
    private readonly slash: Slash;
    /** Plays the owner's melee animation (set by the game scene). */
    private onMeleeSwing: (angle: number, durationMs: number) => void = () => undefined;

    constructor(
        scene: Phaser.Scene,
        private readonly enemies: EnemySystem,
        private readonly combat: CombatSystem,
        private readonly audio: AudioSystem,
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
            launchProjectile: (def, fromX, fromY, toX, toY, maxDistance) => {
                this.projectiles.acquire().launch(def, fromX, fromY, toX, toY, maxDistance);
            },
            swingMelee: (def, angle, durationMs) => {
                this.onMeleeSwing(angle, durationMs);
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
                });
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

    public setMeleeSwingHandler(handler: (angle: number, durationMs: number) => void): void {
        this.onMeleeSwing = handler;
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
        for (const effect of this.effects.active) {
            if (!effect.update()) this.finishedEffects.push(effect);
        }
        // Released after the loops: releasing reorders `active` while we iterate it.
        for (const projectile of this.finishedProjectiles) this.projectiles.release(projectile);
        for (const effect of this.finishedEffects) this.effects.release(effect);
        this.finishedProjectiles.length = 0;
        this.finishedEffects.length = 0;
    }

    private explode(def: ProjectileWeaponDef, x: number, y: number, direct: Enemy | undefined): void {
        this.effects.acquire().play(def.explodeEffect, x, y);
        this.audio.play(def.impactSound);
        this.combat.hitArea({
            damageType: def.damageType,
            x,
            y,
            radius: def.areaRadius,
            areaDamage: def.areaDamage,
            direct,
            directDamage: def.directDamage,
            knockback: def.knockback,
        });
    }
}
