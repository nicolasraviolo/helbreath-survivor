// Ported from sp-client/src/game/assets/HBSprite.ts (MIT, Erko Knoll)
//
// Lector del formato .spr de Helbreath. Cambios respecto al original:
// - Sin exportación de frames a data-URL ni tintado de items (eran para la UI de React).
// - Pivotes guardados en un mapa del módulo en lugar del registry de Phaser.
// - El pivote de cada frame se aplica de forma nativa (Frame.customPivot): cualquier
//   Sprite que muestre ese frame queda colocado correctamente sin listeners por frame.
// - La clave de textura/animación es la clave del manifest (p. ej. `enemy.orc-8`).
import type { Scene } from 'phaser';
import type { PivotData, PivotFrame } from './types';

/** Sprite category for loading/rendering (human, tiles, monster, item packs, etc.). */
export enum SpriteType {
    Human = 'Human',
    Tiles = 'Tiles',
    Monster = 'Monster',
    EquipmentPack = 'EquipmentPack',
    HairAndUndies = 'HairAndUndies',
    Bows = 'Bows',
    Weapons = 'Weapons',
    Shields = 'Shields',
    Effect = 'Effect',
    Interface = 'Interface',
    ItemPack = 'ItemPack',
    ItemGround = 'ItemGround',
}

interface DecodedSpriteImage {
    source: ImageBitmap;
    width: number;
    height: number;
    close(): void;
}

/** A single frame within a sprite sheet: rect inside the sheet PNG plus pivot offset. */
export class HBSpriteFrame {
    constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly width: number,
        public readonly height: number,
        /** Offset from the entity position to the frame's top-left corner (often negative). */
        public readonly pivotX: number,
        public readonly pivotY: number,
        public readonly textureKey: string,
        public readonly frameIndex: number,
    ) {}
}

/** A sprite sheet: one Phaser texture sliced into frames named "0", "1", ... */
export class HBSpriteSheet {
    constructor(
        scene: Scene,
        public readonly textureKey: string,
        public readonly frames: HBSpriteFrame[],
        image: DecodedSpriteImage,
        useCanvasTexture: boolean,
    ) {
        this.createTexture(scene, image, useCanvasTexture);
    }

    private createTexture(scene: Scene, image: DecodedSpriteImage, useCanvasTexture: boolean): void {
        if (scene.textures.exists(this.textureKey)) {
            return;
        }

        let texture: Phaser.Textures.Texture;

        if (useCanvasTexture) {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d', { alpha: true });
            if (!ctx) {
                throw new Error('Failed to get canvas context for texture creation');
            }
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(image.source, 0, 0);
            scene.textures.addCanvas(this.textureKey, canvas);
            texture = scene.textures.get(this.textureKey);
        } else {
            // TextureManager.create exists at runtime but is missing from Phaser's typings.
            const textureManager = scene.textures as Phaser.Textures.TextureManager & {
                create: (key: string, source: ImageBitmap, width?: number, height?: number) => Phaser.Textures.Texture | null;
            };
            texture = textureManager.create(this.textureKey, image.source, image.width, image.height)
                ?? scene.textures.get(this.textureKey);
        }

        texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

        for (const frame of this.frames) {
            const phaserFrame = texture.add(String(frame.frameIndex), 0, frame.x, frame.y, frame.width, frame.height);
            // Empty frames (0x0) have no meaningful pivot; the original also ignores them.
            if (phaserFrame && frame.width > 0 && frame.height > 0) {
                phaserFrame.customPivot = true;
                phaserFrame.pivotX = -frame.pivotX / frame.width;
                phaserFrame.pivotY = -frame.pivotY / frame.height;
            }
        }
    }
}

/** Pivots of every loaded sprite file, keyed by sprite key. Replaces the original registry storage. */
const pivotsBySpriteKey = new Map<string, PivotData>();

export function getPivotData(spriteKey: string): PivotData | undefined {
    return pivotsBySpriteKey.get(spriteKey);
}

/** Animation key for a sheet of a loaded sprite file. Matches the texture key. */
export function getSheetKey(spriteKey: string, sheetIndex: number): string {
    return `${spriteKey}-${sheetIndex}`;
}

/** Registers one looping Phaser animation per sprite sheet. Callers override repeat/frameRate at play time. */
function registerSheetAnimation(scene: Scene, sheet: HBSpriteSheet, frameRate: number): void {
    if (scene.anims.exists(sheet.textureKey) || sheet.frames.length === 0) {
        return;
    }
    scene.anims.create({
        key: sheet.textureKey,
        frames: sheet.frames.map((frame) => ({ key: sheet.textureKey, frame: String(frame.frameIndex) })),
        frameRate,
        repeat: -1,
    });
}

const HEADER_SIZE = 2;
const readInt16 = (view: DataView, offset: number) => view.getInt16(offset, true);
const readInt32 = (view: DataView, offset: number) => view.getInt32(offset, true);

