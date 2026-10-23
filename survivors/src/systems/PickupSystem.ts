// Objetos en el suelo: decide cuándo cae uno al morir un enemigo (los cofres los sueltan los minijefes), los recicla con un pool
// y avisa al juego cuando el jugador recoge uno. Qué hace cada objeto lo decide GameScene (curar, imán, buff).
import type Phaser from 'phaser';
import { CHEST_DROP_SOUND, PICKUP_RADIUS, PICKUPS, type PickupDef, type PickupId } from '../data/pickups';
import { Pickup } from '../entities/Pickup';
import { Pool } from '../utils/Pool';
import type { AudioSystem } from './AudioSystem';


export class PickupSystem {
    private readonly pickups: Pool<Pickup>;
    private readonly finished: Pickup[] = [];
    /** Pickups that enemies can drop, checked in this order on each kill (the Blue Potion only with mana). */
    private readonly enemyDrops: readonly PickupId[];

    constructor(scene: Phaser.Scene, private readonly audio: AudioSystem, private readonly onPickup: (id: PickupId) => void, withMana: boolean) {
        this.pickups = new Pool(() => new Pickup(scene));
        this.enemyDrops = (Object.keys(PICKUPS) as PickupId[]).filter((id) => {
            const def: PickupDef = PICKUPS[id];
            return def.dropChance > 0 && (withMana || !def.onlyWithMana);
        });
    }

    public get active(): number {
        return this.pickups.active.length;
    }

    /** A kill: maybe drops a potion or a magnet there. */
    public onKill(x: number, y: number): void {
        for (const id of this.enemyDrops) {
            if (Math.random() < PICKUPS[id].dropChance) {
                this.drop(id, x, y);
                break;
            }
        }
    }

    public drop(id: PickupId, x: number, y: number): void {
        this.pickups.acquire().drop(id, x, y);
        if (id === 'chest' || id === 'finalChest') this.audio.play(CHEST_DROP_SOUND);
    }

    /** Magnet: the pickups it pulls (potions) start flying to the player. */
    public attract(): void {
        for (const pickup of this.pickups.active) {
            const def: PickupDef = PICKUPS[pickup.id];
            if (def.magnetPulls) pickup.flying = true;
        }
    }

    /** Ages the pickups and collects the ones the player at (x, y) (feet) touches. */
    public update(deltaMs: number, x: number, y: number, canCollect: boolean): void {
        const reachSq = PICKUP_RADIUS * PICKUP_RADIUS;
        for (const pickup of this.pickups.active) {
            if (pickup.flying) pickup.flyTowards(x, y, deltaMs);
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
