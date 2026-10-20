// Objeto de botín en el suelo (Fase 21A), reciclable con un pool (regla 5). Se ve con su dibujo de objeto tirado del
// original (item-ground.spr: misma hoja y frame que su icono del inventario, como sp-client GroundItem.ts; pedido por el
// propietario el 20-oct-2026) sobre un brillo dorado que late, y flota un poco. No caduca: se queda hasta que el jugador lo coge.
import Phaser from 'phaser';
import { DEPTH_GEMS } from '../config/gameConfig';
import type { Gender } from '../data/appearance';
import { itemPicture } from '../data/items';
import { LOOT_GROUND, type OwnedItem } from '../data/loot';
import { getSheetKey } from '../hb/HBSprite';
import { setColouredTexture } from '../hb/additiveTint';
import { attributeColor } from '../data/attributes';
import type { Poolable } from '../utils/Pool';

export class LootDrop implements Poolable {
    public poolIndex = -1;
    public x = 0;
    public y = 0;
    public item: OwnedItem = { id: 'dagger' };
    private ageMs = 0;
    /** The picture is set once its texture has arrived. */
    private pictureSet = false;
    private gender: Gender = 'male';
    private readonly glow: Phaser.GameObjects.Arc;
    private readonly image: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene) {
        const g = LOOT_GROUND;
        // Under the XP gems and the potions: a gem on top of it still shows.
        this.glow = scene.add.circle(0, 0, g.glowRadius, g.glowColor).setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(DEPTH_GEMS - 3).setActive(false).setVisible(false);
        this.image = scene.add.image(0, 0, '__DEFAULT').setDepth(DEPTH_GEMS - 2).setActive(false).setVisible(false);
    }

    public drop(item: OwnedItem, x: number, y: number, gender: Gender): void {
        this.item = item;
        this.x = x;
        this.y = y;
        this.gender = gender;
        this.ageMs = 0;
        this.pictureSet = false;
        this.glow.setPosition(x, y).setActive(true).setVisible(true);
        this.image.setPosition(x, y).setActive(true).setVisible(false);
        this.trySetPicture();
    }

    public update(deltaMs: number): void {
        const g = LOOT_GROUND;
        this.ageMs += deltaMs;
        if (!this.pictureSet) this.trySetPicture();
        // 0 → 1 → 0 once per pulse.
        const wave = (1 - Math.cos((this.ageMs / g.glowPulseMs) * Math.PI * 2)) / 2;
        this.glow.setAlpha(Phaser.Math.Linear(g.glowAlpha.min, g.glowAlpha.max, wave))
            .setScale(Phaser.Math.Linear(g.glowScale.min, g.glowScale.max, wave));
        this.image.setY(this.y - wave * g.bobPx);
    }

    public deactivate(): void {
        this.glow.setActive(false).setVisible(false);
        this.image.setActive(false).setVisible(false);
    }

    private trySetPicture(): void {
        const frame = itemPicture(this.item.id, this.gender);
        if (!frame) return;
        // Fase 21B: in its attribute's colour, as the original drew weapons on the ground.
        if (!setColouredTexture(this.image, getSheetKey('item.ground', frame.sheet), frame.frame, attributeColor(this.item.attribute))) return;
        this.image.setVisible(true);
        this.image.setScale(LOOT_GROUND.scale);
        this.pictureSet = true;
    }
}