/** A Helbreath .spr file: one or more sprite sheets, each a PNG plus frame rects and pivots. */
export class HBSpriteFile {
    public spriteSheets: HBSpriteSheet[] = [];

    /**
     * @param spriteKey - Key of the binary in Phaser's cache; also the texture/animation prefix.
     * @param spriteType - Tiles and Interface get no animations.
     * @param frameRate - Default frame rate of the generated animations.
     * @param tileStartIndex - For map tiles: textures are named `map-tile-{tileStartIndex + sheet}`.
     */
    constructor(
        public readonly spriteKey: string,
        public readonly spriteType: SpriteType,
        private readonly frameRate: number,
        public readonly tileStartIndex?: number,
    ) {}

    /** Parses the binary from cache, creates textures, pivots and animations, then frees the buffer. */
    public async load(scene: Scene): Promise<void> {
        const buffer: unknown = scene.cache.binary.get(this.spriteKey);
        if (!(buffer instanceof ArrayBuffer)) {
            throw new Error(`Missing sprite buffer in cache for ${this.spriteKey}`);
        }

        const parsed = this.parseSprite(buffer);
        const isTiles = this.spriteType === SpriteType.Tiles;

        for (const sheet of parsed) {
            const image = await createImageFromPng(sheet.imageData);
            try {
                this.spriteSheets.push(new HBSpriteSheet(scene, sheet.textureKey, sheet.frames, image, isTiles));
            } finally {
                image.close();
            }
        }

        const spriteSheetPivots: PivotFrame[][] = this.spriteSheets.map((sheet) =>
            sheet.frames.map(({ pivotX, pivotY, width, height }) => ({ pivotX, pivotY, width, height })),
        );
        pivotsBySpriteKey.set(this.spriteKey, { spriteSheetPivots });

        const isStatic = isTiles || this.spriteType === SpriteType.Interface
            || this.spriteType === SpriteType.ItemGround || this.spriteType === SpriteType.ItemPack;
        if (!isStatic) {
            for (const sheet of this.spriteSheets) {
                registerSheetAnimation(scene, sheet, this.frameRate);
            }
        }

        scene.cache.binary.remove(this.spriteKey);
    }

    private parseSprite(buffer: ArrayBuffer): Array<{ textureKey: string; frames: HBSpriteFrame[]; imageData: Uint8Array }> {
        return readSprFile(buffer).map((sheet, i) => {
            const textureKey = this.tileStartIndex !== undefined
                ? `map-tile-${this.tileStartIndex + i}`
                : getSheetKey(this.spriteKey, i);
            const frames = sheet.frames.map((f, index) =>
                new HBSpriteFrame(f.x, f.y, f.width, f.height, f.pivotX, f.pivotY, textureKey, index));
            return { textureKey, frames, imageData: sheet.imageData };
        });
    }
}

/** One frame rect inside a sheet PNG, with its pivot (offset from the entity position to the top-left corner). */
export interface SprFrameRect {
    x: number;
    y: number;
    width: number;
    height: number;
    pivotX: number;
    pivotY: number;
}

/** Raw read of a .spr file without Phaser: each sheet's frame rects plus its embedded PNG bytes. */
export function readSprFile(buffer: ArrayBuffer): Array<{ frames: SprFrameRect[]; imageData: Uint8Array }> {
    const view = new DataView(buffer);
    let offset = 0;

    const sheetCount = readInt16(view, offset);
    offset += HEADER_SIZE;

    const sheets = new Array<{ frames: SprFrameRect[]; imageLength: number }>(sheetCount);

    for (let i = 0; i < sheetCount; i += 1) {
        const frameCount = readInt16(view, offset);
        offset += 2;
        const imageLength = readInt32(view, offset);
        offset += 4;
        offset += 4; // width (unused)
        offset += 4; // height (unused)
        offset += 1; // startLocation placeholder byte

        const frames = new Array<SprFrameRect>(frameCount);
        for (let f = 0; f < frameCount; f += 1) {
            frames[f] = {
                x: readInt16(view, offset),
                y: readInt16(view, offset + 2),
                width: readInt16(view, offset + 4),
                height: readInt16(view, offset + 6),
                pivotX: readInt16(view, offset + 8),
                pivotY: readInt16(view, offset + 10),
            };
            offset += 12;
        }

        sheets[i] = { frames, imageLength };
    }

    return sheets.map((sheet) => {
        offset += 4; // startLocation, not needed for sequential read
        const imageData = new Uint8Array(buffer, offset, sheet.imageLength);
        offset += sheet.imageLength;
        return { frames: sheet.frames, imageData };
    });
}

async function createImageFromPng(data: Uint8Array): Promise<DecodedSpriteImage> {
    try {
        const blob = new Blob([data.slice()], { type: 'image/png' });
        const bitmap = await createImageBitmap(blob);
        return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch (error) {
        throw new Error(`Failed to decode sprite PNG: ${error instanceof Error ? error.message : String(error)}`);
    }
}
