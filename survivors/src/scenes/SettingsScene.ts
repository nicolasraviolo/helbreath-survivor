// Ajustes (Fase 8): volumen de música y de efectos, y la barra de vida sobre el personaje.
// Se abre desde el menú principal o desde la pausa. Cada cambio se aplica y se guarda al momento.
// Fase 11: árboles grandes (On / Off).
// Fase 10: solo en el móvil, el estilo de la interfaz de la partida (HUD: Classic / Compact); en todos, el temblor de cámara.
// Fase 14A: casilla de estadísticas anónimas, con una línea abajo que explica para qué son.
// Fase 12C (táctil): casillas para lo que es sí/no (el volumen sigue con flechas y número, como prefiere el propietario) y la pantalla completa (antes en el menú
// principal); panel grande para que todo quepa dentro del marco.
// Fase 15C (táctil): casilla del stick de apuntar.
// Fase 19C: fila Controls, que abre ControlsScene (cambiar teclas y botones, y la vibración del mando).
// M13: dos pestañas, "Audio & Display" y "Gameplay", en el móvil y en el ordenador. Con menos filas por pestaña quedan
// más separadas (mejor para el dedo) y hay sitio para opciones nuevas. Se cambia tocando la pestaña o, con teclado o
// mando, con ◄ ► en la primera fila (la de las pestañas). Al volver a abrir Settings sale la última pestaña usada.
import Phaser from 'phaser';
import { COMPACT_UI } from '../config/device';
import { DEBUG_START } from '../config/debugStart';
import { MENU_ARROW, MENU_ITEM, MENU_OVERLAY, SETTINGS_MENU } from '../config/menus';
import { METRICS_NOTICE } from '../config/metrics';
import { HUD_STYLE_NAMES, TREE_MODE_NAMES, VOLUME_STEP } from '../config/settings';
import { UI_FONT_SIZE, UI_TEXT, px } from '../config/ui';
import { SpriteText } from '../hb/SpriteText';
import { settings } from '../systems/Settings';
import { fullscreenCheckboxItem } from '../ui/fullscreen';
import type { MenuItem } from '../ui/MenuList';
import { MenuOverlayScene, openOverlay } from './MenuOverlayScene';

/** Tab open the last time Settings was closed (only while the page is open). */
let lastTab = initialTab();

function initialTab(): number {
    const wanted = DEBUG_START.settingsTab;
    const index = wanted ? SETTINGS_MENU.tabNames.findIndex((name) => name.toLowerCase().startsWith(wanted)) : -1;
    return Math.max(0, index);
}

interface TabHeader {
    text: SpriteText;
    centerX: number;
    width: number;
}

export class SettingsScene extends MenuOverlayScene {
    protected readonly title = 'Settings';
    protected override readonly panelScale = MENU_OVERLAY.creditsPanelScale;
    protected override readonly itemSpacing = SETTINGS_MENU.itemSpacing;
    private tab = 0;
    /** Tab to open after this frame's input (switching inside the list's own input handling would rebuild it mid-way). */
    private pendingTab: number | undefined;
    private headers: TabHeader[] = [];
    private tabArrows: Phaser.GameObjects.Image[] = [];
    private underline: Phaser.GameObjects.Graphics | undefined;

    constructor() {
        super('Settings');
    }

