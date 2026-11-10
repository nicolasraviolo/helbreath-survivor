// Helbreath Off, Fase Off-13A: la ventana de pregunta con el estilo de la Off-12 (sustituye a OffConfirmScene, unirse a
// una ciudad, y a OffDeleteScene, borrar un personaje). Una sola escena para todas las preguntas: quien la abre pasa el
// título, la pregunta, el aviso y los botones. Medidas en off/config/offDialog.ts.
// - Se abre con openOverlay: lo de debajo (el mundo o Select Character) espera en pausa bajo una sombra.
// - Al abrir está marcado el botón `focus` (siempre "No" en las preguntas de ahora, para no decir que sí sin querer).
// - ←/→ (o ↑/↓) cambian de botón, Enter / A pulsa el marcado, Esc / B pulsan el de `cancel` ("No"). El ratón marca
//   el botón que tiene encima. Durante un instante al abrir no responde, para que la pulsación que la abrió no conteste.
// - Al pulsar un botón la ventana se cierra (lo de debajo vuelve a moverse) y **después** se llama a su onPress.
// - Pistas A / B debajo de los botones solo si lo último que se usó fue el mando (la fila se reserva siempre).
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import type { MenuOverlayData } from '../../scenes/MenuOverlayScene';
import { Action, InputSystem } from '../../systems/InputSystem';
import { OFF_DIALOG, OFF_DIALOG_TEXT } from '../config/offDialog';
import { OFF_THEME_COLOR, OFF_THEME_INK, OFF_THEME_SIZE } from '../config/offTheme';
import {
    offButton, offDivider, offFocusGroup, offFrame, offLayoutIssues, offPadBadge, offText,
    type OffButton, type OffButtonVariant, type OffFocusGroup,
} from '../ui/offUi';

export const OFF_DIALOG_SCENE_KEY = 'OffDialog';

const D = OFF_DIALOG;

export interface OffDialogButton {
    label: string;
    variant: OffButtonVariant;
    /** Called once the window has closed and the scene underneath runs again. */
    onPress?: () => void;
}

export interface OffDialogSceneData extends MenuOverlayData {
    title: string;
    question: string;
    /** Second line in red (what can't be undone). */
    warning?: string;
    /** Off-13B: the second line is reassuring, not a warning ("Your progress is saved."): grey instead of red. */
    calmWarning?: boolean;
    /** Left to right. */
    buttons: readonly OffDialogButton[];
    /** The button marked when it opens. */
    focus: number;
    /** The button Esc / B press. */
    cancel: number;
}

export class OffDialogScene extends Phaser.Scene {
    private params!: OffDialogSceneData;
    private inputSystem!: InputSystem;
    private buttons: OffButton[] = [];
    private group!: OffFocusGroup;
    private hints!: Phaser.GameObjects.Container;
    private texts: Phaser.GameObjects.Text[] = [];
    private openedAt = 0;
    private closed = false;
    private forcePadHints = false;

    constructor() {
        super(OFF_DIALOG_SCENE_KEY);
    }

    init(data: OffDialogSceneData): void {
        this.params = data;
        this.buttons = [];
        this.texts = [];
        this.closed = false;
        this.forcePadHints = false;
    }

    create(): void {
        // The game's clock, not the scene's: a scene's own clock reads 0 until its first update, which made the
        // opening delay pass at once.
        this.openedAt = this.game.loop.time;
        // The shade takes the clicks: nothing underneath answers while the question is open.
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, D.shadeAlpha).setOrigin(0).setInteractive();
        offFrame(this, D.x, D.y, D.w, D.h, { fill: OFF_THEME_COLOR.window, big: true });
        const cx = D.x + D.w / 2;
        const textW = D.w - D.sidePad * 2;
        offText(this, cx, D.y + D.titleTop, this.params.title, 'title', { originX: 0.5, maxWidth: textW });
        offDivider(this, D.x + D.sidePad, D.y + D.dividerTop, textW);
        this.createTexts(cx, textW);
        this.createButtons(cx);
        this.createHints(cx);

