// Tinte "sumado" del original (PutSpriteRGB en reference/Client.cpp): a cada píxel se le suma un poco de rojo, verde
// y azul. Phaser solo sabe multiplicar colores, así que se hace una copia de la hoja ya teñida, una sola vez, con los
// mismos frames y pivotes. Lo usa el color de pelo (Fase 17B).
import Phaser from 'phaser';

/** Key of the tinted copy of a sheet texture. */
export function tintedKey(baseKey: string, tintId: string): string {
    return `${baseKey}~${tintId}`;
}

/**
 * Makes (once) a copy of `baseKey` with `add` (0..255 per channel, may be negative) added to every visible pixel.
 * Returns false if the base texture isn't loaded yet.
 */
export function ensureAdditiveTexture(textures: Phaser.Textures.TextureManager, baseKey: string, key: string, add: readonly [number, number, number]): boolean {
    if (textures.exists(key)) return true;
    if (!textures.exists(baseKey)) return false;
    const base = textures.get(baseKey);
    // Not getSourceImage(): our sheets have no "__BASE" frame (HBSprite adds only the numbered ones).
    const source = base.source[0]?.image as (CanvasImageSource & { width: number; height: number }) | undefined;
    if (!source) return false;
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
