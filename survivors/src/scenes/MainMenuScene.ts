// Menú principal (Fase 8): la pantalla de título del Helbreath original con un panel de opciones a la derecha.
// Play → elegir personaje; Achievements, Settings y Credits se abren encima; Fullscreen, si el navegador lo permite. Suena la música por defecto del original.
// Se maneja con ↑/↓ (cruceta o stick) + Enter/A, o con el ratón.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import {
    MAIN_MENU,
    MAIN_MENU_FOOTER_Y,
    MENU_BACKGROUND,
    MENU_BACKGROUND_SCALE,
    MENU_FOOTER_STYLE,
    MENU_HINT_STYLE,
    MENU_INPUT_DELAY_MS,
    MENU_PANEL,
} from '../config/menus';
import { MUSIC } from '../data/audio';
import { assetStreamer } from '../systems/AssetStreamer';
import { InputSystem } from '../systems/InputSystem';
import { MusicSystem } from '../systems/MusicSystem';
import { fullscreenItem } from '../ui/fullscreen';
import { MenuList } from '../ui/MenuList';
import { openOverlay } from './MenuOverlayScene';

export class MainMenuScene extends Phaser.Scene {
    private menuInput!: InputSystem;
    private list!: MenuList;
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
        const items = [
            { label: 'Play', onConfirm: () => this.scene.start('CharacterSelect') },
            { label: 'Achievements', onConfirm: () => openOverlay(this, 'Achievements') },
            { label: 'Settings', onConfirm: () => openOverlay(this, 'Settings') },
            { label: 'Credits', onConfirm: () => openOverlay(this, 'Credits') },
            ...fullscreenItem(this),
        ];
        const firstY = MAIN_MENU.panelY - ((items.length - 1) * MAIN_MENU.itemSpacing) / 2;
        this.list = new MenuList(this, items, { x: MAIN_MENU.panelX, y: firstY, spacing: MAIN_MENU.itemSpacing });
        this.list.setReadyCheck(() => this.ready());
        const panelBottom = MAIN_MENU.panelY + (MENU_PANEL.height * MAIN_MENU.panelScale) / 2;
        this.add.text(MAIN_MENU.panelX, panelBottom + 14, '↑ ↓  and  Enter   ·   D-pad and A   ·   Click', MENU_HINT_STYLE).setOrigin(0.5, 0);

        this.menuInput = new InputSystem(this);
        this.menuInput.setPointerMaxY(-1);
        this.events.on(Phaser.Scenes.Events.RESUME, () => {
            this.openedAt = this.time.now;
        });
        new MusicSystem(this).play(MUSIC.menu);
        // The monsters of later waves start downloading already, while the player is in the menus.
        assetStreamer.start(this);
    }

    override update(): void {
        this.menuInput.update();
        if (this.ready()) this.list.handleInput(this.menuInput);
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= MENU_INPUT_DELAY_MS;
    }
}
