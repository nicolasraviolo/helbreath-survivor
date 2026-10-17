// Ported from sp-client/src/game/assets/HBMap.ts (renderMapTiles / renderMapObjects),
// GameAsset.applyShadowIfTree and the tree transparency of GameWorld.ts (MIT, Erko Knoll)
//
// Dibuja una región del mapa:
// - Suelo: todas las casillas distintas se copian a un único tileset y se pintan con UNA capa Tilemap.
// - Objetos (árboles…): una imagen por objeto, ordenada por su Y en píxeles para que el jugador
//   pase por delante o por detrás. Las sombras de los árboles van pegadas al suelo.
// - Si un objeto tapa al jugador, se vuelve semitransparente.
// - Fase 11: los árboles grandes se pueden volver siempre transparentes o quitar (Settings → Large Trees).
import Phaser from 'phaser';
import {
    DEPTH_GROUND,
    DEPTH_GROUND_SHADOWS,
    MAP_OBJECT_FADE_ALPHA,
    TILE_ANCHOR_OFFSET,
    TILE_SIZE,
    TREE_SHADOW_ALPHA,
    TREE_TRANSPARENT_ALPHA,
} from '../config/gameConfig';
import type { TreeMode } from '../config/settings';
import type { TileRect } from '../data/maps';
import { IGNORED_OBJECT_SPRITES, TREE_SHADOW_OFFSET, isTreeSpriteIndex, type HBMap } from './HBMap';
import { getTileTextureKey } from './mapAssets';

const TILESET_COLUMNS = 64;
/** sp-client draws tree shadows 16 px right and down from the tree. */
const TREE_SHADOW_OFFSET_PX = 16;
/** Tiles around the player searched for objects that may cover it (objects reach far upwards). */
const FADE_SEARCH_X = 4;
const FADE_SEARCH_DOWN = 8;

