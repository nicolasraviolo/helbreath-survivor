// Efecto de un solo uso (explosión de un hechizo), reciclable. Reproduce su animación una vez,
// se desvanece desde el frame indicado en config/effects.ts y vuelve al pool.
import type Phaser from 'phaser';
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

    public play(key: EffectKey, x: number, y: number): void {
        const def: EffectDef = EFFECTS[key];
        this.def = def;
        this.sprite.setPosition(x, y).setDepth(y + (def.depthOffset ?? DEPTH_EFFECT_OFFSET)).setAlpha(1).setActive(true).setVisible(true).play(key);
    }

    /** Returns false when the animation has finished (the effect must go back to the pool). */
    public update(): boolean {
        const anims = this.sprite.anims;
        if (!anims.isPlaying) {
            this.sprite.setActive(false).setVisible(false);
            return false;
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
