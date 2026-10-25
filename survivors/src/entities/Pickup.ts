// Objeto en el suelo (poción, imán o cofre), reciclable con un pool (regla 5). Se queda quieto hasta que el jugador
// lo toca (o el imán lo atrae: vuela hacia él como las gemas). Si tiene vida limitada, parpadea al final y desaparece;
// los cofres no caducan.
import type Phaser from 'phaser';
import { DEPTH_GEMS } from '../config/gameConfig';
import { GEM_FLY_ACCELERATION, GEM_FLY_MAX_SPEED, GEM_FLY_START_SPEED } from '../data/leveling';
import { PICKUP_BLINK_MS, PICKUP_BLINK_PERIOD_MS, PICKUPS, type PickupId } from '../data/pickups';
import { getSheetKey } from '../hb/HBSprite';
import type { Poolable } from '../utils/Pool';
import { smoothSprite } from '../hb/XbrPipeline';

export class Pickup implements Poolable {
    public poolIndex = -1;
    public x = 0;
    public y = 0;
    public id: PickupId = 'potion';
    /** Pulled by the Magnet: flies to the player and no longer expires. */
    public flying = false;
    private speed = 0;
    /** Time left on the ground; Infinity for pickups that never disappear. */
    private lifeLeftMs = 0;
    private readonly image: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene) {
        // Just under the XP gems, so a gem on top of a potion still shows.
        this.image = smoothSprite(scene.add.image(0, 0, '__DEFAULT')).setDepth(DEPTH_GEMS - 1).setActive(false).setVisible(false);
    }

    public drop(id: PickupId, x: number, y: number): void {
        const def = PICKUPS[id];
        this.id = id;
        this.x = x;
        this.y = y;
        this.flying = false;
        this.speed = GEM_FLY_START_SPEED;
        this.lifeLeftMs = 'lifeMs' in def ? def.lifeMs : Number.POSITIVE_INFINITY;
        this.image.setTexture(getSheetKey('item.ground', def.sheet), def.frame).setScale(def.scale)
            .setPosition(x, y).setAlpha(1).setActive(true).setVisible(true);
    }

    /** Counts down its life. Returns false once it has expired. */
    public update(deltaMs: number): boolean {
        if (this.flying) return true;
        if (this.lifeLeftMs === Number.POSITIVE_INFINITY) return true;
        this.lifeLeftMs -= deltaMs;
        if (this.lifeLeftMs <= 0) return false;
        const blinking = this.lifeLeftMs < PICKUP_BLINK_MS && Math.floor(this.lifeLeftMs / PICKUP_BLINK_PERIOD_MS) % 2 === 0;
        this.image.setAlpha(blinking ? 0.3 : 1);
        return true;
    }

    /** One step towards (tx, ty), speeding up like the XP gems. */
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
        this.image.setPosition(this.x, this.y).setAlpha(1);
    }

    public deactivate(): void {
        this.image.setActive(false).setVisible(false);
    }
}
