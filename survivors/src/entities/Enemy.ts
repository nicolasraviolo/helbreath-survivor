// Enemigo ligero y reciclable: un sprite animado (más su sombra) que persigue al jugador y, al tenerlo a su alcance,
// se para y le ataca con su animación y su sonido; el golpe cae en el frame 2, como en el original, y solo hace daño
// si el jugador sigue a su alcance y la tirada de puntería contra su defensa acierta (Fase 18A). Lo crea y lo recicla EnemySystem; aquí solo vive su comportamiento.
import Phaser from 'phaser';
import {
    DEFAULT_ANIMATION_FRAME_RATE,
    DEPTH_GROUND_SHADOWS,
    ENEMY_CORPSE_MS,
    ENEMY_FADE_MS,
    ENEMY_HIT_FLASH_MS,
    ENEMY_KNOCKBACK_DECAY,
    ENEMY_WALL_HALF_SIZE,
    BODY_SHADOW_ALPHA,
    BODY_SHADOW_ROTATION,
    MONSTER_ATTACK,
    BODY_SHADOW_SCALE_Y,
    GROUND_SHADOW,
} from '../config/gameConfig';
import type { AudioSystem } from '../systems/AudioSystem';
import { enemySpeed, monsterBaseHp, MONSTER_AI, MONSTER_DAMAGE, type EnemyDef } from '../data/enemies';
import { hitChance } from '../data/defense';
import { ELITE } from '../data/elites';
import { AURA_SLOW_LOOK } from '../data/passiveMagic';
import { NO_DIFFICULTY, type MapDifficulty } from '../data/maps';
import { CHAMPION } from '../data/champion';
import { POISON } from '../data/attributes';
import { EFFECTS } from '../config/effects';
import { FREEZE_TINT } from '../data/totems';
import { ICE_SLOW } from '../data/activeSpells';
import { CHARGE, FLANK, KEEP_AWAY, WANDER, type MovementStyle } from '../data/movement';
import { DEPTH_DAMAGE_NUMBERS, DEPTH_EFFECT_OFFSET, TILE_SIZE } from '../config/gameConfig';
import { HBAsset } from '../hb/HBAsset';
import type { HBMap } from '../hb/HBMap';
import { getSheetKey } from '../hb/HBSprite';
import { tintedKey } from '../hb/additiveTint';
import { ensureGlowTexture } from '../hb/glowTexture';
import { Direction, directionFromVector } from '../hb/directions';
import { MONSTER_DEFAULT_FRAMES_PER_SHEET, MONSTER_SHEET_BASE, MonsterState, monsterFrameRate } from '../hb/monsterSheets';
import { moveAxis } from '../utils/collision';
import type { Poolable } from '../utils/Pool';
import { smoothSprite } from '../hb/XbrPipeline';

/** Texture key suffix of a sheet's red copy for the elites (hb/additiveTint.ts → tintedKey). */
/** The poison cloud's animation (config/effects.ts). */
const POISON_CLOUD_EFFECT = 'fx.poison.cloud';
const ELITE_GLOW_SUFFIX = tintedKey('', 'elite');
/** The same for the whitish copy of the monsters the Eye of the Storm slows (Fase 28). */
const WIND_GLOW_SUFFIX = tintedKey('', 'wind');

/** Who slowed it: the ice (blue) or the Eye of the Storm's wind (greyish white, Fase 28). */
export type SlowLook = 'ice' | 'wind';

export enum EnemyPhase {
    Alive = 'alive',
    Dying = 'dying',
    Corpse = 'corpse',
}

export interface EnemyWorld {
    map: HBMap;
    area: Phaser.Geom.Rectangle;
    targetX: number;
    targetY: number;
    /** Distance to the target at which the enemy stops pushing forward. */
    targetRadius: number;
    /** The player's defense ratio: each blow rolls its hit ratio against it (data/defense.ts). */
    defenseRatio: number;
    /** Told about every blow that reaches the player, landed or dodged (the simulated run counts them). */
    onBlow?: (source: string, damage: number, landed: boolean) => void;
}

