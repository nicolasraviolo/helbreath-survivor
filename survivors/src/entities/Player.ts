// El jugador: posición libre en píxeles (sus pies), movimiento con choque contra el mapa,
// vida con invulnerabilidad tras un golpe y dibujo por capas. Todas las capas avanzan con un
// único reloj para que nunca se desincronicen.
import Phaser from 'phaser';
import { PLAYER_BLINK_MS } from '../config/gameConfig';
import type { CharacterDef } from '../data/characters';
import type { HBMap } from '../hb/HBMap';
import { Direction, directionFromVector } from '../hb/directions';
import {
    PLAYER_FRAMES_PER_DIRECTION,
    PlayerState,
    getGearRenderOrder,
    getLayerFrame,
    type GearLayer,
    type GearSlot,
} from '../hb/playerAppearance';
import { canStandAt, moveAxis } from '../utils/collision';

/** Approximate size of the drawn character, used to fade map objects that cover it. */
const VISUAL_WIDTH = 32;
const VISUAL_HEIGHT = 80;

/** Health bar over the head. */
const BAR_WIDTH = 30;
const BAR_HEIGHT = 4;
const BAR_OFFSET_Y = -74;
const BAR_BACK_COLOR = 0x200808;
const BAR_FILL_COLOR = 0xd83030;
/** Debug invincibility tint. */
const GOD_MODE_TINT = 0xffd860;

export class Player {
    public readonly container: Phaser.GameObjects.Container;
    public state = PlayerState.IdleCombat;
    public direction = Direction.South;
    public hp: number;
    /** Changes with Vit and level: use setMaxHp. */
    public maxHp: number;
    /** Multiplies the character's speed (Dex). */
    public speedMultiplier = 1;
    /** Debug: ignores all damage. Change it with setGodMode so the player shows it. */
    public godMode = false;
    private readonly layers = new Map<GearSlot, { def: GearLayer; sprite: Phaser.GameObjects.Sprite }>();
    private readonly healthBar: Phaser.GameObjects.Graphics;
    private readonly bounds = new Phaser.Geom.Rectangle();
    private animTime = 0;
    private invulnerableMs = 0;
    private shownFrame = -1;
    private orderKey = '';

    constructor(
        scene: Phaser.Scene,
        public x: number,
        public y: number,
        public readonly def: CharacterDef,
        private readonly map: HBMap,
        /** Playable rectangle in pixels; the feet never leave it. */
        private readonly area: Phaser.Geom.Rectangle,
    ) {
        this.maxHp = def.baseHp;
        this.hp = this.maxHp;
        this.container = scene.add.container(x, y);
        for (const [slot, layer] of Object.entries(def.appearance) as [GearSlot, GearLayer][]) {
            const sprite = scene.make.sprite({ x: 0, y: 0, key: '__DEFAULT' }, false);
            this.container.add(sprite);
            this.layers.set(slot, { def: layer, sprite });
        }
        this.healthBar = scene.make.graphics({}, false);
        this.container.add(this.healthBar);
        this.drawHealthBar();
        this.refresh(true);
    }

    public get isDead(): boolean {
        return this.state === PlayerState.Die;
    }

    /** Time since death in milliseconds (0 while alive). */
    public get deadForMs(): number {
        return this.isDead ? this.animTime : 0;
    }

    /** Moves with a 0..1 input vector, then updates animation, layer order and depth. */
    public update(move: Readonly<Phaser.Math.Vector2>, deltaMs: number): void {
        this.animTime += deltaMs;
        if (this.isDead) {
            this.refresh(false);
            return;
        }

        const moving = move.lengthSq() > 0;
        const newState = moving ? PlayerState.Run : PlayerState.IdleCombat;
        const newDirection = directionFromVector(move.x, move.y) ?? this.direction;
        const changed = newState !== this.state || newDirection !== this.direction;
        if (newState !== this.state) {
            this.animTime = 0;
        }
        this.state = newState;
        this.direction = newDirection;

        if (moving) {
            const distance = (this.def.speed * this.speedMultiplier * deltaMs) / 1000;
            const half = this.def.hitboxHalfSize;
            moveAxis(this, move.x * distance, 0, this.map, this.area, half, true);
            moveAxis(this, 0, move.y * distance, this.map, this.area, half, true);
        }

        this.updateInvulnerability(deltaMs);
        this.container.setPosition(this.x, this.y).setDepth(this.y);
        this.refresh(changed);
    }

