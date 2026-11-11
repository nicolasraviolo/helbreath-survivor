// Helbreath Off: la ventana Settings propia de Off, con el estilo de la Off-12 (antes la pausa abría scenes/SettingsScene.ts
// de Survivors, que no se toca). Medidas y textos en off/config/offSettings.ts.
// - Tres secciones (Audio, Display, Gameplay) con solo lo que hace algo en Off. Cada cambio se aplica y se guarda al
//   momento (systems/Settings.ts avisa a la música, los efectos, el mapa y el filtro de sprites).
// - ↑/↓ mueven el foco; en el volumen ←/→ cambian el valor; en una casilla Enter / A / ←/→ la cambian. Esc / B cierran
//   y la pausa recupera el foco en Settings. Pistas del mando según la fila con foco, solo con el mando.
// - Fullscreen: el navegador solo la deja pedir con teclado o ratón, así que con el mando la fila se apaga con una nota.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { VOLUME_STEP } from '../../config/settings';
import type { MenuOverlayData } from '../../scenes/MenuOverlayScene';
import { Action, InputSystem } from '../../systems/InputSystem';
import { settings } from '../../systems/Settings';
import { fullscreenAvailable, toggleFullscreen } from '../../ui/fullscreen';
import { OFF_SETTINGS, OFF_SETTINGS_SECTIONS, OFF_SETTINGS_TEXT, type OffSettingId } from '../config/offSettings';
import { OFF_THEME_COLOR, OFF_THEME_SIZE } from '../config/offTheme';
import {
    OFF_PAD_DPAD, offButton, offCheckRow, offDivider, offFocusGroup, offFrame, offLabel, offLayoutIssues, offOptionRow, offPadHints, offText,
    type OffButton, type OffCheckRow, type OffControl, type OffFocusGroup, type OffOptionRow,
} from '../ui/offUi';

export const OFF_SETTINGS_SCENE_KEY = 'OffSettings';

const L = OFF_SETTINGS;
const T = OFF_SETTINGS_TEXT;

type VolumeKey = 'musicVolume' | 'sfxVolume';
type CheckId = Exclude<OffSettingId, 'music' | 'sound'>;
/** Which pad hints the focused row gets. */
type HintKind = 'volume' | 'check' | 'button';

export class OffSettingsScene extends Phaser.Scene {
    private returnTo = '';
    private inputSystem!: InputSystem;
    private controls: OffControl[] = [];
    private volumes = new Map<VolumeKey, OffOptionRow>();
    private checks = new Map<CheckId, OffCheckRow>();
    private back!: OffButton;
    private group!: OffFocusGroup;
    private hints = new Map<HintKind, Phaser.GameObjects.Container>();
    private padMode = false;
    /** `check`: behave as with the pad whatever the last device was. */
    private forcePad = false;
    private openedAt = 0;
    private closed = false;

    constructor() {
        super(OFF_SETTINGS_SCENE_KEY);
    }

    init(data: MenuOverlayData): void {
        this.returnTo = data.returnTo;
        this.controls = [];
        this.volumes = new Map();
        this.checks = new Map();
        this.hints = new Map();
        this.padMode = false;
        this.forcePad = false;
        this.closed = false;
    }

    create(): void {
        this.openedAt = this.game.loop.time;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, L.shadeAlpha).setOrigin(0).setInteractive();
        offFrame(this, L.x, L.y, L.w, L.h, { fill: OFF_THEME_COLOR.window, big: true });
        const cx = L.x + L.w / 2;
        const left = L.x + L.sidePad;
        const innerW = L.w - L.sidePad * 2;
        offText(this, cx, L.y + L.titleTop, T.title, 'title', { originX: 0.5, maxWidth: innerW });
        offDivider(this, left, L.y + L.dividerTop, innerW);

        let y = L.y + L.contentTop;
        for (const section of OFF_SETTINGS_SECTIONS) {
            offLabel(this, left + OFF_THEME_SIZE.listRowPadding, y, section.label, { maxWidth: innerW });
            y += L.labelGap;
            for (const id of section.rows) {
                this.controls.push(this.addRow(id, left, y, innerW));
                y += L.rowHeight;
            }
            y += L.sectionGap;
        }
        this.back = offButton(this, cx - L.buttonWidth / 2, L.y + L.buttonsTop, T.back, 'normal', () => this.close(), L.buttonWidth);
        this.controls.push(this.back);
        this.group = offFocusGroup(this.controls, 0);

