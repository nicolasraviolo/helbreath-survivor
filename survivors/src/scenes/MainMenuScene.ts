// Menú principal (Fase 8): la pantalla de título del Helbreath original con un panel de opciones a la derecha.
// Play → los 4 personajes (las partidas guardadas se continúan al elegir su personaje) (CharacterSlotsScene, Fase 17A); How to Play (Fase 11), Achievements, Settings y Credits se abren encima, y "What's new" (novedades) desde el link del pie; Install
// (Fase 12), si el navegador lo permite. Pantalla completa: icono pequeño arriba a la derecha (Fase 12C), y a su izquierda el de Discord. Suena la música por defecto del original.
// Se maneja con ↑/↓ (cruceta o stick) + Enter/A, o con el ratón.
import Phaser from 'phaser';
import { DEBUG_START } from '../config/debugStart';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { GAME_VERSION } from '../config/version';
import {
    MAIN_MENU,
    MAIN_MENU_FOOTER_Y,
    MAIN_MENU_NEWS_LINK,
    MENU_BACKGROUND,
    MENU_BACKGROUND_SCALE,
    MENU_FOOTER_STYLE,
    MENU_INPUT_DELAY_MS,
    MENU_PANEL,
} from '../config/menus';
import { MUSIC } from '../data/audio';
import { InputSystem } from '../systems/InputSystem';
import { MusicSystem } from '../systems/MusicSystem';
import { addDiscordButton } from '../ui/discordButton';
import { addFullscreenButton } from '../ui/fullscreen';
import { INSTALL_CHANGED, installEvents, installItem } from '../ui/install';
import { MenuList } from '../ui/MenuList';
import { openOverlay } from './MenuOverlayScene';
import type { CharacterSlotsSceneData } from './CharacterSlotsScene';

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
        this.addFooter();

        this.add.image(MAIN_MENU.panelX, MAIN_MENU.panelY, MENU_PANEL.texture, MENU_PANEL.frame)
            .setOrigin(0.5).setScale(MAIN_MENU.panelScale);
        // The old list (from the last time the menu was shown) went away with the scene.
        this.list = undefined;
        this.buildList();
        addFullscreenButton(this, () => this.ready());
        addDiscordButton(this, () => this.ready());
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
        // ?open= (debugStart.ts): show that menu screen once, as if it had been chosen here.
        if (DEBUG_START.open && DEBUG_START.open !== 'CharacterSlots' && DEBUG_START.open !== 'CharacterInfo' && DEBUG_START.open !== 'Equipment' && DEBUG_START.open !== 'Warehouse' && DEBUG_START.open !== 'RunChoice' && !debugScreenOpened) {
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
        // Only Play (21-oct-2026): a saved run is continued from Select Character, choosing its character.
        const play = () => this.scene.start('CharacterSlots', {} satisfies CharacterSlotsSceneData);
        const items = [
            { label: 'Play', onConfirm: play },
            { label: 'How to Play', onConfirm: () => openOverlay(this, 'HowToPlay') },
            { label: 'Achievements', onConfirm: () => openOverlay(this, 'Achievements') },
            { label: 'Settings', onConfirm: () => openOverlay(this, 'Settings') },
            { label: 'Credits', onConfirm: () => openOverlay(this, 'Credits') },
            ...installItem(),
        ];
        const maxSpan = (MAIN_MENU.itemsAtFullSpacing - 1) * MAIN_MENU.itemSpacing;
        const spacing = Math.min(MAIN_MENU.itemSpacing, maxSpan / Math.max(1, items.length - 1));
        const firstY = MAIN_MENU.panelY - ((items.length - 1) * spacing) / 2;
        this.list = new MenuList(this, items, { x: MAIN_MENU.panelX, y: firstY, spacing });
        this.list.setReadyCheck(() => this.ready());
    }

    /** Footer text and version, then the "What's new" link (ReleaseNotesScene), all centred together. */
    private addFooter(): void {
        const footer = this.add.text(0, MAIN_MENU_FOOTER_Y, GAME_VERSION + MAIN_MENU.footerSeparator, MENU_FOOTER_STYLE)
            .setOrigin(0, 0.5);
        const link = this.add.text(0, MAIN_MENU_FOOTER_Y, MAIN_MENU_NEWS_LINK.label, { ...MENU_FOOTER_STYLE, color: MAIN_MENU_NEWS_LINK.color })
            .setOrigin(0, 0.5);
        footer.x = (GAME_WIDTH - footer.width - link.width) / 2;
        link.x = footer.x + footer.width;
        const underline = this.add.rectangle(link.x, MAIN_MENU_FOOTER_Y + link.height / 2 - 2, link.width, 1, Phaser.Display.Color.HexStringToColor(MAIN_MENU_NEWS_LINK.color).color)
            .setOrigin(0, 0.5);
        // The click area is a bit bigger than the text, for fingers.
        const pad = MAIN_MENU_NEWS_LINK.hitPadding;
        const zone = this.add.zone(link.x - pad, MAIN_MENU_FOOTER_Y, link.width + pad * 2, link.height + pad * 2)
            .setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        const paint = (color: string) => {
            link.setColor(color);
            underline.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color);
        };
        zone.on(Phaser.Input.Events.POINTER_OVER, () => paint(MAIN_MENU_NEWS_LINK.hoverColor));
        zone.on(Phaser.Input.Events.POINTER_OUT, () => paint(MAIN_MENU_NEWS_LINK.color));
        zone.on(Phaser.Input.Events.POINTER_UP, () => {
            if (!this.ready()) return;
            paint(MAIN_MENU_NEWS_LINK.color);
            openOverlay(this, 'ReleaseNotes');
        });
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= MENU_INPUT_DELAY_MS;
    }
}
