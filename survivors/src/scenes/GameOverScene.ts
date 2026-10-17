// Pantalla de final de partida (Fase 7): victoria al matar al jefe final o derrota al morir. Se abre encima de la
// partida, que queda pausada. Muestra tiempo, nivel, bajas, el arma o hechizo y la armadura que llevabas.
// Botones originales (dialogtext.spr): Restart = otra partida con la misma clase; Change = volver a elegir clase;
// Log Out = volver al menú principal.
// Se maneja con ←/→ o cruceta + Enter/A, o con el ratón.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { GAME_OVER } from '../config/hud';
import { px, UI_TEXT, UI_FONT_SIZE } from '../config/ui';
import { SpriteText } from '../hb/SpriteText';
import { Action, InputSystem } from '../systems/InputSystem';
import { formatTime } from '../utils/format';

export interface GameOverSceneData {
    victory: boolean;
    elapsedMs: number;
    level: number;
    kills: number;
    className: string;
    /** Weapon or spell in hand. */
    weaponName: string;
    /** Armor pieces worn, by name. */
    armorNames: readonly string[];
    onRestart: () => void;
    onChangeClass: () => void;
    onMainMenu: () => void;
}

interface Button {
    image: Phaser.GameObjects.Image;
    frame: number;
    action: () => void;
}

export class GameOverScene extends Phaser.Scene {
    private params!: GameOverSceneData;
    private inputSystem!: InputSystem;
    private buttons: Button[] = [];
    private selected = 0;
    private openedAt = 0;
    private chosen = false;

    constructor() {
        super('GameOver');
    }

    init(data: GameOverSceneData): void {
        this.params = data;
        this.buttons = [];
        this.selected = 0;
        this.chosen = false;
    }

    create(): void {
        const p = this.params;
        this.openedAt = this.time.now;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, GAME_OVER.shadeAlpha).setOrigin(0);
        const title = new SpriteText(this, GAME_WIDTH / 2, GAME_OVER.titleY, p.victory ? 'Victory!' : 'You have fallen',
            p.victory ? GAME_OVER.victoryColor : GAME_OVER.defeatColor, 'center');
        title.container.setScale(GAME_OVER.titleScale);

        const lines = [
            `${p.className}  ·  Level ${p.level}`,
            `Time ${formatTime(p.elapsedMs)}  ·  ${p.kills} kills`,
            '',
            p.weaponName,
            p.armorNames.length > 0 ? p.armorNames.join(', ') : 'No armor',
        ];
        this.add.text(GAME_WIDTH / 2, GAME_OVER.statsY, lines, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.large), color: '#e8d9a8', align: 'center', lineSpacing: 6,
        }).setOrigin(0.5, 0);

        this.addButton(GAME_OVER.restartFrame, -1, p.onRestart);
        this.addButton(GAME_OVER.changeFrame, 0, p.onChangeClass);
        this.addButton(GAME_OVER.logOutFrame, 1, p.onMainMenu);
        this.highlight(0);
        this.add.text(GAME_WIDTH / 2, GAME_OVER.hintY, GAME_OVER.hint, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.small), color: '#a89870',
        }).setOrigin(0.5);

        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerMaxY(-1);
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        if (!this.ready()) return;
        const count = this.buttons.length;
        if (input.justPressed(Action.MenuLeft)) this.highlight((this.selected - 1 + count) % count);
        if (input.justPressed(Action.MenuRight)) this.highlight((this.selected + 1) % count);
        if (input.justPressed(Action.Confirm)) this.choose(this.selected);
    }

    private ready(): boolean {
        return !this.chosen && this.time.now - this.openedAt >= GAME_OVER.inputDelayMs;
    }

    /** `side` −1 = left, 0 = centre, +1 = right. */
    private addButton(frame: number, side: number, action: () => void): void {
        const index = this.buttons.length;
        const x = GAME_WIDTH / 2 + side * GAME_OVER.buttonGap;
        const image = this.add.image(x, GAME_OVER.buttonsY, GAME_OVER.buttonTexture, frame).setScale(GAME_OVER.buttonScale);
        // The frames' pivot is their top-left corner: centre them by hand.
        image.setOrigin(0.5);
        image.setInteractive({ useHandCursor: true });
        image.on(Phaser.Input.Events.POINTER_OVER, () => this.highlight(index));
        image.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) this.choose(index);
        });
        this.buttons.push({ image, frame, action });
    }

    /** The highlighted button shows its lit frame (the next one). */
    private highlight(index: number): void {
        this.selected = index;
        this.buttons.forEach((button, i) => button.image.setFrame(button.frame + (i === index ? 1 : 0)).setOrigin(0.5));
    }

    private choose(index: number): void {
        const button = this.buttons[index];
        if (!button || this.chosen) return;
        this.chosen = true;
        button.action();
    }
}
