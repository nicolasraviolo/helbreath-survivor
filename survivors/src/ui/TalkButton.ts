// Botón táctil "Talk" de la ciudad (Fase 23B): un círculo como el del Critical Strike, en la misma esquina de abajo a
// la derecha (TOUCH_RESERVED_CORNER). Solo se ve cuando hay un NPC cerca; mientras se ve, esa esquina no abre el stick.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { TOUCH_RESERVED_CORNER } from '../config/touch';
import { TOWN_TALK_BUTTON } from '../config/town';
import { ScreenLayer } from './renderScale';

export class TalkButton {
    private readonly container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, depth: number, onPress: () => void) {
        const b = TOWN_TALK_BUTTON;
        const corner = TOUCH_RESERVED_CORNER;
        const base = scene.add.graphics()
            .fillStyle(b.color, b.alpha).fillCircle(0, 0, b.radius)
            .lineStyle(2, b.ringColor, b.ringAlpha).strokeCircle(0, 0, b.radius);
        const label = scene.add.text(0, 0, 'Talk', b.style).setOrigin(0.5);
        this.container = scene.add.container(GAME_WIDTH - corner.width / 2, GAME_HEIGHT - corner.height / 2, [base, label])
            .setSize(corner.width, corner.height)
            .setInteractive()
            .setVisible(false);
        new ScreenLayer(scene, depth).addFixed(this.container);
        this.container.setScrollFactor(0, 0, true);
        this.container.on(Phaser.Input.Events.POINTER_DOWN, onPress);
    }

    public get visible(): boolean {
        return this.container.visible;
    }

    public setVisible(visible: boolean): void {
        if (visible !== this.container.visible) this.container.setVisible(visible);
    }

    /** A finger landing here presses the button (while it shows), so it must not open the stick. */
    public covers(x: number, y: number): boolean {
        const corner = TOUCH_RESERVED_CORNER;
        return this.container.visible && x >= GAME_WIDTH - corner.width && y >= GAME_HEIGHT - corner.height;
    }
}
