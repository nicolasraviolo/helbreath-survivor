// Menú principal (Fase 8): la pantalla de título del Helbreath original con un panel de opciones a la derecha.
// Continue (Fase 12, si hay partidas guardadas) → SaveSlotsScene; Play → elegir personaje; How to Play (Fase 11), Achievements, Settings y Credits se abren encima; Fullscreen e Install
// (Fase 12), si el navegador lo permite. Suena la música por defecto del original.
// Se maneja con ↑/↓ (cruceta o stick) + Enter/A, o con el ratón.
import Phaser from 'phaser';
import { DEBUG_START } from '../config/debugStart';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import {
    MAIN_MENU,
    MAIN_MENU_FOOTER_Y,
    MENU_BACKGROUND,
    MENU_BACKGROUND_SCALE,
    MENU_FOOTER_STYLE,
    MENU_INPUT_DELAY_MS,
    MENU_PANEL,
} from '../config/menus';
import { MUSIC } from '../data/audio';
import { assetStreamer } from '../systems/AssetStreamer';
import { InputSystem } from '../systems/InputSystem';
import { MusicSystem } from '../systems/MusicSystem';
import { fullscreenItem } from '../ui/fullscreen';
import { INSTALL_CHANGED, installEvents, installItem } from '../ui/install';
import { MenuList } from '../ui/MenuList';
import { openOverlay } from './MenuOverlayScene';
import type { SaveSlotsSceneData } from './SaveSlotsScene';
import { saveStore } from '../systems/SaveStore';

/** ?open= only applies the first time the menu is shown. */
let debugScreenOpened = false;

export class MainMenuScene extends Phaser.Scene {
    private menuInput!: InputSystem;
    private list: MenuList | undefined;
    private openedAt = 0;

    constructor() {
        super('MainMenu');
    }

    create(): void {
        this.openedAt = this.time.now;
        this.add.image(0, 0, MENU_BACKGROUND.texture, MENU_BACKGROUND.frame).setOrigin(0).setScale(MENU_BACKGROUND_SCALE);
        this.add.rectangle(0, GAME_HEIGHT - MAIN_MENU.footerHeight, GAME_WIDTH, MAIN_MENU.footerHeight, 0x000000).setOrigin(0);
        this.add.text(GAME_WIDTH / 2, MAIN_MENU_FOOTER_Y, MAIN_MENU.footerText, MENU_FOOTER_STYLE).setOrigin(0.5);

        this.add.image(MAIN_MENU.panelX, MAIN_MENU.panelY, MENU_PANEL.texture, MENU_PANEL.frame)
            .setOrigin(0.5).setScale(MAIN_MENU.panelScale);
        // The old list (from the last time the menu was shown) went away with the scene.
        this.list = undefined;
        this.buildList();
        // Chrome can offer installing (or stop offering it) while the menu is open: the options are built again.
        const onInstallChanged = () => this.buildList();
        installEvents.on(INSTALL_CHANGED, onInstallChanged);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => installEvents.off(INSTALL_CHANGED, onInstallChanged));

        this.menuInput = new InputSystem(this);
        this.menuInput.setPointerMaxY(-1);
        this.events.on(Phaser.Scenes.Events.RESUME, () => {
            this.openedAt = this.time.now;
        });
        new MusicSystem(this).play(MUSIC.menu);
        // The monsters of later waves start downloading already, while the player is in the menus.
        assetStreamer.start(this);
        // ?open= (debugStart.ts): show that menu screen once, as if it had been chosen here.
        if (DEBUG_START.open && DEBUG_START.open !== 'CharacterSelect' && !debugScreenOpened) {
            debugScreenOpened = true;
            openOverlay(this, DEBUG_START.open);
        }
    }

    override update(): void {
        this.menuInput.update();
        if (this.ready()) this.list?.handleInput(this.menuInput);
    }

    private buildList(): void {
        this.list?.destroy();
        // Fase 12: Continue only with a saved run; Play with every slot in use first asks which run to delete.
        const continueItem = saveStore.hasAny
            ? [{ label: 'Continue', onConfirm: () => openOverlay(this, 'SaveSlots', { mode: 'continue' } satisfies SaveSlotsSceneData) }]
            : [];
        const play = () => {
            if (saveStore.hasFree) this.scene.start('CharacterSelect');
            else openOverlay(this, 'SaveSlots', { mode: 'replace' } satisfies SaveSlotsSceneData);
        };
        const items = [
            ...continueItem,
            { label: 'Play', onConfirm: play },
            { label: 'How to Play', onConfirm: () => openOverlay(this, 'HowToPlay') },
            { label: 'Achievements', onConfirm: () => openOverlay(this, 'Achievements') },
            { label: 'Settings', onConfirm: () => openOverlay(this, 'Settings') },
            { label: 'Credits', onConfirm: () => openOverlay(this, 'Credits') },
            ...fullscreenItem(this),
            ...installItem(),
        ];
        const maxSpan = (MAIN_MENU.itemsAtFullSpacing - 1) * MAIN_MENU.itemSpacing;
        const spacing = Math.min(MAIN_MENU.itemSpacing, maxSpan / Math.max(1, items.length - 1));
        const firstY = MAIN_MENU.panelY - ((items.length - 1) * spacing) / 2;
        this.list = new MenuList(this, items, { x: MAIN_MENU.panelX, y: firstY, spacing });
        this.list.setReadyCheck(() => this.ready());
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= MENU_INPUT_DELAY_MS;
    }
}
