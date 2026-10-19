// Ajustes (Fase 8): volumen de música y de efectos, y la barra de vida sobre el personaje.
// Se abre desde el menú principal o desde la pausa. Cada cambio se aplica y se guarda al momento.
// Fase 11: árboles grandes (On / Off).
// Fase 10: solo en el móvil, el estilo de la interfaz de la partida (HUD: Classic / Compact); en todos, el temblor de cámara.
// Fase 14A: casilla de estadísticas anónimas, con una línea abajo que explica para qué son.
// Fase 12C (táctil): casillas para lo que es sí/no (el volumen sigue con flechas y número, como prefiere el propietario) y la pantalla completa (antes en el menú
// principal); panel grande para que todo quepa dentro del marco.
// Fase 15C (táctil): casilla del stick de apuntar.
// Fase 19C: fila Controls, que abre ControlsScene (cambiar teclas y botones, y la vibración del mando).
import Phaser from 'phaser';
import { COMPACT_UI } from '../config/device';
import { MENU_OVERLAY, SETTINGS_MENU } from '../config/menus';
import { METRICS_NOTICE } from '../config/metrics';
import { HUD_STYLE_NAMES, TREE_MODE_NAMES, VOLUME_STEP } from '../config/settings';
import { UI_FONT_SIZE, UI_TEXT, px } from '../config/ui';
import { settings } from '../systems/Settings';
import { fullscreenCheckboxItem } from '../ui/fullscreen';
import type { MenuItem } from '../ui/MenuList';
import { MenuOverlayScene, openOverlay } from './MenuOverlayScene';

export class SettingsScene extends MenuOverlayScene {
    protected readonly title = 'Settings';
    protected override readonly panelScale = MENU_OVERLAY.creditsPanelScale;
    protected override readonly itemSpacing = SETTINGS_MENU.itemSpacing;

    constructor() {
        super('Settings');
    }

    protected build(): void {
        const volume = (key: 'musicVolume' | 'sfxVolume'): Partial<MenuItem> => ({
            value: () => `${Math.round(settings.current[key] * 100)}%`,
            onLeft: () => settings.set(key, stepVolume(settings.current[key], -1)),
            onRight: () => settings.set(key, stepVolume(settings.current[key], 1)),
        });
        const checkbox = (key: 'showPlayerHealthBar' | 'screenShake' | 'anonymousStats' | 'aimStick' | 'showMinimap'): Partial<MenuItem> => {
            const toggle = () => settings.set(key, !settings.current[key]);
            return { checked: () => settings.current[key], onConfirm: toggle, onLeft: toggle, onRight: toggle };
        };
        const toggleTrees = () => settings.set('largeTrees', settings.current.largeTrees === 'on' ? 'off' : 'on');
        const toggleHud = () => settings.set('hudStyle', settings.current.hudStyle === 'classic' ? 'compact' : 'classic');
        const hudRow = COMPACT_UI
            ? [{ label: 'HUD', value: () => HUD_STYLE_NAMES[settings.current.hudStyle], onLeft: toggleHud, onRight: toggleHud }]
            : [];
        // The aim stick only exists on touch screens (Fase 15C).
        const aimStickRow = this.sys.game.device.input.touch ? [{ label: 'Aim Stick', ...checkbox('aimStick') }] : [];
        // Phone interface (no keyboard, a gamepad is rare, and the panel is full): no Controls row (Fase 19C).
        const controlsRow: MenuItem[] = COMPACT_UI ? [] : [{ label: 'Controls', onConfirm: () => openOverlay(this, 'Controls') }];
        this.addList([
            { label: 'Music', ...volume('musicVolume') },
            { label: 'Sound', ...volume('sfxVolume') },
            { label: 'Health Bar on Character', ...checkbox('showPlayerHealthBar') },
            { label: 'Screen Shake', ...checkbox('screenShake') },
            { label: 'Minimap', ...checkbox('showMinimap') },
            {
                label: 'Large Trees',
                value: () => TREE_MODE_NAMES[settings.current.largeTrees],
                onLeft: toggleTrees,
                onRight: toggleTrees,
            },
            ...hudRow,
            ...aimStickRow,
            ...controlsRow,
            ...fullscreenCheckboxItem(this),
            { label: 'Anonymous Stats', ...checkbox('anonymousStats') },
            { label: 'Back', onConfirm: () => this.close() },
        ], SETTINGS_MENU.firstRowOffset, SETTINGS_MENU.valueBoxWidth);
        this.add.text(MENU_OVERLAY.panelX, this.panelBottom + SETTINGS_MENU.noticeOffsetY, METRICS_NOTICE, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.small), color: SETTINGS_MENU.noticeColor, align: 'center', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);

        // Entering or leaving fullscreen takes a moment (and Esc / the back gesture also leave it): tick the box then.
        const refresh = () => this.list?.refresh();
        this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, refresh);
        this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, refresh);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, refresh);
            this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, refresh);
        });
    }
}

/** One step up or down, kept within 0..1 and rounded so 0.1 steps don't drift (0.30000000000000004). */
function stepVolume(current: number, direction: number): number {
    const next = Math.round((current + direction * VOLUME_STEP) * 100) / 100;
    return Math.min(1, Math.max(0, next));
}
