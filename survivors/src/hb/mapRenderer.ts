// Ported from sp-client/src/game/assets/HBMap.ts (renderMapTiles / renderMapObjects),
// GameAsset.applyShadowIfTree and the tree transparency of GameWorld.ts (MIT, Erko Knoll)
//
// Dibuja una región del mapa:
// - Suelo: todas las casillas distintas se copian a un único tileset y se pintan con UNA capa Tilemap.
// - Objetos (árboles…): una imagen por objeto, ordenada por su Y en píxeles para que el jugador
//   pase por delante o por detrás. Las sombras de los árboles van pegadas al suelo.
// - Si un objeto tapa al jugador, se vuelve semitransparente.
// - Fase 11: los árboles grandes se pueden quitar (Settings → Large Trees).
import Phaser from 'phaser';
import {
    DEPTH_GROUND,
    DEPTH_GROUND_SHADOWS,
    MAP_OBJECT_FADE_ALPHA,
    TILE_ANCHOR_OFFSET,
    TILE_SIZE,
    TREE_SHADOW_ALPHA,
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

    /** Shows large trees (and their shadows) as drawn, or not at all. */
    public setTreeMode(mode: TreeMode): void {
        if (mode === this.treeMode) return;
        this.treeMode = mode;
        const visible = mode !== 'off';
        for (const tree of this.trees) tree.setVisible(visible);
        for (const shadow of this.treeShadows) shadow.setVisible(visible);
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
            if (!nowFaded.has(object)) object.setAlpha(1);
        }
        for (const object of nowFaded) object.setAlpha(MAP_OBJECT_FADE_ALPHA);
        this.faded.clear();
        nowFaded.forEach((object) => this.faded.add(object));
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
        fillGroundHoles(ctx, frames.length);

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

/**
 * Fills the see-through pixels of the ground tiles with the colour of a solid neighbour (Fase 30A). The .spr were made
 * by turning every pixel of the sheet's top-left colour transparent (tools/PakToSprConverter), so some snow tiles came
 * out full of holes and the dark background showed through as black specks (Icebound, sheets 445–461). Nothing is
 * drawn under the ground, so the tiles can be solid. Each 32×32 cell is filled on its own, a few passes of spreading
 * from the sides, and whatever is left takes the cell's average colour.
 */
function fillGroundHoles(ctx: CanvasRenderingContext2D, cells: number): void {
    if (cells === 0) return;
    const { width, height } = ctx.canvas;
    const image = ctx.getImageData(0, 0, width, height);
    const px = image.data;
    const neighbours: ReadonlyArray<readonly [number, number]> = [[-1, 0], [0, -1], [1, 0], [0, 1]];
    for (let cell = 0; cell < cells; cell++) {
        const x0 = (cell % TILESET_COLUMNS) * TILE_SIZE;
        const y0 = Math.floor(cell / TILESET_COLUMNS) * TILE_SIZE;
        let holes = 0;
        let r = 0;
        let g = 0;
        let b = 0;
        let solid = 0;
        for (let y = y0; y < y0 + TILE_SIZE; y++) {
            for (let x = x0; x < x0 + TILE_SIZE; x++) {
                const i = (y * width + x) * 4;
                if (px[i + 3] === 0) holes++;
                else {
                    r += px[i];
                    g += px[i + 1];
                    b += px[i + 2];
                    solid++;
                }
            }
        }
        // Tiles without holes (most) are untouched; an empty cell (no solid pixel at all) too.
        if (holes === 0 || solid === 0) continue;
        for (let pass = 0; pass < TILE_SIZE && holes > 0; pass++) {
            const filled: number[] = [];
            for (let y = y0; y < y0 + TILE_SIZE; y++) {
                for (let x = x0; x < x0 + TILE_SIZE; x++) {
                    const i = (y * width + x) * 4;
                    if (px[i + 3] !== 0) continue;
                    for (const [dx, dy] of neighbours) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx < x0 || ny < y0 || nx >= x0 + TILE_SIZE || ny >= y0 + TILE_SIZE) continue;
                        const j = (ny * width + nx) * 4;
                        if (px[j + 3] === 0) continue;
                        filled.push(i, j);
                        break;
                    }
                }
            }
            if (filled.length === 0) break;
            // Copied after the scan, so a pass only spreads one pixel (no streaks in the scan direction).
            for (let k = 0; k < filled.length; k += 2) {
                const i = filled[k];
                const j = filled[k + 1];
                px[i] = px[j];
                px[i + 1] = px[j + 1];
                px[i + 2] = px[j + 2];
                px[i + 3] = 255;
                holes--;
            }
        }
        if (holes > 0) {
            for (let y = y0; y < y0 + TILE_SIZE; y++) {
                for (let x = x0; x < x0 + TILE_SIZE; x++) {
                    const i = (y * width + x) * 4;
                    if (px[i + 3] !== 0) continue;
                    px[i] = r / solid;
                    px[i + 1] = g / solid;
                    px[i + 2] = b / solid;
                    px[i + 3] = 255;
                }
            }
        }
    }
    ctx.putImageData(image, 0, 0);
}