export class Enemy implements Poolable {
    public poolIndex = -1;
    public x = 0;
    public y = 0;
    public hp = 0;
    /** Hits taken since it spawned (to measure how many die in one hit: ?debug=sim). */
    public hitsTaken = 0;
    public phase = EnemyPhase.Alive;
    /** Separation push accumulated by EnemySystem this frame, in px/s. */
    public pushX = 0;
    public pushY = 0;
    /** Knockback velocity from hits (px/s); fades out over time. */
    private knockX = 0;
    private knockY = 0;
    private flashMs = 0;
    public readonly sprite: HBAsset;
    private readonly shadow: Phaser.GameObjects.Sprite | undefined;
    private direction = Direction.South;
    /** Sprite opacity when fully visible (the Wyverns are a bit transparent, as in the original). */
    private readonly baseAlpha: number;
    /** Walking speed in px/s, from its real action time (data/enemies.ts → enemySpeed). */
    private readonly baseSpeed: number;
    /** Sprite scale of its kind (data/enemies.ts), before the champion's size. */
    private readonly baseScale: number;
    private state = MonsterState.Move;
    /** Which way to go around walls (+1 / -1), flipped when that way is blocked too. */
    private sideBias = 1;
    private timerMs = 0;
    /** Time left of the current attack animation (0 = not attacking). */
    private attackLeftMs = 0;
    /** Time until the blow of the current attack lands; negative = already landed. */
    private hitInMs = -1;
    /** Damage of the blows that landed this frame; EnemySystem collects it and sets it back to 0. */
    public landedDamage = 0;
    /** Damage of an arrow to shoot this frame (Dark Elf), or 0; EnemySystem collects it. */
    public shotDamage = 0;
    /** Time before it may start another attack (the original action time). */
    private cooldownMs = 0;
    /** Time left running away (hit-and-run strategy or low health). */
    private fleeMs = 0;
    /** Attack strategy rolled when it appears: 'normal', 'hitAndRun' (1 blow) or 'twoHitsAndRun'. */
    private strategy: 'normal' | 'hitAndRun' | 'twoHitsAndRun' = 'normal';
    private blowsSinceFlee = 0;
    /** The low-health bravery check is done once. */
    private braveryChecked = false;
    /** Stampede (data/waves.ts): runs straight this way, faster, for `chargeMs`; then chases as usual. */
    private chargeMs = 0;
    private chargeX = 0;
    private chargeY = 0;
    /** How it walks towards the player (data/movement.ts, Fase 27): bosses always go direct. */
    private readonly movement: MovementStyle;
    /** Flank: angle off the straight line when far away (radians, signed: its side), rolled on spawn. */
    private flankAngle = 0;
    /** Wander: has it seen the player (or been hit)? Then it chases for good. */
    private noticed = true;
    /** Wander: time left on the current leg, its heading (unit vector) and its share of speed (0 = standing). */
    private legMs = 0;
    private legX = 0;
    private legY = 0;
    private legPace = 1;
    /** Where it wants to walk this frame (unit vector) and at what share of its speed; set by `pickHeading`. */
    private headX = 0;
    private headY = 0;
    private headPace = 1;
    /** Charge (Fase 27B): time left standing with the "!", where it will rush (unit vector) and how far. */
    private windupMs = 0;
    private windupX = 0;
    private windupY = 0;
    private windupDistance = 0;
    /** Charge: time before it may charge again. */
    private nextChargeMs = 0;
    /** EnemySystem's ChargeWarnings has a "!" over it. */
    public hasChargeWarning = false;
    /** Freeze totem (Fase 16B): time left standing still, animation paused and tinted blue. */
    private frozenMs = 0;
    /** Ice Strike (Fase 26D): time left slowed, and its share of normal speed (0.5 = half: walks, hits and animates slower). */
    private slowMs = 0;
    private slowFactor = 1;
    /** Look of the slow now: the strongest one's. */
    private slowLook: SlowLook = 'ice';
    /** Elite (data/elites.ts): hits harder, has more health and gives more XP; glows red like the player's Berserk. */
    public elite = false;
    /** The map's multipliers for normal monsters (data/maps.ts → difficulty, Fase 22A); 1 for bosses. */
    private difficulty: MapDifficulty = NO_DIFFICULTY;
    /** Poison (Fase 21B, data/attributes.ts): its level (0 = not poisoned) and the time to the next tick. */
    private poisonLevel = 0;
    private poisonTickMs = 0;
    /** The original's green cloud over it while poisoned; made the first time this (pooled) enemy is poisoned. */
    private poisonCloud: Phaser.GameObjects.Sprite | undefined;
    /** Champion (Fase 21½C, data/champion.ts): bigger, much tougher, glows like the elites and shows its health bar. */
    public champion = false;
    /** Dark oval under the monsters with no body shadow (GROUND_SHADOW), instead of `shadow`. */
    private readonly groundShadow: Phaser.GameObjects.Image | undefined;
    /** Its health bar over the head; made the first time this (pooled) enemy is a champion. */
    private healthBar: Phaser.GameObjects.Graphics | undefined;
    /** Highest point of its frames seen so far, above the feet (px): the bar sits over it without jumping. */
    private headHeight = 0;

    constructor(scene: Phaser.Scene, public readonly def: EnemyDef, private readonly audio: AudioSystem) {
        const scale = def.scale ?? 1;
        this.baseScale = scale;
        this.baseAlpha = def.alpha ?? 1;
        this.baseSpeed = enemySpeed(def);
        this.movement = def.boss ? 'direct' : def.movement ?? 'direct';
        this.sprite = scene.add.existing(new HBAsset(scene, 0, 0, def.sprite)).setScale(scale);
        if (def.hasShadow) {
            this.shadow = smoothSprite(scene.add.sprite(0, 0, getSheetKey(def.sprite, 0), '0'))
                .setTint(0x000000)
                .setAlpha(BODY_SHADOW_ALPHA)
                .setRotation(BODY_SHADOW_ROTATION)
                .setScale(scale, BODY_SHADOW_SCALE_Y * scale)
                .setDepth(DEPTH_GROUND_SHADOWS + 1);
        } else {
            // No body shadow in the original: a dark oval instead, so it doesn't blend into the floor.
            ensureGroundShadowTexture(scene);
            this.groundShadow = scene.add.image(0, 0, GROUND_SHADOW.texture)
                .setAlpha(GROUND_SHADOW.alpha)
                .setDepth(DEPTH_GROUND_SHADOWS + 1);
            this.scaleGroundShadow(scale);
        }
        this.setActive(false);
    }

    public get isAlive(): boolean {
        return this.phase === EnemyPhase.Alive;
    }

