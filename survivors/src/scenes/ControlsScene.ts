// Settings → Controls (Fase 19C): cambiar la tecla y el botón del Critical Strike / Meteor Strike y del panel de stats,
// y la casilla de vibración del mando (data/feedback.ts, GAMEPAD_RUMBLE).
// En una fila, Enter / A / clic la deja esperando ("..."); la siguiente tecla o botón válido se queda. Esc o B cancelan
// (y un clic en la misma fila). Si la tecla ya la usaba la otra acción, se intercambian. "Reset to default" vuelve a
// las de serie. Qué se puede cambiar y qué teclas quedan fijas: config/controls.ts.
import Phaser from 'phaser';
import { CONTROLS_MENU, MENU_OVERLAY } from '../config/menus';
import {
    DEFAULT_CONTROLS, GAMEPAD_BUTTON, buttonName, canBindButton, canBindKey, keyName, rebind, type ControlBindings,
    type RemappableControl,
} from '../config/controls';
import { Action } from '../systems/InputSystem';
import { settings } from '../systems/Settings';
import type { MenuItem } from '../ui/MenuList';
import { MenuOverlayScene } from './MenuOverlayScene';

type Device = keyof ControlBindings;

interface Waiting {
    device: Device;
    control: RemappableControl;
}

const CONTROL_LABELS: Readonly<Record<RemappableControl, string>> = { critStrike: 'Crit', toggleStats: 'Character' };
const DEVICE_LABELS: Readonly<Record<Device, string>> = { keyboard: 'Key', gamepad: 'Button' };
/** Keys that stop waiting without changing anything (also read here: a very short press can miss Action.Back). */
const CANCEL_KEYS: readonly number[] = [Phaser.Input.Keyboard.KeyCodes.ESC, Phaser.Input.Keyboard.KeyCodes.BACKSPACE];
/** Shown in the row while it waits for a key or button. */
const WAITING_TEXT = '...';

export class ControlsScene extends MenuOverlayScene {
    protected readonly title = 'Controls';
    protected override readonly panelScale = MENU_OVERLAY.creditsPanelScale;
    protected override readonly itemSpacing = CONTROLS_MENU.itemSpacing;
    private waiting: Waiting | undefined;
    /** Key pressed while waiting, applied in the next update (after the menu has swallowed that press). */
    private pendingKey: number | undefined;

    constructor() {
        super('Controls');
    }

    protected build(): void {
        this.waiting = undefined;
        this.pendingKey = undefined;
        const row = (control: RemappableControl, device: Device): MenuItem => ({
            label: `${CONTROL_LABELS[control]} ${DEVICE_LABELS[device]}`,
            noArrows: true,
            value: () => {
                if (this.waiting?.control === control && this.waiting.device === device) return WAITING_TEXT;
                const value = settings.current.controls[device][control];
                return device === 'keyboard' ? keyName(value) : buttonName(value);
            },
            onConfirm: () => this.toggleWaiting({ device, control }),
        });
        const toggleVibration = () => settings.set('vibration', !settings.current.vibration);
        this.addList([
            row('critStrike', 'keyboard'),
            row('critStrike', 'gamepad'),
            row('toggleStats', 'keyboard'),
            row('toggleStats', 'gamepad'),
            { label: 'Vibration', checked: () => settings.current.vibration, onConfirm: toggleVibration, onLeft: toggleVibration, onRight: toggleVibration },
            { label: 'Reset to default', onConfirm: () => this.finish(DEFAULT_CONTROLS) },
            { label: 'Back', onConfirm: () => this.close() },
        ], CONTROLS_MENU.firstRowOffset, CONTROLS_MENU.valueBoxWidth);

        const keyboard = this.input.keyboard;
        const onKey = (event: KeyboardEvent) => {
            if (this.waiting) this.pendingKey = event.keyCode;
        };
        keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, onKey);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, onKey));
    }

    override update(): void {
        if (!this.waiting) {
            super.update();
            return;
        }
        const input = this.menuInput;
        input.update();
        // Swallow this frame's menu presses, so the key just picked (Space, A...) doesn't also act on the menu.
        const cancel = input.justPressed(Action.Back) || input.justPressed(Action.Pause);
        for (const action of [Action.Confirm, Action.MenuUp, Action.MenuDown, Action.MenuLeft, Action.MenuRight]) input.justPressed(action);
        const { device, control } = this.waiting;
        const key = this.pendingKey;
        this.pendingKey = undefined;
        const button = input.justPressedButton();
        if (device === 'keyboard' && key !== undefined && canBindKey(key)) {
            this.finish(rebind(settings.current.controls, device, control, key));
        } else if (device === 'gamepad' && button !== undefined && canBindButton(button)) {
            this.finish(rebind(settings.current.controls, device, control, button));
        } else if (cancel || button === GAMEPAD_BUTTON.B || (device === 'keyboard' && key !== undefined && CANCEL_KEYS.includes(key))) {
            this.finish(undefined);
        }
    }

    /** Starts waiting on that row, or stops if it was already waiting there (a second click). */
    private toggleWaiting(next: Waiting): void {
        const same = this.waiting?.control === next.control && this.waiting.device === next.device;
        this.waiting = same ? undefined : next;
        this.pendingKey = undefined;
        this.list?.refresh();
    }

    private finish(controls: ControlBindings | undefined): void {
        this.waiting = undefined;
        if (controls) settings.set('controls', controls);
        this.list?.refresh();
    }
}
