// Escena de inicio de Helbreath Off (Fase Off-0): el título, Play y Back.
// Play abre Select Character (OffSlotsScene, 8-nov-2026); sin ningún personaje, la pantalla de crearlo (Fase Off-3A).
// Back (clic, Enter / A en él, o Esc / B) vuelve a la pantalla de elegir juego.
// Fase Off-13E: el panel de madera es ahora una ventana oscura de la Off-12 (medidas en off/config/offHome.ts) con los
// botones Play y Back; ↑/↓ mueven el foco, Enter / A pulsa, y las pistas del mando salen al usar el mando.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { MAIN_MENU, MENU_BACKGROUND, MENU_BACKGROUND_SCALE, MENU_INPUT_DELAY_MS } from '../../config/menus';
import { Action, InputSystem } from '../../systems/InputSystem';
import { OFF_HOME } from '../config/offHome';
import { OFF_THEME_COLOR, OFF_THEME_INK } from '../config/offTheme';
import { offSaveStore } from '../systems/OffSaveStore';
import {
    OFF_PAD_DPAD, offButton, offDivider, offFocusGroup, offFrame, offLayoutIssues, offPadHints, offRule, offText,
    type OffFocusGroup,
} from '../ui/offUi';
import { OFF_CREATE_SCENE_KEY, type OffCreateSceneData } from './OffCreateScene';
import { OFF_SLOTS_SCENE_KEY } from './OffSlotsScene';

const H = OFF_HOME;

export class OffHomeScene extends Phaser.Scene {
    private menuInput!: InputSystem;
    private group!: OffFocusGroup;
    private hints!: Phaser.GameObjects.Container;
    private forcePadHints = false;
    private openedAt = 0;

    constructor() {
        super('OffHome');
    }

    create(): void {
        this.openedAt = this.time.now;
        this.forcePadHints = false;
        this.add.image(0, 0, MENU_BACKGROUND.texture, MENU_BACKGROUND.frame).setOrigin(0).setScale(MENU_BACKGROUND_SCALE);
        // Same black strip as the main menu: it covers the original's buttons painted on the background.
        this.add.rectangle(0, GAME_HEIGHT - MAIN_MENU.footerHeight, GAME_WIDTH, MAIN_MENU.footerHeight, H.footerColor).setOrigin(0);

        offFrame(this, H.x, H.y, H.w, H.h, { fill: OFF_THEME_COLOR.window, big: true });
        const cx = H.x + H.w / 2;
        const innerW = H.w - H.sidePad * 2;
        offText(this, cx, H.y + H.titleTop, H.title, 'title', { originX: 0.5, color: OFF_THEME_INK.gold, maxWidth: innerW });
        offDivider(this, H.x + H.sidePad, H.y + H.dividerTop, innerW);
        const bx = cx - H.buttonWidth / 2;
        const play = offButton(this, bx, H.y + H.buttonsTop, H.play, 'main', () => this.whenReady(() => this.play()), H.buttonWidth, H.buttonHeight);
        const back = offButton(this, bx, H.y + H.buttonsTop + H.buttonHeight + H.buttonGap, H.back, 'normal',
            () => this.whenReady(() => this.back()), H.buttonWidth, H.buttonHeight);
        this.group = offFocusGroup([play, back]);
        offRule(this, H.x + H.sidePad, H.y + H.ruleTop, innerW, OFF_THEME_COLOR.line);
        this.hints = offPadHints(this, cx, H.y + H.hintsCentreY, [[OFF_PAD_DPAD, H.hintMove], ['A', H.hintSelect], ['B', H.hintBack]]);

        this.menuInput = new InputSystem(this);
        // The buttons have their own click zones: a click elsewhere does nothing.
        this.menuInput.setPointerMaxY(-1);
    }

    override update(): void {
        const input = this.menuInput;
        input.update();
        this.hints.setVisible(this.forcePadHints || input.getLastDevice() === 'gamepad');
        if (!this.ready()) return;
        if (input.justPressed(Action.Back)) {
            this.back();
            return;
        }
        if (input.justPressed(Action.MenuUp)) this.group.move(-1);
        if (input.justPressed(Action.MenuDown)) this.group.move(1);
        if (input.justPressed(Action.Confirm)) this.group.press();
    }

    private whenReady(action: () => void): void {
        if (this.ready()) action();
    }

    private play(): void {
        if (offSaveStore.hasAny) this.scene.start(OFF_SLOTS_SCENE_KEY);
        else this.scene.start(OFF_CREATE_SCENE_KEY, { slot: 0 } satisfies OffCreateSceneData);
    }

    private back(): void {
        this.scene.start('GameSelect');
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= MENU_INPUT_DELAY_MS;
    }

    // ---------------------------------------------------------------- development

    /** `check`: the window as if the pad were in use. */
    public debugShowPadHints(): void {
        this.forcePadHints = true;
        this.hints.setVisible(true);
    }

    /** `check`: the button with the focus and whether everything fits. */
    public debugState(): { focus: string; issues: string[] } {
        return { focus: [H.play, H.back][this.group.index()] ?? '', issues: offLayoutIssues(this) };
    }
}