    public spawn(x: number, y: number, elite = false, difficulty: MapDifficulty = NO_DIFFICULTY, champion = false): void {
        this.x = x;
        this.y = y;
        this.elite = elite && !champion;
        this.champion = champion;
        this.difficulty = difficulty;
        this.headHeight = 0;
        this.applySize();
        this.hp = this.maxHp;
        this.hitsTaken = 0;
        this.phase = EnemyPhase.Alive;
        this.pushX = 0;
        this.pushY = 0;
        this.knockX = 0;
        this.knockY = 0;
        this.flashMs = 0;
        this.attackLeftMs = 0;
        this.hitInMs = -1;
        this.landedDamage = 0;
        this.shotDamage = 0;
        this.cooldownMs = 0;
        this.fleeMs = 0;
        this.blowsSinceFlee = 0;
        this.braveryChecked = false;
        this.chargeMs = 0;
        this.windupMs = 0;
        this.nextChargeMs = Phaser.Math.FloatBetween(0, CHARGE.maxCooldownMs);
        this.frozenMs = 0;
        this.slowMs = 0;
        this.slowFactor = 1;
        this.sprite.anims.timeScale = 1;
        this.cure();
        this.sprite.anims.resume();
        const roll = Phaser.Math.Between(1, MONSTER_AI.strategyDie);
        this.strategy = roll === MONSTER_AI.hitAndRunRoll ? 'hitAndRun' : roll === MONSTER_AI.twoHitsAndRunRoll ? 'twoHitsAndRun' : 'normal';
        this.sprite.clearTint();
        this.sideBias = Math.random() < 0.5 ? 1 : -1;
        const flankDeg = Phaser.Math.FloatBetween(FLANK.minAngleDeg, FLANK.maxAngleDeg);
        this.flankAngle = Phaser.Math.DegToRad(flankDeg) * this.sideBias;
        this.noticed = this.movement !== 'wander';
        this.legMs = 0;
        this.sprite.setAlpha(this.baseAlpha);
        this.setActive(true);
        this.play(MonsterState.Move, true);
        this.syncDisplay();
    }

    /**
     * Stampede: runs in a straight line along (dirX, dirY) at `speedFactor` times its speed for `ms`, ignoring the
     * player except to hit them if they get in the way. Afterwards it chases as usual.
     */
    public charge(dirX: number, dirY: number, speedFactor: number, ms: number): void {
        const length = Math.hypot(dirX, dirY) || 1;
        this.chargeX = (dirX / length) * this.speed * speedFactor;
        this.chargeY = (dirY / length) * this.speed * speedFactor;
        this.chargeMs = ms;
        this.noticed = true;
    }

    /** Freeze totem: stands still (no walking, no attacks, a blow on its way is cancelled) for `ms`. */
    public freeze(ms: number): void {
        if (!this.isAlive) return;
        this.frozenMs = Math.max(this.frozenMs, ms);
        this.attackLeftMs = 0;
        this.hitInMs = -1;
        this.chargeMs = 0;
        this.windupMs = 0;
        this.knockX = 0;
        this.knockY = 0;
        this.sprite.anims.pause();
        if (this.flashMs <= 0) this.sprite.setTint(FREEZE_TINT);
    }

    /**
     * Ice Strike (Fase 26D, propietario: el hielo ralentiza, no congela): for `ms` it lives at `factor` of its speed
     * (walking, attacks and animation), tinted ice blue, or greyish white for the Eye of the Storm (`look`). A new hit
     * renews the time; the strongest slow wins, with its look.
     */
    public slow(factor: number, ms: number, look: SlowLook = 'ice'): void {
        if (!this.isAlive) return;
        if (this.slowMs <= 0 || factor <= this.slowFactor) this.slowLook = look;
        this.slowFactor = this.slowMs > 0 ? Math.min(this.slowFactor, factor) : factor;
        this.slowMs = Math.max(this.slowMs, ms);
        this.sprite.anims.timeScale = this.slowFactor;
        this.applyStatusTint();
    }

    public get isSlowed(): boolean {
        return this.slowMs > 0;
    }

    /** Freeze blue, Ice Strike blue or none (not while it flashes white from a hit). */
    private applyStatusTint(): void {
        if (this.flashMs > 0) return;
        if (this.isFrozen) this.sprite.setTint(FREEZE_TINT);
        else if (this.isSlowed) this.sprite.setTint(this.slowLook === 'wind' ? AURA_SLOW_LOOK.tint : ICE_SLOW.tint);
        else this.sprite.clearTint();
    }

    private endSlow(): void {
        this.slowMs = 0;
        this.slowFactor = 1;
        this.sprite.anims.timeScale = 1;
        this.applyStatusTint();
    }

    /** Full health (data/enemies.ts, monsterBaseHp): the elites have more, the champions much more. */
    public get maxHp(): number {
        const factor = this.champion ? CHAMPION.hpMultiplier : this.elite ? ELITE.hpMultiplier : 1;
        return Math.max(1, Math.round(monsterBaseHp(this.def) * this.difficulty.hp * factor));
    }

    /** XP it drops (a champion's is split into several gems by the game scene): the elites give more. */
    public get xp(): number {
        const factor = this.champion ? CHAMPION.xpMultiplier : this.elite ? ELITE.xpMultiplier : 1;
        return Math.max(1, Math.round(this.def.xp * this.difficulty.hp * factor));
    }

    /** How much bigger than its kind it is (champions). */
    public get sizeFactor(): number {
        return this.champion ? CHAMPION.sizeFactor : 1;
    }

    /** Body radius (px), for touching and pushing: champions are bigger. */
    public get radius(): number {
        return this.def.radius * this.sizeFactor;
    }

