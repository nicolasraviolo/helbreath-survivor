// Helbreath Off (Fase Off-7A): el teleport de la ciudad deja elegir adónde ir (propietario, 8-nov-2026, como el portal
// de Survivors): Traveler Zone o Promiseland (OFF_TELEPORT_DESTINATIONS). Mismo panel que la pregunta de unirse a un
// bando (OffConfirmScene): el mundo espera en pausa debajo. Cancel, Esc o B cierran y sigues sobre el teleport (no vuelve
// a preguntar hasta salir de él y volver a pisarlo).
import { MENU_TEXT_STYLE, MENU_OVERLAY, RUN_CHOICE } from '../../config/menus';
import { MenuOverlayScene, type MenuOverlayData } from '../../scenes/MenuOverlayScene';
import { OFF_PLACE_TEXT, OFF_PLACES, OFF_TELEPORT_DESTINATIONS, type OffPlaceId } from '../data/offPlaces';

export const OFF_TELEPORT_SCENE_KEY = 'OffTeleport';

export interface OffTeleportSceneData extends MenuOverlayData {
    /** A destination: called once this window has closed and the world is running again. */
    onChoose: (place: OffPlaceId) => void;
}

export class OffTeleportScene extends MenuOverlayScene {
    protected title = OFF_PLACE_TEXT.teleportTitle;
    private onChoose: (place: OffPlaceId) => void = () => undefined;

    constructor() {
        super(OFF_TELEPORT_SCENE_KEY);
    }

    override init(data: OffTeleportSceneData): void {
        super.init(data);
        this.onChoose = data.onChoose;
    }

    protected build(): void {
        this.add.text(MENU_OVERLAY.panelX, this.contentTop + RUN_CHOICE.textOffsetY, OFF_PLACE_TEXT.teleportQuestion, {
            ...MENU_TEXT_STYLE, align: 'center', wordWrap: { width: RUN_CHOICE.textWrapWidth },
        }).setOrigin(0.5, 0);
        this.addList([
            ...OFF_TELEPORT_DESTINATIONS.map((place) => ({ label: OFF_PLACES[place].name, onConfirm: () => this.choose(place) })),
            { label: OFF_PLACE_TEXT.teleportCancel, onConfirm: () => this.close() },
        ], RUN_CHOICE.listOffsetY);
    }

    /** Development (`check offteleport`): chooses as the options would. */
    public choose(place: OffPlaceId): void {
        this.close();
        this.onChoose(place);
    }
}
