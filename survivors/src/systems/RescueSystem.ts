// Rescate de la partida (Fase 29A; data/rescues.ts). Si el NPC de este mapa sigue secuestrado, al empezar aparece en
// un sitio libre lejos del jugador, marcado en el minimapa, con su Guard al lado. Al matar al Guard queda rescatado
// (se guarda al momento, aunque luego mueras): aviso, sonido, y el NPC se desvanece (vuelve a la ciudad).
// Sus sprites (el NPC y el Guard) se descargan aquí si faltan; el rescate aparece cuando están listos.
import Phaser from 'phaser';
import { TILE_SIZE } from '../config/gameConfig';
import type { SpriteKey } from '../config/assetManifest';
import { ENEMIES } from '../data/enemies';
import type { MapId } from '../data/maps';
import { RESCUE, RESCUES, type RescueDef } from '../data/rescues';
import { TOWN_NPCS } from '../data/town';
import type { Enemy } from '../entities/Enemy';
import { Npc } from '../entities/Npc';
import type { HBMap } from '../hb/HBMap';
import { getSheetKey } from '../hb/HBSprite';
import { loadSprite } from './AssetStreamer';
import type { AudioSystem } from './AudioSystem';
import type { EnemySystem } from './EnemySystem';
import { rescueStore } from './RescueStore';

/** The NPC faces south while held (its sheet 4). */
const CAPTIVE_DIRECTION = 4;

export class RescueSystem {
    private readonly rescue: RescueDef | undefined;
    private npc: Npc | undefined;
    private guard: Enemy | undefined;
    /** Rescued: ms since, while the NPC is still on the map (-1 = not yet). */
    private freedMs = -1;

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly map: HBMap,
        /** Play area in world px. */
        private readonly area: Phaser.Geom.Rectangle,
        /** undefined: no rescue in this run (the simulated ones). */
        mapId: MapId | undefined,
        private readonly enemies: EnemySystem,
        private readonly audio: AudioSystem,
        /** Shows a warning in the middle of the screen. */
        private readonly announce: (message: string) => void,
        /** Where the player starts (the captive stands far from it), or where to put it close by (?debug=rescue). */
        start: { x: number; y: number; near: boolean },
    ) {
        const rescue = mapId === undefined ? undefined : RESCUES[mapId];
        this.rescue = rescue && !rescueStore.isInTown(rescue.npc) ? rescue : undefined;
        if (!this.rescue) return;
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeNpc());
        const sprites: SpriteKey[] = [TOWN_NPCS[this.rescue.npc].sprite, ENEMIES.guard.sprite];
        const missing = sprites.filter((key) => !scene.textures.exists(getSheetKey(key, 0)));
        void Promise.all(missing.map((key) => loadSprite(scene, key)))
            .then(() => {
                if (scene.sys.isActive()) this.place(start.x, start.y, start.near);
            })
            .catch((error: unknown) => console.warn('RescueSystem: could not load the captive or its Guard', error));
    }

    /** The captive, for the minimap (while it is on the map). */
    public get markers(): readonly Npc[] {
        return this.npc ? [this.npc] : [];
    }

    /** A monster died: if it was the Guard, the captive is free (true: just rescued). */
    public onEnemyKilled(enemy: Enemy): boolean {
        if (!this.rescue || enemy !== this.guard) return false;
        this.guard = undefined;
        this.freedMs = 0;
        rescueStore.rescue(this.rescue.npc);
        this.audio.play(RESCUE.rescuedSound);
        this.announce(RESCUE.rescuedMessage(TOWN_NPCS[this.rescue.npc].name));
        return true;
    }

    public update(deltaMs: number): void {
        const npc = this.npc;
        if (!npc) return;
        npc.update();
        if (this.freedMs < 0) return;
        this.freedMs += deltaMs;
        const fading = this.freedMs - RESCUE.leaveAfterMs;
        if (fading <= 0) return;
        if (fading >= RESCUE.fadeMs) this.removeNpc();
        else npc.setAlpha(1 - fading / RESCUE.fadeMs);
    }

    private place(fromX: number, fromY: number, near: boolean): void {
        const rescue = this.rescue;
        if (!rescue) return;
        const tile = near ? this.findTile(fromX, fromY, 4 * TILE_SIZE, 6 * TILE_SIZE) : this.findTile(fromX, fromY, RESCUE.minDistance, RESCUE.maxDistance)
            ?? this.findTile(fromX, fromY, RESCUE.minDistance / 2, RESCUE.maxDistance);
        if (!tile) {
            console.warn('RescueSystem: no free spot for the captive');
            return;
        }
        const def = TOWN_NPCS[rescue.npc];
        this.npc = new Npc(this.scene, rescue.npc, { ...def, tile, direction: CAPTIVE_DIRECTION }, this.map);
        this.guard = this.enemies.spawnGuard('guard', this.npc.x + RESCUE.guardOffsetX, this.npc.y, rescue.guard);
        this.scene.time.delayedCall(RESCUE.startMessageDelayMs, () => this.announce(RESCUE.startMessage(def.name)));
    }

    /** A tile at that distance from (x, y), inside the play area, open around it (the Guard stands beside it). */
    private findTile(x: number, y: number, minDistance: number, maxDistance: number): { x: number; y: number } | undefined {
        const area = this.area;
        const marginTiles = 3;
        for (let i = 0; i < RESCUE.tries; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Phaser.Math.FloatBetween(minDistance, maxDistance);
            const tx = Math.floor((x + Math.cos(angle) * distance) / TILE_SIZE);
            const ty = Math.floor((y + Math.sin(angle) * distance) / TILE_SIZE);
            const px = (tx + 0.5) * TILE_SIZE;
            const py = (ty + 0.5) * TILE_SIZE;
            const margin = marginTiles * TILE_SIZE;
            if (px < area.left + margin || px > area.right - margin || py < area.top + margin || py > area.bottom - margin) continue;
            if (this.isOpenAround(tx, ty, 2)) return { x: tx, y: ty };
        }
        return undefined;
    }

    private isOpenAround(tx: number, ty: number, radius: number): boolean {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (!this.map.isWalkableTile(tx + dx, ty + dy)) return false;
            }
        }
        return true;
    }

    private removeNpc(): void {
        this.npc?.destroy(this.map);
        this.npc = undefined;
    }
}
