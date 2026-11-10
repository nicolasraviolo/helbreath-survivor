// Helbreath Off, Fase Off-13B: la ventana Controls de la pausa (Off esconde How to Play de Survivors). Una tabla de
// solo lectura: acción, teclado y ratón, y mando con sus circulitos y pastillas (filas en off/data/offControls.ts).
// Un solo botón Back; Esc / B / Start vuelven a la pausa. Medidas en off/config/offPause.ts.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import type { MenuOverlayData } from '../../scenes/MenuOverlayScene';
import { Action, InputSystem } from '../../systems/InputSystem';
import { OFF_CONTROLS, OFF_CONTROLS_TEXT } from '../config/offPause';
import { OFF_THEME_COLOR, OFF_THEME_INK, OFF_THEME_SIZE } from '../config/offTheme';
import { OFF_CONTROL_ROWS, type OffPadPiece } from '../data/offControls';
import {
    offButton, offDivider, offFitText, offFrame, offLabel, offLayoutIssues, offPadBadge, offPadHints, offPadPill, offRule, offText,
    type OffButton,
} from '../ui/offUi';

export const OFF_CONTROLS_SCENE_KEY = 'OffControls';

const K = OFF_CONTROLS;

export class OffControlsScene extends Phaser.Scene {
    private returnTo = '';
    private inputSystem!: InputSystem;
    private back!: OffButton;
    private hints!: Phaser.GameObjects.Container;
    private openedAt = 0;
    private closed = false;
    private padIssues: string[] = [];

    constructor() {
        super(OFF_CONTROLS_SCENE_KEY);
    }

    init(data: MenuOverlayData): void {
        this.returnTo = data.returnTo;
        this.closed = false;
        this.padIssues = [];
    }

    create(): void {
        this.openedAt = this.game.loop.time;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, K.shadeAlpha).setOrigin(0).setInteractive();
        offFrame(this, K.x, K.y, K.w, K.h, { fill: OFF_THEME_COLOR.window, big: true });
        const cx = K.x + K.w / 2;
        const innerW = K.w - K.sidePad * 2;
        const left = K.x + K.sidePad;
        offText(this, cx, K.y + K.titleTop, OFF_CONTROLS_TEXT.title, 'title', { originX: 0.5, maxWidth: innerW });
        offDivider(this, left, K.y + K.dividerTop, innerW);

        const keyX = left + K.actionWidth;
        const padX = keyX + K.keyboardWidth;
        const padW = left + innerW - padX;
        const headerY = K.y + K.headerTop;
        offLabel(this, left, headerY, OFF_CONTROLS_TEXT.action, { maxWidth: K.actionWidth });
        offLabel(this, keyX, headerY, OFF_CONTROLS_TEXT.keyboard, { maxWidth: K.keyboardWidth });
        offLabel(this, padX, headerY, OFF_CONTROLS_TEXT.gamepad, { maxWidth: padW });

        OFF_CONTROL_ROWS.forEach((row, i) => {
            const top = K.y + K.rowsTop + i * K.rowHeight;
            const cy = top + K.rowHeight / 2;
            offText(this, left, cy, row.action, 'body', { originY: 0.5, maxWidth: K.actionWidth - OFF_THEME_SIZE.rowGap });
            offText(this, keyX, cy, row.keyboard, 'body', { originY: 0.5, color: OFF_THEME_INK.dim, maxWidth: K.keyboardWidth - OFF_THEME_SIZE.rowGap });
            this.addPadCell(padX, cy, padW, row.pad, row.action);
            offRule(this, left, top + K.rowHeight - 1, innerW);
        });

        this.back = offButton(this, cx - K.buttonWidth / 2, K.y + K.buttonsTop, OFF_CONTROLS_TEXT.back, 'normal', () => this.close(), K.buttonWidth);
        this.back.setFocused(true);
        this.hints = offPadHints(this, cx, K.y + K.hintsCentreY, [['B', OFF_CONTROLS_TEXT.back]]);

        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerMaxY(-1);
    }

    /** Badges, pills and words in a row from x, centred on cy; a word shrinks to fit what is left. */
    private addPadCell(x: number, cy: number, width: number, pieces: readonly OffPadPiece[], action: string): void {
        const right = x + width;
        let at = x;
        for (const piece of pieces) {
            if ('badge' in piece) {
                offPadBadge(this, at + OFF_THEME_SIZE.badge / 2, cy, piece.badge);
                at += OFF_THEME_SIZE.badge;
            } else if ('pill' in piece) {
                at += offPadPill(this, at, cy, piece.pill).width;
            } else {
                const t = offText(this, at, cy, piece.text, 'body', { originY: 0.5, color: OFF_THEME_INK.dim });
                offFitText(t, 'body', Math.max(0, right - at));
                at += t.width;
            }
            at += K.pieceGap;
        }
        if (at - K.pieceGap > right + 0.5) this.padIssues.push(`${action}: the gamepad cell is ${Math.ceil(at - K.pieceGap - x)} px wide, room for ${Math.floor(width)}`);
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        this.hints.setVisible(input.getLastDevice() === 'gamepad');
        const back = input.justPressed(Action.Back) || input.justPressed(Action.Pause) || input.justPressed(Action.Confirm);
        if (this.game.loop.time - this.openedAt < K.inputDelayMs) return;
        if (back) this.close();
    }

    public close(): void {
        if (this.closed || this.game.loop.time - this.openedAt < K.inputDelayMs) return;
        this.closed = true;
        this.scene.stop();
        this.scene.resume(this.returnTo);
    }

    /** `check`: rows shown and whether everything fits. */
    public debugState(): { rows: number; issues: string[] } {
        return { rows: OFF_CONTROL_ROWS.length, issues: [...offLayoutIssues(this), ...this.padIssues] };
    }
}
