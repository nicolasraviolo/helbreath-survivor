// Copia "con brillo" de una hoja de sprites, hecha en la GPU: la hoja y, encima, otra vez la misma hoja teñida en modo
// ADD (la copia roja del Berserk del original, sp-client GameAsset.createBerserkOverlay). Se hace una vez por hoja y
// luego no cuesta nada dibujarla: un sprite ADD encima de cada monstruo rompe el lote de WebGL y hunde los FPS con
// muchos. No se puede copiar píxel a píxel (hb/additiveTint.ts) porque las hojas de monstruo ya no guardan sus
// píxeles en memoria (HBSprite cierra su ImageBitmap al subirlas a la GPU).
import Phaser from 'phaser';

/** Temporary frame covering the whole sheet, to draw it in one go. */
const WHOLE_SHEET_FRAME = '__glowWhole';

/**
 * Makes (once) `key`: `baseKey` with itself drawn over in ADD mode, tinted `tint` at `alpha`, with the same frames and
 * pivots. Returns false if the base texture isn't loaded yet.
 */
export function ensureGlowTexture(scene: Phaser.Scene, baseKey: string, key: string, tint: number, alpha: number): boolean {
    const textures = scene.textures;
    if (textures.exists(key)) return true;
    if (!textures.exists(baseKey)) return false;
    const base = textures.get(baseKey);
    const source = base.source[0];
    if (!source) return false;
    const copy = textures.addDynamicTexture(key, source.width, source.height);
    if (!copy) return false;
    const whole = base.add(WHOLE_SHEET_FRAME, 0, 0, 0, source.width, source.height);
    const image = scene.make.image({ key: baseKey, frame: WHOLE_SHEET_FRAME }, false).setOrigin(0, 0);
    copy.draw(image, 0, 0);
    copy.draw(image.setBlendMode(Phaser.BlendModes.ADD).setTint(tint).setAlpha(alpha), 0, 0);
    image.destroy();
    if (whole) base.remove(WHOLE_SHEET_FRAME);
    copy.setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (const name of base.getFrameNames(false)) {
        const frame = base.get(name);
        const added = copy.add(name, 0, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight);
        if (added && frame.customPivot) {
            added.customPivot = true;
            added.pivotX = frame.pivotX;
            added.pivotY = frame.pivotY;
        }
    }
    return true;
}