    protected build(): void {
        this.tab = lastTab;
        this.pendingTab = undefined;
        this.buildTabBar();
        this.showTab();
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

    override update(): void {
        super.update();
        if (this.pendingTab !== undefined && this.pendingTab !== this.tab) {
            this.tab = this.pendingTab;
            lastTab = this.tab;
            this.showTab();
        }
        this.pendingTab = undefined;
        this.drawTabBar();
    }

    /** The tab names under the title, a line under the open one and ◄ ► at the ends (lit while that row is selected). */
    private buildTabBar(): void {
        const y = this.tabBarY;
        // Tab names side by side, the pair centred in the panel.
        const texts = SETTINGS_MENU.tabNames.map((name) => {
            const text = new SpriteText(this, 0, y, name, MENU_ITEM.color, 'center');
            text.container.setScale(MENU_ITEM.scale);
            text.container.y = y - text.container.getBounds().height / 2;
            return text;
        });
        const widths = texts.map((text) => text.width * MENU_ITEM.scale);
        const total = widths.reduce((sum, w) => sum + w, 0) + SETTINGS_MENU.tabGap * (texts.length - 1);
        let left = MENU_OVERLAY.panelX - total / 2;
        this.headers = texts.map((text, index) => {
            const width = widths[index] ?? 0;
            const centerX = left + width / 2;
            left += width + SETTINGS_MENU.tabGap;
            text.container.x = centerX;
            const zone = this.add.zone(centerX, y, width + SETTINGS_MENU.tabGap, MENU_ITEM.hitHeight).setInteractive({ useHandCursor: true });
            zone.on(Phaser.Input.Events.POINTER_UP, () => {
                this.pendingTab = index;
            });
            return { text, centerX, width };
        });

        const half = MENU_OVERLAY.valueColumnHalfWidth;
        this.tabArrows = [-1, 1].map((side) => {
            const x = MENU_OVERLAY.panelX + side * (total / 2 + SETTINGS_MENU.tabArrowMargin);
            const zone = this.add.zone(x, y, MENU_ITEM.arrowHitWidth, MENU_ITEM.hitHeight).setInteractive({ useHandCursor: true });
            zone.on(Phaser.Input.Events.POINTER_UP, () => this.turnTab(side));
            return this.add.image(x, y, MENU_ARROW.texture, MENU_ARROW.frame).setOrigin(0.5).setScale(MENU_ARROW.scale).setFlipX(side > 0);
        });

        const dividerY = y + SETTINGS_MENU.dividerOffsetY;
        this.add.graphics()
            .lineStyle(1, MENU_ITEM.color, SETTINGS_MENU.dividerAlpha)
            .lineBetween(MENU_OVERLAY.panelX - half, dividerY, MENU_OVERLAY.panelX + half, dividerY);
        this.underline = this.add.graphics();
    }

    private drawTabBar(): void {
        const barSelected = this.list?.selectedIndex === 0;
        this.headers.forEach((header, index) => {
            const open = index === this.tab;
            header.text.setColor(open ? MENU_ITEM.selectedColor : MENU_ITEM.color);
            header.text.container.setAlpha(open ? 1 : SETTINGS_MENU.idleTabAlpha);
        });
        for (const arrow of this.tabArrows) arrow.setAlpha(barSelected ? 1 : MENU_ARROW.idleAlpha);
        const open = this.headers[this.tab];
        if (!this.underline || !open) return;
        const y = this.tabBarY + SETTINGS_MENU.underlineOffsetY;
        this.underline.clear()
            .lineStyle(SETTINGS_MENU.underlineWidth, MENU_ITEM.selectedColor, barSelected ? 1 : SETTINGS_MENU.idleTabAlpha)
            .lineBetween(open.centerX - open.width / 2, y, open.centerX + open.width / 2, y);
    }

    private turnTab(direction: number): void {
        const count = SETTINGS_MENU.tabNames.length;
        this.pendingTab = (this.tab + direction + count) % count;
    }

    /** Rebuilds the list with the open tab's options; its first row is the tab bar (keyboard and gamepad only). */
    private showTab(): void {
        this.list?.destroy();
        const tabRow: MenuItem = {
            label: '', keyboardOnly: true, onLeft: () => this.turnTab(-1), onRight: () => this.turnTab(1), onConfirm: () => this.turnTab(1),
        };
        const rows = this.tab === 0 ? this.audioDisplayRows() : this.gameplayRows();
        this.addList([tabRow, ...rows, { label: 'Back', onConfirm: () => this.close() }],
            this.tabBarY - this.contentTop, SETTINGS_MENU.valueBoxWidth);
    }

    private audioDisplayRows(): MenuItem[] {
        const volume = (key: 'musicVolume' | 'sfxVolume'): Partial<MenuItem> => ({
            value: () => `${Math.round(settings.current[key] * 100)}%`,
            onLeft: () => settings.set(key, stepVolume(settings.current[key], -1)),
            onRight: () => settings.set(key, stepVolume(settings.current[key], 1)),
        });
        const toggleTrees = () => settings.set('largeTrees', settings.current.largeTrees === 'on' ? 'off' : 'on');
        const toggleHud = () => settings.set('hudStyle', settings.current.hudStyle === 'classic' ? 'compact' : 'classic');
        // The HUD style only matters on phones (Fase 10).
        const hudRow = COMPACT_UI
            ? [{ label: 'HUD', value: () => HUD_STYLE_NAMES[settings.current.hudStyle], onLeft: toggleHud, onRight: toggleHud }]
            : [];
        return [
            { label: 'Music', ...volume('musicVolume') },
            { label: 'Sound', ...volume('sfxVolume') },
            ...fullscreenCheckboxItem(this),
            { label: 'Large Trees', value: () => TREE_MODE_NAMES[settings.current.largeTrees], onLeft: toggleTrees, onRight: toggleTrees },
            ...hudRow,
        ];
    }

    private gameplayRows(): MenuItem[] {
        // The aim stick only exists on touch screens (Fase 15C).
        const aimStickRow = this.sys.game.device.input.touch ? [{ label: 'Aim Stick', ...checkbox('aimStick') }] : [];
        // Phone interface (no keyboard, a gamepad is rare): no Controls row (Fase 19C).
        const controlsRow: MenuItem[] = COMPACT_UI ? [] : [{ label: 'Controls', onConfirm: () => openOverlay(this, 'Controls') }];
        return [
            { label: 'Minimap', ...checkbox('showMinimap') },
            { label: 'Health Bar on Character', ...checkbox('showPlayerHealthBar') },
            { label: 'Screen Shake', ...checkbox('screenShake') },
            ...aimStickRow,
            ...controlsRow,
            { label: 'Anonymous Stats', ...checkbox('anonymousStats') },
        ];
    }

    private get tabBarY(): number {
        return this.contentTop + SETTINGS_MENU.tabBarOffset;
    }
}

type CheckboxSetting = 'showPlayerHealthBar' | 'screenShake' | 'anonymousStats' | 'aimStick' | 'showMinimap';

function checkbox(key: CheckboxSetting): Partial<MenuItem> {
    const toggle = () => settings.set(key, !settings.current[key]);
    return { checked: () => settings.current[key], onConfirm: toggle, onLeft: toggle, onRight: toggle };
}

/** One step up or down, kept within 0..1 and rounded so 0.1 steps don't drift (0.30000000000000004). */
function stepVolume(current: number, direction: number): number {
    const next = Math.round((current + direction * VOLUME_STEP) * 100) / 100;
    return Math.min(1, Math.max(0, next));
}
