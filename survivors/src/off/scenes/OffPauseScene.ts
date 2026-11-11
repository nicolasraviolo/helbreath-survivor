// Helbreath Off, Fase Off-13B: la pausa propia de Off, con el estilo de la Off-12 (antes usaba scenes/PauseScene.ts de
// Survivors, que no se toca). Medidas y textos en off/config/offPause.ts.
// - La abren Esc, B, Start o el disquete del HUD (OffWorldScene.openPause): el mundo y el HUD esperan parados debajo.
// - Resume (marcado al abrir), Settings (OffSettingsScene, encima; antes el de Survivors), Controls (OffControlsScene) y Quit to Menu, que
//   pregunta antes con la ventana de la 13A (No marcado; salir guarda, así que no avisa en rojo).
// - ↑/↓ mueven el foco, Enter / A pulsan, Esc / B / Start reanudan. Pistas del mando solo con el mando.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { openOverlay, type MenuOverlayData } from '../../scenes/MenuOverlayScene';
import { Action, InputSystem } from '../../systems/InputSystem';
import { OFF_DIALOG_TEXT } from '../config/offDialog';
import { OFF_PAUSE, OFF_PAUSE_TEXT } from '../config/offPause';
import { OFF_THEME_COLOR, OFF_THEME_SIZE } from '../config/offTheme';
import {
    offButton, offDivider, offFocusGroup, offFrame, offLayoutIssues, offPadHints, offText, type OffButton, type OffFocusGroup,
} from '../ui/offUi';
import { OFF_CONTROLS_SCENE_KEY } from './OffControlsScene';
import { OFF_DIALOG_SCENE_KEY, type OffDialogSceneData } from './OffDialogScene';
import { OFF_SETTINGS_SCENE_KEY } from './OffSettingsScene';

export const OFF_PAUSE_SCENE_KEY = 'OffPause';

const P = OFF_PAUSE;

export interface OffPauseSceneData extends MenuOverlayData {
    /** The world, resumed with Resume and stopped with Quit (returnTo is its HUD). */
    worldSceneKey: string;
    /** Where Quit to Menu goes. */
    quitTo: string;
}

export class OffPauseScene extends Phaser.Scene {
    private params!: OffPauseSceneData;
    private inputSystem!: InputSystem;
    private buttons: OffButton[] = [];
    private group!: OffFocusGroup;
    private hints!: Phaser.GameObjects.Container;
    private openedAt = 0;
    private closed = false;

    constructor() {
        super(OFF_PAUSE_SCENE_KEY);
    }

    init(data: OffPauseSceneData): void {
        this.params = data;
        this.buttons = [];
        this.closed = false;
    }

    create(): void {
        this.openedAt = this.game.loop.time;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, P.shadeAlpha).setOrigin(0).setInteractive();
        offFrame(this, P.x, P.y, P.w, P.h, { fill: OFF_THEME_COLOR.window, big: true });
        const cx = P.x + P.w / 2;
        const textW = P.w - P.sidePad * 2;
        offText(this, cx, P.y + P.titleTop, OFF_PAUSE_TEXT.title, 'title', { originX: 0.5, maxWidth: textW });
        offDivider(this, P.x + P.sidePad, P.y + P.dividerTop, textW);

        const entries: readonly [string, () => void][] = [
            [OFF_PAUSE_TEXT.resume, () => this.resume()],
            [OFF_PAUSE_TEXT.settings, () => this.openSettings()],
            [OFF_PAUSE_TEXT.controls, () => this.openControls()],
            [OFF_PAUSE_TEXT.quit, () => this.askQuit()],
        ];
        const x = cx - P.buttonWidth / 2;
        entries.forEach(([label, action], i) => {
            const y = P.y + P.buttonsTop + i * (OFF_THEME_SIZE.buttonHeight + P.buttonGap);
            this.buttons.push(offButton(this, x, y, label, i === 0 ? 'main' : 'normal', () => this.ifReady(action), P.buttonWidth));
        });
        this.group = offFocusGroup(this.buttons, 0);
        this.hints = offPadHints(this, cx, P.y + P.hintsCentreY, [['A', OFF_PAUSE_TEXT.select], ['B', OFF_PAUSE_TEXT.resume]]);

        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerMaxY(-1);
        // Back from Settings, Controls or the question: the press that closed them doesn't reach the pause.
        const onResume = (): void => {
            this.openedAt = this.game.loop.time;
        };
        this.events.on(Phaser.Scenes.Events.RESUME, onResume);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.RESUME, onResume));
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        this.hints.setVisible(input.getLastDevice() === 'gamepad');
        const back = input.justPressed(Action.Back) || input.justPressed(Action.Pause);
        const step = input.justPressed(Action.MenuUp) ? -1 : input.justPressed(Action.MenuDown) ? 1 : 0;
        const confirm = input.justPressed(Action.Confirm);
        if (!this.ready()) return;
        if (back) {
            this.resume();
            return;
        }
        if (step !== 0) this.group.move(step);
        if (confirm) this.group.press();
    }

    private ready(): boolean {
        return this.game.loop.time - this.openedAt >= P.inputDelayMs;
    }

    private ifReady(action: () => void): void {
        if (this.ready()) action();
    }

    /** Back to the world: the HUD (returnTo) and the world run again. */
    public resume(): void {
        if (this.closed) return;
        this.closed = true;
        this.scene.stop();
        this.scene.resume(this.params.returnTo);
        this.scene.resume(this.params.worldSceneKey);
    }

    /** The Settings window over the pause. */
    public openSettings(): void {
        openOverlay(this, OFF_SETTINGS_SCENE_KEY);
    }

    /** The Controls window over the pause. */
    public openControls(): void {
        openOverlay(this, OFF_CONTROLS_SCENE_KEY);
    }

    /** "Return to the title screen?" with No marked; Yes quits. */
    public askQuit(): void {
        const data: Omit<OffDialogSceneData, 'returnTo'> = {
            title: OFF_PAUSE_TEXT.quitTitle,
            question: OFF_PAUSE_TEXT.quitQuestion,
            warning: OFF_PAUSE_TEXT.quitNote,
            calmWarning: true,
            buttons: [
                { label: OFF_DIALOG_TEXT.no, variant: 'normal' },
                { label: OFF_DIALOG_TEXT.yes, variant: 'normal', onPress: () => this.quit() },
            ],
            focus: 0,
            cancel: 0,
        };
        openOverlay(this, OFF_DIALOG_SCENE_KEY, data);
    }

    /** Stopping the world saves where you are and stops its HUD and windows (OffWorldScene, on SHUTDOWN). */
    private quit(): void {
        this.closed = true;
        this.scene.stop(this.params.worldSceneKey);
        this.scene.start(this.params.quitTo);
    }

    // ---------------------------------------------------------------- development

    /** `check`: what has the focus and whether everything fits. */
    public debugState(): { focus: string; buttons: string[]; issues: string[] } {
        return {
            focus: OFF_PAUSE_LABELS[this.group.index()] ?? '',
            buttons: [...OFF_PAUSE_LABELS],
            issues: offLayoutIssues(this),
        };
    }
}

const OFF_PAUSE_LABELS: readonly string[] = [OFF_PAUSE_TEXT.resume, OFF_PAUSE_TEXT.settings, OFF_PAUSE_TEXT.controls, OFF_PAUSE_TEXT.quit];