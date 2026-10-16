// Armas del jugador: les da el contexto cada frame, mueve los proyectiles (con pool), detecta impactos
// y lanza las explosiones, cuyo daño aplica CombatSystem.
import type Phaser from 'phaser';
import type { ProjectileWeaponDef } from '../data/weapons';
import { Effect } from '../entities/Effect';
import type { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
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
    private readonly context: WeaponContext & { x: number; y: number };

    constructor(
        scene: Phaser.Scene,
        private readonly enemies: EnemySystem,
        private readonly combat: CombatSystem,
        private readonly audio: AudioSystem,
    ) {
        this.projectiles = new Pool(() => new Projectile(scene));
        this.effects = new Pool(() => new Effect(scene));
        this.context = {
            x: 0,
            y: 0,
            audio,
            findNearestEnemy: (maxDistance) => enemies.findNearest(this.context.x, this.context.y, maxDistance),
            launchProjectile: (def, fromX, fromY, toX, toY, maxDistance) => {
                this.projectiles.acquire().launch(def, fromX, fromY, toX, toY, maxDistance);
            },
        };
    }

    public get activeProjectiles(): number {
        return this.projectiles.active.length;
    }

    public add(weapon: Weapon): void {
        this.weapons.push(weapon);
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