    /** Applies damage unless invulnerable. Returns true if the hit landed. */
    public takeDamage(amount: number): boolean {
        if (amount <= 0 || this.isDead || this.godMode || this.invulnerableMs > 0) {
            return false;
        }
        this.hp = Math.max(0, this.hp - amount);
        this.invulnerableMs = this.def.invulnerabilityMs;
        this.drawHealthBar();
        if (this.hp === 0) {
            this.die();
        }
        return true;
    }

    /**
     * New maximum health. When it grows, current health grows by the same amount
     * (like in Helbreath when Vit goes up); `fill` heals to full instead.
     */
    public setMaxHp(value: number, fill = false): void {
        const gained = value - this.maxHp;
        this.maxHp = value;
        this.hp = fill ? value : Math.min(value, Math.max(0, this.hp + Math.max(0, gained)));
        this.drawHealthBar();
    }

    /** Debug invincibility, shown as a golden tint on every layer. */
    public setGodMode(enabled: boolean): void {
        this.godMode = enabled;
        for (const { sprite } of this.layers.values()) {
            if (enabled) sprite.setTint(GOD_MODE_TINT);
            else sprite.clearTint();
        }
    }

    public canStandAt(x: number, y: number): boolean {
        return canStandAt(this.map, this.area, x, y, this.def.hitboxHalfSize);
    }

    public getHitbox(out: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
        const h = this.def.hitboxHalfSize;
        return out.setTo(this.x - h, this.y - h, h * 2, h * 2);
    }

    /** Rough screen area covered by the character (for fading trees in front of it). */
    public getVisualBounds(): Phaser.Geom.Rectangle {
        return this.bounds.setTo(this.x - VISUAL_WIDTH / 2, this.y - VISUAL_HEIGHT, VISUAL_WIDTH, VISUAL_HEIGHT);
    }

    private die(): void {
        this.state = PlayerState.Die;
        this.animTime = 0;
        this.invulnerableMs = 0;
        this.container.setAlpha(1);
        this.healthBar.setVisible(false);
        this.refresh(true);
    }

    /** Blinks while invulnerable after a hit. */
    private updateInvulnerability(deltaMs: number): void {
        if (this.invulnerableMs <= 0) return;
        this.invulnerableMs = Math.max(0, this.invulnerableMs - deltaMs);
        const visible = this.invulnerableMs === 0 || Math.floor(this.invulnerableMs / PLAYER_BLINK_MS) % 2 === 0;
        this.container.setAlpha(visible ? 1 : 0.35);
    }

    private drawHealthBar(): void {
        const ratio = this.hp / this.maxHp;
        const left = -BAR_WIDTH / 2;
        this.healthBar.clear()
            .fillStyle(BAR_BACK_COLOR, 0.8)
            .fillRect(left - 1, BAR_OFFSET_Y - 1, BAR_WIDTH + 2, BAR_HEIGHT + 2)
            .fillStyle(BAR_FILL_COLOR, 1)
            .fillRect(left, BAR_OFFSET_Y, BAR_WIDTH * ratio, BAR_HEIGHT);
    }

    private currentFrame(): number {
        const lastFrame = PLAYER_FRAMES_PER_DIRECTION - 1;
        switch (this.state) {
            case PlayerState.Die:
                // Played once, then stays on the last frame.
                return Math.min(lastFrame, Math.floor((this.animTime * this.def.dieFrameRate) / 1000));
            case PlayerState.Run:
                return Math.floor((this.animTime * this.def.runFrameRate) / 1000) % PLAYER_FRAMES_PER_DIRECTION;
            default:
                return Math.floor((this.animTime * this.def.idleFrameRate) / 1000) % PLAYER_FRAMES_PER_DIRECTION;
        }
    }

    private refresh(force: boolean): void {
        const frame = this.currentFrame();
        if (!force && frame === this.shownFrame) {
            return;
        }
        this.shownFrame = frame;

        for (const [slot, { def, sprite }] of this.layers) {
            const layerFrame = getLayerFrame(slot, def, this.state, this.direction, frame);
            sprite.setVisible(layerFrame !== undefined);
            if (layerFrame) sprite.setTexture(layerFrame.texture, layerFrame.frame);
        }
        this.applyRenderOrder();
    }

    /** Re-stacks the layers when direction or state changes the drawing order. */
    private applyRenderOrder(): void {
        const isRunning = this.state === PlayerState.Run;
        const key = `${this.direction}-${isRunning}`;
        if (key === this.orderKey) {
            return;
        }
        this.orderKey = key;
        const order = getGearRenderOrder(this.direction, isRunning);
        for (const slot of order) {
            const layer = this.layers.get(slot);
            if (layer) this.container.bringToTop(layer.sprite);
        }
        this.container.bringToTop(this.healthBar);
    }
}
