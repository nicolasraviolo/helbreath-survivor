// Código de traspaso (Fase 27½B): Settings → Gameplay → Transfer Save (solo desde el menú principal, para no mandar
// una partida a medias). Get Code sube la partida y enseña el código con Copy; Enter Code deja escribirlo (una casilla
// HTML encima del lienzo, para que salga el teclado del móvil y se pueda pegar), avisa de que sustituye la partida,
// la baja, la escribe y recarga la página para que todo se lea de nuevo. Si algo falla, lo dice y no toca nada.
// Esc/B: desde cualquier paso vuelve a las tres opciones; desde ahí, a Settings. Mientras espera al servidor, nada.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { MENU_OVERLAY, MENU_TEXT_STYLE, TRANSFER_MENU } from '../config/menus';
import {
    TRANSFER_RELOAD_DELAY_MS,
    TRANSFER_TTL_MS,
    formatTransferCode,
    normalizeTransferCode,
} from '../config/transfer';
import { UI_FONT, UI_TEXT, px } from '../config/ui';
import { applySave, claimCode, collectSave, createCode, reloadWithNewSave, type TransferError } from '../systems/TransferClient';
import type { MenuItem } from '../ui/MenuList';
import { MenuOverlayScene, type MenuOverlayData } from './MenuOverlayScene';

const ERROR_TEXT: Record<TransferError, string> = {
    offline: 'Can\'t reach the server.\nCheck your connection and try again later.\nNothing was changed.',
    notFound: 'Code not found.\nIt may be mistyped, already used or older than a day.\nNothing was changed.',
    tooBig: 'This save is too big to send.\nNothing was changed.',
    busy: 'The server is busy right now.\nTry again in a while. Nothing was changed.',
    failed: 'Something went wrong.\nTry again later. Nothing was changed.',
};

type Step = 'menu' | 'busy' | 'code' | 'enter' | 'confirm' | 'message';

export class TransferScene extends MenuOverlayScene {
    protected readonly title = 'Transfer Save';
    protected override readonly panelScale = MENU_OVERLAY.creditsPanelScale;
    private step: Step = 'menu';
    /** Bumped on every step change: a server answer that arrives after the player left that step is ignored. */
    private stepId = 0;
    private texts: Phaser.GameObjects.Text[] = [];
    private codeBox: HTMLInputElement | undefined;
    private hint: Phaser.GameObjects.Text | undefined;

    constructor() {
        super('Transfer');
    }

    override init(data: MenuOverlayData): void {
        super.init(data);
        this.step = 'menu';
        this.texts = [];
        this.codeBox = undefined;
        this.hint = undefined;
    }

