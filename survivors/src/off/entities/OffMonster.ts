// Helbreath Off (Fase Off-2): un monstruo de un pit. Aquí está su estado (vida, casilla, modo) y su dibujo: quieto,
// andando, atacando, recibiendo un golpe y muriendo, en 8 direcciones, con su sombra y, si está marcado, su nombre y
// su barra de vida. Lo que decide qué hace está en off/systems/OffMonsterAI.ts.
// El dibujo copia el de los monstruos de Survivors (entities/Enemy.ts: play, syncDisplay), sin su forma de moverse.
// Fase Off-6B: arder y frenarse con las magias, como los de Survivors (Enemy.burn / Enemy.slow, números de
// data/elements.ts BURN y data/activeSpells.ts ICE_SLOW). Frenado o aturdido, su reloj corre más despacio (`timeScale`):
// la IA, el paso y la animación van a ese ritmo.
import Phaser from 'phaser';
import {
    BODY_SHADOW_ALPHA, BODY_SHADOW_ROTATION, BODY_SHADOW_SCALE_Y, DEFAULT_ANIMATION_FRAME_RATE, DEPTH_DAMAGE_NUMBERS,
    DEPTH_EFFECT_OFFSET, DEPTH_GROUND_SHADOWS, ENEMY_HIT_FLASH_MS, GROUND_SHADOW, MONSTER_ATTACK, TILE_SIZE,
} from '../../config/gameConfig';
import { EFFECTS } from '../../config/effects';
import { ICE_SLOW } from '../../data/activeSpells';
import { BURN } from '../../data/elements';
import { ensureGroundShadowTexture } from '../../entities/Enemy';
import { HBAsset } from '../../hb/HBAsset';
import { getSheetKey } from '../../hb/HBSprite';
import { Direction } from '../../hb/directions';
import { MONSTER_DEFAULT_FRAMES_PER_SHEET, MONSTER_SHEET_BASE, MonsterState, monsterFrameRate } from '../../hb/monsterSheets';
import { smoothSprite } from '../../hb/XbrPipeline';
import type { Poolable } from '../../utils/Pool';
import { OFF_MONSTER_LOOK } from '../config/offMonsterLook';
import { OFF_COMBAT } from '../data/offCombat';
import type { OffMonsterDef, OffMonsterId } from '../data/offMonsters';
import { TileMover, type TilePoint } from '../systems/TileMover';

/** The little fire at its feet while it burns (config/effects.ts), as Survivors' monsters. */
const BURN_FLAME_EFFECT = 'fx.burn.flame';

/** What it is doing: walking about its pit, after the player, running away, or dead. */
export type OffMonsterMode = 'wander' | 'attack' | 'flee' | 'dead';

export class OffMonster implements Poolable {
    public poolIndex = -1;
    public mover: TileMover;
    public hp = 1;
    public maxHp = 1;
    /** Experience it gives (rolled when it appears; used in Off-2B). */
    public exp = 0;
    public mode: OffMonsterMode = 'wander';
    /** Pit it belongs to (index in OFF_PITS). */
    public pit = 0;
    /** ATime plus its own 0–299 ms, rolled when it appears (server). */
    public actionTimeMs = 0;
    /** MinBravery + 0..2, rolled when it appears (server). */
    public bravery = 0;
    /** Time left before its next action, ms. */
    public waitMs = 0;
    /** Attack turns spent on the chase; at OFF_COMBAT.giveUpTurns it gives up. */
    public turns = 0;
    /** Actions left running away. */
    public fleeLeft = 0;
    /** Where it walks to while wandering. */
    public waypoint: TilePoint | undefined;
    /** Its blow, decided when the attack starts, lands after this many ms (undefined: none coming). */
    public pendingHitMs: number | undefined;
    public pendingHitLands = false;
    /** Shown with its name and health bar (under the mouse or chosen with the gamepad). */
    public marked = false;
    /** Feet on screen, px. */
    public x = 0;
    public y = 0;

