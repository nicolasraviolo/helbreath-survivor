// Carga de monstruos por oleada (Fase 9): antes de jugar solo se descargan los de la primera oleada. El resto se
// descarga y prepara en segundo plano, uno a uno, en el orden en que aparecen en data/waves.ts (empezando ya en el
// menú principal). Mientras un monstruo no está listo no aparece; un jefe espera a que lo esté (y pasa delante en la
// cola). Así la descarga inicial baja mucho: los Wyverns, por ejemplo, pesan casi 4 MB cada uno.
// Es único para todo el juego: lo ya cargado sirve para todas las partidas.
// Fase 22A: la cola junta las oleadas de todos los mapas; al elegir uno (prioritize), los suyos pasan delante.
// Repartir la carga por mapa del todo es el bloque 22B.
import type Phaser from 'phaser';
import { ASSET_BASE_PATH, SPRITES, type SpriteKey } from '../config/assetManifest';
import { DEFAULT_ANIMATION_FRAME_RATE } from '../config/gameConfig';
import { BOSS_MINIONS, ENEMIES, type EnemyId } from '../data/enemies';
import type { MapId } from '../data/maps';
import { TIMELINES, type MapTimeline } from '../data/waves';
import { getSheetKey, HBSpriteFile } from '../hb/HBSprite';

const ALL_TIMELINES: readonly MapTimeline[] = Object.values(TIMELINES);

/** Monsters of the first wave of every map: loaded with everything else before the game starts. */
export const UPFRONT_ENEMIES: ReadonlySet<EnemyId> = new Set(
    ALL_TIMELINES.flatMap((timeline) => timeline.waves[0]?.enemies.map((entry) => entry.enemy) ?? []),
);

/** Sprites loaded later, during menus and play. */
export const STREAMED_SPRITES: ReadonlySet<SpriteKey> = new Set(
    streamOrder().map((id) => ENEMIES[id].sprite),
);

/** Every enemy not in a first wave, in the order it first appears (waves and events by minute) on these maps. */
function streamOrder(timelines: readonly MapTimeline[] = ALL_TIMELINES): EnemyId[] {
    const appearances: Array<{ minute: number; enemy: EnemyId }> = timelines.flatMap(({ waves, events }) => [
        ...waves.flatMap((wave) => wave.enemies.map((entry) => ({ minute: wave.fromMinute, enemy: entry.enemy }))),
        ...events.map((event) => ({ minute: event.atMinute, enemy: event.enemy })),
        // A boss's minions, with the boss.
        ...events.flatMap((event) => (BOSS_MINIONS[event.enemy]?.enemies ?? []).map((enemy) => ({ minute: event.atMinute, enemy }))),
    ]);
    appearances.sort((a, b) => a.minute - b.minute);
    const order: EnemyId[] = [];
    for (const { enemy } of appearances) {
        if (!UPFRONT_ENEMIES.has(enemy) && !order.includes(enemy)) order.push(enemy);
    }
    return order;
}

class Streamer {
    private readonly queue: EnemyId[] = streamOrder();
    private running = false;
    private game: Phaser.Game | undefined;

    /** Starts the background loading (once; later calls do nothing). */
    public start(scene: Phaser.Scene): void {
        this.game = scene.sys.game;
        if (this.running) return;
        this.running = true;
        void this.run(scene);
    }

    /** True when the monster's sprite is ready to draw. */
    public isReady(id: EnemyId): boolean {
        return this.game?.textures.exists(getSheetKey(ENEMIES[id].sprite, 0)) ?? false;
    }

    /** Moves a monster to the front of the queue (a boss that is due now). */
    public hurry(id: EnemyId): void {
        const index = this.queue.indexOf(id);
        if (index > 0) {
            this.queue.splice(index, 1);
            this.queue.unshift(id);
        }
    }

    /** A map was chosen: its monsters go first, in the order of its waves (Fase 22A). */
    public prioritize(map: MapId): void {
        const timeline = TIMELINES[map];
        if (!timeline) return;
        const mine = streamOrder([timeline]).filter((id) => this.queue.includes(id));
        const rest = this.queue.filter((id) => !mine.includes(id));
        this.queue.splice(0, this.queue.length, ...mine, ...rest);
    }

    /** Monsters still waiting to load (debug panel). */
    public get pending(): number {
        return this.queue.length;
    }

    private async run(scene: Phaser.Scene): Promise<void> {
        let id = this.queue.shift();
        while (id) {
            if (!this.isReady(id)) {
                try {
                    await loadSprite(scene, ENEMIES[id].sprite);
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
