// Helbreath Off (9-nov-2026, propietario): mientras se mantiene RT, las cuatro magias del mando en cruz como los
// botones (Y arriba, A abajo, X a la izquierda, B a la derecha), abajo en el centro. Cada caja lleva la letra con su
// color y el nombre; atenuada si no hay magia en ese botón o no llega el maná. Medidas en OFF_PAD_CROSS.
import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config/gameConfig';
import { HUD_DEPTH_TEXT } from '../../config/hud';
import { overlayBottom } from '../../ui/hudLayout';
import { OFF_PAD_CROSS } from '../config/offSpellLook';

/** One button of the cross: its spell's name (undefined: none) and whether it can be cast now. */
export interface OffPadCrossSlot {
    name: string | undefined;
    usable: boolean;
}

/** Where each button (A, B, X, Y) sits, from the cross's centre, in spreads. */
const SPOTS: readonly { x: number; y: number }[] = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
const LETTERS = ['A', 'B', 'X', 'Y'] as const;

export class OffPadCross {
    private readonly root: Phaser.GameObjects.Container;
    private readonly boxes: { box: Phaser.GameObjects.Container; name: Phaser.GameObjects.Text }[];

    constructor(scene: Phaser.Scene) {
        const c = OFF_PAD_CROSS;
        this.root = scene.add.container(GAME_WIDTH / 2, 0).setDepth(HUD_DEPTH_TEXT).setVisible(false);
        this.boxes = SPOTS.map((spot, i) => {
            const bg = scene.add.rectangle(0, 0, c.boxWidth, c.boxHeight, c.boxColor, c.boxAlpha).setStrokeStyle(1, c.borderColor);
            const letterX = -c.boxWidth / 2 + c.letterRadius + 6;
            const circle = scene.add.circle(letterX, 0, c.letterRadius, c.letterColors[i] ?? 0xffffff);
            const letter = scene.add.text(letterX, 0, LETTERS[i] ?? '?', c.letterStyle).setOrigin(0.5);
            const name = scene.add.text(letterX + c.letterRadius + 6, 0, '', c.nameStyle).setOrigin(0, 0.5);
            const box = scene.add.container(spot.x * c.spreadX, spot.y * c.spreadY, [bg, circle, letter, name]);
            this.root.add(box);
            return { box, name };
        });
    }

    /** Shows the four buttons (slots in A, B, X, Y order), or hides them with undefined. */
    public update(slots: readonly OffPadCrossSlot[] | undefined): void {
        this.root.setVisible(slots !== undefined);
        if (!slots) return;
        this.root.setY(overlayBottom() - OFF_PAD_CROSS.bottomGap);
        this.boxes.forEach(({ box, name }, i) => {
            const slot = slots[i];
            name.setText(slot?.name ?? OFF_PAD_CROSS.empty);
            box.setAlpha(slot?.name !== undefined && slot.usable ? 1 : OFF_PAD_CROSS.dimAlpha);
        });
    }
}
