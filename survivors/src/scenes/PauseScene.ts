// Pausa de la partida (Fase 8): Esc o Start del mando, el botón del disquete de la barra, o sola si se desconecta
// el mando. La partida y la barra quedan congeladas debajo. Resume vuelve a jugar; Settings abre los ajustes;
// Fullscreen (si el navegador lo permite); Quit to menu abandona la partida y vuelve al menú principal.
import { fullscreenItem } from '../ui/fullscreen';
import { openOverlay, MenuOverlayScene, type MenuOverlayData } from './MenuOverlayScene';

export interface PauseSceneData {
    /** The game scene (paused underneath); it is stopped on "Quit to menu". */
    gameSceneKey: string;
}

export class PauseScene extends MenuOverlayScene {
    protected readonly title = 'Paused';
    private gameSceneKey = '';

    constructor() {
        super('Pause');
    }

    override init(data: PauseSceneData & MenuOverlayData): void {
        super.init(data);
        this.gameSceneKey = data.gameSceneKey;
    }

    protected build(): void {
        this.addList([
            { label: 'Resume', onConfirm: () => this.close() },
            { label: 'Settings', onConfirm: () => openOverlay(this, 'Settings') },
            ...fullscreenItem(this),
            { label: 'Quit to menu', onConfirm: () => this.quit() },
        ]);
    }

    /** Resumes the HUD (returnTo) and the game under it. */
    protected override close(): void {
        super.close();
        this.scene.resume(this.gameSceneKey);
    }

    private quit(): void {
        // Stopping the game also stops its HUD and level-up / game over scenes (GameScene, on SHUTDOWN).
        this.scene.stop(this.gameSceneKey);
        this.scene.start('MainMenu');
    }
}
