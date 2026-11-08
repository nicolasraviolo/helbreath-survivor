// Escena de inicio de Helbreath Off (Fase Off-0): el título, Play y Back.
// Play abre Select Character (OffSlotsScene, 8-nov-2026); sin ningún personaje, la pantalla de crearlo (Fase Off-3A).
// Antes (Fase Off-1) Play cargaba Traveler Zone; sin personaje creado, antes abría la pantalla de crearlo para andar por él (OffWorldScene). Back (clic, Enter/A, o Esc/B) vuelve a la
// pantalla de elegir juego. Las fases siguientes (docs/PLAN-OFF.md) la llenan.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { MAIN_MENU, MENU_BACKGROUND, MENU_BACKGROUND_SCALE, MENU_INPUT_DELAY_MS, MENU_ITEM, MENU_PANEL } from '../../config/menus';
import { SpriteText } from '../../hb/SpriteText';
import { Action, InputSystem } from '../../systems/InputSystem';
import { MenuList } from '../../ui/MenuList';
import { OFF_HOME } from '../config/offHome';
import { offSaveStore } from '../systems/OffSaveStore';
import { OFF_CREATE_SCENE_KEY, type OffCreateSceneData } from './OffCreateScene';
import { OFF_SLOTS_SCENE_KEY } from './OffSlotsScene';

export class OffHomeScene extends Phaser.Scene {
    private menuInput!: InputSystem;
    private list!: MenuList;
    private openedAt = 0;

    constructor() {
        super('OffHome');
    }

    create(): void {
        this.openedAt = this.time.now;
        this.add.image(0, 0, MENU_BACKGROUND.texture, MENU_BACKGROUND.frame).setOrigin(0).setScale(MENU_BACKGROUND_SCALE);
        // Same black strip and panel as the main menu: they cover the original's buttons painted on the background.
        this.add.rectangle(0, GAME_HEIGHT - MAIN_MENU.footerHeight, GAME_WIDTH, MAIN_MENU.footerHeight, 0x000000).setOrigin(0);
        this.add.image(MAIN_MENU.panelX, MAIN_MENU.panelY, MENU_PANEL.texture, MENU_PANEL.frame).setOrigin(0.5).setScale(MAIN_MENU.panelScale);

        const x = MAIN_MENU.panelX;
        const title = new SpriteText(this, x, MAIN_MENU.panelY + OFF_HOME.titleOffsetY, OFF_HOME.title, MENU_ITEM.titleColor, 'center');
        title.container.setScale(OFF_HOME.titleScale);
        title.container.y -= title.container.getBounds().height / 2;
        this.list = new MenuList(this, [
            { label: 'Play', onConfirm: () => this.play() },
            { label: 'Back', onConfirm: () => this.back() },
        ], { x, y: MAIN_MENU.panelY + OFF_HOME.listOffsetY, spacing: MAIN_MENU.itemSpacing });
        this.list.setReadyCheck(() => this.ready());
        this.menuInput = new InputSystem(this);
        this.menuInput.setPointerMaxY(-1);
    }

    override update(): void {
        this.menuInput.update();
        if (!this.ready()) return;
        if (this.menuInput.justPressed(Action.Back)) {
            this.back();
            return;
        }
        this.list.handleInput(this.menuInput);
    }

    private play(): void {
        if (offSaveStore.hasAny) this.scene.start(OFF_SLOTS_SCENE_KEY);
        else this.scene.start(OFF_CREATE_SCENE_KEY, { slot: 0 } satisfies OffCreateSceneData);
    }

    private back(): void {
        this.scene.start('GameSelect');
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= MENU_INPUT_DELAY_MS;
    }
}
