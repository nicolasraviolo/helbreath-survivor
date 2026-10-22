// Panel de hablar con un NPC de la ciudad (Fase 23B), con el diseño de los demás paneles (GameDialog del original):
// su nombre de título, su frase y sus opciones, más "Back". Las opciones abren pantallas que ya existían:
// - Howard: Equipment y Warehouse (antes en Select Character).
// - William: Achievements; Missions, "Coming soon".
// - Shop Keeper: la tienda (Fase 24B, ShopScene). Tom: Buy y Sell (herrero, Fase 24C, SmithScene); Upgrade, "Coming soon" (24D).
// Al abrir una pantalla, este panel se cierra y esa pantalla vuelve directa a la ciudad.
import Phaser from 'phaser';
import { MENU_TEXT_STYLE, MENU_OVERLAY, RUN_CHOICE } from '../config/menus';
import { NPC_DIALOG_LIST } from '../config/town';
import { TOWN_NPCS, TOWN_TALK, type NpcAction, type NpcId } from '../data/town';
import type { MenuItem } from '../ui/MenuList';
import type { EquipmentSceneData } from './EquipmentScene';
import { MenuOverlayScene, type MenuOverlayData } from './MenuOverlayScene';
import { SHOP_SCENE_KEY, type ShopSceneData } from './ShopScene';
import { SMITH_SCENE_KEY, type SmithSceneData } from './SmithScene';
import type { WarehouseSceneData } from './WarehouseScene';

export const NPC_DIALOG_SCENE_KEY = 'NpcDialog';

export interface NpcDialogSceneData extends MenuOverlayData {
    npc: NpcId;
    /** The character walking the town (Equipment and Warehouse are its own). Undefined with no saved character. */
    characterUid: string | undefined;
}

export class NpcDialogScene extends MenuOverlayScene {
    protected title = '';
    protected override readonly itemSpacing = NPC_DIALOG_LIST.itemSpacing;
    private npc: NpcId = 'william';
    private characterUid: string | undefined;
    private text: Phaser.GameObjects.Text | undefined;

    constructor() {
        super(NPC_DIALOG_SCENE_KEY);
    }

    override init(data: NpcDialogSceneData): void {
        super.init(data);
        this.npc = data.npc;
        this.characterUid = data.characterUid;
        this.title = TOWN_NPCS[data.npc].name;
        this.text = undefined;
    }

    protected build(): void {
        const def = TOWN_NPCS[this.npc];
        this.setText(def.line);
        const items: MenuItem[] = def.options.map((option) => ({ label: option.label, onConfirm: () => this.choose(option.action) }));
        items.push({ label: 'Back', onConfirm: () => this.close() });
        this.addList(items, NPC_DIALOG_LIST.offsetY);
    }

    private choose(action: NpcAction): void {
        switch (action) {
            case 'soon':
                this.setText(TOWN_TALK.comingSoon);
                return;
            case 'achievements':
                this.openFromTown('Achievements', {});
                return;
            case 'shop':
                // Without a character it still opens: only the Zemstone needs one (it says so when you try).
                this.openFromTown(SHOP_SCENE_KEY, { characterUid: this.characterUid } satisfies ShopSceneData);
                return;
            case 'smithBuy':
            case 'smithSell':
            case 'smithUpgrade': {
                const tab = action === 'smithBuy' ? 'buy' : action === 'smithSell' ? 'sell' : 'upgrade';
                this.openFromTown(SMITH_SCENE_KEY, { characterUid: this.characterUid, tab } satisfies SmithSceneData);
                return;
            }
            case 'equipment':
            case 'warehouse': {
                const uid = this.characterUid;
                if (uid === undefined) {
                    this.setText(TOWN_TALK.noCharacter);
                    return;
                }
                if (action === 'equipment') this.openFromTown('Equipment', { characterUid: uid } satisfies EquipmentSceneData);
                else this.openFromTown('Warehouse', { characterUid: uid } satisfies WarehouseSceneData);
            }
        }
    }

    /**
     * Closes this panel and opens that screen over the town, which stays paused underneath: closing it goes straight
     * back to the town. Next frame, so the list that called this finishes reading its input first.
     */
    private openFromTown(key: string, extra: object): void {
        const town = this.returnScene;
        this.time.delayedCall(0, () => {
            const data: MenuOverlayData = { ...extra, returnTo: town };
            this.scene.launch(key, data);
            this.scene.bringToTop(key);
            this.scene.stop();
        });
    }

    private setText(text: string): void {
        this.text?.destroy();
        this.text = this.add.text(MENU_OVERLAY.panelX, this.contentTop + RUN_CHOICE.textOffsetY, text, {
            ...MENU_TEXT_STYLE, align: 'center', wordWrap: { width: RUN_CHOICE.textWrapWidth },
        }).setOrigin(0.5, 0);
    }
}
