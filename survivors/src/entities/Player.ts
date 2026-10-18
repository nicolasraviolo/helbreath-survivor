// El jugador: posición libre en píxeles (sus pies), movimiento con choque contra el mapa,
// vida con invulnerabilidad tras un golpe. El dibujo por capas lo hace CharacterSprite.
import Phaser from 'phaser';
import { MOVE_DIRECTIONS, PLAYER_BLINK_MS } from '../config/gameConfig';
import type { CharacterLook } from '../data/appearance';
import type { CharacterDef } from '../data/characters';
import type { HBMap } from '../hb/HBMap';
import { Direction, directionFromVector } from '../hb/directions';
import { PlayerState, type GearLayer, type GearSlot } from '../hb/playerAppearance';
import { settings, SETTINGS_CHANGED } from '../systems/Settings';
import { canStandAt, moveAxis } from '../utils/collision';
import { CharacterSprite } from './CharacterSprite';

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
    public hp: number;
    /** Changes with Vit and level: use setMaxHp. */
    public maxHp: number;
    /** Multiplies the character's speed (Dex). */
    public speedMultiplier = 1;
    /** Debug: ignores all damage. Change it with setGodMode so the player shows it. */
    public godMode = false;
    private readonly body: CharacterSprite;
    private readonly healthBar: Phaser.GameObjects.Graphics;
    private readonly bounds = new Phaser.Geom.Rectangle();
    private invulnerableMs = 0;
    private readonly snapped = new Phaser.Math.Vector2();
    /** Time left of the current melee swing animation. */
    private swingLeftMs = 0;
    /** Time left standing still at the start of a swing (until the blow lands), as in the original. */
    private rootLeftMs = 0;

    constructor(
        scene: Phaser.Scene,
        public x: number,
        public y: number,
        public readonly def: CharacterDef,
        public readonly look: CharacterLook,
        private readonly map: HBMap,
        /** Playable rectangle in pixels; the feet never leave it. */
        private readonly area: Phaser.Geom.Rectangle,
    ) {
        this.maxHp = def.baseHp;
        this.hp = this.maxHp;
        this.body = new CharacterSprite(scene, def, look);
        this.healthBar = scene.make.graphics({}, false);
        this.container = scene.add.container(x, y, [this.body.container, this.healthBar]);
        this.drawHealthBar();
        // Settings → "Health bar over player": shows or hides it at once.
        const onSettings = () => this.healthBar.setVisible(settings.current.showPlayerHealthBar && !this.isDead);
        onSettings();
        settings.on(SETTINGS_CHANGED, onSettings);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => settings.off(SETTINGS_CHANGED, onSettings));
    }

    public get state(): PlayerState {
        return this.body.state;
    }

    public get direction(): Direction {
        return this.body.direction;
    }

    /** True while standing still at the start of a swing. */
    public get isRooted(): boolean {
        return this.rootLeftMs > 0;
    }

    public get isDead(): boolean {
        return this.state === PlayerState.Die;
    }

    /** Time since death in milliseconds (0 while alive). */
    public get deadForMs(): number {
        return this.isDead ? this.body.stateTime : 0;
    }

    /** Moves with a 0..1 input vector, then updates animation, layer order and depth. */
    public update(input: Readonly<Phaser.Math.Vector2>, deltaMs: number): void {
        const move = snapToDirections(input, this.snapped);
        this.body.update(deltaMs);
        if (this.isDead) {
            return;
        }

        this.swingLeftMs = Math.max(0, this.swingLeftMs - deltaMs);
        this.rootLeftMs = Math.max(0, this.rootLeftMs - deltaMs);
        const moving = move.lengthSq() > 0 && this.rootLeftMs === 0;
        // Once the blow has landed, moving cuts the rest of the swing so the character runs instead of sliding.
        if (moving && this.swingLeftMs > 0) this.swingLeftMs = 0;
        if (this.swingLeftMs === 0) {
            const newState = moving ? PlayerState.Run : PlayerState.IdleCombat;
            this.body.setPose(newState, directionFromVector(move.x, move.y) ?? this.direction);
        }

        if (moving) {
            const distance = (this.def.speed * this.speedMultiplier * deltaMs) / 1000;
            const half = this.def.hitboxHalfSize;
            moveAxis(this, move.x * distance, 0, this.map, this.area, half, true);
            moveAxis(this, 0, move.y * distance, this.map, this.area, half, true);
        }

        this.updateInvulnerability(deltaMs);
        this.regenerate(deltaMs);
        this.container.setPosition(this.x, this.y).setDepth(this.y);
    }

    /**
     * Plays a melee swing or a cast (`action`) towards a direction for `durationMs`. The player stands still for
     * `rootMs` (until the blow lands or the spell leaves) and then may run again, which cuts the rest of the animation.
     */
    public act(action: PlayerState.Melee | PlayerState.Cast | PlayerState.Hurt, direction: Direction, durationMs: number, rootMs: number): void {
        if (this.isDead) return;
        this.swingLeftMs = durationMs;
        this.rootLeftMs = rootMs;
        this.body.actionDurationMs = durationMs;
        // Restart the animation even if the previous one was still showing.
        this.body.setPose(PlayerState.IdleCombat, direction);
        this.body.setPose(action, direction);
    }

    /** Additive colour glow over the player (Berserk); undefined removes it. */
    public setGlow(color: number | undefined, alpha = 1): void {
        this.body.setGlow(color, alpha);
    }

    /** Health healed by itself each second (from Vit: CharacterStats.hpRegenPerSecond). */
    public regenPerSecond = 0;
    /** Healing gathered but not yet applied (health goes up one whole point at a time). */
    private regenCarry = 0;

    /** Heals up to the maximum. */
    public heal(amount: number): void {
        if (this.isDead) return;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.drawHealthBar();
    }

    /** Slow healing from Vit, a whole point at a time. Nothing gathers while at full health. */
    private regenerate(deltaMs: number): void {
        if (this.hp >= this.maxHp) {
            this.regenCarry = 0;
            return;
        }
        this.regenCarry += (this.regenPerSecond * deltaMs) / 1000;
        const whole = Math.floor(this.regenCarry);
        if (whole <= 0) return;
        this.regenCarry -= whole;
        this.heal(whole);
    }

    /** Changes the weapon or a piece of armor drawn on the player (undefined takes it off). */
    public setGear(slot: GearSlot, layer: GearLayer | undefined): void {
        this.body.setLayer(slot, layer);
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

    /** Continue (saved run): the health it had, within 1..maxHp. */
    public restoreHp(value: number): void {
        this.hp = Phaser.Math.Clamp(Math.round(value), 1, this.maxHp);
        this.drawHealthBar();
    }

    /** Debug invincibility, shown as a golden tint on every layer. */
    public setGodMode(enabled: boolean): void {
        this.godMode = enabled;
        this.body.setTint(enabled ? GOD_MODE_TINT : undefined);
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
        this.body.setPose(PlayerState.Die, this.direction);
        this.invulnerableMs = 0;
        this.container.setAlpha(1);
        this.healthBar.setVisible(false);
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
}

/** Keeps the input's strength but turns it to the nearest of MOVE_DIRECTIONS directions (0 = untouched). */
function snapToDirections(input: Readonly<Phaser.Math.Vector2>, out: Phaser.Math.Vector2): Readonly<Phaser.Math.Vector2> {
    const length = input.length();
    if (MOVE_DIRECTIONS <= 0 || length === 0) return input;
    const step = (Math.PI * 2) / MOVE_DIRECTIONS;
    const angle = Math.round(Math.atan2(input.y, input.x) / step) * step;
    return out.setTo(Math.cos(angle) * length, Math.sin(angle) * length);
}