    private readonly sprite: HBAsset;
    private readonly shadow: Phaser.GameObjects.Sprite | undefined;
    private readonly groundShadow: Phaser.GameObjects.Image | undefined;
    private readonly bar: Phaser.GameObjects.Graphics;
    private readonly nameText: Phaser.GameObjects.Text;
    private state = MonsterState.Idle;
    /** An attack or a flinch is showing for this long. */
    private actionLeftMs = 0;
    private flashLeftMs = 0;
    private corpseLeftMs = 0;
    private headHeight = 0;
    /** Direction of the animation playing (a turn replays it the new way). */
    private playedFacing = Direction.South;
    private readonly feet: TilePoint = { x: 0, y: 0 };
    /** Burn (Off-6B): health each layer takes per tick, time left and to the next tick; the fire at its feet. */
    private readonly burnLayers: number[] = [];
    private burnMs = 0;
    private burnTickMs = 0;
    private burnFlame: Phaser.GameObjects.Sprite | undefined;
    /** Ice (Off-6B): its clock runs at `slowFactor` for `slowMs`; a burn's stun stops it for `stunMs`. */
    private slowFactor = 1;
    private slowMs = 0;
    private stunMs = 0;

    constructor(scene: Phaser.Scene, public readonly id: OffMonsterId, public readonly def: OffMonsterDef, isFree: (x: number, y: number) => boolean) {
        const base = def.base;
        this.mover = new TileMover(isFree, 0, 0);
        this.sprite = scene.add.existing(new HBAsset(scene, 0, 0, base.sprite));
        if (base.hasShadow) {
            this.shadow = smoothSprite(scene.add.sprite(0, 0, getSheetKey(base.sprite, 0), '0'))
                .setTint(0x000000)
                .setAlpha(BODY_SHADOW_ALPHA)
                .setRotation(BODY_SHADOW_ROTATION)
                .setScale(1, BODY_SHADOW_SCALE_Y)
                .setDepth(DEPTH_GROUND_SHADOWS + 1);
        } else {
            ensureGroundShadowTexture(scene);
            const { widthPerRadius, heightPerRadius, textureWidth, textureHeight } = GROUND_SHADOW;
            this.groundShadow = scene.add.image(0, 0, GROUND_SHADOW.texture)
                .setAlpha(GROUND_SHADOW.alpha)
                .setScale((base.radius * widthPerRadius) / textureWidth, (base.radius * heightPerRadius) / textureHeight)
                .setDepth(DEPTH_GROUND_SHADOWS + 1);
        }
        this.bar = scene.add.graphics().setDepth(DEPTH_DAMAGE_NUMBERS - 1);
        const look = OFF_MONSTER_LOOK;
        this.nameText = scene.add.text(0, 0, def.name, look.nameStyle).setOrigin(0.5, 1).setDepth(DEPTH_DAMAGE_NUMBERS - 1);
        if (def.neutral) this.nameText.setColor(look.neutralColor);
        this.setVisible(false);
    }

    public get isAlive(): boolean {
        return this.mode !== 'dead';
    }

    /** Gone: dead and its body faded (the pit may put a new one). */
    public get isGone(): boolean {
        return this.mode === 'dead' && this.corpseLeftMs <= 0;
    }

