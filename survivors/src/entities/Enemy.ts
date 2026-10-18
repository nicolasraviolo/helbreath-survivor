// Enemigo ligero y reciclable: un sprite animado (más su sombra) que persigue al jugador y, al tenerlo a su alcance,
// se para y le ataca con su animación y su sonido; el golpe cae en el frame 2, como en el original, y solo hace daño
// si el jugador sigue a su alcance. Lo crea y lo recicla EnemySystem; aquí solo vive su comportamiento.
import Phaser from 'phaser';
import {
    DEFAULT_ANIMATION_FRAME_RATE,
    DEPTH_GROUND_SHADOWS,
    ENEMY_CORPSE_MS,
    ENEMY_FADE_MS,
    ENEMY_HIT_FLASH_MS,
    ENEMY_KNOCKBACK_DECAY,
    ENEMY_WALL_HALF_SIZE,
    MONSTER_SHADOW_ALPHA,
    MONSTER_SHADOW_ROTATION,
    MONSTER_ATTACK,
    MONSTER_SHADOW_SCALE_Y,
} from '../config/gameConfig';
import type { AudioSystem } from '../systems/AudioSystem';
import { enemySpeed, MONSTER_AI, MONSTER_DAMAGE, type EnemyDef } from '../data/enemies';
import { TILE_SIZE } from '../config/gameConfig';
import { HBAsset } from '../hb/HBAsset';
import type { HBMap } from '../hb/HBMap';
import { getSheetKey } from '../hb/HBSprite';
import { Direction, directionFromVector } from '../hb/directions';
import { MONSTER_DEFAULT_FRAMES_PER_SHEET, MONSTER_SHEET_BASE, MonsterState, monsterFrameRate } from '../hb/monsterSheets';
import { moveAxis } from '../utils/collision';
import type { Poolable } from '../utils/Pool';

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
    private readonly speed: number;
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

    constructor(scene: Phaser.Scene, public readonly def: EnemyDef, private readonly audio: AudioSystem) {
        const scale = def.scale ?? 1;
        this.baseAlpha = def.alpha ?? 1;
        this.speed = enemySpeed(def);
        this.sprite = scene.add.existing(new HBAsset(scene, 0, 0, def.sprite)).setScale(scale);
        if (def.hasShadow) {
            this.shadow = scene.add.sprite(0, 0, getSheetKey(def.sprite, 0), '0')
                .setTint(0x000000)
                .setAlpha(MONSTER_SHADOW_ALPHA)
                .setRotation(MONSTER_SHADOW_ROTATION)
                .setScale(scale, MONSTER_SHADOW_SCALE_Y * scale)
                .setDepth(DEPTH_GROUND_SHADOWS + 1);
        }
        this.setActive(false);
    }

    public get isAlive(): boolean {
        return this.phase === EnemyPhase.Alive;
    }

    public spawn(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.hp = this.def.maxHp;
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
        const roll = Phaser.Math.Between(1, MONSTER_AI.strategyDie);
        this.strategy = roll === MONSTER_AI.hitAndRunRoll ? 'hitAndRun' : roll === MONSTER_AI.twoHitsAndRunRoll ? 'twoHitsAndRun' : 'normal';
        this.sprite.clearTint();
        this.sideBias = Math.random() < 0.5 ? 1 : -1;
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
    }

    /** Walking speed (px/s). */
    public get speedPxPerSecond(): number {
        return this.speed;
    }

    /** Point where projectiles aim and hit (above the feet). */
    public get bodyY(): number {
        return this.y - this.def.bodyOffsetY;
    }

    /**
     * Takes damage: flashes white and is pushed away from (fromX, fromY) at `knockback` px/s.
     * Returns true if this hit killed it.
     */
    public takeDamage(amount: number, fromX: number, fromY: number, knockback: number): boolean {
        if (!this.isAlive) return false;
        this.hp -= amount;
        this.hitsTaken++;
        this.flashMs = ENEMY_HIT_FLASH_MS;
        this.sprite.setTintFill(0xffffff);
        const dx = this.x - fromX;
        const dy = this.y - fromY;
        const distance = Math.hypot(dx, dy);
        // Bosses barely move when hit.
        knockback *= this.def.knockbackTaken ?? 1;
        if (distance > 0) {
            this.knockX += (dx / distance) * knockback;
            this.knockY += (dy / distance) * knockback;
        }
        if (this.hp > 0) {
            this.checkBravery();
            return false;
        }
        this.kill();
        return true;
    }

    /** Starts the death animation. Returns false if it was already dead. */
    public kill(): boolean {
        if (!this.isAlive) return false;
        this.phase = EnemyPhase.Dying;
        this.shadow?.setVisible(false);
        this.play(MonsterState.Dead, true);
        return true;
    }

    /** Returns true when the enemy has finished fading out and must go back to the pool. */
    public update(deltaMs: number, world: EnemyWorld): boolean {
        if (this.flashMs > 0) {
            this.flashMs -= deltaMs;
            if (this.flashMs <= 0) this.sprite.clearTint();
        }
        switch (this.phase) {
            case EnemyPhase.Alive:
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

    private chase(deltaMs: number, world: EnemyWorld): void {
        const dx = world.targetX - this.x;
        const dy = world.targetY - this.y;
        const distance = Math.hypot(dx, dy);
        const seconds = deltaMs / 1000;
        let vx = this.pushX + this.knockX;
        let vy = this.pushY + this.knockY;
        const fade = Math.exp(-ENEMY_KNOCKBACK_DECAY * seconds);
        this.knockX *= fade;
        this.knockY *= fade;
        const inReach = this.inReach(dx, dy, distance, world.targetRadius);
        this.cooldownMs = Math.max(0, this.cooldownMs - deltaMs);
        let facingX = dx;
        let facingY = dy;
        let wanted = MonsterState.Move;

        if (this.attackLeftMs > 0) {
            // Attacking: stands still (only pushes and knockback move it) until the animation ends.
            this.updateAttack(deltaMs, inReach);
            wanted = MonsterState.Attack;
        } else if (this.fleeMs > 0) {
            // Running away from the player (hit-and-run or scared at low health).
            this.fleeMs -= deltaMs;
            if (distance > 0) {
                vx -= (dx / distance) * this.speed;
                vy -= (dy / distance) * this.speed;
            }
            facingX = -dx;
            facingY = -dy;
        } else if (this.chargeMs > 0 && !(inReach && this.cooldownMs <= 0)) {
            this.chargeMs -= deltaMs;
            vx += this.chargeX;
            vy += this.chargeY;
            facingX = this.chargeX;
            facingY = this.chargeY;
        } else if (inReach) {
            if (this.cooldownMs <= 0) {
                this.startAttack(dx, dy);
                wanted = MonsterState.Attack;
            } else {
                // Waits its action time facing the player.
                wanted = MonsterState.Idle;
            }
        } else if (distance > world.targetRadius + this.def.radius) {
            vx += (dx / distance) * this.speed;
            vy += (dy / distance) * this.speed;
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
            const step = this.speed * seconds;
            const sideX = (-vy / Math.hypot(vx, vy)) * step * this.sideBias;
            const sideY = (vx / Math.hypot(vx, vy)) * step * this.sideBias;
            if (!moveAxis(this, sideX, 0, map, area, half, false) && !moveAxis(this, 0, sideY, map, area, half, false)) {
                this.sideBias = -this.sideBias;
            }
        }
    }

    /**
     * Melee monsters (range 1) must touch the player; the others hit from `attackRange` tiles away (measured on each
     * axis, like the original server).
     */
    private inReach(dx: number, dy: number, distance: number, targetRadius: number): boolean {
        if (this.def.attackRange <= 1) return distance <= targetRadius + this.def.radius + MONSTER_ATTACK.reach;
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

    /** The blow lands on frame 2, if the player is still within reach (archers shoot instead). */
    private updateAttack(deltaMs: number, inReach: boolean): void {
        this.attackLeftMs -= deltaMs;
        if (this.hitInMs >= 0) {
            this.hitInMs -= deltaMs;
            if (this.hitInMs < 0) {
                if (this.def.attackProjectile) this.shotDamage = this.rollDamage();
                else if (inReach) this.landedDamage = Math.max(this.landedDamage, this.rollDamage());
            }
        }
        if (this.attackLeftMs <= 0) {
            this.attackLeftMs = 0;
            this.afterBlow();
            this.play(MonsterState.Move, true);
        }
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
        if (this.braveryChecked || this.hp > this.def.maxHp * MONSTER_AI.lowHealthShare) return;
        this.braveryChecked = true;
        if (Phaser.Math.Between(1, this.def.bravery) <= MONSTER_AI.braveryRoll) {
            this.fleeMs = MONSTER_AI.lowHealthFleeActions * this.def.actionTimeMs;
        }
    }

    /** One blow: the original dice, compressed for our health scale (data/enemies.ts → MONSTER_DAMAGE), softer for bosses. */
    private rollDamage(): number {
        const [count, sides] = this.def.damageDice;
        let roll = 0;
        for (let i = 0; i < count; i++) roll += Phaser.Math.Between(1, sides);
        const average = (count * (sides + 1)) / 2;
        const blow = MONSTER_DAMAGE.scale * average ** MONSTER_DAMAGE.exponent * (roll / average);
        return Math.max(1, Math.round(blow * (this.def.damageScale ?? 1)));
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

    private setActive(active: boolean): void {
        this.sprite.setActive(active).setVisible(active);
        this.shadow?.setActive(active).setVisible(active);
        if (!active) this.sprite.anims.stop();
    }
}
