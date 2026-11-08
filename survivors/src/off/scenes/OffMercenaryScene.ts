// Helbreath Off (Fase Off-8B): la ventana de William, junto al teleport de la ciudad. Dice qué mercenario hay, a qué
// nivel y cuánto cuesta (pago único según tu nivel), y el oro que tienes. Hire lo contrata (sustituye al que hubiera),
// Dismiss lo despide, Close cierra. El mundo espera en pausa debajo (openOverlay), como el teleport.
// Off-8C: dos ofertas, Gorn el Guerrero y Kaila la Maga. Sigue habiendo uno a la vez: contratar a uno despide al otro.
import { MENU_TEXT_STYLE, MENU_OVERLAY, RUN_CHOICE } from '../../config/menus';
import { MenuOverlayScene, type MenuOverlayData } from '../../scenes/MenuOverlayScene';
import type { MenuItem } from '../../ui/MenuList';
import { OFF_MERCENARIES, OFF_MERCENARY_IDS, OFF_MERCENARY_TEXT, offMercenaryPrice, type OffMercenaryId } from '../data/offMercenary';
import { offSaveStore } from '../systems/OffSaveStore';

export const OFF_MERCENARY_SCENE_KEY = 'OffMercenary';

export interface OffMercenarySceneData extends MenuOverlayData {
    /** Hire: called once this window has closed and the world is running again. */
    onHire: (id: OffMercenaryId, price: number) => void;
    onDismiss: () => void;
}

export class OffMercenaryScene extends MenuOverlayScene {
    protected title = OFF_MERCENARY_TEXT.title;
    /** Off-8C: two offers and up to three options: the bigger panel (as Settings). */
    protected override readonly panelScale = MENU_OVERLAY.creditsPanelScale;
    private onHire: OffMercenarySceneData['onHire'] = () => undefined;
    private onDismiss: () => void = () => undefined;

    constructor() {
        super(OFF_MERCENARY_SCENE_KEY);
    }

    override init(data: OffMercenarySceneData): void {
        super.init(data);
        this.onHire = data.onHire;
        this.onDismiss = data.onDismiss;
    }

    protected build(): void {
        const level = offSaveStore.level;
        const gold = offSaveStore.character.gold;
        const hired = offSaveStore.character.mercenary;
        const offers = OFF_MERCENARY_IDS.map((id) => OFF_MERCENARY_TEXT.offer(OFF_MERCENARIES[id].name, OFF_MERCENARIES[id].kind, level, offMercenaryPrice(id, level)));
        const text = [OFF_MERCENARY_TEXT.npcLine, ...offers, OFF_MERCENARY_TEXT.yourGold(gold)].join('\n');
        this.add.text(MENU_OVERLAY.panelX, this.contentTop + RUN_CHOICE.textOffsetY, text, {
            ...MENU_TEXT_STYLE, align: 'center', wordWrap: { width: RUN_CHOICE.textWrapWidth },
        }).setOrigin(0.5, 0);
        const items: MenuItem[] = [];
        for (const id of OFF_MERCENARY_IDS) {
            if (id === hired) continue;
            const price = offMercenaryPrice(id, level);
            const name = OFF_MERCENARIES[id].name;
            items.push({ label: gold >= price ? OFF_MERCENARY_TEXT.hire(name, price) : `${OFF_MERCENARY_TEXT.hire(name, price)} · ${OFF_MERCENARY_TEXT.hireShort}`, onConfirm: () => this.hire(id) });
        }
        if (hired) items.push({ label: OFF_MERCENARY_TEXT.dismiss(OFF_MERCENARIES[hired].name), onConfirm: () => this.dismiss() });
        items.push({ label: OFF_MERCENARY_TEXT.close, onConfirm: () => this.close() });
        this.addList(items, RUN_CHOICE.confirmListOffsetY + MERCENARY_LIST_EXTRA_Y);
    }

    /** Development (`check offmerchire`): hires as the option would. */
    public hire(id: OffMercenaryId = 'warrior'): void {
        const price = offMercenaryPrice(id, offSaveStore.level);
        this.close();
        this.onHire(id, price);
    }

    public dismiss(): void {
        this.close();
        this.onDismiss();
    }
}

/** The text has five lines (three more than the teleport's question): the options go lower (px). */
const MERCENARY_LIST_EXTRA_Y = 34;