    /** Walking speed now (px/s): champions are a bit slower. */
    private get speed(): number {
        return this.champion ? this.baseSpeed * CHAMPION.speedFactor : this.baseSpeed;
    }

    public get isFrozen(): boolean {
        return this.frozenMs > 0;
    }

    /** Walking speed (px/s). */
    public get speedPxPerSecond(): number {
        return this.speed;
    }

    /** Point where projectiles aim and hit (above the feet). */
    public get bodyY(): number {
        return this.y - this.def.bodyOffsetY * this.sizeFactor;
    }

    /**
     * Takes damage: flashes white and is pushed away from (fromX, fromY) at `knockback` px/s.
     * Returns true if this hit killed it.
     */
    public takeDamage(amount: number, fromX: number, fromY: number, knockback: number): boolean {
        if (!this.isAlive) return false;
        this.hp -= amount;
        this.hitsTaken++;
        this.noticed = true;
        this.flashMs = ENEMY_HIT_FLASH_MS;
        this.sprite.setTintFill(0xffffff);
        this.push(fromX, fromY, knockback);
        if (this.hp > 0) {
            this.checkBravery();
            return false;
        }
        this.kill();
        return true;
    }

    /** Pushed away from (fromX, fromY) at `speed` px/s, fading like a knockback (also without damage: Abaddon's wave). */
    public push(fromX: number, fromY: number, speed: number): void {
        if (!this.isAlive || this.isFrozen) return;
        const dx = this.x - fromX;
        const dy = this.y - fromY;
        const distance = Math.hypot(dx, dy);
        if (distance <= 0) return;
        // Bosses barely move when hit.
        const knockback = speed * (this.champion ? CHAMPION.knockbackTaken : this.def.knockbackTaken ?? 1);
        this.knockX += (dx / distance) * knockback;
        this.knockY += (dy / distance) * knockback;
    }

    public get isPoisoned(): boolean {
        return this.poisonLevel > 0;
    }

    /** Poisoned by a Poison weapon: only if it is not poisoned already, as in the original (reference/Server.cpp:54261). */
    public poison(level: number): void {
        if (!this.isAlive || this.isPoisoned || level <= 0) return;
        this.poisonLevel = level;
        this.poisonTickMs = POISON.tickMs;
        if (!this.poisonCloud) {
            this.poisonCloud = smoothSprite(this.sprite.scene.add.sprite(0, 0, '__DEFAULT')).setAlpha(POISON.cloudAlpha);
        }
        if (this.sprite.scene.anims.exists(POISON_CLOUD_EFFECT)) this.poisonCloud.setActive(true).setVisible(true).play(POISON_CLOUD_EFFECT);
        this.syncPoisonCloud();
    }

    /**
     * Runs the poison: the health it took this frame (0 most frames). Each tick takes 1d(level) and may cure it
     * (PoisonEffect, Server.cpp:33105). It may kill: the caller checks hp.
     */
    public tickPoison(deltaMs: number): number {
        if (!this.isPoisoned) return 0;
        if (!this.isAlive) {
            this.cure();
            return 0;
        }
        this.syncPoisonCloud();
        this.poisonTickMs -= deltaMs;
        if (this.poisonTickMs > 0) return 0;
        this.poisonTickMs += POISON.tickMs;
        const damage = Phaser.Math.Between(1, this.poisonLevel);
        this.hp -= damage;
        if (Math.random() < POISON.cureChance) this.cure();
        return damage;
    }

    private cure(): void {
        this.poisonLevel = 0;
        this.poisonCloud?.stop().setActive(false).setVisible(false);
    }

    private syncPoisonCloud(): void {
        const def = EFFECTS[POISON_CLOUD_EFFECT];
        this.poisonCloud?.setPosition(this.x + def.offsetX, this.bodyY + def.offsetY).setDepth(this.y + DEPTH_EFFECT_OFFSET);
    }

    /** Starts the death animation. Returns false if it was already dead. */
    public kill(): boolean {
        if (!this.isAlive) return false;
        this.phase = EnemyPhase.Dying;
        this.cure();
        if (this.isFrozen) this.thaw();
        if (this.isSlowed) this.endSlow();
        this.shadow?.setVisible(false);
        this.groundShadow?.setVisible(false);
        this.healthBar?.setVisible(false);
        this.play(MonsterState.Dead, true);
        return true;
    }

    /** Returns true when the enemy has finished fading out and must go back to the pool. */
    public update(deltaMs: number, world: EnemyWorld): boolean {
        // The animation already advanced this frame (Phaser runs it before the scene's update).
        this.syncGlowTexture();
        return this.step(deltaMs, world);
    }

