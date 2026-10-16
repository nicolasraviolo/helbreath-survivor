// Efectos visuales de hechizos: qué hoja y qué frames de un .spr de efectos usa cada uno.
// Valores de sp-client/src/constants/Effects.ts (Energy Bolt Projectile / Explosion, Footsteps dry).
import type Phaser from 'phaser';
import type { SpriteKey } from './assetManifest';
import { getSheetKey } from '../hb/HBSprite';

export interface EffectDef {
    sprite: SpriteKey;
    sheet: number;
    /** First and last frame (inclusive). Omitted = the whole sheet. */
    frames?: readonly [number, number];
    frameRate: number;
    loop: boolean;
    /** Frame index from which the effect fades out (sp-client fadeOutStartAnimationIndex). */
    fadeFromFrame?: number;
    /** Added to the Y depth. Default DEPTH_EFFECT_OFFSET (above characters); negative = under them. */
    depthOffset?: number;
}

export const EFFECTS = {
    'fx.energyBolt.fly': { sprite: 'fx.effect', sheet: 0, frames: [2, 5], frameRate: 20, loop: true },
    'fx.energyBolt.explode': { sprite: 'fx.effect', sheet: 6, frameRate: 50, loop: false, fadeFromFrame: 6 },
    'fx.footsteps': { sprite: 'fx.effect2', sheet: 1, frames: [28, 32], frameRate: 10, loop: false, depthOffset: -1 },
} as const satisfies Record<string, EffectDef>;

export type EffectKey = keyof typeof EFFECTS;

/** Creates one Phaser animation per effect (key = effect key). Call once the sprites are loaded. */
export function registerEffectAnimations(anims: Phaser.Animations.AnimationManager, textures: Phaser.Textures.TextureManager): void {
    for (const [key, def] of Object.entries(EFFECTS) as [EffectKey, EffectDef][]) {
        if (anims.exists(key)) continue;
        const textureKey = getSheetKey(def.sprite, def.sheet);
        const frameCount = textures.get(textureKey).frameTotal - 1; // frameTotal includes __BASE
        const [first, last] = def.frames ?? [0, frameCount - 1];
        const frames: Phaser.Types.Animations.AnimationFrame[] = [];
        for (let i = first; i <= last; i++) frames.push({ key: textureKey, frame: String(i) });
        anims.create({ key, frames, frameRate: def.frameRate, repeat: def.loop ? -1 : 0 });
    }
}
