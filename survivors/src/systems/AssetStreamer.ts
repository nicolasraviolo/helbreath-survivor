// Carga de monstruos por oleada (Fase 9): antes de jugar solo se descargan los de la primera oleada. El resto se
// descarga y prepara en segundo plano, uno a uno, en el orden en que aparecen en data/waves.ts. Mientras un monstruo
// no está listo no aparece; un jefe espera a que lo esté (y pasa delante en la cola). Así la descarga inicial baja
// mucho: los Wyverns, por ejemplo, pesan casi 4 MB cada uno.
// Fase 22B: todo es por mapa. Antes del menú no se baja ningún monstruo; al elegir un mapa, MapLoadScene descarga los
// de su primera oleada y luego `start` pone en cola solo los suyos, en el orden de sus oleadas. Lo ya cargado sirve
// para todas las partidas (y para otro mapa que comparta monstruos).
import type Phaser from 'phaser';
import { ASSET_BASE_PATH, SPRITES, type SpriteKey } from '../config/assetManifest';
import { DEFAULT_ANIMATION_FRAME_RATE } from '../config/gameConfig';
import { BOSS_MINIONS, ENEMIES, type EnemyId } from '../data/enemies';
import type { MapId } from '../data/maps';
import { TIMELINES } from '../data/waves';
import { getSheetKey, HBSpriteFile } from '../hb/HBSprite';

/** Monsters of the map's first wave: downloaded by its loading screen, before the run starts. */
export function firstWaveEnemies(map: MapId): EnemyId[] {
    return [...new Set(TIMELINES[map]?.waves[0]?.enemies.map((entry) => entry.enemy) ?? [])];
}

/** The rest of the map's monsters, in the order they first appear (waves and events by minute). */
function streamOrder(map: MapId): EnemyId[] {
    const timeline = TIMELINES[map];
    if (!timeline) return [];
    const { waves, events } = timeline;
    const appearances: Array<{ minute: number; enemy: EnemyId }> = [
        ...waves.flatMap((wave) => wave.enemies.map((entry) => ({ minute: wave.fromMinute, enemy: entry.enemy }))),
        ...events.map((event) => ({ minute: event.atMinute, enemy: event.enemy })),
        // A boss's minions, with the boss.
        ...events.flatMap((event) => (BOSS_MINIONS[event.enemy]?.enemies ?? []).map((enemy) => ({ minute: event.atMinute, enemy }))),
    ];
    appearances.sort((a, b) => a.minute - b.minute);
    const first = new Set(firstWaveEnemies(map));
    const order: EnemyId[] = [];
    for (const { enemy } of appearances) {
        if (!first.has(enemy) && !order.includes(enemy)) order.push(enemy);
    }
    return order;
}

class Streamer {
    private readonly queue: EnemyId[] = [];
    private running = false;
    private scene: Phaser.Scene | undefined;

    /** A map was chosen (or a run started): its monsters are queued, replacing those of another map still waiting. */
    public start(scene: Phaser.Scene, map: MapId): void {
        this.scene = scene;
        this.queue.splice(0, this.queue.length, ...streamOrder(map).filter((id) => !this.isReady(id)));
        this.run();
    }

    /** True when the monster's sprite is ready to draw. */
    public isReady(id: EnemyId): boolean {
        return this.scene?.sys.game.textures.exists(getSheetKey(ENEMIES[id].sprite, 0)) ?? false;
    }

    /** Moves a monster to the front of the queue (a boss that is due now), adding it if it was not there (debug keys). */
    public hurry(id: EnemyId): void {
        if (this.isReady(id)) return;
        const index = this.queue.indexOf(id);
        if (index === 0) return;
        if (index > 0) this.queue.splice(index, 1);
        this.queue.unshift(id);
        this.run();
    }

    /** Monsters still waiting to load (debug panel). */
    public get pending(): number {
        return this.queue.length;
    }

    private run(): void {
        if (this.running || !this.scene) return;
        this.running = true;
        void this.loop();
    }

    private async loop(): Promise<void> {
        let id = this.queue.shift();
        while (id && this.scene) {
            if (!this.isReady(id)) {
                try {
                    await loadSprite(this.scene, ENEMIES[id].sprite);
                } catch (error) {
                    // A failed download (bad connection): try again later, after the others.
                    console.warn(`AssetStreamer: could not load ${id}, retrying later`, error);
                    this.queue.push(id);
                }
            }
            id = this.queue.shift();
        }
        this.running = false;
    }
}

/** Downloads one .spr and turns it into textures and animations (like PreloadScene, but outside the loader). */
export async function loadSprite(scene: Phaser.Scene, key: SpriteKey): Promise<void> {
    const response = await fetch(ASSET_BASE_PATH + SPRITES[key].file);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    scene.sys.game.cache.binary.add(key, await response.arrayBuffer());
    await new HBSpriteFile(key, SPRITES[key].type, DEFAULT_ANIMATION_FRAME_RATE).load(scene);
}

export const assetStreamer = new Streamer();
