// Anillo en el suelo donde caerá el Spell 2 mientras la Maga arrastra su botón en el móvil (Fase 26B). Del tamaño de la
// zona del hechizo; más apagado si aún no hay maná para lanzarlo. Medidas y color en data/targeting.ts (SPELL_AIM_MARKER).
import type Phaser from 'phaser';
import { DEPTH_GROUND_SHADOWS } from '../config/gameConfig';
import { SPELL_AIM_MARKER } from '../data/targeting';

export class SpellAimMarker {
    private readonly graphics: Phaser.GameObjects.Graphics;
    private radius = 0;

    constructor(scene: Phaser.Scene) {
        // On the ground, just over the shadows: everything standing there is drawn on top.
        this.graphics = scene.add.graphics().setDepth(DEPTH_GROUND_SHADOWS + 1).setVisible(false);
    }

    /** At (x, y) with that radius; hidden when `at` is undefined. */
    public update(at: { x: number; y: number } | undefined, radius: number, ready: boolean): void {
        if (!at) {
            this.graphics.setVisible(false);
            return;
        }
        if (radius !== this.radius) this.draw(radius);
        this.graphics
            .setPosition(at.x, at.y)
            .setAlpha(ready ? 1 : SPELL_AIM_MARKER.noManaAlpha)
            .setVisible(true);
    }

    private draw(radius: number): void {
        const m = SPELL_AIM_MARKER;
        this.radius = radius;
        this.graphics.clear()
            .fillStyle(m.color, m.fillAlpha).fillCircle(0, 0, radius)
            .lineStyle(m.lineWidth, m.color, m.alpha).strokeCircle(0, 0, radius)
            .fillStyle(m.color, m.alpha).fillCircle(0, 0, m.dotRadius);
    }
}