    /** Appears standing on a tile with full health. */
    public spawn(pit: number, tile: TilePoint, hp: number, exp: number, actionTimeMs: number, bravery: number): void {
        this.pit = pit;
        this.mover.place(tile.x, tile.y);
        this.mover.facing = Phaser.Math.Between(0, 7) as Direction;
        this.hp = hp;
        this.maxHp = hp;
        this.exp = exp;
        this.actionTimeMs = actionTimeMs;
        this.bravery = bravery;
        this.mode = 'wander';
        this.waitMs = Phaser.Math.Between(0, actionTimeMs);
        this.turns = 0;
        this.fleeLeft = 0;
        this.waypoint = undefined;
        this.pendingHitMs = undefined;
        this.marked = false;
        this.actionLeftMs = 0;
        this.flashLeftMs = 0;
        this.corpseLeftMs = 0;
        this.extinguish();
        this.slowMs = 0;
        this.stunMs = 0;
        this.slowFactor = 1;
        this.sprite.setAlpha(1).clearTint();
        this.setVisible(true);
        this.play(MonsterState.Idle, true);
        this.sync(0);
    }

    /** Starts its attack animation looking at a tile; the blow lands `hitShare` of the way through. */
    public startAttack(towards: Direction, lands: boolean): void {
        this.mover.face(towards);
        this.actionLeftMs = this.play(MonsterState.Attack, true);
        this.pendingHitMs = this.actionLeftMs * OFF_COMBAT.hitShare;
        this.pendingHitLands = lands;
    }

    /** Takes a blow: flashes, and flinches if it is standing (no death here: see kill). */
    public hurt(damage: number): void {
        this.hp = Math.max(0, this.hp - damage);
        this.flashLeftMs = ENEMY_HIT_FLASH_MS;
        this.sprite.setTintFill(0xffffff);
        if (this.hp > 0 && !this.mover.isMoving && this.state !== MonsterState.Attack) {
            this.actionLeftMs = this.play(MonsterState.TakeDamage, true);
        }
    }

    /** Dies: falls, stays a while and fades. */
    public kill(): void {
        this.mode = 'dead';
        this.pendingHitMs = undefined;
        this.marked = false;
        this.extinguish();
        this.slowMs = 0;
        this.stunMs = 0;
        this.sprite.anims.timeScale = 1;
        this.applyTint();
        this.mover.cancel();
        this.play(MonsterState.Dead, true);
        this.corpseLeftMs = OFF_COMBAT.corpseMs + OFF_COMBAT.corpseFadeMs;
    }

    /** Hidden until the pit uses it again. */
    public hide(): void {
        this.setVisible(false);
        this.sprite.anims.stop();
    }

    /** Box around the drawn monster (clicks and the mouse pointing at it). */
    public contains(px: number, py: number): boolean {
        return this.sprite.getBounds().contains(px, py);
    }

    // ---- Burn and ice (Off-6B) ----

    /** How fast its clock runs: 0 stunned, ICE_SLOW's factor while slowed, else 1. */
    public get timeScale(): number {
        if (this.stunMs > 0) return 0;
        return this.slowMs > 0 ? this.slowFactor : 1;
    }

    public get isBurning(): boolean {
        return this.burnLayers.length > 0;
    }

    public get isSlowed(): boolean {
        return this.slowMs > 0;
    }

    /** A fire spell's hit: one more layer (up to BURN.maxStacks; then a stronger one replaces the weakest), as Enemy.burn. */
    public burn(perTick: number): void {
        if (!this.isAlive || perTick <= 0) return;
        if (this.burnLayers.length < BURN.maxStacks) {
            this.burnLayers.push(perTick);
        } else {
            const weakest = this.burnLayers.indexOf(Math.min(...this.burnLayers));
            if (perTick > (this.burnLayers[weakest] ?? 0)) this.burnLayers[weakest] = perTick;
        }
        if (this.burnMs <= 0) this.burnTickMs = BURN.tickMs;
        this.burnMs = BURN.durationMs;
        if (!this.burnFlame) {
            this.burnFlame = smoothSprite(this.sprite.scene.add.sprite(0, 0, '__DEFAULT'))
                .setAlpha(BURN.flameAlpha).setScale(BURN.flameScale).setVisible(false);
        }
        if (!this.burnFlame.visible && this.sprite.scene.anims.exists(BURN_FLAME_EFFECT)) {
            this.burnFlame.setActive(true).setVisible(true).play(BURN_FLAME_EFFECT);
        }
        this.syncBurnFlame();
    }

