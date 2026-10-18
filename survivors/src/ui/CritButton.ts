// Botón táctil del Critical Strike (Fase 19A): el icono rojo del original, más grande, con el número de cargas encima;
// se vuelve violeta un momento al lanzar.
// Va en la esquina de abajo a la derecha de la zona de juego, que no abre ningún stick (TOUCH_RESERVED_CORNER), así que
// se puede pulsar mientras un dedo mueve y otro apunta. Apagado sin cargas; oculto si el personaje no tiene crit.
import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import { HUD_CRIT, HUD_CRIT_BUTTON, HUD_DEPTH_TEXT, HUD_TEXTURE } from '../config/hud';
import { TOUCH_RESERVED_CORNER } from '../config/touch';
import { CritIconState } from './hudLayout';

export class CritButton {
    private readonly container: Phaser.GameObjects.Container;
    private readonly icon: Phaser.GameObjects.Image;
    private readonly number: Phaser.GameObjects.Text;
    private shown: number | undefined = -1;
    private readonly iconState = new CritIconState();

    constructor(private readonly scene: Phaser.Scene, onPress: () => void) {
        const b = HUD_CRIT_BUTTON;
        const base = scene.add.graphics()
            .fillStyle(b.color, b.alpha).fillCircle(0, 0, b.radius)
            .lineStyle(2, b.ringColor, b.ringAlpha).strokeCircle(0, 0, b.radius);
        // Its frame carries the original's pivot (top left): centred by hand.
        this.icon = scene.add.image(0, 0, HUD_TEXTURE, HUD_CRIT.frame).setOrigin(0.5).setScale(b.iconScale);
        this.number = scene.add.text(b.numberOffset.x, b.numberOffset.y, '', b.style).setOrigin(0.5);
        this.container = scene.add.container(0, 0, [base, this.icon, this.number]).setDepth(HUD_DEPTH_TEXT)
            .setSize(TOUCH_RESERVED_CORNER.width, TOUCH_RESERVED_CORNER.height)
            .setInteractive();
        this.container.on(Phaser.Input.Events.POINTER_DOWN, onPress);
    }

    /** Centres the button in the reserved corner above `bottom` (overlayBottom: over the compact gauges, if any). */
    public place(bottom: number): void {
        const corner = TOUCH_RESERVED_CORNER;
        this.container.setPosition(GAME_WIDTH - corner.width / 2, bottom - corner.height / 2);
    }

    public update(charges: number | undefined, launches: number): void {
        // Keeps the centred origin (the frames carry the original's pivot).
        this.icon.setFrame(this.iconState.frame(launches, this.scene.time.now, HUD_CRIT), false, false);
        if (charges === this.shown) return;
        this.shown = charges;
        this.container.setVisible(charges !== undefined);
        this.icon.setAlpha(charges ? 1 : HUD_CRIT.emptyAlpha);
        this.number.setText(String(charges ?? ''));
    }
}
