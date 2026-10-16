// Gemas de XP: las suelta cada enemigo al morir, el imán las atrae y al tocar al jugador suman experiencia.
// Si hay demasiadas en el suelo, la XP nueva se suma a una gema ya existente en lugar de crear otra.
import type Phaser from 'phaser';
import { GEM_MAGNET_RADIUS, GEM_MAX, GEM_PICKUP_RADIUS, GEM_TARGET_OFFSET_Y } from '../data/leveling';
import { XpGem } from '../entities/XpGem';
import { Pool } from '../utils/Pool';
import type { AudioSystem } from './AudioSystem';

export class XpSystem {
    private readonly gems: Pool<XpGem>;
    private readonly collected: XpGem[] = [];

    constructor(scene: Phaser.Scene, private readonly audio: AudioSystem) {
        this.gems = new Pool(() => new XpGem(scene));
    }

    public get active(): number {
        return this.gems.active.length;
    }

    public drop(x: number, y: number, value: number): void {
        const active = this.gems.active;
        if (active.length >= GEM_MAX) {
            const target = active[Math.floor(Math.random() * active.length)];
            target?.setValue(target.value + value);
            return;
        }
        this.gems.acquire().drop(x, y, value);
    }

    /** Moves the gems towards the player at (x, y) (feet) and returns the XP picked up this frame. */
    public update(deltaMs: number, x: number, y: number): number {
        const targetY = y - GEM_TARGET_OFFSET_Y;
        const magnetSq = GEM_MAGNET_RADIUS * GEM_MAGNET_RADIUS;
        const pickupSq = GEM_PICKUP_RADIUS * GEM_PICKUP_RADIUS;
        let xp = 0;
        for (const gem of this.gems.active) {
            if (!gem.flying) {
                const dx = gem.x - x;
                const dy = gem.y - targetY;
                if (dx * dx + dy * dy > magnetSq) continue;
                gem.flying = true;
            }
            gem.flyTowards(x, targetY, deltaMs);
            const dx = gem.x - x;
            const dy = gem.y - targetY;
            if (dx * dx + dy * dy <= pickupSq) {
                xp += gem.value;
                gem.deactivate();
                this.collected.push(gem);
            }
        }
        // Released after the loop: releasing reorders `active` while we iterate it.
        for (const gem of this.collected) this.gems.release(gem);
        if (this.collected.length > 0) this.audio.play('sfx.pickup');
        this.collected.length = 0;
        return xp;
    }
}
