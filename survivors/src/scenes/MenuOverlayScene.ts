// Base de las pantallas que se abren encima de otra (Pausa, Ajustes, Créditos y Logros): oscurece lo de debajo,
// pone el panel del original con su título y, al volver (Esc, B o la opción "Back"), reanuda la escena de debajo.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { MENU_INPUT_DELAY_MS, MENU_ITEM, MENU_OVERLAY, MENU_PANEL } from '../config/menus';
import { SpriteText } from '../hb/SpriteText';
import { Action, InputSystem } from '../systems/InputSystem';
import { MenuList, type MenuItem } from '../ui/MenuList';

export interface MenuOverlayData {
    /** Scene paused underneath; it is resumed when this one closes. */
    returnTo: string;
}

/** Opens an overlay menu over `from`, which stays paused (and drawn) underneath. */
export function openOverlay(from: Phaser.Scene, key: string, extra: object = {}): void {
    const data: MenuOverlayData = { ...extra, returnTo: from.scene.key };
    from.scene.pause();
    from.scene.launch(key, data);
    from.scene.bringToTop(key);
}

export abstract class MenuOverlayScene extends Phaser.Scene {
    protected menuInput!: InputSystem;
    protected list: MenuList | undefined;
    private returnTo = '';
    private openedAt = 0;

    protected abstract readonly title: string;
    /** Size of the panel; a screen with more content can make it bigger. */
    protected readonly panelScale: number = MENU_OVERLAY.panelScale;

    init(data: MenuOverlayData): void {
        this.returnTo = data.returnTo;
        this.list = undefined;
    }

    create(): void {
        this.openedAt = this.time.now;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, MENU_OVERLAY.shadeAlpha).setOrigin(0);
        this.add.image(MENU_OVERLAY.panelX, MENU_OVERLAY.panelY, MENU_PANEL.texture, MENU_PANEL.frame)
            .setOrigin(0.5).setScale(this.panelScale);
        const title = new SpriteText(this, MENU_OVERLAY.panelX, this.panelTop + MENU_OVERLAY.titleOffsetY, this.title, MENU_ITEM.titleColor, 'center');
        title.container.setScale(MENU_OVERLAY.titleScale);
        title.container.y -= title.container.getBounds().height / 2;

        this.menuInput = new InputSystem(this);
        // Options have their own click areas: a click elsewhere does nothing.
        this.menuInput.setPointerMaxY(-1);
        this.events.on(Phaser.Scenes.Events.RESUME, () => {
            this.openedAt = this.time.now;
        });
        this.build();
    }

    override update(): void {
        this.menuInput.update();
        if (!this.ready()) return;
        if (this.menuInput.justPressed(Action.Back) || this.menuInput.justPressed(Action.Pause)) {
            this.close();
            return;
        }
        this.list?.handleInput(this.menuInput);
    }

    /** Adds the options, starting at the content row. */
    protected addList(items: readonly MenuItem[], firstRowOffset = 0, valueBoxWidth?: number): MenuList {
        this.list = new MenuList(this, items, {
            x: MENU_OVERLAY.panelX,
            y: this.contentTop + firstRowOffset,
            spacing: MENU_OVERLAY.itemSpacing,
            valueHalfWidth: MENU_OVERLAY.valueColumnHalfWidth,
            valueBoxWidth,
        });
        this.list.setReadyCheck(() => this.ready());
        return this.list;
    }

    /** Back to the scene underneath. */
    protected close(): void {
        this.scene.stop();
        this.scene.resume(this.returnTo);
    }

    protected get panelTop(): number {
        return MENU_OVERLAY.panelY - (MENU_PANEL.height * this.panelScale) / 2;
    }

    protected get panelBottom(): number {
        return MENU_OVERLAY.panelY + (MENU_PANEL.height * this.panelScale) / 2;
    }

    protected get contentTop(): number {
        return this.panelTop + MENU_OVERLAY.contentOffsetY;
    }

    /** Builds the screen's content (options and text). */
    protected abstract build(): void;

    private ready(): boolean {
        return this.time.now - this.openedAt >= MENU_INPUT_DELAY_MS;
    }
}