    protected build(): void {
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeInput());
        this.showMenu();
    }

    override update(): void {
        super.update();
        this.placeInput();
    }

    /** Esc/B: back to the three options; from there, to Settings. Never while waiting for the server. */
    protected override close(): void {
        if (this.step === 'busy') return;
        if (this.step === 'menu') super.close();
        else this.later(() => this.showMenu());
    }

    private showMenu(): void {
        this.setStep('menu');
        this.setText('Take your characters, gold, warehouse, maps and achievements to another device.\nSettings stay on each device.');
        this.setOptions([
            { label: 'Get Code', onConfirm: () => this.later(() => void this.getCode()) },
            { label: 'Enter Code', onConfirm: () => this.later(() => this.showEnter()) },
            { label: 'Back', onConfirm: () => this.close() },
        ], TRANSFER_MENU.menuListOffsetY);
    }

    private async getCode(): Promise<void> {
        const save = collectSave();
        if (!save) {
            this.showMessage('There is nothing saved on this device yet.', false);
            return;
        }
        const id = this.setStep('busy');
        this.setText('Getting a code...');
        this.setOptions([], 0);
        const result = await createCode(save);
        if (id !== this.stepId) return;
        if (!result.ok) this.showMessage(ERROR_TEXT[result.error], true, () => void this.getCode());
        else this.showCode(formatTransferCode(result.value.code), false);
    }

    private showCode(code: string, copied: boolean): void {
        this.setStep('code');
        const hours = Math.round(TRANSFER_TTL_MS / (60 * 60 * 1000));
        this.setText(`On the other device, open Settings → Gameplay →\nTransfer Save → Enter Code and type:`);
        this.addText(code, TRANSFER_MENU.codeOffsetY, {
            ...UI_TEXT, fontSize: px(TRANSFER_MENU.codeFontSize), fontStyle: 'bold', color: TRANSFER_MENU.codeColor,
            stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5);
        this.addText(`It works once, for ${hours} hours.`, TRANSFER_MENU.hintOffsetY, MENU_TEXT_STYLE).setOrigin(0.5);
        this.setOptions([
            { label: copied ? 'Copied!' : 'Copy', onConfirm: () => void this.copy(code) },
            { label: 'Back', onConfirm: () => this.close() },
        ], TRANSFER_MENU.codeListOffsetY);
    }

    private async copy(code: string): Promise<void> {
        const id = this.stepId;
        let copied = false;
        try {
            await navigator.clipboard.writeText(code);
            copied = true;
        } catch {
            copied = false;
        }
        if (id !== this.stepId) return;
        if (copied) this.later(() => this.showCode(code, true));
        else this.showMessage(`Can't copy here. Write it down:\n${code}`, false);
    }

    private showEnter(): void {
        this.setStep('enter');
        this.setText('Type the code from your other device:');
        this.createInput();
        this.setOptions([
            { label: 'OK', onConfirm: () => this.submitCode() },
            { label: 'Back', onConfirm: () => this.close() },
        ], TRANSFER_MENU.codeListOffsetY);
    }

    private submitCode(): void {
        const code = normalizeTransferCode(this.codeBox?.value ?? '');
        if (!code) {
            this.hint?.destroy();
            this.hint = this.addText('That is not a code. It looks like K7P-29X.', TRANSFER_MENU.hintOffsetY, {
                ...MENU_TEXT_STYLE, color: TRANSFER_MENU.hintColor,
            }).setOrigin(0.5);
            this.codeBox?.focus();
            return;
        }
        this.later(() => this.showConfirm(code));
    }

    private showConfirm(code: string): void {
        this.setStep('confirm');
        this.setText(`Load the save from code ${formatTransferCode(code)}?\nIt replaces the characters, gold and progress\non this device. This can't be undone.`);
        // "No" first: Enter by mistake doesn't replace the save.
        this.setOptions([
            { label: 'No', onConfirm: () => this.later(() => this.showMenu()) },
            { label: 'Replace', onConfirm: () => this.later(() => void this.claim(code)) },
        ], TRANSFER_MENU.confirmListOffsetY);
    }

    private async claim(code: string): Promise<void> {
        const id = this.setStep('busy');
        this.setText('Loading the save...');
        this.setOptions([], 0);
        const result = await claimCode(code);
        if (id !== this.stepId) return;
        if (!result.ok) {
            // A code not found won't work a second time: no Try Again for it.
            const retry = result.error === 'notFound' ? undefined : () => void this.claim(code);
            this.showMessage(ERROR_TEXT[result.error], retry !== undefined, retry);
            return;
        }
        if (!applySave(result.value)) {
            this.showMessage('This browser did not let the game save.\nNothing was changed.', false);
            return;
        }
        this.setText('Done! Loading your save...');
        this.time.delayedCall(TRANSFER_RELOAD_DELAY_MS, () => reloadWithNewSave());
    }

    private showMessage(text: string, canRetry: boolean, retry?: () => void): void {
        this.setStep('message');
        this.setText(text);
        const items: MenuItem[] = canRetry && retry ? [{ label: 'Try Again', onConfirm: () => this.later(retry) }] : [];
        items.push({ label: 'Back', onConfirm: () => this.close() });
        this.setOptions(items, TRANSFER_MENU.messageListOffsetY);
    }

    /** Clears the previous step's texts and box; returns the new step's id. */
    private setStep(step: Step): number {
        this.step = step;
        this.stepId++;
        for (const text of this.texts) text.destroy();
        this.texts = [];
        this.hint = undefined;
        this.removeInput();
        return this.stepId;
    }

    private setText(text: string): void {
        this.addText(text, TRANSFER_MENU.textOffsetY, { ...MENU_TEXT_STYLE, wordWrap: { width: TRANSFER_MENU.textWrapWidth } })
            .setOrigin(0.5, 0);
    }

    private addText(text: string, offsetY: number, style: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text {
        const object = this.add.text(MENU_OVERLAY.panelX, this.contentTop + offsetY, text, style);
        this.texts.push(object);
        return object;
    }

    private setOptions(items: readonly MenuItem[], offset: number): void {
        this.list?.destroy();
        this.list = undefined;
        if (items.length > 0) this.addList(items, offset);
    }

    /** Next frame: the list that called this finishes reading its input before it is replaced. */
    private later(action: () => void): void {
        this.time.delayedCall(0, action);
    }

    /** The box to type the code: a real HTML input, so phones show their keyboard and a code can be pasted. */
    private createInput(): void {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = TRANSFER_MENU.inputMaxLength;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.placeholder = 'K7P-29X';
        input.setAttribute('autocapitalize', 'characters');
        input.setAttribute('aria-label', 'Transfer code');
        Object.assign(input.style, {
            position: 'fixed', boxSizing: 'border-box', textAlign: 'center', fontFamily: UI_FONT, fontWeight: 'bold',
            color: TRANSFER_MENU.codeColor, background: 'rgba(0, 0, 0, 0.75)', border: '2px solid #c8b88a', borderRadius: '4px',
            outline: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', zIndex: '10', padding: '0',
        });
        // The game reads keys on the whole window (and blocks some, like WASD): keys typed here stay here.
        const keepKey = (event: KeyboardEvent) => {
            event.stopPropagation();
            if (event.type !== 'keydown') return;
            if (event.key === 'Enter') this.submitCode();
            else if (event.key === 'Escape') this.close();
        };
        input.addEventListener('keydown', keepKey);
        input.addEventListener('keyup', keepKey);
        // The "not a code" line goes away as soon as the player types again.
        input.addEventListener('input', () => {
            this.hint?.destroy();
            this.hint = undefined;
        });
        (this.game.canvas.parentElement ?? document.body).appendChild(input);
        this.codeBox = input;
        this.placeInput();
        // A mouse or keyboard player can type straight away; on phones the keyboard opens when the box is tapped.
        if (!this.sys.game.device.input.touch) input.focus();
    }

    private removeInput(): void {
        this.codeBox?.remove();
        this.codeBox = undefined;
    }

    /** Keeps the box over its spot in the game, whatever the window size (also fullscreen and the phone keyboard). */
    private placeInput(): void {
        if (!this.codeBox) return;
        const rect = this.game.canvas.getBoundingClientRect();
        const scale = rect.width / GAME_WIDTH;
        const width = TRANSFER_MENU.inputWidth * scale;
        const height = TRANSFER_MENU.inputHeight * scale;
        const centerY = rect.top + ((this.contentTop + TRANSFER_MENU.codeOffsetY) / GAME_HEIGHT) * rect.height;
        const centerX = rect.left + (MENU_OVERLAY.panelX / GAME_WIDTH) * rect.width;
        const style = this.codeBox.style;
        style.left = `${centerX - width / 2}px`;
        style.top = `${centerY - height / 2}px`;
        style.width = `${width}px`;
        style.height = `${height}px`;
        style.fontSize = `${TRANSFER_MENU.inputFontSize * scale}px`;
    }
}