    /** Runs the fire: the health it took this frame (0 most frames). It may leave it at 0: the battle kills it. */
    public tickBurn(deltaMs: number): number {
        if (!this.isBurning) return 0;
        this.burnMs -= deltaMs;
        this.burnTickMs -= deltaMs;
        let damage = 0;
        if (this.burnTickMs <= 0) {
            this.burnTickMs += BURN.tickMs;
            const total = this.burnLayers.reduce((sum, layer) => sum + layer, 0);
            damage = Math.max(1, Math.round(total));
            this.hp = Math.max(0, this.hp - damage);
        }
        if (this.burnMs <= 0) this.extinguish();
        return damage;
    }

    /** The burn's moment of stun (BURN.stunChance per tick). */
    public stun(ms: number): void {
        this.stunMs = Math.max(this.stunMs, ms);
    }

    /** An ice spell's hit: its clock runs at ICE_SLOW's pace for a while, tinted blue. */
    public slow(): void {
        if (!this.isAlive) return;
        this.slowFactor = ICE_SLOW.normal.factor;
        this.slowMs = Math.max(this.slowMs, ICE_SLOW.normal.ms);
        this.applyTint();
    }

    private extinguish(): void {
        this.burnLayers.length = 0;
        this.burnMs = 0;
        this.burnFlame?.stop().setActive(false).setVisible(false);
    }

    private syncBurnFlame(): void {
        const def = EFFECTS[BURN_FLAME_EFFECT];
        this.burnFlame?.setPosition(this.x + def.offsetX * BURN.flameScale, this.y + def.offsetY * BURN.flameScale)
            .setDepth(this.y + DEPTH_EFFECT_OFFSET);
    }

    /** Its own colour: blue while slowed (not over the white flash of a blow). */
    private applyTint(): void {
        if (this.flashLeftMs > 0) return;
        if (this.isAlive && this.slowMs > 0) this.sprite.setTint(ICE_SLOW.tint);
        else this.sprite.clearTint();
    }

    /** Advances its step and its animation, and draws it where its feet are. */
    public sync(deltaMs: number): void {
        if (this.stunMs > 0) this.stunMs = Math.max(0, this.stunMs - deltaMs);
        if (this.slowMs > 0) {
            this.slowMs = Math.max(0, this.slowMs - deltaMs);
            if (this.slowMs === 0) this.applyTint();
        }
        this.sprite.anims.timeScale = this.mode === 'dead' ? 1 : this.timeScale;
        if (this.flashLeftMs > 0) {
            this.flashLeftMs -= deltaMs;
            if (this.flashLeftMs <= 0) this.applyTint();
        }
        if (this.mode === 'dead') {
            this.corpseLeftMs -= deltaMs;
            const fade = OFF_COMBAT.corpseFadeMs;
            this.sprite.setAlpha(Phaser.Math.Clamp(this.corpseLeftMs / fade, 0, 1));
            if (this.corpseLeftMs <= 0) this.hide();
        } else {
            this.actionLeftMs = Math.max(0, this.actionLeftMs - deltaMs * this.timeScale);
            const pose = this.actionLeftMs > 0 ? this.state : this.mover.isMoving ? MonsterState.Move : MonsterState.Idle;
            if (pose !== this.state || this.mover.facing !== this.playedFacing) this.play(pose, false);
        }
        this.mover.position(this.feet);
        this.x = this.feet.x * TILE_SIZE;
        this.y = this.feet.y * TILE_SIZE;
        this.sprite.setPosition(this.x, this.y).setDepth(this.y);
        this.groundShadow?.setPosition(this.x, this.y).setVisible(this.mode !== 'dead');
        this.syncShadow();
        if (this.isBurning) this.syncBurnFlame();
        this.drawMark();
    }

