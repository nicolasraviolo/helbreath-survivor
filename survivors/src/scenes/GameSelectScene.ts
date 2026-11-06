// Pantalla de elegir juego (Fase Off-0): "Helbreath Survivors" o "Helbreath Off". Solo sale si se abre el juego con
// `?off` (Off está oculto, decisión del 6-nov-2026; ver off/offAccess.ts). Mismo fondo y panel que el menú principal;
// se maneja con ↑/↓ (cruceta o stick) + Enter/A, o con el ratón o el dedo.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { GAME_SELECT, MAIN_MENU, MENU_BACKGROUND, MENU_BACKGROUND_SCALE, MENU_INPUT_DELAY_MS, MENU_PANEL } from '../config/menus';
import { InputSystem } from '../systems/InputSystem';
import { addFullscreenButton } from '../ui/fullscreen';
import { MenuList } from '../ui/MenuList';

export class GameSelectScene extends Phaser.Scene {
    private menuInput!: InputSystem;
    private list!: MenuList;
    private openedAt = 0;

    constructor() {
        super('GameSelect');
    }

    create(): void {
        this.openedAt = this.time.now;
        this.add.image(0, 0, MENU_BACKGROUND.texture, MENU_BACKGROUND.frame).setOrigin(0).setScale(MENU_BACKGROUND_SCALE);
        // Same black strip as the main menu, over the original's "Multiplayer Online Game…" line.
        this.add.rectangle(0, GAME_HEIGHT - MAIN_MENU.footerHeight, GAME_WIDTH, MAIN_MENU.footerHeight, 0x000000).setOrigin(0);
        this.add.image(MAIN_MENU.panelX, MAIN_MENU.panelY, MENU_PANEL.texture, MENU_PANEL.frame).setOrigin(0.5).setScale(MAIN_MENU.panelScale);

        const items = [
            { label: GAME_SELECT.survivorsLabel, onConfirm: () => this.scene.start('MainMenu') },
            { label: GAME_SELECT.offLabel, onConfirm: () => this.scene.start('OffHome') },
        ];
        const firstY = MAIN_MENU.panelY - ((items.length - 1) * GAME_SELECT.itemSpacing) / 2;
        this.list = new MenuList(this, items, { x: MAIN_MENU.panelX, y: firstY, spacing: GAME_SELECT.itemSpacing });
        this.list.setReadyCheck(() => this.ready());
        addFullscreenButton(this, () => this.ready());

        this.menuInput = new InputSystem(this);
        this.menuInput.setPointerMaxY(-1);
    }

    override update(): void {
        this.menuInput.update();
        if (this.ready()) this.list.handleInput(this.menuInput);
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= MENU_INPUT_DELAY_MS;
    }
}
