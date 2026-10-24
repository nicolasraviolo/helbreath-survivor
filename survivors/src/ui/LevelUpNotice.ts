// Aviso "Level Up" de la ciudad (24-oct-2026, propietario): abajo a la derecha, con la letra caligráfica de los
// títulos, mientras el personaje tiene puntos sin repartir. Late suave (crece un poco y vuelve); un clic o un toque abre la ventana Character.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { TOUCH_RESERVED_CORNER } from '../config/touch';
import { TOWN_LEVEL_UP } from '../config/town';
import { SpriteText } from '../hb/SpriteText';
import { ScreenLayer } from './renderScale';

export class LevelUpNotice {
    private readonly container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, depth: number, touch: boolean, onPress: () => void) {
        const n = TOWN_LEVEL_UP;
        const text = new SpriteText(scene, 0, 0, n.text, n.color, 'right');
        text.container.setScale(n.scale);
        const bounds = text.container.getBounds();
        const bottom = touch ? TOUCH_RESERVED_CORNER.height + n.touchGap : n.bottom;
        // Right edge of the text at (0, 0); the container's origin is its bottom-right corner.
        text.container.setY(-bounds.height);
        // The beat scales this inner box (around the bottom-right corner); the outer one belongs to the screen layer.
        const beat = scene.add.container(0, 0, [text.container]);
        this.container = scene.add.container(GAME_WIDTH - n.right, GAME_HEIGHT - bottom, [beat])
            .setVisible(false);
        this.container.setInteractive(new Phaser.Geom.Rectangle(-bounds.width, -bounds.height, bounds.width, bounds.height), Phaser.Geom.Rectangle.Contains);
        if (this.container.input) this.container.input.cursor = 'pointer';
        new ScreenLayer(scene, depth).addFixed(this.container);
        this.container.setScrollFactor(0, 0, true);
        this.container.on(Phaser.Input.Events.POINTER_DOWN, onPress);
        const grow = { from: 1, to: n.pulseScale };
        scene.tweens.add({ targets: beat, scaleX: grow, scaleY: grow, duration: n.pulseMs, yoyo: true, repeat: -1 });
    }

    public setVisible(visible: boolean): void {
        if (visible !== this.container.visible) this.container.setVisible(visible);
    }
}
