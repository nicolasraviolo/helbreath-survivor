// Tótem en el suelo (Fase 16B): la Mana Stone con su brillo de color a los pies, reciclable con un pool (regla 5).
// Se recoge pisando cualquier casilla que tape su dibujo (ver data/totems.ts → TOTEM_PICKUP). Si nadie la coge,
// parpadea al final de su vida y desaparece.
import Phaser from 'phaser';
import { EFFECTS, type EffectDef } from '../config/effects';
import { DEPTH_GROUND_SHADOWS, TILE_SIZE } from '../config/gameConfig';
import { PICKUP_BLINK_MS, PICKUP_BLINK_PERIOD_MS } from '../data/pickups';
import { getTotem, TOTEM_LOOK, TOTEM_PICKUP, TOTEM_SPAWN, type TotemId } from '../data/totems';
import { getSheetKey } from '../hb/HBSprite';
import type { Poolable } from '../utils/Pool';

/** Over the ground and the monster shadows, under everything that stands. */
const DEPTH_GLOW = DEPTH_GROUND_SHADOWS + 2;

export class Totem implements Poolable {
    public poolIndex = -1;
    /** Base of the stone (world px). */
    public x = 0;
    public y = 0;
    public id: TotemId = 'berserk';
    /** Colour of its glow, also used by the minimap. */
    public color = 0;
    /** Tiles where stepping picks it up, in world px. */
    public readonly zone = new Phaser.Geom.Rectangle();
    private lifeLeftMs = 0;
    private readonly stone: Phaser.GameObjects.Image;
    private readonly glow: Phaser.GameObjects.Sprite;

    constructor(scene: Phaser.Scene) {
        this.stone = scene.add.image(0, 0, getSheetKey('object.manastone', TOTEM_LOOK.sheet), 0).setActive(false).setVisible(false);
        this.glow = scene.add.sprite(0, 0, '__DEFAULT').setBlendMode(Phaser.BlendModes.ADD).setScale(TOTEM_LOOK.glowScale)
            .setDepth(DEPTH_GLOW).setActive(false).setVisible(false);
    }

    public place(id: TotemId, x: number, y: number): void {
        const def = getTotem(id);
        this.id = id;
        this.x = x;
        this.y = y;
        this.color = def.color;
        this.lifeLeftMs = TOTEM_SPAWN.lifeMs;
        // Depth by its base, like the characters: whoever stands in front of it hides it.
        this.stone.setPosition(x, y).setDepth(y).setAlpha(1).setActive(true).setVisible(true);
        const glowDef: EffectDef = EFFECTS[TOTEM_LOOK.glowEffect];
        this.glow.setPosition(x + (glowDef.offsetX ?? 0), y + (glowDef.offsetY ?? 0)).setTintFill(def.color)
            .setAlpha(TOTEM_LOOK.glowAlpha).setActive(true).setVisible(true).play(TOTEM_LOOK.glowEffect);
        this.computeZone();
    }

    /** True if feet at (x, y) stand on one of its tiles. */
    public isSteppedOn(x: number, y: number): boolean {
        return this.zone.contains(x, y);
    }

    /** Counts down its life and blinks near the end. Returns false once it has expired. */
    public update(deltaMs: number): boolean {
        this.lifeLeftMs -= deltaMs;
        if (this.lifeLeftMs <= 0) return false;
        const blinking = this.lifeLeftMs < PICKUP_BLINK_MS && Math.floor(this.lifeLeftMs / PICKUP_BLINK_PERIOD_MS) % 2 === 0;
        this.stone.setAlpha(blinking ? 0.3 : 1);
        this.glow.setAlpha(blinking ? 0.3 * TOTEM_LOOK.glowAlpha : TOTEM_LOOK.glowAlpha);
        return true;
    }

    public deactivate(): void {
        this.stone.setActive(false).setVisible(false);
        this.glow.stop().setActive(false).setVisible(false);
    }

    /**
     * The tiles the picture covers (by at least minOverlapPx on each axis), grown to minTiles × minTiles around the
     * base when the picture is smaller.
     */
    private computeZone(): void {
        const bounds = this.stone.getBounds();
        const { minOverlapPx, minTiles } = TOTEM_PICKUP;
        // First and last tile that the picture overlaps by at least minOverlapPx; always including the base's tile.
        const first = (start: number, base: number) => Math.min(Math.ceil((start + minOverlapPx) / TILE_SIZE) - 1, Math.floor(base / TILE_SIZE));
        const last = (end: number, base: number) => Math.max(Math.floor((end - minOverlapPx) / TILE_SIZE), Math.floor(base / TILE_SIZE));
        let left = first(bounds.left, this.x);
        let right = last(bounds.right, this.x);
        let top = first(bounds.top, this.y);
        let bottom = last(bounds.bottom, this.y);
        // Too small: grow towards the side where the base is closer to the edge.
        while (right - left + 1 < minTiles) {
            if (this.x - left * TILE_SIZE < (right + 1) * TILE_SIZE - this.x) left--;
            else right++;
        }
        while (bottom - top + 1 < minTiles) {
            if (this.y - top * TILE_SIZE < (bottom + 1) * TILE_SIZE - this.y) top--;
            else bottom++;
        }
        this.zone.setTo(left * TILE_SIZE, top * TILE_SIZE, (right - left + 1) * TILE_SIZE, (bottom - top + 1) * TILE_SIZE);
    }
}
