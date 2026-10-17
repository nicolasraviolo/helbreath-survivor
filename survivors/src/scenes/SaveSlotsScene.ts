// Partidas guardadas (Fase 12, bloque 12B), encima del menú principal. Dos usos:
// - Continue: la lista de partidas sin terminar; al elegir una, la partida sigue desde ahí.
// - Play con las ranuras llenas: elegir qué partida borrar (con confirmación) para empezar una nueva.
import type Phaser from 'phaser';
import { MENU_OVERLAY, MENU_TEXT_STYLE } from '../config/menus';
import { CHARACTERS } from '../data/characters';
import { RESUME_SLOT_KEY, saveStore, type RunSnapshot } from '../systems/SaveStore';
import { formatTime } from '../utils/format';
import { MenuOverlayScene, type MenuOverlayData } from './MenuOverlayScene';

export interface SaveSlotsSceneData {
    mode: 'continue' | 'replace';
}

export class SaveSlotsScene extends MenuOverlayScene {
    private mode: SaveSlotsSceneData['mode'] = 'continue';
    /** Slot waiting for "Yes / No" before deleting it (replace mode). */
    private confirming: number | undefined;
    private message: Phaser.GameObjects.Text | undefined;

    constructor() {
        super('SaveSlots');
    }

    protected get title(): string {
        return this.mode === 'continue' ? 'Continue' : 'Saved Runs';
    }

    override init(data: SaveSlotsSceneData & MenuOverlayData): void {
        super.init(data);
        this.mode = data.mode;
        this.confirming = undefined;
        this.message = undefined;
    }

    protected build(): void {
        this.message = this.add.text(MENU_OVERLAY.panelX, this.contentTop, '', MENU_TEXT_STYLE).setOrigin(0.5);
        this.showSlots();
    }

    /** Esc / B while confirming goes back to the list instead of closing. */
    protected override close(): void {
        if (this.confirming !== undefined) {
            this.showSlots();
            return;
        }
        super.close();
    }

    private showSlots(): void {
        this.confirming = undefined;
        this.list?.destroy();
        this.message?.setText(this.mode === 'replace' ? 'All slots are in use. Choose a run to delete.' : '');
        const items = saveStore.all.flatMap((run, slot) => {
            if (!run) return [];
            const onConfirm = this.mode === 'continue' ? () => this.resume(slot) : () => this.askDelete(slot, run);
            return [{ label: describeRun(run), onConfirm }];
        });
        // Replace mode starts with a line of text: the slots go one row lower.
        const offset = this.mode === 'replace' ? MENU_OVERLAY.itemSpacing : 0;
        this.addList([...items, { label: 'Back', onConfirm: () => this.close() }], offset);
    }

    private askDelete(slot: number, run: Readonly<RunSnapshot>): void {
        this.confirming = slot;
        this.list?.destroy();
        this.message?.setText(`Delete this run and start a new one?\n${describeRun(run)}`);
        this.addList([
            { label: 'No', onConfirm: () => this.showSlots() },
            { label: 'Yes, delete it', onConfirm: () => this.deleteAndStart(slot) },
        ], MENU_OVERLAY.itemSpacing * 1.5);
    }

    private deleteAndStart(slot: number): void {
        saveStore.clear(slot);
        this.leaveMenusFor('CharacterSelect');
    }

    private resume(slot: number): void {
        this.registry.set(RESUME_SLOT_KEY, slot);
        this.leaveMenusFor('Game');
    }

    /** Closes this screen and the main menu underneath, and opens `key`. */
    private leaveMenusFor(key: string): void {
        this.scene.stop(this.returnScene);
        this.scene.start(key);
    }
}

/** "Warrior   Lv 12   08:31" */
function describeRun(run: Readonly<RunSnapshot>): string {
    return `${CHARACTERS[run.character].name}   Lv ${run.level}   ${formatTime(run.elapsedMs)}`;
}
