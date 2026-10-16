// Estela del tajo cuerpo a cuerpo: un arco claro que se desvanece enseguida, para que se lea el alcance del arma.
// El original no tiene este efecto (solo la animación del personaje); con cientos de enemigos ayuda a ver el golpe.
// Solo hay un arma en la mano, así que basta con una estela que se reutiliza (no hace falta pool).
import type Phaser from 'phaser';
import { DEPTH_EFFECT_OFFSET, SLASH_COLOR, SLASH_LIFE_MS, SLASH_WIDTH } from '../config/gameConfig';

export class Slash {
    private readonly graphics: Phaser.GameObjects.Graphics;
    private lifeMs = 0;

    constructor(scene: Phaser.Scene) {
        this.graphics = scene.add.graphics().setVisible(false);
    }

    /** Draws the arc centred on (x, y): `angle` and `arc` in radians, `radius` in pixels. */
    public show(x: number, y: number, radius: number, angle: number, arc: number): void {
        const start = angle - arc / 2;
        const end = angle + arc / 2;
        this.graphics.clear()
            .lineStyle(SLASH_WIDTH, SLASH_COLOR, 0.9)
            .beginPath()
            .arc(0, 0, radius * 0.85, start, end)
            .strokePath()
            .lineStyle(SLASH_WIDTH / 2, SLASH_COLOR, 0.5)
            .beginPath()
            .arc(0, 0, radius * 0.6, start + arc * 0.15, end - arc * 0.15)
            .strokePath();
        this.graphics.setPosition(x, y).setDepth(y + DEPTH_EFFECT_OFFSET).setAlpha(1).setVisible(true);
        this.lifeMs = SLASH_LIFE_MS;
    }

    public update(deltaMs: number): void {
        if (this.lifeMs <= 0) return;
        this.lifeMs -= deltaMs;
        if (this.lifeMs <= 0) this.graphics.setVisible(false);
        else this.graphics.setAlpha(this.lifeMs / SLASH_LIFE_MS);
    }
}
