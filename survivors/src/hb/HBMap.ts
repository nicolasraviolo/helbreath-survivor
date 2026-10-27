// Ported from sp-client/src/game/assets/HBMap.ts (MIT, Erko Knoll)
//
// Solo la lectura del .amd y las consultas de casillas. El dibujo vive en mapRenderer.ts.
// Cambios: datos en arrays planos (más ligero que un objeto por casilla) y consultas en píxeles
// para el movimiento libre.
import type { Scene } from 'phaser';
import { TILE_SIZE } from '../config/gameConfig';

const HEADER_SIZE = 256;
const FLAG_BLOCKED = 0x80;
/** Ground sprite index used for water. Not flagged as blocked, but not walkable either. */
export const WATER_SPRITE = 19;
/** Object sprites the original never draws: leftover duplicates of ground tiles. */
export const IGNORED_OBJECT_SPRITES: ReadonlySet<number> = new Set([6, 7, 9, 24]);

export class HBMap {
    public readonly width: number;
    public readonly height: number;
    public readonly groundSprite: Int16Array;
    public readonly groundFrame: Int16Array;
    public readonly objectSprite: Int16Array;
    public readonly objectFrame: Int16Array;
    private readonly flags: Uint8Array;

    constructor(buffer: ArrayBuffer) {
        const header = new TextDecoder('ascii').decode(new Uint8Array(buffer, 0, HEADER_SIZE));
        this.width = readHeaderValue(header, 'MAPSIZEX');
        this.height = readHeaderValue(header, 'MAPSIZEY');
        // Bytes per cell record (10 in every map we measured). Always read it from the header.
        const recordSize = readHeaderValue(header, 'TILESIZE');

        const count = this.width * this.height;
        this.groundSprite = new Int16Array(count);
        this.groundFrame = new Int16Array(count);
        this.objectSprite = new Int16Array(count);
        this.objectFrame = new Int16Array(count);
        this.flags = new Uint8Array(count);

        const view = new DataView(buffer);
        for (let i = 0; i < count; i++) {
            const offset = HEADER_SIZE + i * recordSize;
            this.groundSprite[i] = view.getInt16(offset, true);
            this.groundFrame[i] = view.getInt16(offset + 2, true);
            this.objectSprite[i] = view.getInt16(offset + 4, true);
            this.objectFrame[i] = view.getInt16(offset + 6, true);
            this.flags[i] = view.getUint8(offset + 8);
        }
    }

    public index(tx: number, ty: number): number {
        return ty * this.width + tx;
    }

    public isInside(tx: number, ty: number): boolean {
        return tx >= 0 && ty >= 0 && tx < this.width && ty < this.height;
    }

    /** False for tiles outside the map, blocked tiles and water. */
    public isWalkableTile(tx: number, ty: number): boolean {
        if (!this.isInside(tx, ty)) {
            return false;
        }
        const i = this.index(tx, ty);
        return (this.flags[i] & FLAG_BLOCKED) === 0 && this.groundSprite[i] !== WATER_SPRITE;
    }

    /** Marks a tile as blocked (Fase 23B: the tile a town NPC stands on). The map is cached, so it stays blocked. */
    public blockTile(tx: number, ty: number): void {
        if (this.isInside(tx, ty)) this.flags[this.index(tx, ty)] |= FLAG_BLOCKED;
    }

    /** Undoes blockTile (a captive NPC that leaves, Fase 29A: the map stays cached for the next runs). */
    public unblockTile(tx: number, ty: number): void {
        if (this.isInside(tx, ty)) this.flags[this.index(tx, ty)] &= ~FLAG_BLOCKED;
    }

    public isWalkableAtPixel(px: number, py: number): boolean {
        return this.isWalkableTile(Math.floor(px / TILE_SIZE), Math.floor(py / TILE_SIZE));
    }

    /**
     * Tile sprite indices the game draws (Fase 22E): ground inside `area`, and objects (plus tree shadows, tree + 50)
     * inside `area` grown by `objectMargin` tiles, as MapView does. Huge maps (Middleland, 524×524) only download
     * the tiles of their play area.
     */
    public requiredTileIndices(area: { x: number; y: number; width: number; height: number }, objectMargin: number): Set<number> {
        const indices = new Set<number>();
        const x0 = Math.max(0, area.x - objectMargin);
        const y0 = Math.max(0, area.y - objectMargin);
        const x1 = Math.min(this.width, area.x + area.width + objectMargin);
        const y1 = Math.min(this.height, area.y + area.height + objectMargin);
        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                const i = this.index(x, y);
                const inArea = x >= area.x && x < area.x + area.width && y >= area.y && y < area.y + area.height;
                if (inArea) indices.add(this.groundSprite[i]);
                const object = this.objectSprite[i];
                if (object > 0 && !IGNORED_OBJECT_SPRITES.has(object)) {
                    indices.add(object);
                    if (isTreeSpriteIndex(object)) {
                        indices.add(object + TREE_SHADOW_OFFSET);
                    }
                }
            }
        }
        return indices;
    }
}

// Ported from sp-client/src/utils/SpriteUtils.ts (MIT, Erko Knoll)
const TREE_FIRST = 100;
const TREE_LAST = 145;
/** The shadow of tree sprite N is tile sprite N + 50 (treeshadows.spr). */
export const TREE_SHADOW_OFFSET = 50;

export function isTreeSpriteIndex(index: number): boolean {
    return index >= TREE_FIRST && index <= TREE_LAST;
}

function readHeaderValue(header: string, name: string): number {
    const match = new RegExp(`${name}\\s*=\\s*(\\d+)`).exec(header);
    if (!match) {
        throw new Error(`Invalid .amd header: missing ${name}`);
    }
    return Number(match[1]);
}

const parsedMaps = new Map<string, HBMap>();

/** Parses a map binary loaded with `load.binary(key, …)` once and keeps it for later scenes. */
/** True once the map was read (its buffer is no longer in the cache then). Added for Fase 22A. */
export function hasMap(key: string): boolean {
    return parsedMaps.has(key);
}

export function getMap(scene: Scene, key: string): HBMap {
    let map = parsedMaps.get(key);
    if (!map) {
        const buffer: unknown = scene.cache.binary.get(key);
        if (!(buffer instanceof ArrayBuffer)) {
            throw new Error(`Missing map buffer in cache for ${key}`);
        }
        map = new HBMap(buffer);
        parsedMaps.set(key, map);
        scene.cache.binary.remove(key);
    }
    return map;
}