    private step(deltaMs: number, world: EnemyWorld): boolean {
        if (this.flashMs > 0) {
            this.flashMs -= deltaMs;
            if (this.flashMs <= 0) this.applyStatusTint();
        }
        switch (this.phase) {
            case EnemyPhase.Alive:
                if (this.frozenMs > 0) {
                    this.frozenMs -= deltaMs;
                    if (this.frozenMs <= 0) this.thaw();
                    return false;
                }
                if (this.slowMs > 0) {
                    // Slowed: what it does runs on a slower clock (not the crowd's push nor the knockback).
                    const pace = this.slowFactor;
                    this.slowMs -= deltaMs;
                    if (this.slowMs <= 0) this.endSlow();
                    this.chase(deltaMs, world, pace);
                    this.syncDisplay();
                    return false;
                }
                this.chase(deltaMs, world);
                this.syncDisplay();
                return false;
            case EnemyPhase.Dying:
                if (!this.sprite.anims.isPlaying) {
                    this.phase = EnemyPhase.Corpse;
                    this.timerMs = 0;
                }
                return false;
            case EnemyPhase.Corpse:
                this.timerMs += deltaMs;
                if (this.timerMs > ENEMY_CORPSE_MS) {
                    const fade = (this.timerMs - ENEMY_CORPSE_MS) / ENEMY_FADE_MS;
                    this.sprite.setAlpha(Math.max(0, 1 - fade) * this.baseAlpha);
                    if (fade >= 1) {
                        this.setActive(false);
                        return true;
                    }
                }
                return false;
        }
    }

    private thaw(): void {
        this.frozenMs = 0;
        this.sprite.anims.resume();
        this.applyStatusTint();
    }

    /**
     * `pace` < 1 when slowed by ice (Fase 26D): its own walking, charging and timers go slower, while the push of the
     * crowd and the knockback keep their real speed, so slowed packs don't pile up (review of Fase 26).
     */
    private chase(deltaMs: number, world: EnemyWorld, pace = 1): void {
        const dx = world.targetX - this.x;
        const dy = world.targetY - this.y;
        const distance = Math.hypot(dx, dy);
        const seconds = deltaMs / 1000;
        const ownMs = deltaMs * pace;
        const speed = this.speed * pace;
        let vx = this.pushX + this.knockX;
        let vy = this.pushY + this.knockY;
        const fade = Math.exp(-ENEMY_KNOCKBACK_DECAY * seconds);
        this.knockX *= fade;
        this.knockY *= fade;
        const inReach = this.inReach(dx, dy, distance, world.targetRadius);
        this.cooldownMs = Math.max(0, this.cooldownMs - ownMs);
        if (this.movement === 'charge') this.nextChargeMs -= ownMs;
        let facingX = dx;
        let facingY = dy;
        let wanted = MonsterState.Move;

        if (this.attackLeftMs > 0) {
            // Attacking: stands still (only pushes and knockback move it) until the animation ends.
            this.updateAttack(ownMs, inReach, world);
            wanted = MonsterState.Attack;
        } else if (this.fleeMs > 0) {
            // Running away from the player (hit-and-run or scared at low health).
            this.fleeMs -= ownMs;
            if (distance > 0) {
                vx -= (dx / distance) * speed;
                vy -= (dy / distance) * speed;
            }
            facingX = -dx;
            facingY = -dy;
        } else if (this.chargeMs > 0 && !(inReach && this.cooldownMs <= 0)) {
            this.chargeMs -= ownMs;
            vx += this.chargeX * pace;
            vy += this.chargeY * pace;
            facingX = this.chargeX;
            facingY = this.chargeY;
        } else if (this.windupMs > 0) {
            // Charge: stands with the "!" facing where it will rush, then goes.
            this.windupMs -= ownMs;
            facingX = this.windupX;
            facingY = this.windupY;
            wanted = MonsterState.Idle;
            if (this.windupMs <= 0) this.startOwnCharge();
        } else if (inReach) {
            if (this.cooldownMs <= 0) {
                this.startAttack(dx, dy);
                wanted = MonsterState.Attack;
            } else if (this.movement === 'keepAway' && distance > 0) {
                // Keep away (27C): backs off if the player is too close, else sidesteps around them while it waits.
                const step = this.keepAwayStep(dx, dy, distance, ownMs);
                vx += step.x * speed;
                vy += step.y * speed;
                facingX = step.x;
                facingY = step.y;
            } else {
                // Waits its action time facing the player.
                wanted = MonsterState.Idle;
            }
        } else if (this.wantsToCharge(distance)) {
            this.windupMs = CHARGE.windupMs;
            this.windupX = dx / distance;
            this.windupY = dy / distance;
            this.windupDistance = distance;
            facingX = dx;
            facingY = dy;
            wanted = MonsterState.Idle;
        } else if (distance > world.targetRadius + this.radius) {
            this.pickHeading(dx, dy, distance, ownMs);
            vx += this.headX * speed * this.headPace;
            vy += this.headY * speed * this.headPace;
            facingX = this.headX;
            facingY = this.headY;
            if (this.headPace === 0) wanted = MonsterState.Idle;
        }

        if (wanted !== MonsterState.Attack) {
            const facing = directionFromVector(facingX, facingY) ?? this.direction;
            if (facing !== this.direction || wanted !== this.state) {
                this.direction = facing;
                this.play(wanted, wanted !== this.state);
            }
        }

        if (vx === 0 && vy === 0) return;
        const { map, area } = world;
        const half = ENEMY_WALL_HALF_SIZE;
        const movedX = moveAxis(this, vx * seconds, 0, map, area, half, false);
        const movedY = moveAxis(this, 0, vy * seconds, map, area, half, false);
        if (!movedX && !movedY) {
            // Stuck against a wall: walk sideways along it (perpendicular to the wanted direction).
            const step = speed * seconds;
            const sideX = (-vy / Math.hypot(vx, vy)) * step * this.sideBias;
            const sideY = (vx / Math.hypot(vx, vy)) * step * this.sideBias;
            if (!moveAxis(this, sideX, 0, map, area, half, false) && !moveAxis(this, 0, sideY, map, area, half, false)) {
                this.sideBias = -this.sideBias;
            }
        }
    }

