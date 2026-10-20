// Tinte "sumado" del original (PutSpriteRGB en reference/Client.cpp): a cada píxel se le suma un poco de rojo, verde
// y azul. Phaser solo sabe multiplicar colores, así que se hace una copia de la hoja ya teñida, una sola vez, con los
// mismos frames y pivotes. Lo usa el color de pelo (Fase 17B) y el de las armas con atributo (Fase 21B).
import Phaser from 'phaser';
import { ASSET_BASE_PATH, SPRITES, type SpriteKey } from '../config/assetManifest';
import { readSprFile } from './HBSprite';
import type { AddedColor } from './playerAppearance';

/** Key of the tinted copy of a sheet texture. */
export function tintedKey(baseKey: string, tintId: string): string {
    return `${baseKey}~${tintId}`;
}

/**
 * Makes (once) a copy of `baseKey` with `add` (0..255 per channel, may be negative) added to every visible pixel.
 * Returns false if the base texture isn't loaded yet, or its pixels were freed (see colouredTexture).
 */
export function ensureAdditiveTexture(textures: Phaser.Textures.TextureManager, baseKey: string, key: string, add: readonly [number, number, number]): boolean {
    if (textures.exists(key)) return true;
    if (!textures.exists(baseKey)) return false;
    const base = textures.get(baseKey);
    // Not getSourceImage(): our sheets have no "__BASE" frame (HBSprite adds only the numbered ones).
    const source = base.source[0]?.image;
    if (!(source instanceof HTMLCanvasElement)) return false;
    return addTintedCopy(textures, base, key, source, add);
}

/** Draws `source` (the base sheet's picture) with `add`, as texture `key` with the base's frames and pivots. */
function addTintedCopy(
    textures: Phaser.Textures.TextureManager, base: Phaser.Textures.Texture, key: string,
    source: CanvasImageSource & { width: number; height: number }, add: readonly [number, number, number],
): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(source, 0, 0);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = image.data;
    const [r, g, b] = add;
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] === 0) continue;
        pixels[i] = Math.max(0, Math.min(255, (pixels[i] ?? 0) + r));
        pixels[i + 1] = Math.max(0, Math.min(255, (pixels[i + 1] ?? 0) + g));
        pixels[i + 2] = Math.max(0, Math.min(255, (pixels[i + 2] ?? 0) + b));
    }
    ctx.putImageData(image, 0, 0);
    const texture = textures.addCanvas(key, canvas);
    if (!texture) return false;
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (const name of base.getFrameNames(false)) {
        const frame = base.get(name);
        const copy = texture.add(name, 0, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight);
        if (copy && frame.customPivot) {
            copy.customPivot = true;
            copy.pivotX = frame.pivotX;
            copy.pivotY = frame.pivotY;
        }
    }
    return true;
}

// ---- Sheets whose pixels were freed (weapons, item icons; Fase 21B) ----
// Keeping the pixels of every sword would cost ~16 MB, so only the sheets drawn with a colour are read again from their
// .spr (already in the browser's cache): the file is fetched and parsed once, and each sheet decoded when first needed.

const parsedFiles = new Map<SpriteKey, Promise<ReturnType<typeof readSprFile>>>();
const pendingCopies = new Map<string, Promise<void>>();

function parsedFile(spriteKey: SpriteKey): Promise<ReturnType<typeof readSprFile>> {
    let parsed = parsedFiles.get(spriteKey);
    if (!parsed) {
        parsed = fetch(`${ASSET_BASE_PATH}${SPRITES[spriteKey].file}`).then((response) => response.arrayBuffer()).then(readSprFile);
        parsedFiles.set(spriteKey, parsed);
    }
    return parsed;
}

/** "gear.swords.m-12" → its sprite and sheet, if it is one of ours. */
function splitSheetKey(baseKey: string): { sprite: SpriteKey; sheet: number } | undefined {
    const dash = baseKey.lastIndexOf('-');
    const sprite = baseKey.slice(0, dash);
    const sheet = Number(baseKey.slice(dash + 1));
    return dash > 0 && Number.isInteger(sheet) && Object.prototype.hasOwnProperty.call(SPRITES, sprite) ? { sprite: sprite as SpriteKey, sheet } : undefined;
}

/** Makes the coloured copy of a sheet whose pixels were freed; it is in the texture manager when the promise ends. */
function requestTintedCopy(textures: Phaser.Textures.TextureManager, baseKey: string, key: string, add: readonly [number, number, number]): Promise<void> {
    const where = splitSheetKey(baseKey);
    if (!where) return Promise.resolve();
    const pending = pendingCopies.get(key);
    if (pending) return pending;
    const making = (async () => {
        const sheet = (await parsedFile(where.sprite))[where.sheet];
        if (!sheet || textures.exists(key) || !textures.exists(baseKey)) return;
        const bitmap = await createImageBitmap(new Blob([sheet.imageData.slice()], { type: 'image/png' }));
        try {
            addTintedCopy(textures, textures.get(baseKey), key, bitmap, add);
        } finally {
            bitmap.close();
        }
    })().catch(() => undefined).finally(() => pendingCopies.delete(key));
    pendingCopies.set(key, making);
    return making;
}

/**
 * The texture to draw `baseKey` with: itself, or its copy with `added`. Undefined while the base texture isn't loaded.
 * If the base's pixels were freed, its own picture is drawn until the coloured copy is ready (a moment later).
 */
export function colouredTexture(textures: Phaser.Textures.TextureManager, baseKey: string, added: AddedColor | undefined): string | undefined {
    if (!textures.exists(baseKey)) return undefined;
    if (!added) return baseKey;
    const key = tintedKey(baseKey, added.id);
    if (ensureAdditiveTexture(textures, baseKey, key, added.add)) return key;
    void requestTintedCopy(textures, baseKey, key, added.add);
    return baseKey;
}

/**
 * Shows `frame` of `baseKey` on a still image, with `added`: its own picture now if the coloured copy isn't ready, and
 * the coloured one as soon as it is (if the image is still on screen). False while the base texture isn't loaded.
 */
export function setColouredTexture(image: Phaser.GameObjects.Image, baseKey: string, frame: string | number, added: AddedColor | undefined): boolean {
    const textures = image.scene.sys.textures;
    const texture = colouredTexture(textures, baseKey, added);
    if (!texture || !textures.get(texture).has(String(frame))) return false;
    image.setTexture(texture, frame);
    if (added && texture === baseKey) {
        const key = tintedKey(baseKey, added.id);
        void requestTintedCopy(textures, baseKey, key, added.add).then(() => {
            if (image.active && image.texture.key === baseKey && textures.exists(key)) image.setTexture(key, frame);
        });
    }
    return true;
}
