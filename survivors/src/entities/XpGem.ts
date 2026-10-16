// Gema de XP en el suelo. Quieta hasta que el jugador entra en el radio del imán; entonces vuela hacia él,
// cada vez más rápido. Se recicla con un pool (regla 5). Su aspecto (esmeralda, zafiro, rubí) depende de lo que vale.
import Phaser from 'phaser';
import { DEPTH_GEMS } from '../config/gameConfig';
import { GEM_FLY_ACCELERATION, GEM_FLY_MAX_SPEED, GEM_FLY_START_SPEED, GEM_SCALE, GEM_SHEET, GEM_TIERS } from '../data/leveling';
import { getSheetKey } from '../hb/HBSprite';
import type { Poolable } from '../utils/Pool';

const GEM_TEXTURE = getSheetKey('item.ground', GEM_SHEET);

export class XpGem implements Poolable {
    public poolIndex = -1;
    public x = 0;
    public y = 0;
    public value = 0;
    public flying = false;
    private speed = 0;
    private readonly image: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene) {
        this.image = scene.add.image(0, 0, GEM_TEXTURE, firstFrame()).setScale(GEM_SCALE).setDepth(DEPTH_GEMS).setActive(false).setVisible(false);
    }

    public drop(x: number, y: number, value: number): void {
        this.x = x;
        this.y = y;
        this.flying = false;
        this.speed = GEM_FLY_START_SPEED;
        this.setValue(value);
        this.image.setPosition(x, y).setActive(true).setVisible(true);
    }

    /** Changes the value (and so the look). Used when gems are merged because there are too many. */
    public setValue(value: number): void {
        this.value = value;
        let frame = firstFrame();
        for (const tier of GEM_TIERS) {
            if (value >= tier.minValue) frame = tier.frame;
        }
        this.image.setFrame(frame);
    }

    /** Moves towards (tx, ty) once flying. */
    public flyTowards(tx: number, ty: number, deltaMs: number): void {
        const seconds = deltaMs / 1000;
        this.speed = Math.min(GEM_FLY_MAX_SPEED, this.speed + GEM_FLY_ACCELERATION * seconds);
        const dx = tx - this.x;
        const dy = ty - this.y;
        const distance = Math.hypot(dx, dy);
        const step = Math.min(distance, this.speed * seconds);
        if (distance > 0) {
            this.x += (dx / distance) * step;
            this.y += (dy / distance) * step;
        }
        this.image.setPosition(this.x, this.y);
    }

    public deactivate(): void {
        this.image.setActive(false).setVisible(false);
    }
}

function firstFrame(): number {
    return GEM_TIERS[0]?.frame ?? 0;
}