    /**
     * Where to walk this frame (data/movement.ts): straight at the player, on a curve from its side (flank), or a
     * random leg until it notices the player (wander). Sets headX/headY (unit vector) and headPace.
     */
    private pickHeading(dx: number, dy: number, distance: number, ownMs: number): void {
        const ux = dx / distance;
        const uy = dy / distance;
        this.headPace = 1;
        if (this.movement === 'wander' && !this.noticed) {
            if (distance <= WANDER.sightPx) {
                this.noticed = true;
            } else {
                this.legMs -= ownMs;
                if (this.legMs <= 0) this.newLeg(dx, dy);
                this.headX = this.legX;
                this.headY = this.legY;
                this.headPace = this.legPace;
                return;
            }
        }
        if (this.movement === 'flank') {
            // Full angle far away, none at nearPx: it closes in straight.
            const share = Phaser.Math.Clamp((distance - FLANK.nearPx) / (FLANK.farPx - FLANK.nearPx), 0, 1);
            const angle = this.flankAngle * share;
            if (angle !== 0) {
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                this.headX = ux * cos - uy * sin;
                this.headY = ux * sin + uy * cos;
                return;
            }
        }
        this.headX = ux;
        this.headY = uy;
    }

    /**
     * Keep away: where it walks while waiting for its next attack (scaled by its share of speed). Straight away from
     * the player when closer than KEEP_AWAY.tooCloseShare of its range; otherwise sideways (its `sideBias` side),
     * swapping side now and then. Reuses the wander leg timer, which keepAway monsters never use.
     */
    private keepAwayStep(dx: number, dy: number, distance: number, ownMs: number): { x: number; y: number } {
        const ux = dx / distance;
        const uy = dy / distance;
        if (distance < this.def.attackRange * TILE_SIZE * KEEP_AWAY.tooCloseShare) {
            return { x: -ux * KEEP_AWAY.backPace, y: -uy * KEEP_AWAY.backPace };
        }
        this.legMs -= ownMs;
        if (this.legMs <= 0) {
            this.legMs = Phaser.Math.FloatBetween(KEEP_AWAY.minStrafeMs, KEEP_AWAY.maxStrafeMs);
            if (Math.random() < KEEP_AWAY.swapChance) this.sideBias = -this.sideBias;
        }
        return { x: -uy * this.sideBias * KEEP_AWAY.strafePace, y: ux * this.sideBias * KEEP_AWAY.strafePace };
    }

    /** Charge: its pause is over and the player is at charging distance (not too close, not too far). */
    private wantsToCharge(distance: number): boolean {
        return this.movement === 'charge' && this.nextChargeMs <= 0 && distance >= CHARGE.minPx && distance <= CHARGE.maxPx;
    }

    /** Charge: rushes in a straight line to where the player stood, and a bit past it. */
    private startOwnCharge(): void {
        const travel = this.windupDistance + CHARGE.overshootPx;
        this.charge(this.windupX, this.windupY, CHARGE.speedFactor, (travel / (this.speed * CHARGE.speedFactor)) * 1000);
        this.nextChargeMs = Phaser.Math.FloatBetween(CHARGE.minCooldownMs, CHARGE.maxCooldownMs);
    }

    /** Standing with the "!" before a charge (EnemySystem shows it). */
    public get isWindingUp(): boolean {
        return this.windupMs > 0 && this.phase === EnemyPhase.Alive;
    }

    /** Highest point of its head seen so far (world y), for things drawn over it. */
    public headTopY(): number {
        const frame = this.sprite.frame;
        this.headHeight = Math.max(this.headHeight, frame.pivotY * frame.height * this.sprite.scaleY);
        return this.y - this.headHeight;
    }

    /** Wander: a new leg, roughly towards the player, or a pause. */
    private newLeg(dx: number, dy: number): void {
        this.legMs = Phaser.Math.FloatBetween(WANDER.minLegMs, WANDER.maxLegMs);
        if (Math.random() < WANDER.idleChance) {
            this.legPace = 0;
            return;
        }
        const spread = Phaser.Math.DegToRad(WANDER.spreadDeg);
        const angle = Math.atan2(dy, dx) + Phaser.Math.FloatBetween(-spread, spread);
        this.legX = Math.cos(angle);
        this.legY = Math.sin(angle);
        this.legPace = 1;
    }

    /**
     * Melee monsters (range 1) must touch the player; the others hit from `attackRange` tiles away (measured on each
     * axis, like the original server).
     */
    private inReach(dx: number, dy: number, distance: number, targetRadius: number): boolean {
        if (this.def.attackRange <= 1) return distance <= targetRadius + this.radius + MONSTER_ATTACK.reach;
        const reach = this.def.attackRange * TILE_SIZE;
        return Math.abs(dx) <= reach && Math.abs(dy) <= reach;
    }

    /** Faces the player and starts the attack animation and sound; the next one waits the original action time. */
    private startAttack(dx: number, dy: number): void {
        this.direction = directionFromVector(dx, dy) ?? this.direction;
        const durationMs = this.play(MonsterState.Attack, true);
        this.attackLeftMs = durationMs;
        this.hitInMs = durationMs * (MONSTER_ATTACK.hitFrame / this.attackFrameCount());
        const cut = Phaser.Utils.Array.GetRandom([...MONSTER_AI.attackTimeCuts]) ?? 0;
        this.cooldownMs = Math.max(MONSTER_AI.minAttackIntervalMs, this.def.actionTimeMs - cut, durationMs);
        this.audio.play(this.def.attackSound, durationMs);
    }

