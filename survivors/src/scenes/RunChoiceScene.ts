// Se abre en Select Character al elegir un personaje con una partida guardada (21-oct-2026): Continue la sigue;
// New Run avisa de que esa partida se pierde (su EXP y su botín) y, si se acepta, la borra y empieza una nueva.
// Continue carga el mapa de esa partida; la partida nueva pasa por Select Map (Fase 22A).
// Esc/B: desde el aviso vuelve a las dos opciones; desde ahí, a Select Character.
import Phaser from 'phaser';
import { MENU_OVERLAY, MENU_TEXT_STYLE, RUN_CHOICE } from '../config/menus';
import { CHARACTERS, CHOSEN_CHARACTER_KEY } from '../data/characters';
import { ACTIVE_CHARACTER_KEY, characterStore } from '../systems/CharacterStore';
import { RESUME_SLOT_KEY, saveStore } from '../systems/SaveStore';
import { formatTime } from '../utils/format';
import type { MenuItem } from '../ui/MenuList';
import type { MapLoadSceneData } from './MapLoadScene';
import { MenuOverlayScene, type MenuOverlayData } from './MenuOverlayScene';

export interface RunChoiceSceneData extends MenuOverlayData {
    /** Character slot (and its run's slot). */
    slot: number;
}

/**
 * Plays with the character in that slot: its saved run if `resume` (loading its map first, Fase 22A), otherwise
 * Select Map opens for a new run.
 */
export function startCharacterRun(scene: Phaser.Scene, slot: number, resume: boolean): void {
    const saved = characterStore.get(slot);
    if (!saved) return;
    scene.registry.set(CHOSEN_CHARACTER_KEY, saved.classId);
    scene.registry.set(ACTIVE_CHARACTER_KEY, saved.uid);
    const run = resume ? saveStore.get(slot) : undefined;
    if (run) {
        scene.registry.set(RESUME_SLOT_KEY, slot);
        scene.scene.start('MapLoad', { map: run.map } satisfies MapLoadSceneData);
        return;
    }
    scene.registry.remove(RESUME_SLOT_KEY);
    scene.scene.start('MapSelect');
}

export class RunChoiceScene extends MenuOverlayScene {
    protected readonly title = 'Saved Run';
    private slot = 0;
    private confirming = false;
    private text: Phaser.GameObjects.Text | undefined;

    constructor() {
        super('RunChoice');
    }

    override init(data: RunChoiceSceneData): void {
        super.init(data);
        this.slot = data.slot;
        this.confirming = false;
        this.text = undefined;
    }

    protected build(): void {
        this.showChoice();
    }

    /** Esc/B on the warning goes back to the two options. */
    protected override close(): void {
        if (this.confirming) this.later(() => this.showChoice());
        else super.close();
    }

    private showChoice(): void {
        this.confirming = false;
        const saved = characterStore.get(this.slot);
        const run = saveStore.get(this.slot);
        const who = saved ? `${saved.name} (${CHARACTERS[saved.classId].name})` : 'This character';
        const lines = [`${who} has a run in progress.`];
        if (run) lines.push(`Power ${run.level}, ${formatTime(run.elapsedMs)}.`);
        this.setText(lines.join('\n'));
        this.setOptions([
            { label: 'Continue', onConfirm: () => this.play(true) },
            { label: 'New Run', onConfirm: () => this.later(() => this.showConfirm()) },
            { label: 'Back', onConfirm: () => this.close() },
        ], RUN_CHOICE.listOffsetY);
    }

    private showConfirm(): void {
        this.confirming = true;
        this.setText('Start a new run?\nYou will lose this run\'s progress,\nincluding its EXP and loot.');
        // "No" first: Enter by mistake doesn't throw the run away.
        this.setOptions([
            { label: 'No', onConfirm: () => this.later(() => this.showChoice()) },
            { label: 'Yes', onConfirm: () => this.play(false) },
        ], RUN_CHOICE.confirmListOffsetY);
    }

    /** Next frame: the list that called this finishes reading its input before it is replaced. */
    private later(action: () => void): void {
        this.time.delayedCall(0, action);
    }

    private play(resume: boolean): void {
        if (!resume) saveStore.clear(this.slot);
        this.scene.stop(this.returnScene);
        startCharacterRun(this, this.slot, resume);
    }

    private setText(text: string): void {
        this.text?.destroy();
        this.text = this.add.text(MENU_OVERLAY.panelX, this.contentTop + RUN_CHOICE.textOffsetY, text, {
            ...MENU_TEXT_STYLE, wordWrap: { width: RUN_CHOICE.textWrapWidth },
        }).setOrigin(0.5, 0);
    }

    private setOptions(items: readonly MenuItem[], offset: number): void {
        this.list?.destroy();
        this.list = undefined;
        this.addList(items, offset);
    }
}
