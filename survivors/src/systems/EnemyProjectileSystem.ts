// Proyectiles de los enemigos (las bolas de fuego del Fire Wyvern y las flechas del Dark Elf). Vuelan en línea recta hacia donde estaba el
// jugador; si lo tocan le hacen daño (la armadura y el Defense Shield lo reducen en GameScene) y explotan.
// Las flechas se pueden esquivar como un golpe (Fase 18A): si fallan, siguen volando de largo.
// Los hechizos se pueden resistir (Fase 18B): explotan igual, pero sin daño y con el texto "Resist".
// Se reciclan con un pool (regla 5). Usan los mismos efectos que el Fire Ball de la Maga.
// Fase 29A: también los hechizos que caen del cielo (el Lightning Bolt de los Guards): una marca en el suelo y, al poco,
// el rayo; solo hace daño si el jugador sigue dentro de la marca, y la resistencia mágica puede pararlo.
import type Phaser from 'phaser';
import { effectAnimationKey, type EffectKey } from '../config/effects';
import { DEPTH_EFFECT_OFFSET, DEPTH_GROUND_SHADOWS, PLAYER_BODY_OFFSET_Y } from '../config/gameConfig';
import { hitChance, spellHitChance, type PlayerDefense } from '../data/defense';
import { SKY_SPELL_MARK, type EnemyRangedAttack, type EnemySkySpell } from '../data/enemies';
import { LightningArc } from '../entities/LightningArc';
import { Pool, type Poolable } from '../utils/Pool';
import type { AudioSystem } from './AudioSystem';
import { smoothSprite } from '../hb/XbrPipeline';

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
        this.sprite = smoothSprite(scene.add.sprite(0, 0, '__DEFAULT')).setActive(false).setVisible(false);
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

/** A sky spell on its way (Fase 29A): its mark on the ground at (x, y) (the player's feet), until it strikes. */
class SkyStrike implements Poolable {
    public poolIndex = -1;
    public x = 0;
    public y = 0;
    public spell!: EnemySkySpell;
    public damage = 0;
    public source = '';
    private leftMs = 0;
    private readonly mark: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene) {
        this.mark = scene.add.graphics().setActive(false).setVisible(false).setDepth(DEPTH_GROUND_SHADOWS + 2);
    }

    public start(spell: EnemySkySpell, source: string, damage: number, x: number, y: number): void {
        this.spell = spell;
        this.source = source;
        this.damage = damage;
        this.x = x;
        this.y = y;
        this.leftMs = spell.warnMs;
        this.mark.setActive(true).setVisible(true);
        this.draw();
    }

    /** Returns true when it is time to strike. */
    public update(deltaMs: number): boolean {
        this.leftMs -= deltaMs;
        if (this.leftMs <= 0) return true;
        this.draw();
        return false;
    }

    public deactivate(): void {
        this.mark.clear().setActive(false).setVisible(false);
    }

    private draw(): void {
        const look = SKY_SPELL_MARK;
        const width = this.spell.radius * 2;
        const height = width * look.yShare;
        const grown = 1 - Math.max(0, this.leftMs) / this.spell.warnMs;
        this.mark.clear()
            .lineStyle(look.ringWidth, look.color, look.ringAlpha)
            .strokeEllipse(this.x, this.y, width, height)
            .fillStyle(look.color, look.fillAlpha)
            .fillEllipse(this.x, this.y, width * grown, height * grown);
    }
}

export class EnemyProjectileSystem {
    private readonly projectiles: Pool<EnemyProjectile>;
    private readonly strikes: Pool<SkyStrike>;
    private readonly finishedStrikes: SkyStrike[] = [];
    private readonly lightnings: Pool<LightningArc>;
    private readonly finishedLightnings: LightningArc[] = [];
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
        this.strikes = new Pool(() => new SkyStrike(scene));
        this.lightnings = new Pool(() => new LightningArc(scene));
    }

    /** A sky spell will fall on (x, y) (the player's feet) after its warning (a Guard's Lightning Bolt, Fase 29A). */
    public strikeAt(spell: EnemySkySpell, source: string, x: number, y: number, damage: number): void {
        this.strikes.acquire().start(spell, source, damage, x, y);
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

        // Sky spells: strike when their warning ends, hurting the player only if still inside the mark.
        const feetY = bodyY + PLAYER_BODY_OFFSET_Y;
        for (const strike of this.strikes.active) {
            if (!strike.update(deltaMs)) continue;
            const { spell } = strike;
            this.lightnings.acquire().strike(strike.x, strike.y);
            this.audio.play(spell.sound);
            const reach = spell.radius + bodyRadius;
            const dx = strike.x - bodyX;
            const dy = (strike.y - feetY) / SKY_SPELL_MARK.yShare;
            if (dx * dx + dy * dy <= reach * reach) {
                const hit = Math.random() < spellHitChance(spell.magicHitRatio, defense.magicResistance);
                onBlow?.(strike.source, strike.damage, hit);
                if (!hit) this.onResist(bodyX, bodyY);
                else {
                    damage += strike.damage;
                    if (strike.damage > strongest) {
                        strongest = strike.damage;
                        this.hitSource = strike.source;
                    }
                }
            }
            strike.deactivate();
            this.finishedStrikes.push(strike);
        }
        for (const strike of this.finishedStrikes) this.strikes.release(strike);
        this.finishedStrikes.length = 0;
        for (const arc of this.lightnings.active) {
            if (!arc.update(deltaMs)) this.finishedLightnings.push(arc);
        }
        for (const arc of this.finishedLightnings) this.lightnings.release(arc);
        this.finishedLightnings.length = 0;
        return damage;
    }
}