        this.inputSystem = new InputSystem(this);
        // The buttons have their own click zones: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);
    }

    /** Question (wrapped to two lines at most) and warning, centred together between the divider and the buttons. */
    private createTexts(cx: number, textW: number): void {
        const question = offText(this, cx, 0, this.params.question, 'body', { originX: 0.5 });
        question.setAlign('center').setWordWrapWidth(textW);
        this.texts.push(question);
        let blockH = question.height;
        let warning: Phaser.GameObjects.Text | undefined;
        if (this.params.warning) {
            warning = offText(this, cx, 0, this.params.warning, 'body', { originX: 0.5, color: this.params.calmWarning ? OFF_THEME_INK.dim : OFF_THEME_INK.bad, maxWidth: textW });
            this.texts.push(warning);
            blockH += D.warningGap + warning.height;
        }
        const top = D.y + D.textTop + (D.textBottom - D.textTop - blockH) / 2;
        question.setY(Math.round(top));
        warning?.setY(Math.round(top + question.height + D.warningGap));
    }

    private createButtons(cx: number): void {
        const n = this.params.buttons.length;
        const rowW = n * D.buttonWidth + (n - 1) * D.buttonGap;
        const y = D.y + D.buttonsTop;
        this.params.buttons.forEach((b, i) => {
            const x = cx - rowW / 2 + i * (D.buttonWidth + D.buttonGap);
            this.buttons.push(offButton(this, x, y, b.label, b.variant, () => this.answer(i), D.buttonWidth));
        });
        this.group = offFocusGroup(this.buttons, this.params.focus);
    }

    /** "(A) Choose   (B) No", centred; shown only while the pad is in use. */
    private createHints(cx: number): void {
        const cancel = this.params.buttons[this.params.cancel]?.label ?? '';
        const parts: Phaser.GameObjects.GameObject[] = [];
        let x = 0;
        const add = (button: 'A' | 'B', word: string): void => {
            parts.push(offPadBadge(this, x + OFF_THEME_SIZE.badge / 2, 0, button));
            x += OFF_THEME_SIZE.badge + D.hintBadgeGap;
            const t = offText(this, x, 0, word, 'small', { originY: 0.5 });
            parts.push(t);
            x += t.width;
        };
        add('A', OFF_DIALOG_TEXT.choose);
        x += D.hintGap;
        add('B', cancel);
        this.hints = this.add.container(Math.round(cx - x / 2), D.y + D.hintsCentreY, parts).setVisible(false);
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        this.hints.setVisible(this.forcePadHints || input.getLastDevice() === 'gamepad');
        // Every press is read each frame (a key is "just pressed" until read): the ones during the opening delay are
        // dropped, not kept for later.
        const back = input.justPressed(Action.Back) || input.justPressed(Action.Pause);
        const step = input.justPressed(Action.MenuLeft) || input.justPressed(Action.MenuUp) ? -1
            : input.justPressed(Action.MenuRight) || input.justPressed(Action.MenuDown) ? 1 : 0;
        const confirm = input.justPressed(Action.Confirm);
        if (!this.ready()) return;
        if (back) {
            this.answer(this.params.cancel);
            return;
        }
        if (step !== 0) this.group.move(step);
        if (confirm) this.group.press();
    }

    private ready(): boolean {
        return this.game.loop.time - this.openedAt >= D.inputDelayMs;
    }

    /** Closes (the scene underneath runs again), then does what the button says. */
    public answer(i: number): void {
        if (this.closed || !this.ready()) return;
        this.closed = true;
        this.scene.stop();
        this.scene.resume(this.params.returnTo);
        this.params.buttons[i]?.onPress?.();
    }

    // ---------------------------------------------------------------- development

    /** `check`: the window as if the pad were in use. */
    public debugShowPadHints(): void {
        this.forcePadHints = true;
    }

    /** `check`: what the window shows and whether it all fits. */
    public debugState(): { focus: string; buttons: string[]; padHints: boolean; issues: string[] } {
        const issues = [...offLayoutIssues(this)];
        const zoneH = D.textBottom - D.textTop;
        const first = this.texts[0];
        const last = this.texts[this.texts.length - 1];
        if (first && last && last.y + last.height - first.y > zoneH) issues.push(`question + warning are ${Math.ceil(last.y + last.height - first.y)} px tall, room for ${zoneH}`);
        return {
            focus: this.params.buttons[this.group.index()]?.label ?? '',
            buttons: this.params.buttons.map((b) => b.label),
            padHints: this.hints.visible,
            issues,
        };
    }
}
