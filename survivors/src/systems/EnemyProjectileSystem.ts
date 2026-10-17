// Proyectiles de los enemigos (las bolas de fuego del Fire Wyvern y las flechas del Dark Elf). Vuelan en línea recta hacia donde estaba el
// jugador; si lo tocan le hacen daño (la armadura y el Defense Shield lo reducen en GameScene) y explotan.
// Se reciclan con un pool (regla 5). Usan los mismos efectos que el Fire Ball de la Maga.
import type Phaser from 'phaser';
import { effectAnimationKey, type EffectKey } from '../config/effects';
import { DEPTH_EFFECT_OFFSET } from '../config/gameConfig';
import type { EnemyRangedAttack } from '../data/enemies';
import { Pool, type Poolable } from '../utils/Pool';
import type { AudioSystem } from './AudioSystem';

class EnemyProjectile implements Poolable {
    public poolIndex = -1;
    public x = 0;
    public y = 0;
    public attack!: EnemyRangedAttack;
    public damage = 0;
    private vx = 0;
    private vy = 0;
    private remaining = 0;
    private readonly sprite: Phaser.GameObjects.Sprite;

    constructor(scene: Phaser.Scene) {
        this.sprite = scene.add.sprite(0, 0, '__DEFAULT').setActive(false).setVisible(false);
    }

    public launch(attack: EnemyRangedAttack, damage: number, x: number, y: number, angle: number): void {
        this.attack = attack;
        this.damage = damage;
        this.x = x;
        this.y = y;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        this.vx = dx * attack.speed;
        this.vy = dy * attack.speed;
        this.remaining = attack.range * 1.5;
        this.sprite.setActive(true).setVisible(true).play(effectAnimationKey(attack.flyEffect, dx, dy));
        this.sync();
    }

    /** Returns false once it has flown its whole distance. */
    public update(deltaMs: number): boolean {
        const seconds = deltaMs / 1000;
        this.x += this.vx * seconds;
        this.y += this.vy * seconds;
        this.remaining -= this.attack.speed * seconds;
        this.sync();
        return this.remaining > 0;
    }

    public deactivate(): void {
        this.sprite.stop().setActive(false).setVisible(false);
    }

    private sync(): void {
        this.sprite.setPosition(this.x, this.y).setDepth(this.y + DEPTH_EFFECT_OFFSET);
    }
}

export class EnemyProjectileSystem {
    private readonly projectiles: Pool<EnemyProjectile>;
    private readonly finished: EnemyProjectile[] = [];

    constructor(
        scene: Phaser.Scene,
        private readonly audio: AudioSystem,
        /** Plays the explosion (shared effect pool). */
        private readonly spawnEffect: (key: EffectKey, x: number, y: number) => void,
    ) {
        this.projectiles = new Pool(() => new EnemyProjectile(scene));
    }

    public get active(): number {
        return this.projectiles.active.length;
    }

    /**
     * Throws `attack.shots` projectiles from (x, y) towards (targetX, targetY), fanned over its spread.
     * `damage` is used when the attack has no fixed damage of its own (arrows use the archer's dice).
     */
    public throwAt(attack: EnemyRangedAttack, x: number, y: number, targetX: number, targetY: number, damage = 0): void {
        const centre = Math.atan2(targetY - y, targetX - x);
        const spread = (attack.spreadDegrees * Math.PI) / 180;
        for (let i = 0; i < attack.shots; i++) {
            const offset = attack.shots > 1 ? (i / (attack.shots - 1) - 0.5) * spread : 0;
            this.projectiles.acquire().launch(attack, attack.damage ?? damage, x, y, centre + offset);
        }
    }

    /**
     * Moves the projectiles; one touching the player's body at (bodyX, bodyY) explodes and its damage is returned
     * (the sum if several hit this frame).
     */
    public update(deltaMs: number, bodyX: number, bodyY: number, bodyRadius: number): number {
        let damage = 0;
        for (const projectile of this.projectiles.active) {
            const flying = projectile.update(deltaMs);
            const reach = projectile.attack.radius + bodyRadius;
            const dx = projectile.x - bodyX;
            const dy = projectile.y - bodyY;
            const hit = dx * dx + dy * dy <= reach * reach;
            if (hit) damage += projectile.damage;
            if (hit || !flying) {
                const { explodeEffect, sound } = projectile.attack;
                if (explodeEffect) this.spawnEffect(explodeEffect, projectile.x, projectile.y);
                if (sound) this.audio.play(sound);
                projectile.deactivate();
                this.finished.push(projectile);
            }
        }
        // Released after the loop: releasing reorders `active` while we iterate it.
        for (const projectile of this.finished) this.projectiles.release(projectile);
        this.finished.length = 0;
        return damage;
    }
}
