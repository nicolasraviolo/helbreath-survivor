// Objetos en el suelo: decide cuándo cae uno (al morir un enemigo, o un cofre cada N bajas), los recicla con un pool
// y avisa al juego cuando el jugador recoge uno. Qué hace cada objeto lo decide GameScene (curar, imán, buff).
import type Phaser from 'phaser';
import { CHEST_DROP_SOUND, CHEST_EVERY_KILLS, PICKUP_RADIUS, PICKUPS, type PickupId } from '../data/pickups';
import { Pickup } from '../entities/Pickup';
import { Pool } from '../utils/Pool';
import type { AudioSystem } from './AudioSystem';

/** Pickups that enemies can drop, checked in this order on each kill. */
const ENEMY_DROPS = (Object.keys(PICKUPS) as PickupId[]).filter((id) => PICKUPS[id].dropChance > 0);

export class PickupSystem {
    private readonly pickups: Pool<Pickup>;
    private readonly finished: Pickup[] = [];
    private killsSinceChest = 0;

    constructor(scene: Phaser.Scene, private readonly audio: AudioSystem, private readonly onPickup: (id: PickupId) => void) {
        this.pickups = new Pool(() => new Pickup(scene));
    }

    public get active(): number {
        return this.pickups.active.length;
    }

    /** A kill: maybe drops a potion or a magnet there, and every CHEST_EVERY_KILLS kills a chest. */
    public onKill(x: number, y: number): void {
        for (const id of ENEMY_DROPS) {
            if (Math.random() < PICKUPS[id].dropChance) {
                this.drop(id, x, y);
                break;
            }
        }
        this.killsSinceChest++;
        if (this.killsSinceChest >= CHEST_EVERY_KILLS) {
            this.killsSinceChest = 0;
            this.drop('chest', x, y);
        }
    }

    public drop(id: PickupId, x: number, y: number): void {
        this.pickups.acquire().drop(id, x, y);
        if (id === 'chest') this.audio.play(CHEST_DROP_SOUND);
    }

    /** Ages the pickups and collects the ones the player at (x, y) (feet) touches. */
    public update(deltaMs: number, x: number, y: number, canCollect: boolean): void {
        const reachSq = PICKUP_RADIUS * PICKUP_RADIUS;
        for (const pickup of this.pickups.active) {
            const dx = pickup.x - x;
            const dy = pickup.y - y;
            if (canCollect && dx * dx + dy * dy <= reachSq) {
                this.audio.play(PICKUPS[pickup.id].pickupSound);
                this.onPickup(pickup.id);
                this.finish(pickup);
            } else if (!pickup.update(deltaMs)) {
                this.finish(pickup);
            }
        }
        // Released after the loop: releasing reorders `active` while we iterate it.
        for (const pickup of this.finished) this.pickups.release(pickup);
        this.finished.length = 0;
    }

    private finish(pickup: Pickup): void {
        pickup.deactivate();
        this.finished.push(pickup);
    }
}
