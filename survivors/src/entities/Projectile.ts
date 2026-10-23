// Proyectil reciclable: vuela en línea recta con su animación de efecto hasta chocar con un enemigo
// o recorrer su distancia máxima. Lo crea, mueve y recicla WeaponSystem.
// Si va dirigido a un jefe (Fase 15A), atraviesa a los demás monstruos y solo choca con él: si no, los pequeños que
// lo rodean se comen todos los disparos.
import type Phaser from 'phaser';
import { effectAnimationKey } from '../config/effects';
import { DEPTH_EFFECT_OFFSET } from '../config/gameConfig';
import type { SpellDef } from '../data/spells';
import type { Enemy } from './Enemy';
import type { Poolable } from '../utils/Pool';

export class Projectile implements Poolable {
    public poolIndex = -1;
    public x = 0;
    public y = 0;
    public def!: SpellDef;
    /** Only enemy it can hit while alive (a boss); undefined = the first one it touches. */
    public target: Enemy | undefined;
    /** Multiplies the spell's damage; set (with big numbers) for the shots of an active spell (Fase 20D). */
    public damageScale = 1;
    public fromSkill = false;
    /** Time until the next spark of its trail (def.trail; Lightning Arrow). */
    public trailWaitMs = 0;
    private vx = 0;
    private vy = 0;
    private remaining = 0;
    private readonly sprite: Phaser.GameObjects.Sprite;

    constructor(scene: Phaser.Scene) {
        this.sprite = scene.add.sprite(0, 0, '__DEFAULT').setActive(false).setVisible(false);
    }

    /** Starts flying from (x, y) towards (targetX, targetY), up to `maxDistance` pixels. */
    public launch(def: SpellDef, x: number, y: number, targetX: number, targetY: number, maxDistance: number, target?: Enemy): void {
        this.def = def;
        this.target = target;
        this.damageScale = 1;
        this.fromSkill = false;
        this.trailWaitMs = 0;
        this.x = x;
        this.y = y;
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.hypot(dx, dy) || 1;
        this.vx = (dx / distance) * def.speed;
        this.vy = (dy / distance) * def.speed;
        this.remaining = maxDistance;
        // Directional effects (Fire Ball) show the frames of the flight direction.
        this.sprite.setActive(true).setVisible(true).play(effectAnimationKey(def.flyEffect, dx, dy));
        this.syncDisplay();
    }

    /** Moves the projectile. Returns false once it has used up its distance. */
    public update(deltaMs: number): boolean {
        const seconds = deltaMs / 1000;
        this.x += this.vx * seconds;
        this.y += this.vy * seconds;
        this.remaining -= this.def.speed * seconds;
        this.syncDisplay();
        return this.remaining > 0;
    }

    public deactivate(): void {
        this.sprite.stop().setActive(false).setVisible(false);
        this.target = undefined;
    }

    private syncDisplay(): void {
        this.sprite.setPosition(this.x, this.y).setDepth(this.y + DEPTH_EFFECT_OFFSET);
    }
}
