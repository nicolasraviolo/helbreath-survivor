// Tótems (Fase 16B): cada cierto tiempo aparece uno en un sitio libre al azar de la zona de juego, con un sonido, y
// avisa al juego cuando el jugador lo pisa. Qué hace cada uno lo decide GameScene. Números en data/totems.ts.
import Phaser from 'phaser';
import { TILE_SIZE } from '../config/gameConfig';
import { getTotem, TOTEM_APPEAR_SOUND, TOTEM_IDS, TOTEM_SPAWN, type TotemId } from '../data/totems';
import { Totem } from '../entities/Totem';
import type { HBMap } from '../hb/HBMap';
import { Pool } from '../utils/Pool';
import type { AudioSystem } from './AudioSystem';

export class TotemSystem {
    /** Off after the final boss and while the player is dead: the timer stops too. */
    public enabled = true;
    private readonly totems: Pool<Totem>;
    private readonly finished: Totem[] = [];
    private nextInMs: number = TOTEM_SPAWN.firstAtMs;

    constructor(
        scene: Phaser.Scene,
        private readonly map: HBMap,
        /** Play area in world px. */
        private readonly area: Phaser.Geom.Rectangle,
        private readonly audio: AudioSystem,
        private readonly onCollect: (id: TotemId) => void,
    ) {
        this.totems = new Pool(() => new Totem(scene));
    }

    /** Totems on the ground (for the minimap). */
    public get active(): readonly Totem[] {
        return this.totems.active;
    }

    /** Puts a totem at (x, y) (debug: ?debug=totems), with its sound. */
    public place(id: TotemId, x: number, y: number): void {
        this.totems.acquire().place(id, x, y);
        this.audio.play(TOTEM_APPEAR_SOUND);
    }

    /** Ages the totems, picks up the one the player at (x, y) (feet) steps on, and makes new ones appear. */
    public update(deltaMs: number, x: number, y: number, canCollect: boolean): void {
        for (const totem of this.totems.active) {
            if (canCollect && totem.isSteppedOn(x, y)) {
                this.onCollect(totem.id);
                this.finish(totem);
            } else if (!totem.update(deltaMs)) {
                this.finish(totem);
            }
        }
        // Released after the loop: releasing reorders `active` while we iterate it.
        for (const totem of this.finished) this.totems.release(totem);
        this.finished.length = 0;

        if (!this.enabled || (this.nextInMs -= deltaMs) > 0) return;
        this.nextInMs = TOTEM_SPAWN.everyMs;
        if (this.totems.active.length >= TOTEM_SPAWN.maxAlive) return;
        const point = this.findPoint(x, y);
        if (point) this.place(this.pickId(), point.x, point.y);
        else this.nextInMs = TOTEM_SPAWN.retryMs;
    }

    private finish(totem: Totem): void {
        totem.deactivate();
        this.finished.push(totem);
    }

    /** At random by weight, preferring one that is not already on the ground. */
    private pickId(): TotemId {
        const onGround = new Set(this.totems.active.map((totem) => totem.id));
        const choices = TOTEM_IDS.filter((id) => !onGround.has(id));
        const pool = choices.length > 0 ? choices : TOTEM_IDS;
        let roll = Math.random() * pool.reduce((sum, id) => sum + getTotem(id).weight, 0);
        for (const id of pool) {
            roll -= getTotem(id).weight;
            if (roll < 0) return id;
        }
        return pool[0] ?? 'berserk';
    }

    /**
     * A tile centre inside the play area, at a fair distance from the player, whose tile and the ones around it can be
     * walked on (so the stone never stands in a wall and the player can reach it).
     */
    private findPoint(playerX: number, playerY: number): { x: number; y: number } | undefined {
        const { minDistance, maxDistance, tries } = TOTEM_SPAWN;
        const area = this.area;
        for (let i = 0; i < tries; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Phaser.Math.FloatBetween(minDistance, maxDistance);
            const tx = Math.floor((playerX + Math.cos(angle) * distance) / TILE_SIZE);
            const ty = Math.floor((playerY + Math.sin(angle) * distance) / TILE_SIZE);
            const x = (tx + 0.5) * TILE_SIZE;
            const y = (ty + 0.5) * TILE_SIZE;
            // One tile of margin inside the play area.
            if (x < area.left + TILE_SIZE || x > area.right - TILE_SIZE || y < area.top + TILE_SIZE || y > area.bottom - TILE_SIZE) continue;
            if (this.isOpenAround(tx, ty)) return { x, y };
        }
        return undefined;
    }

    private isOpenAround(tx: number, ty: number): boolean {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (!this.map.isWalkableTile(tx + dx, ty + dy)) return false;
            }
        }
        return true;
    }
}
