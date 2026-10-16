// Enemigo ligero y reciclable: un sprite animado (más su sombra) que persigue al jugador.
// Lo crea y lo recicla EnemySystem; aquí solo vive su comportamiento.
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
    MONSTER_SHADOW_SCALE_Y,
} from '../config/gameConfig';
import type { EnemyDef } from '../data/enemies';
import { HBAsset } from '../hb/HBAsset';
import type { HBMap } from '../hb/HBMap';
import { getSheetKey } from '../hb/HBSprite';
import { Direction, directionFromVector } from '../hb/directions';
import { MONSTER_SHEET_BASE, MonsterState, monsterFrameRate } from '../hb/monsterSheets';
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
    private state = MonsterState.Move;
    /** Which way to go around walls (+1 / -1), flipped when that way is blocked too. */
    private sideBias = 1;
    private timerMs = 0;

    constructor(scene: Phaser.Scene, public readonly def: EnemyDef) {
        this.sprite = scene.add.existing(new HBAsset(scene, 0, 0, def.sprite));
        if (def.hasShadow) {
            this.shadow = scene.add.sprite(0, 0, getSheetKey(def.sprite, 0), '0')
                .setTint(0x000000)
                .setAlpha(MONSTER_SHADOW_ALPHA)
                .setRotation(MONSTER_SHADOW_ROTATION)
                .setScale(1, MONSTER_SHADOW_SCALE_Y)
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
        this.phase = EnemyPhase.Alive;
        this.pushX = 0;
        this.pushY = 0;
        this.knockX = 0;
        this.knockY = 0;
        this.flashMs = 0;
        this.sprite.clearTint();
        this.sideBias = Math.random() < 0.5 ? 1 : -1;
        this.sprite.setAlpha(1);
        this.setActive(true);
        this.play(MonsterState.Move, true);
        this.syncDisplay();
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
        this.flashMs = ENEMY_HIT_FLASH_MS;
        this.sprite.setTintFill(0xffffff);
        const dx = this.x - fromX;
        const dy = this.y - fromY;
        const distance = Math.hypot(dx, dy);
        if (distance > 0) {
            this.knockX += (dx / distance) * knockback;
            this.knockY += (dy / distance) * knockback;
        }
        if (this.hp > 0) return false;
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
                    this.sprite.setAlpha(Math.max(0, 1 - fade));
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
        if (distance > world.targetRadius + this.def.radius) {
            vx += (dx / distance) * this.def.speed;
            vy += (dy / distance) * this.def.speed;
        }

        const facing = directionFromVector(dx, dy);
        if (facing !== undefined && facing !== this.direction) {
            this.direction = facing;
            this.play(MonsterState.Move, false);
        }

        if (vx === 0 && vy === 0) return;
        const { map, area } = world;
        const half = ENEMY_WALL_HALF_SIZE;
        const movedX = moveAxis(this, vx * seconds, 0, map, area, half, false);
        const movedY = moveAxis(this, 0, vy * seconds, map, area, half, false);
        if (!movedX && !movedY) {
            // Stuck against a wall: walk sideways along it (perpendicular to the wanted direction).
            const step = this.def.speed * seconds;
            const sideX = (-vy / Math.hypot(vx, vy)) * step * this.sideBias;
            const sideY = (vx / Math.hypot(vx, vy)) * step * this.sideBias;
            if (!moveAxis(this, sideX, 0, map, area, half, false) && !moveAxis(this, 0, sideY, map, area, half, false)) {
                this.sideBias = -this.sideBias;
            }
        }
    }

    private play(state: MonsterState, restart: boolean): void {
        this.state = state;
        const baseSheet = MONSTER_SHEET_BASE[state];
        if (restart) this.sprite.anims.stop();
        this.sprite.playDirectional({
            baseSheet,
            direction: this.direction,
            frameRate: monsterFrameRate(this.sprite.scene.anims, getSheetKey(this.def.sprite, baseSheet + this.direction),
                DEFAULT_ANIMATION_FRAME_RATE, this.def.temporalCoefficient),
            loop: state === MonsterState.Move,
        });
    }

    /** Moves sprite and shadow to the logical position; the shadow copies the current frame. */
    private syncDisplay(): void {
        this.sprite.setPosition(this.x, this.y).setDepth(this.y);
        const shadow = this.shadow;
        if (!shadow || this.state !== MonsterState.Move) return;
        const frame = this.sprite.frame;
        if (shadow.frame !== frame) {
            shadow.setTexture(frame.texture.key, frame.name);
            // setTexture applies the frame's custom pivot; the shadow pivots on the frame's bottom centre.
            shadow.setOrigin(0.5, 1);
        }
        // Bottom centre of the drawn frame (sp-client ShadowManager).
        const left = this.x - frame.pivotX * frame.width;
        const top = this.y - frame.pivotY * frame.height;
        shadow.setPosition(left + frame.width / 2, top + frame.height);
    }

    private setActive(active: boolean): void {
        this.sprite.setActive(active).setVisible(active);
        this.shadow?.setActive(active).setVisible(active);
        if (!active) this.sprite.anims.stop();
    }
}
