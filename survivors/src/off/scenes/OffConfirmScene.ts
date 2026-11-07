// Helbreath Off (Fase Off-5A): la pregunta al pisar el portal de una ciudad sin bando, "Do you want to join Aresden?"
// (o Elvine), con Yes / No. El mundo espera en pausa debajo (openOverlay). Con Yes el personaje queda unido para
// siempre a esa ciudad (propietario, 6-nov-2026) y va allí; No, Esc o B cierran y sigue en Traveler Zone, sobre el
// portal (no vuelve a preguntar hasta salir de él y volver a pisarlo).
// Mismo panel que los demás menús encima del juego (MenuOverlayScene), con el texto como el de hablar con un NPC.
import { MENU_TEXT_STYLE, MENU_OVERLAY, RUN_CHOICE } from '../../config/menus';
import { MenuOverlayScene, type MenuOverlayData } from '../../scenes/MenuOverlayScene';
import { OFF_PLACE_TEXT, type OffFaction } from '../data/offPlaces';

export const OFF_CONFIRM_SCENE_KEY = 'OffConfirm';

export interface OffConfirmSceneData extends MenuOverlayData {
    faction: OffFaction;
    /** Yes: called once this window has closed and the world is running again. */
    onYes: () => void;
}

export class OffConfirmScene extends MenuOverlayScene {
    protected title = '';
    private faction: OffFaction = 'aresden';
    private onYes: () => void = () => undefined;

    constructor() {
        super(OFF_CONFIRM_SCENE_KEY);
    }

    override init(data: OffConfirmSceneData): void {
        super.init(data);
        this.faction = data.faction;
        this.onYes = data.onYes;
        this.title = OFF_PLACE_TEXT.joinTitle(data.faction);
    }

    protected build(): void {
        const text = `${OFF_PLACE_TEXT.joinQuestion(this.faction)}\n${OFF_PLACE_TEXT.joinWarning}`;
        this.add.text(MENU_OVERLAY.panelX, this.contentTop + RUN_CHOICE.textOffsetY, text, {
            ...MENU_TEXT_STYLE, align: 'center', wordWrap: { width: RUN_CHOICE.textWrapWidth },
        }).setOrigin(0.5, 0);
        this.addList([
            { label: 'Yes', onConfirm: () => this.answer(true) },
            { label: 'No', onConfirm: () => this.close() },
        ], RUN_CHOICE.listOffsetY);
    }

    /** Development (`check offjoin`): answers as the options would. */
    public answer(yes: boolean): void {
        this.close();
        if (yes) this.onYes();
    }
}