    private setVisible(visible: boolean): void {
        this.sprite.setActive(visible).setVisible(visible);
        this.shadow?.setVisible(visible);
        this.groundShadow?.setVisible(visible);
        if (!visible) {
            this.bar.setVisible(false);
            this.nameText.setVisible(false);
        }
    }

    /** Name and health bar over the head while marked. */
    private drawMark(): void {
        const show = this.marked && this.mode !== 'dead';
        this.bar.setVisible(show);
        this.nameText.setVisible(show);
        if (!show) return;
        const { bar, nameGap } = OFF_MONSTER_LOOK;
        const frame = this.sprite.frame;
        this.headHeight = Math.max(this.headHeight, frame.pivotY * frame.height);
        const top = this.y - this.headHeight - bar.gapAboveHead - bar.height;
        const left = this.x - bar.width / 2;
        const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
        this.bar.clear()
            .fillStyle(bar.backColor, bar.backAlpha)
            .fillRect(left - 1, top - 1, bar.width + 2, bar.height + 2)
            .fillStyle(bar.fillColor, 1)
            .fillRect(left, top, bar.width * ratio, bar.height);
        this.nameText.setPosition(this.x, top - nameGap);
    }

    /** The body shadow copies the current frame (sp-client ShadowManager), as in Survivors. */
    private syncShadow(): void {
        const shadow = this.shadow;
        if (!shadow) return;
        const hide = this.mode === 'dead' || this.state === MonsterState.TakeDamage;
        shadow.setVisible(this.sprite.visible && !hide);
        if (hide) return;
        const frame = this.sprite.frame;
        if (shadow.frame !== frame) {
            shadow.setTexture(frame.texture.key, frame.name);
            shadow.setOrigin(0.5, 1);
        }
        const left = this.x - frame.pivotX * frame.width;
        const top = this.y - frame.pivotY * frame.height;
        shadow.setPosition(left + frame.width / 2, top + frame.height);
    }

    private baseSheet(state: MonsterState): number {
        return this.special(state)?.sheet ?? MONSTER_SHEET_BASE[state];
    }

    private special(state: MonsterState) {
        const animations = this.def.base.animations;
        return state === MonsterState.Move ? animations?.move
            : state === MonsterState.Idle ? animations?.idle
            : state === MonsterState.Attack ? animations?.attack
            : state === MonsterState.Dead ? animations?.dead : undefined;
    }

    /** Plays a state in the direction it looks (as Enemy.play); returns how long it lasts, ms. */
    private play(state: MonsterState, restart: boolean): number {
        const base = this.def.base;
        this.state = state;
        const special = this.special(state);
        const baseSheet = this.baseSheet(state);
        const frames = special?.firstFrame !== undefined && special.frameCount !== undefined
            ? { first: special.firstFrame, count: special.frameCount } : undefined;
        if (restart) this.sprite.anims.stop();
        const baseRate = state === MonsterState.Attack ? MONSTER_ATTACK.frameRate * (base.attackSpeed ?? 1) : DEFAULT_ANIMATION_FRAME_RATE;
        const direction = this.mover.facing;
        this.playedFacing = direction;
        const sheetKey = getSheetKey(base.sprite, baseSheet + direction);
        const sheetFrameRate = monsterFrameRate(this.sprite.scene.anims, sheetKey, baseRate, base.temporalCoefficient);
        const frameRate = frames ? sheetFrameRate * (frames.count / MONSTER_DEFAULT_FRAMES_PER_SHEET) : sheetFrameRate;
        const loop = state === MonsterState.Move || state === MonsterState.Idle;
        this.sprite.playDirectional({ baseSheet, direction, frameRate, loop, frames });
        const frameCount = frames?.count ?? this.sprite.scene.anims.get(sheetKey)?.frames.length ?? MONSTER_DEFAULT_FRAMES_PER_SHEET;
        return (frameCount / frameRate) * 1000;
    }
}