    /** The blow lands on frame 2, if the player is still within reach and does not dodge it (archers shoot instead). */
    private updateAttack(deltaMs: number, inReach: boolean, world: EnemyWorld): void {
        this.attackLeftMs -= deltaMs;
        if (this.hitInMs >= 0) {
            this.hitInMs -= deltaMs;
            if (this.hitInMs < 0) {
                if (this.def.attackProjectile) this.shotDamage = this.rollDamage();
                else if (inReach) this.strike(world);
            }
        }
        if (this.attackLeftMs <= 0) {
            this.attackLeftMs = 0;
            this.afterBlow();
            this.play(MonsterState.Move, true);
        }
    }

    /** A melee blow reaches the player: it lands only if the hit roll beats the player's defense. */
    private strike(world: EnemyWorld): void {
        const damage = this.rollDamage();
        const landed = Math.random() < hitChance(this.def.hitRatio, world.defenseRatio);
        world.onBlow?.(this.def.name, damage, landed);
        if (landed) this.landedDamage = Math.max(this.landedDamage, damage);
    }

    /** Hit-and-run strategies: after one (or two) blows, it runs away for a couple of actions. */
    private afterBlow(): void {
        this.blowsSinceFlee++;
        const blowsBeforeFleeing = this.strategy === 'hitAndRun' ? 1 : this.strategy === 'twoHitsAndRun' ? 2 : 0;
        if (blowsBeforeFleeing > 0 && this.blowsSinceFlee >= blowsBeforeFleeing) {
            this.blowsSinceFlee = 0;
            this.fleeMs = MONSTER_AI.fleeActions * this.def.actionTimeMs;
        }
    }

    /** Once, at very low health: cowardly monsters (low bravery) run away for a while. */
    private checkBravery(): void {
        if (this.braveryChecked || this.hp > this.maxHp * MONSTER_AI.lowHealthShare) return;
        this.braveryChecked = true;
        if (Phaser.Math.Between(1, this.def.bravery) <= MONSTER_AI.braveryRoll) {
            this.fleeMs = MONSTER_AI.lowHealthFleeActions * this.def.actionTimeMs;
        }
    }

    /** One blow: the original dice, compressed for our health scale (data/enemies.ts → MONSTER_DAMAGE), softer for bosses. */
    private rollDamage(): number {
        if (this.def.fixedDamage !== undefined) return this.def.fixedDamage;
        const [count, sides] = this.def.damageDice;
        let roll = 0;
        for (let i = 0; i < count; i++) roll += Phaser.Math.Between(1, sides);
        const average = (count * (sides + 1)) / 2;
        const blow = MONSTER_DAMAGE.scale * average ** MONSTER_DAMAGE.exponent * (roll / average);
        const elite = this.champion ? CHAMPION.damageMultiplier : this.elite ? ELITE.damageMultiplier : 1;
        return Math.max(1, Math.round(blow * (this.def.damageScale ?? 1) * elite * this.difficulty.damage));
    }

    /** Frames of the attack animation for the current direction. */
    private attackFrameCount(): number {
        const special = this.def.animations?.attack;
        if (special?.frameCount !== undefined) return special.frameCount;
        const sheet = (special?.sheet ?? MONSTER_SHEET_BASE[MonsterState.Attack]) + this.direction;
        return this.sprite.scene.anims.get(getSheetKey(this.def.sprite, sheet))?.frames.length ?? MONSTER_DEFAULT_FRAMES_PER_SHEET;
    }

    /** Plays a state for the current direction. Returns how long one run of the animation lasts (ms). */
    private play(state: MonsterState, restart: boolean): number {
        this.state = state;
        // Some monsters use other sheets or only part of them (data/enemies.ts → animations).
        const special = state === MonsterState.Move ? this.def.animations?.move
            : state === MonsterState.Idle ? this.def.animations?.idle
            : state === MonsterState.Attack ? this.def.animations?.attack
            : state === MonsterState.Dead ? this.def.animations?.dead : undefined;
        const baseSheet = special?.sheet ?? MONSTER_SHEET_BASE[state];
        const frames = special?.firstFrame !== undefined && special.frameCount !== undefined
            ? { first: special.firstFrame, count: special.frameCount } : undefined;
        if (restart) this.sprite.anims.stop();
        // Attacks run at their own speed (sp-client default attack speed), the rest at the standard 10 fps.
        const baseRate = state === MonsterState.Attack ? MONSTER_ATTACK.frameRate * (this.def.attackSpeed ?? 1) : DEFAULT_ANIMATION_FRAME_RATE;
        const sheetKey = getSheetKey(this.def.sprite, baseSheet + this.direction);
        const sheetFrameRate = monsterFrameRate(this.sprite.scene.anims, sheetKey, baseRate, this.def.temporalCoefficient);
        // Same total length as the full sheet (sp-client: frame rate scales with the frame count).
        const frameRate = frames ? sheetFrameRate * (frames.count / MONSTER_DEFAULT_FRAMES_PER_SHEET) : sheetFrameRate;
        const loop = state === MonsterState.Move || state === MonsterState.Idle;
        this.sprite.playDirectional({ baseSheet, direction: this.direction, frameRate, loop, frames });
        const frameCount = frames?.count ?? this.sprite.scene.anims.get(sheetKey)?.frames.length ?? MONSTER_DEFAULT_FRAMES_PER_SHEET;
        return (frameCount / frameRate) * 1000;
    }

