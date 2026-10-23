// Efecto de un solo uso (explosión de un hechizo), reciclable. Reproduce su animación una vez,
// se desvanece desde el frame indicado en config/effects.ts y vuelve al pool.
import Phaser from 'phaser';
import { EFFECTS, type EffectDef, type EffectKey } from '../config/effects';
import { DEPTH_EFFECT_OFFSET } from '../config/gameConfig';
import type { Poolable } from '../utils/Pool';

export class Effect implements Poolable {
    public poolIndex = -1;
    private def: EffectDef | undefined;
    private readonly sprite: Phaser.GameObjects.Sprite;

    constructor(scene: Phaser.Scene) {
        this.sprite = scene.add.sprite(0, 0, '__DEFAULT').setActive(false).setVisible(false);
    }

    /** Pixels still to fall and their speed (px/ms): effects dropped from the sky (Chill Wind, Fase 26C). */
    private fallLeftPx = 0;
    private fallPxPerMs = 0;

    /** Plays the effect at (x, y); with `fallPx`, it starts that far above and falls onto (x, y) in `fallMs`. */
    public play(key: EffectKey, x: number, y: number, fallPx = 0, fallMs = 0): void {
        const def: EffectDef = EFFECTS[key];
        this.def = def;
        this.fallLeftPx = fallPx > 0 && fallMs > 0 ? fallPx : 0;
        this.fallPxPerMs = this.fallLeftPx > 0 ? fallPx / fallMs : 0;
        this.sprite.setBlendMode(def.additive ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
        this.sprite.setPosition(x + (def.offsetX ?? 0), y + (def.offsetY ?? 0) - this.fallLeftPx).setDepth(y + (def.depthOffset ?? DEPTH_EFFECT_OFFSET)).setScale(def.scale ?? 1).setAlpha(1).setActive(true).setVisible(true);
        // Ice shards: the animation runs once over the whole fall, as in sp-client (frame rate = frames / fall time).
        if (def.stretchToFall && this.fallLeftPx > 0) this.sprite.play({ key, duration: fallMs });
        else this.sprite.play(key);
    }

    /** Returns false when the animation has finished (the effect must go back to the pool). */
    public update(deltaMs = 0): boolean {
        const anims = this.sprite.anims;
        if (!anims.isPlaying) {
            this.sprite.setActive(false).setVisible(false);
            return false;
        }
        if (this.fallLeftPx > 0) {
            const step = Math.min(this.fallLeftPx, this.fallPxPerMs * deltaMs);
            this.fallLeftPx -= step;
            this.sprite.y += step;
        }
        const fadeFrom = this.def?.fadeFromFrame;
        const frame = anims.currentFrame;
        if (fadeFrom !== undefined && frame) {
            const total = anims.getTotalFrames();
            const index = frame.index - 1;
            if (index >= fadeFrom) this.sprite.setAlpha(1 - (index - fadeFrom + 1) / (total - fadeFrom + 1));
        }
        return true;
    }
}
