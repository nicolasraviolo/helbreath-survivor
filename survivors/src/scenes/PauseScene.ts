// Pausa de la partida (Fase 8): Esc o Start del mando, el botón del disquete de la barra, o sola si se desconecta
// el mando. La partida y la barra quedan congeladas debajo. Resume vuelve a jugar; Settings abre los ajustes;
// Fullscreen (si el navegador lo permite); Quit to menu abandona la partida y vuelve al menú principal.
// En la ciudad (24-oct-2026, propietario) además Character (repartir los puntos) y Equipment, sin ir a Howard.
import { QUIT_RUN_EVENT } from '../config/hud';
import { MENU_OVERLAY } from '../config/menus';
import { fullscreenItem } from '../ui/fullscreen';
import type { CharacterId } from '../data/characters';
import type { CharacterInfoSceneData } from './CharacterInfoScene';
import type { EquipmentSceneData } from './EquipmentScene';
import { startTown } from './MapLoadScene';
import { BARRACKS_EXIT_KEY } from '../data/training';
import { openOverlay, MenuOverlayScene, type MenuOverlayData } from './MenuOverlayScene';

export interface PauseSceneData {
    /** The game scene (paused underneath); it is stopped on "Quit to menu". */
    gameSceneKey: string;
    /** Paused in the town with a saved character: Character and Equipment open over the town. */
    town?: { characterUid: string; classId: CharacterId };
    /** Barracks (training): Back to Town leaves it (nothing to lose there). */
    leaveToTown?: boolean;
}

export class PauseScene extends MenuOverlayScene {
    protected readonly title = 'Paused';
    private gameSceneKey = '';
    private town: PauseSceneData['town'];
    private leaveToTown = false;
    /** In the town there are two more options: the bigger panel, so all of them fit inside the frame. */
    protected override panelScale: number = MENU_OVERLAY.panelScale;
    protected override itemSpacing: number = MENU_OVERLAY.itemSpacing;

    constructor() {
        super('Pause');
    }

    override init(data: PauseSceneData & MenuOverlayData): void {
        super.init(data);
        this.gameSceneKey = data.gameSceneKey;
        this.town = data.town;
        this.leaveToTown = data.leaveToTown === true;
        // The town and the Barracks (Back to Town) have more options: the bigger panel, so all of them fit in the frame.
        const longer = data.town !== undefined || data.leaveToTown === true;
        this.panelScale = longer ? MENU_OVERLAY.creditsPanelScale : MENU_OVERLAY.panelScale;
        this.itemSpacing = longer ? MENU_OVERLAY.townPauseItemSpacing : MENU_OVERLAY.itemSpacing;
    }

    protected build(): void {
        this.addList([
            { label: 'Resume', onConfirm: () => this.close() },
            ...this.townItems(),
            { label: 'Settings', onConfirm: () => openOverlay(this, 'Settings') },
            { label: 'How to Play', onConfirm: () => openOverlay(this, 'HowToPlay') },
            ...fullscreenItem(this),
            ...(this.leaveToTown ? [{ label: 'Back to Town', onConfirm: () => this.backToTown() }] : []),
            { label: 'Quit to menu', onConfirm: () => this.quit() },
        ]);
    }

    private townItems(): Array<{ label: string; onConfirm: () => void }> {
        const town = this.town;
        if (!town) return [];
        const character: CharacterInfoSceneData = { characterUid: town.characterUid, classId: town.classId };
        const equipment: Omit<EquipmentSceneData, 'returnTo'> = { characterUid: town.characterUid };
        return [
            { label: 'Character', onConfirm: () => this.openOverTown('CharacterInfo', character) },
            { label: 'Equipment', onConfirm: () => this.openOverTown('Equipment', equipment) },
        ];
    }

    /**
     * Closes the pause and opens that screen over the town, which stays paused underneath: closing it goes straight
     * back to the town (as Howard's panel does). Next frame, so the list finishes reading its input first.
     */
    private openOverTown(key: string, extra: object): void {
        const town = this.gameSceneKey;
        this.time.delayedCall(0, () => {
            const data: MenuOverlayData = { ...extra, returnTo: town };
            this.scene.launch(key, data);
            this.scene.bringToTop(key);
            this.scene.stop();
        });
    }

    /** Resumes the HUD (returnTo) and the game under it. */
    protected override close(): void {
        super.close();
        this.scene.resume(this.gameSceneKey);
    }

    /** Barracks: straight back to the town (stopping the game also stops its HUD). */
    private backToTown(): void {
        this.registry.set(BARRACKS_EXIT_KEY, true);
        this.scene.stop(this.gameSceneKey);
        startTown(this);
    }

    private quit(): void {
        this.scene.get(this.gameSceneKey).events.emit(QUIT_RUN_EVENT);
        // Stopping the game also stops its HUD and level-up / game over scenes (GameScene, on SHUTDOWN).
        this.scene.stop(this.gameSceneKey);
        this.scene.start('MainMenu');
    }
}