    /** Moves sprite and shadow to the logical position; the shadow copies the current frame. */
    private syncDisplay(): void {
        this.sprite.setPosition(this.x, this.y).setDepth(this.y);
        if (this.champion) this.drawHealthBar();
        this.groundShadow?.setPosition(this.x, this.y);
        const shadow = this.shadow;
        if (!shadow || this.state === MonsterState.Dead || this.state === MonsterState.TakeDamage) return;
        const frame = this.sprite.frame;
        if (shadow.frame !== frame) {
            shadow.setTexture(frame.texture.key, frame.name);
            // setTexture applies the frame's custom pivot; the shadow pivots on the frame's bottom centre.
            shadow.setOrigin(0.5, 1);
        }
        // Bottom centre of the drawn frame (sp-client ShadowManager), at the sprite's scale.
        const scale = this.sprite.scaleX;
        const left = this.x - frame.pivotX * frame.width * scale;
        const top = this.y - frame.pivotY * frame.height * scale;
        shadow.setPosition(left + (frame.width * scale) / 2, top + frame.height * scale);
    }

    /**
     * Elites: draws the current frame from the sheet's red copy (the player's Berserk glow baked in, hb/glowTexture.ts),
     * made the first time. The animation sets the plain frame when it advances; this swaps it back each update.
     * While frozen or slowed by the ice it shows the plain frame, so the ice blue reads clearly. Slowed by the Eye of the
     * Storm (Fase 28), it shows the whitish copy instead (a tint alone can't lighten).
     */
    private syncGlowTexture(): void {
        const sprite = this.sprite;
        const frame = sprite.frame;
        const key = frame.texture.key;
        const current = key.endsWith(ELITE_GLOW_SUFFIX) ? ELITE_GLOW_SUFFIX : key.endsWith(WIND_GLOW_SUFFIX) ? WIND_GLOW_SUFFIX : '';
        let wanted = '';
        if (this.isFrozen) wanted = '';
        else if (this.isSlowed) wanted = this.slowLook === 'wind' ? WIND_GLOW_SUFFIX : '';
        else if (this.elite || this.champion || this.def.glows === true) wanted = ELITE_GLOW_SUFFIX;
        if (wanted === current) return;
        const baseKey = current ? key.slice(0, -current.length) : key;
        if (!wanted) {
            sprite.setTexture(baseKey, frame.name);
            return;
        }
        const wind = wanted === WIND_GLOW_SUFFIX;
        const glow = wind ? AURA_SLOW_LOOK : ELITE;
        if (ensureGlowTexture(sprite.scene, baseKey, baseKey + wanted, glow.glowTint, glow.glowAlpha, wind)) sprite.setTexture(baseKey + wanted, frame.name);
        else if (current) sprite.setTexture(baseKey, frame.name);
    }

    /** Its kind's size, or bigger for a champion (sprite and shadow). */
    private applySize(): void {
        const scale = this.baseScale * this.sizeFactor;
        this.sprite.setScale(scale);
        this.shadow?.setScale(scale, BODY_SHADOW_SCALE_Y * scale);
        this.scaleGroundShadow(scale);
    }

    /** Sizes the ground oval from the monster's radius and its current scale. */
    private scaleGroundShadow(scale: number): void {
        const { widthPerRadius, heightPerRadius, textureWidth, textureHeight } = GROUND_SHADOW;
        const radius = this.def.radius * (scale / this.baseScale);
        this.groundShadow?.setScale((radius * widthPerRadius) / textureWidth, (radius * heightPerRadius) / textureHeight);
    }

    /**
     * Champion: its health bar over the head, like the player's. The head is the highest point of the frames seen so
     * far, so the bar doesn't jump with each frame of the animation.
     */
    private drawHealthBar(): void {
        const { width, height, gapAboveHead, backColor, fillColor, backAlpha } = CHAMPION.bar;
        if (!this.healthBar) this.healthBar = this.sprite.scene.add.graphics();
        const top = this.headTopY() - gapAboveHead - height;
        const left = this.x - width / 2;
        const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
        this.healthBar.setVisible(true).setDepth(DEPTH_DAMAGE_NUMBERS - 1).clear()
            .fillStyle(backColor, backAlpha)
            .fillRect(left - 1, top - 1, width + 2, height + 2)
            .fillStyle(fillColor, 1)
            .fillRect(left, top, width * ratio, height);
    }

    private setActive(active: boolean): void {
        this.sprite.setActive(active).setVisible(active);
        this.shadow?.setActive(active).setVisible(active);
        this.groundShadow?.setActive(active).setVisible(active);
        if (!active || !this.champion) this.healthBar?.setVisible(false);
        if (!active) this.sprite.anims.stop();
    }
}

/** Draws the ground oval texture once (it stays for the whole game): black, darker towards the middle. */
function ensureGroundShadowTexture(scene: Phaser.Scene): void {
    const { texture, textureWidth, textureHeight, rings } = GROUND_SHADOW;
    if (scene.textures.exists(texture)) return;
    const graphics = scene.make.graphics({}, false);
    for (const [size, alpha] of rings) {
        graphics.fillStyle(0x000000, alpha).fillEllipse(textureWidth / 2, textureHeight / 2, textureWidth * size, textureHeight * size);
    }
    graphics.generateTexture(texture, textureWidth, textureHeight);
    graphics.destroy();
}
