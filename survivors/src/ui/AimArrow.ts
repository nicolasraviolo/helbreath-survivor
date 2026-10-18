// Flecha discreta junto a los pies del personaje, solo mientras el jugador apunta a mano (Fase 15B).
// Medidas y color en data/targeting.ts (MANUAL_AIM).
import type Phaser from 'phaser';
import { DEPTH_EFFECT_OFFSET } from '../config/gameConfig';
import { MANUAL_AIM } from '../data/targeting';
import { type ManualAim, manualAimAngle } from '../systems/Targeting';

export class AimArrow {
    private readonly graphics: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene) {
        const { arrowDistance, arrowLength, arrowWidth, arrowColor } = MANUAL_AIM;
        // Drawn once pointing right (angle 0); each frame it is only moved and rotated.
        this.graphics = scene.add.graphics()
            .fillStyle(arrowColor, 1)
            .fillTriangle(arrowDistance + arrowLength, 0, arrowDistance, -arrowWidth / 2, arrowDistance, arrowWidth / 2)
            .setAlpha(MANUAL_AIM.arrowAlpha)
            .setVisible(false);
    }

    /** Around the feet at (x, y) towards the aim; hidden when there is no manual aim. */
    public update(aim: Readonly<ManualAim> | undefined, x: number, y: number): void {
        if (!aim) {
            this.graphics.setVisible(false);
            return;
        }
        this.graphics
            .setPosition(x, y)
            .setRotation(manualAimAngle(aim, x, y))
            .setDepth(y + DEPTH_EFFECT_OFFSET)
            .setVisible(true);
    }
}
