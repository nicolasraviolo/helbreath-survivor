// Helbreath Off (9-nov-2026): la mirilla en el suelo donde caerá una magia del mando apuntada con el stick derecho.
// Se pinta una vez (aro y cruz) y cada frame solo se mueve; roja si va a dar a un monstruo. Medidas en OFF_PAD_RETICLE.
import type Phaser from 'phaser';
import { DEPTH_EFFECT_OFFSET } from '../../config/gameConfig';
import { OFF_PAD_RETICLE } from '../config/offSpellLook';

export class OffAimReticle {
    private readonly graphics: Phaser.GameObjects.Graphics;
    private onMonster: boolean | undefined;

    constructor(scene: Phaser.Scene) {
        this.graphics = scene.add.graphics().setAlpha(OFF_PAD_RETICLE.alpha).setVisible(false);
    }

    /** At (x, y), or hidden without a point. */
    public update(point: { x: number; y: number; onMonster: boolean } | undefined): void {
        if (!point) {
            this.graphics.setVisible(false);
            return;
        }
        if (this.onMonster !== point.onMonster) this.draw(point.onMonster);
        this.graphics.setPosition(point.x, point.y).setDepth(point.y + DEPTH_EFFECT_OFFSET).setVisible(true);
    }

    private draw(onMonster: boolean): void {
        this.onMonster = onMonster;
        const { radius, lineWidth, crossHalf } = OFF_PAD_RETICLE;
        const color = onMonster ? OFF_PAD_RETICLE.monsterColor : OFF_PAD_RETICLE.color;
        this.graphics.clear()
            .lineStyle(lineWidth, color, 1)
            .strokeCircle(0, 0, radius)
            .lineBetween(-crossHalf, 0, crossHalf, 0)
            .lineBetween(0, -crossHalf, 0, crossHalf);
    }
}