        const hintY = L.y + L.hintsCentreY;
        this.hints.set('check', offPadHints(this, cx, hintY, [['A', T.toggle], ['B', T.back]]));
        this.hints.set('volume', offPadHints(this, cx, hintY, [[OFF_PAD_DPAD, T.change], ['B', T.back]]));
        this.hints.set('button', offPadHints(this, cx, hintY, [['A', T.select], ['B', T.back]]));

        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerMaxY(-1);
        // Fullscreen changes a moment after asking (or with the browser's own Esc / F11): repaint the box then.
        const onFullscreen = (): void => this.refresh();
        this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, onFullscreen);
        this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, onFullscreen);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, onFullscreen);
            this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, onFullscreen);
        });
        this.refresh();
    }

    private addRow(id: OffSettingId, x: number, y: number, w: number): OffControl {
        const index = this.controls.length;
        const focusHere = (): void => this.group.focusAt(index);
        if (id === 'music' || id === 'sound') {
            const key: VolumeKey = id === 'music' ? 'musicVolume' : 'sfxVolume';
            const row = offOptionRow(this, x, y, w, T.rows[id],
                () => this.ifReady(() => this.stepVolume(key, -1)), () => this.ifReady(() => this.stepVolume(key, 1)), focusHere);
            this.volumes.set(key, row);
            return row;
        }
        const row = offCheckRow(this, x, y, w, T.rows[id], () => this.ifReady(() => this.toggle(id)));
        this.checks.set(id, row);
        return row;
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        const pad = this.forcePad || input.getLastDevice() === 'gamepad';
        if (pad !== this.padMode) {
            this.padMode = pad;
            this.refresh();
        }
        const back = input.justPressed(Action.Back) || input.justPressed(Action.Pause);
        const step = input.justPressed(Action.MenuUp) ? -1 : input.justPressed(Action.MenuDown) ? 1 : 0;
        const side = input.justPressed(Action.MenuLeft) ? -1 : input.justPressed(Action.MenuRight) ? 1 : 0;
        const confirm = input.justPressed(Action.Confirm);
        if (this.ready()) {
            if (back) {
                this.close();
                return;
            }
            if (step !== 0) this.group.move(step);
            if (side !== 0) this.sideOnFocus(side);
            // On a volume row, A does nothing (its arrows take clicks; ←/→ change it).
            if (confirm && this.focusKind() !== 'volume') this.group.press();
        }
        this.showHints();
    }

    /** ← / → on the focused row: volume one step, a box flips; nothing on Back. */
    private sideOnFocus(side: number): void {
        const focused = this.controls[this.group.index()];
        for (const [key, row] of this.volumes) if (row === focused) this.stepVolume(key, side);
        for (const [id, row] of this.checks) if (row === focused) this.toggle(id);
    }

    private focusKind(): HintKind {
        const focused = this.controls[this.group.index()];
        if (focused === this.back) return 'button';
        return [...this.volumes.values()].some((r) => r === focused) ? 'volume' : 'check';
    }

    private showHints(): void {
        const kind = this.focusKind();
        for (const [k, c] of this.hints) c.setVisible(this.padMode && k === kind);
    }

    private stepVolume(key: VolumeKey, direction: number): void {
        const next = Math.round((settings.current[key] + direction * VOLUME_STEP) * 100) / 100;
        settings.set(key, Math.min(1, Math.max(0, next)));
        this.refresh();
    }

    private toggle(id: CheckId): void {
        switch (id) {
            case 'fullscreen':
                // The browser only allows it from a key or a click (never the pad): the row is off then.
                if (fullscreenAvailable(this) && !this.padMode) toggleFullscreen(this);
                break;
            case 'largeTrees':
                settings.set('largeTrees', settings.current.largeTrees === 'on' ? 'off' : 'on');
                break;
            case 'smoothSprites':
                settings.set('smoothSprites', !settings.current.smoothSprites);
                break;
            case 'minimap':
                settings.set('showMinimap', !settings.current.showMinimap);
                break;
            case 'screenShake':
                settings.set('screenShake', !settings.current.screenShake);
                break;
        }
        this.refresh();
    }

    /** Repaints every row from the settings (and the fullscreen state). */
    private refresh(): void {
        for (const [key, row] of this.volumes) {
            const v = settings.current[key];
            row.setValue(`${Math.round(v * 100)}%`);
            row.setPrevEnabled(v > 0);
            row.setNextEnabled(v < 1);
        }
        const c = settings.current;
        this.checks.get('largeTrees')?.setChecked(c.largeTrees === 'on');
        this.checks.get('smoothSprites')?.setChecked(c.smoothSprites);
        this.checks.get('minimap')?.setChecked(c.showMinimap);
        this.checks.get('screenShake')?.setChecked(c.screenShake);
        const full = this.checks.get('fullscreen');
        if (full) {
            const available = fullscreenAvailable(this);
            full.setChecked(this.scale.isFullscreen);
            full.setEnabled(available && !this.padMode);
            full.setNote(!available ? T.fullscreenUnavailable : this.padMode ? T.fullscreenPadNote : undefined);
            // The ring can't stay on a row that just went off.
            if (!full.isEnabled() && this.controls[this.group.index()] === full) this.group.focusAt(this.controls.indexOf(full));
        }
    }

    private ready(): boolean {
        return this.game.loop.time - this.openedAt >= L.inputDelayMs;
    }

    private ifReady(action: () => void): void {
        if (this.ready()) action();
    }

    public close(): void {
        if (this.closed) return;
        this.closed = true;
        this.scene.stop();
        this.scene.resume(this.returnTo);
    }

    // ---------------------------------------------------------------- development

    /** `check`: the rows, what has the focus and whether everything fits. */
    public debugState(): { rows: string[]; focus: string; window: { x: number; y: number; w: number; h: number }; issues: string[] } {
        const ids = OFF_SETTINGS_SECTIONS.flatMap((s) => s.rows);
        const names = [...ids.map((id) => T.rows[id]), T.back];
        return {
            rows: names,
            focus: names[this.group.index()] ?? '',
            window: { x: L.x, y: L.y, w: L.w, h: L.h },
            issues: offLayoutIssues(this),
        };
    }

    /** `check`: pad hints and the fullscreen row as with the pad. */
    public debugPadMode(): void {
        this.forcePad = true;
    }
}
