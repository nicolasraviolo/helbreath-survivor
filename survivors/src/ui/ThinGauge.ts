// Helbreath Off (Fase Off-3B): barra fina (HUD_XP_STRIP) para la experiencia, porque en Off la barra verde es la
// estamina, como en el original. Sirve para la barra clásica (dentro de su contenedor) y para la compacta.
import Phaser from 'phaser';
import { HUD_XP_STRIP } from '../config/hud';

export class ThinGauge {
    private readonly graphics: Phaser.GameObjects.Graphics;
    private shownFilled = -1;

    constructor(
        scene: Phaser.Scene,
        private readonly x: number,
        private readonly y: number,
        private readonly width: number,
        private readonly height: number,
        /** The classic bar's container (bar pixels); none for the compact HUD (screen pixels). */
        parent?: Phaser.GameObjects.Container,
        depth = 0,
    ) {
        this.graphics = scene.add.graphics().setDepth(depth).setVisible(false);
        parent?.add(this.graphics);
    }

    /** 0..1, or undefined to hide it. */
    public update(ratio: number | undefined): void {
        if (ratio === undefined) {
            this.graphics.setVisible(false);
            return;
        }
        const filled = Math.round(this.width * Phaser.Math.Clamp(ratio, 0, 1));
        this.graphics.setVisible(true);
        if (filled === this.shownFilled) return;
        this.shownFilled = filled;
        const s = HUD_XP_STRIP;
        this.graphics.clear()
            .fillStyle(s.track, s.trackAlpha).fillRect(this.x, this.y, this.width, this.height)
            .fillStyle(s.fill, 1).fillRect(this.x, this.y, filled, this.height);
    }

    public destroy(): void {
        this.graphics.destroy();
    }
}