export class MapView {
    /** Drawn objects by map tile index, used to find the ones near the player. */
    private readonly objects = new Map<number, Phaser.GameObjects.Image>();
    private readonly faded = new Set<Phaser.GameObjects.Image>();
    private readonly trees = new Set<Phaser.GameObjects.Image>();
    private readonly treeShadows: Phaser.GameObjects.Image[] = [];
    private treeMode: TreeMode = 'on';
    private readonly bounds = new Phaser.Geom.Rectangle();

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly map: HBMap,
        groundArea: TileRect,
        objectArea: TileRect,
    ) {
        this.renderGround(groundArea);
        this.renderObjects(clampToMap(objectArea, map));
    }

    /** Shows large trees (and their shadows) as drawn, always see-through, or not at all. */
    public setTreeMode(mode: TreeMode): void {
        if (mode === this.treeMode) return;
        this.treeMode = mode;
        const visible = mode !== 'off';
        const alpha = mode === 'transparent' ? TREE_TRANSPARENT_ALPHA : 1;
        for (const tree of this.trees) {
            tree.setVisible(visible).setAlpha(this.faded.has(tree) ? Math.min(alpha, MAP_OBJECT_FADE_ALPHA) : alpha);
        }
        for (const shadow of this.treeShadows) {
            shadow.setVisible(visible).setAlpha(TREE_SHADOW_ALPHA * alpha);
        }
    }

    /** Fades objects drawn in front of the player whose image overlaps the player's bounds. */
    public updateFading(playerDepth: number, playerBounds: Phaser.Geom.Rectangle): void {
        const tx = Math.floor(playerBounds.centerX / TILE_SIZE);
        const ty = Math.floor(playerDepth / TILE_SIZE);
        const nowFaded = new Set<Phaser.GameObjects.Image>();

        for (let y = ty; y <= ty + FADE_SEARCH_DOWN; y++) {
            for (let x = tx - FADE_SEARCH_X; x <= tx + FADE_SEARCH_X; x++) {
                if (!this.map.isInside(x, y)) continue;
                const object = this.objects.get(this.map.index(x, y));
                if (!object || object.depth <= playerDepth) continue;
                if (Phaser.Geom.Intersects.RectangleToRectangle(object.getBounds(this.bounds), playerBounds)) {
                    nowFaded.add(object);
                }
            }
        }

        for (const object of this.faded) {
            if (!nowFaded.has(object)) object.setAlpha(this.restingAlpha(object));
        }
        for (const object of nowFaded) {
            object.setAlpha(Math.min(this.restingAlpha(object), MAP_OBJECT_FADE_ALPHA));
        }
        this.faded.clear();
        nowFaded.forEach((object) => this.faded.add(object));
    }

    /** Alpha of an object while it doesn't hide the player. */
    private restingAlpha(object: Phaser.GameObjects.Image): number {
        return this.treeMode === 'transparent' && this.trees.has(object) ? TREE_TRANSPARENT_ALPHA : 1;
    }

    private renderGround(area: TileRect): void {
        const { map, scene } = this;
        // 1. Unique (sprite, frame) pairs → tileset cell.
        const cellByTile = new Map<number, number>();
        const frames: Phaser.Textures.Frame[] = [];
        const data: number[][] = [];

        for (let y = area.y; y < area.y + area.height; y++) {
            const row: number[] = [];
            for (let x = area.x; x < area.x + area.width; x++) {
                const i = map.index(x, y);
                const sprite = map.groundSprite[i];
                const frameIndex = map.groundFrame[i];
                const id = sprite * 10000 + frameIndex;
                let cell = cellByTile.get(id);
                if (cell === undefined) {
                    const frame = getTileFrame(scene, sprite, frameIndex);
                    cell = frame ? frames.push(frame) - 1 : -1;
                    cellByTile.set(id, cell);
                }
                row.push(cell);
            }
            data.push(row);
        }

        // 2. Copy every used frame, without pivot, into one 32x32-cell canvas.
        const rows = Math.max(1, Math.ceil(frames.length / TILESET_COLUMNS));
        const canvas = document.createElement('canvas');
        canvas.width = TILESET_COLUMNS * TILE_SIZE;
        canvas.height = rows * TILE_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context for the map tileset');
        }
        ctx.imageSmoothingEnabled = false;
        frames.forEach((frame, cell) => {
            const dx = (cell % TILESET_COLUMNS) * TILE_SIZE;
            const dy = Math.floor(cell / TILESET_COLUMNS) * TILE_SIZE;
            ctx.drawImage(frame.source.image as CanvasImageSource, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
                dx, dy, frame.cutWidth, frame.cutHeight);
        });

        const tilesetKey = 'map-ground-tileset';
        if (scene.textures.exists(tilesetKey)) {
            scene.textures.remove(tilesetKey);
        }
        scene.textures.addCanvas(tilesetKey, canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);

        // 3. One Tilemap layer for the whole region.
        const tilemap = scene.make.tilemap({ data, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
        const tileset = tilemap.addTilesetImage(tilesetKey, tilesetKey, TILE_SIZE, TILE_SIZE, 0, 0, 0);
        if (!tileset) {
            throw new Error('Failed to create the map tileset');
        }
        tilemap.createLayer(0, tileset, area.x * TILE_SIZE, area.y * TILE_SIZE)?.setDepth(DEPTH_GROUND);
    }

    private renderObjects(area: TileRect): void {
        const { map, scene } = this;
        for (let y = area.y; y < area.y + area.height; y++) {
            for (let x = area.x; x < area.x + area.width; x++) {
                const i = map.index(x, y);
                const sprite = map.objectSprite[i];
                if (sprite <= 0 || IGNORED_OBJECT_SPRITES.has(sprite)) continue;

                const frame = String(map.objectFrame[i]);
                const key = getTileTextureKey(sprite);
                if (!scene.textures.get(key).has(frame)) continue;

                // Native pivots (HBSprite.ts) place the frame relative to the tile centre.
                const px = x * TILE_SIZE + TILE_ANCHOR_OFFSET;
                const py = y * TILE_SIZE + TILE_ANCHOR_OFFSET;
                const object = scene.add.image(px, py, key, frame).setDepth(py);
                this.objects.set(i, object);

                if (isTreeSpriteIndex(sprite)) {
                    this.trees.add(object);
                    const shadowKey = getTileTextureKey(sprite + TREE_SHADOW_OFFSET);
                    if (scene.textures.get(shadowKey).has(frame)) {
                        this.treeShadows.push(scene.add.image(px + TREE_SHADOW_OFFSET_PX, py + TREE_SHADOW_OFFSET_PX, shadowKey, frame)
                            .setAlpha(TREE_SHADOW_ALPHA)
                            .setDepth(DEPTH_GROUND_SHADOWS));
                    }
                }
            }
        }
    }
}

function getTileFrame(scene: Phaser.Scene, sprite: number, frameIndex: number): Phaser.Textures.Frame | undefined {
    const key = getTileTextureKey(sprite);
    if (!scene.textures.exists(key)) return undefined;
    const texture = scene.textures.get(key);
    return texture.has(String(frameIndex)) ? texture.get(String(frameIndex)) : undefined;
}

function clampToMap(area: TileRect, map: HBMap): TileRect {
    const x = Math.max(0, area.x);
    const y = Math.max(0, area.y);
    return {
        x,
        y,
        width: Math.min(map.width, area.x + area.width) - x,
        height: Math.min(map.height, area.y + area.height) - y,
    };
}
