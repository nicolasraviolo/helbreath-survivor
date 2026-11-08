// Helbreath Off (8-nov-2026): la pregunta antes de borrar un personaje en Select Character, "Delete <name>?", con
// No / Yes ("No" marcado primero, para no borrar por error). Mismo panel que las demás ventanas (MenuOverlayScene), como
// la de unirse a una ciudad (OffConfirmScene). Yes borra el personaje del hueco y cierra; No, Esc o B solo cierran.
import { MENU_TEXT_STYLE, MENU_OVERLAY, RUN_CHOICE } from '../../config/menus';
import { MenuOverlayScene, type MenuOverlayData } from '../../scenes/MenuOverlayScene';
import { OFF_SLOTS } from '../config/offSlots';
import { offSaveStore } from '../systems/OffSaveStore';

export const OFF_DELETE_SCENE_KEY = 'OffDelete';

export interface OffDeleteSceneData extends MenuOverlayData {
    slot: number;
}

export class OffDeleteScene extends MenuOverlayScene {
    protected readonly title = OFF_SLOTS.deleteTitle;
    private slot = 0;

    constructor() {
        super(OFF_DELETE_SCENE_KEY);
    }

    override init(data: OffDeleteSceneData): void {
        super.init(data);
        this.slot = data.slot;
    }

    protected build(): void {
        const name = offSaveStore.peek(this.slot)?.name ?? '';
        this.add.text(MENU_OVERLAY.panelX, this.contentTop + RUN_CHOICE.textOffsetY, OFF_SLOTS.deleteQuestion(name), {
            ...MENU_TEXT_STYLE, align: 'center', wordWrap: { width: RUN_CHOICE.textWrapWidth },
        }).setOrigin(0.5, 0);
        this.addList([
            { label: 'No', onConfirm: () => this.close() },
            { label: 'Yes', onConfirm: () => this.answer(true) },
        ], RUN_CHOICE.listOffsetY);
    }

    /** Development (`check offslotsdelete`): answers as the options would. */
    public answer(yes: boolean): void {
        // Deleted before closing: Select Character draws itself again when it resumes.
        if (yes) offSaveStore.remove(this.slot);
        this.close();
    }
}
