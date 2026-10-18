// Proyectiles de los enemigos (las bolas de fuego del Fire Wyvern y las flechas del Dark Elf). Vuelan en línea recta hacia donde estaba el
// jugador; si lo tocan le hacen daño (la armadura y el Defense Shield lo reducen en GameScene) y explotan.
// Las flechas se pueden esquivar como un golpe (Fase 18A): si fallan, siguen volando de largo.
// Los hechizos se pueden resistir (Fase 18B): explotan igual, pero sin daño y con el texto "Resist".
// Se reciclan con un pool (regla 5). Usan los mismos efectos que el Fire Ball de la Maga.
import type Phaser from 'phaser';
import { effectAnimationKey, type EffectKey } from '../config/effects';
import { DEPTH_EFFECT_OFFSET } from '../config/gameConfig';
import { hitChance, spellHitChance, type PlayerDefense } from '../data/defense';
import type { EnemyRangedAttack } from '../data/enemies';
import { Pool, type Poolable } from '../utils/Pool';
import type { AudioSystem } from './AudioSystem';

class EnemyProjectile implements Poolable {
    public poolIndex = -1;
    public x = 0;
    public y = 0;
    public attack!: EnemyRangedAttack;
    public damage = 0;
    /** Thrown by a boss (the screen shakes harder when it hits). */
    public fromBoss = false;
    /** Name of the monster that threw it (the metrics' "killed by"). */
    public source = '';
    /** Thrower's hit ratio for a physical shot (it can be dodged); undefined for spells. */
    public hitRatio: number | undefined;
    /** Already dodged: it flies on past the player. */
    public dodged = false;
    private vx = 0;
    private vy = 0;
    private remaining = 0;
    private readonly sprite: Phaser.GameObjects.Sprite;

    constructor(scene: Phaser.Scene) {
        this.sprite = scene.add.sprite(0, 0, '__DEFAULT').setActive(false).setVisible(false);
    }

    public launch(attack: EnemyRangedAttack, source: string, damage: number, fromBoss: boolean, hitRatio: number | undefined, x: number, y: number, angle: number): void {
        this.attack = attack;
        this.hitRatio = hitRatio;
        this.dodged = false;
        this.source = source;
        this.damage = damage;
        this.fromBoss = fromBoss;
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
    private bossHit = false;
    private hitSource = '';

    constructor(
        scene: Phaser.Scene,
        private readonly audio: AudioSystem,
        /** Plays the explosion (shared effect pool). */
        private readonly spawnEffect: (key: EffectKey, x: number, y: number) => void,
        /** A spell was resisted where it touched the player (shows "Resist"). */
        private readonly onResist: (x: number, y: number) => void,
    ) {
        this.projectiles = new Pool(() => new EnemyProjectile(scene));
    }

    public get active(): number {
        return this.projectiles.active.length;
    }

    /** True if a boss projectile hit the player during the last update. */
    public get hitFromBoss(): boolean {
        return this.bossHit;
    }

    /** Who threw the strongest projectile that hit the player during the last update ('' if none). */
    public get hitBy(): string {
        return this.hitSource;
    }

    /**
     * Throws `attack.shots` projectiles from (x, y) towards (targetX, targetY), fanned over its spread.
     * `damage` is used when the attack has no fixed damage of its own (arrows use the archer's dice), and `hitRatio`
     * (the thrower's) when the attack is physical and can be dodged.
     */
    public throwAt(attack: EnemyRangedAttack, source: string, x: number, y: number, targetX: number, targetY: number, damage = 0, fromBoss = false, hitRatio?: number): void {
        const centre = Math.atan2(targetY - y, targetX - x);
        const spread = (attack.spreadDegrees * Math.PI) / 180;
        for (let i = 0; i < attack.shots; i++) {
            const offset = attack.shots > 1 ? (i / (attack.shots - 1) - 0.5) * spread : 0;
            this.projectiles.acquire().launch(attack, source, attack.damage ?? damage, fromBoss, attack.physical ? hitRatio : undefined, x, y, centre + offset);
        }
    }

    /**
     * Moves the projectiles; one touching the player's body at (bodyX, bodyY) explodes and its damage is returned
     * (the sum if several hit this frame). A physical shot rolls its hit ratio against the player's defense ratio
     * first, and a spell its magic hit ratio against the magic resistance.
     */
    public update(deltaMs: number, bodyX: number, bodyY: number, bodyRadius: number, defense: PlayerDefense,
        onBlow?: (source: string, damage: number, landed: boolean) => void): number {
        let damage = 0;
        let strongest = 0;
        this.bossHit = false;
        this.hitSource = '';
        for (const projectile of this.projectiles.active) {
            const flying = projectile.update(deltaMs);
            const reach = projectile.attack.radius + bodyRadius;
            const dx = projectile.x - bodyX;
            const dy = projectile.y - bodyY;
            const touches = !projectile.dodged && dx * dx + dy * dy <= reach * reach;
            let hit = touches;
            if (hit && projectile.hitRatio !== undefined) {
                hit = Math.random() < hitChance(projectile.hitRatio, defense.defenseRatio);
                projectile.dodged = !hit;
                onBlow?.(projectile.source, projectile.damage, hit);
            }
            const { magicHitRatio } = projectile.attack;
            let resisted = false;
            if (hit && magicHitRatio !== undefined) {
                hit = Math.random() < spellHitChance(magicHitRatio, defense.magicResistance);
                resisted = !hit;
                onBlow?.(projectile.source, projectile.damage, hit);
                if (resisted) this.onResist(bodyX, bodyY);
            }
            if (hit) {
                damage += projectile.damage;
                this.bossHit ||= projectile.fromBoss;
                if (projectile.damage > strongest) {
                    strongest = projectile.damage;
                    this.hitSource = projectile.source;
                }
            }
            if (hit || resisted || !flying) {
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
