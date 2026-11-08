// Helbreath Off (Fase Off-4A): un objeto (o un montón de oro) en el suelo, en una casilla. Reciclable con un pool
// (regla 5). Se dibuja con su imagen de item-ground.spr, como el original (sin brillo), bajo los cuerpos. Parpadea al
// final de su tiempo y desaparece (off/data/offLoot.ts).
// Off-8C: sabe cuánto lleva en el suelo (`ageMs`) y si lo tiraste tú (`fromPlayer`), para que el mercenario recoja
// lo que se queda olvidado pero no lo que no querías; `mercSkip`: no le cabía, no vuelve a por él.
import { setColouredTexture } from '../../hb/additiveTint';
import type Phaser from 'phaser';
import { DEPTH_GROUND_SHADOWS, TILE_SIZE } from '../../config/gameConfig';
import type { ItemIconFrame } from '../../data/itemTypes';
import { getSheetKey } from '../../hb/HBSprite';
import { smoothSprite } from '../../hb/XbrPipeline';
import type { Poolable } from '../../utils/Pool';
import { offItemTint, type OffBagItemKey } from '../data/offItems';
import { OFF_LOOT } from '../data/offLoot';

/** What lies there: gold (an amount) or one item. */
export type OffGroundContent = { gold: number } | { item: OffBagItemKey };

export class OffGroundItem implements Poolable {
    public poolIndex = -1;
    public tileX = 0;
    public tileY = 0;
    public content: OffGroundContent = { gold: 0 };
    /** Off-8C: you dropped it from the bag (the mercenary leaves it), and the mercenary gave up on it (it didn't fit). */
    public fromPlayer = false;
    public mercSkip = false;
    private lifeLeftMs = 0;
    private readonly image: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene) {
        // Above the shadows, under every body (they are drawn at their y).
        this.image = smoothSprite(scene.add.image(0, 0, '__DEFAULT')).setDepth(DEPTH_GROUND_SHADOWS + 2).setActive(false).setVisible(false);
    }

    /** `nudge` (0, 1, 2...) moves a second or third item on the same tile a little, so all of them show. */
    public drop(content: OffGroundContent, tileX: number, tileY: number, picture: ItemIconFrame, nudge: number, fromPlayer: boolean): void {
        this.content = content;
        this.fromPlayer = fromPlayer;
        this.mercSkip = false;
        this.tileX = tileX;
        this.tileY = tileY;
        this.lifeLeftMs = OFF_LOOT.groundLifeMs;
        const nudges = OFF_LOOT.groundNudges;
        const shift = nudges[nudge % nudges.length] ?? [0, 0];
        // Off-7B: Sharp / Poison / Ancient in their colour, as in the bag.
        const sheet = getSheetKey('item.ground', picture.sheet);
        if (!setColouredTexture(this.image, sheet, picture.frame, 'item' in content ? offItemTint(content.item) : undefined)) this.image.setTexture(sheet, picture.frame);
        this.image
            .setPosition((tileX + 0.5) * TILE_SIZE + shift[0], (tileY + 0.5) * TILE_SIZE + shift[1])
            .setScale(OFF_LOOT.groundScale)
            .setAlpha(1).setActive(true).setVisible(true);
    }

    /** How long it has been on the ground. */
    public get ageMs(): number {
        return OFF_LOOT.groundLifeMs - this.lifeLeftMs;
    }

    /** Counts down its time. False once it has gone. */
    public update(deltaMs: number): boolean {
        this.lifeLeftMs -= deltaMs;
        if (this.lifeLeftMs <= 0) return false;
        const blinking = this.lifeLeftMs < OFF_LOOT.blinkMs && Math.floor(this.lifeLeftMs / OFF_LOOT.blinkPeriodMs) % 2 === 0;
        this.image.setAlpha(blinking ? 0.3 : 1);
        return true;
    }

    public deactivate(): void {
        this.image.setActive(false).setVisible(false);
    }
}
