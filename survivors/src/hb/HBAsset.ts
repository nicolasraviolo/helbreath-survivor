// Inspired by sp-client/src/game/objects/GameAsset.ts (MIT, Erko Knoll)
//
// Versión mínima de GameAsset. El pivote de cada frame ya lo aplica Phaser
// (ver HBSprite.ts: Frame.customPivot), así que aquí solo elegimos qué hoja
// reproducir según animación + dirección. x/y del sprite = posición lógica (los pies).
import Phaser from 'phaser';
import { getSheetKey } from './HBSprite';
import type { Direction } from './directions';

export interface DirectionalPlayOptions {
    /** First sheet of the animation; the played sheet is `baseSheet + direction`. */
    baseSheet: number;
    direction: Direction;
    frameRate: number;
    loop: boolean;
    /** Only part of the sheet: `count` frames from `first` (sp-client startAnimationFrame / animationFrames). */
    frames?: { first: number; count: number };
}

export class HBAsset extends Phaser.GameObjects.Sprite {
    private lastBaseSheet = -1;

    constructor(scene: Phaser.Scene, x: number, y: number, public readonly spriteKey: string) {
        super(scene, x, y, getSheetKey(spriteKey, 0), '0');
    }

    /** Plays the sheet for a direction. Keeps the current frame index when only the direction changes. */
    public playDirectional({ baseSheet, direction, frameRate, loop, frames }: DirectionalPlayOptions): void {
        const sheetKey = getSheetKey(this.spriteKey, baseSheet + direction);
        const key = frames ? this.partialAnimation(sheetKey, frames.first, frames.count) : sheetKey;
        const current = this.anims.currentAnim;
        const sameAnimationOtherDirection = current !== null
            && current.key !== key
            && this.lastBaseSheet === baseSheet
            && this.anims.isPlaying;
        const startFrame = sameAnimationOtherDirection ? (this.anims.currentFrame?.index ?? 1) - 1 : 0;

        this.lastBaseSheet = baseSheet;
        this.play({ key, frameRate, repeat: loop ? -1 : 0, startFrame }, false);
    }

    /** Animation with only some frames of a sheet, created the first time it is needed. */
    private partialAnimation(sheetKey: string, first: number, count: number): string {
        const key = `${sheetKey}#${first}+${count}`;
        const anims = this.scene.anims;
        if (!anims.exists(key)) {
            const animFrames: Phaser.Types.Animations.AnimationFrame[] = [];
            for (let i = first; i < first + count; i++) animFrames.push({ key: sheetKey, frame: String(i) });
            anims.create({ key, frames: animFrames });
        }
        return key;
    }
}
