// Panel de daño de los Barracks (31-oct-2026; medidas en config/training.ts): los números del medidor
// (systems/TrainingGround.ts) y tres botones, Level Up, Reset y Equipment, que también van con L, R e I.
import Phaser from 'phaser';
import { COMPACT_UI } from '../config/device';
import { DEPTH_DEBUG } from '../config/gameConfig';
import { TRAINING_PANEL } from '../config/training';
import { px, UI_TEXT } from '../config/ui';
import { TRAINING } from '../data/training';
import type { TrainingMeter } from '../systems/TrainingGround';
import { ScreenLayer } from './renderScale';

export interface TrainingPanelActions {
    levelUp: () => void;
    reset: () => void;
    /** Undefined without a saved character (debug runs): no Equipment button. */
    equipment: (() => void) | undefined;
}

export class TrainingPanel {
    private readonly text: Phaser.GameObjects.Text;
    private readonly buttons: Phaser.GameObjects.Text[];
    private refreshInMs = 0;

    constructor(scene: Phaser.Scene, actions: TrainingPanelActions) {
        const p = TRAINING_PANEL;
        const style = { ...UI_TEXT, fontSize: px(p.fontSize), color: p.textColor, backgroundColor: p.background, padding: p.padding, lineSpacing: p.lineGap };
        this.text = scene.add.text(p.x, p.y, '', style);
        const layer = new ScreenLayer(scene, DEPTH_DEBUG - 3).addFixed(this.text);
        // Keys are shown on PC only (phones tap the buttons).
        const key = (letter: string) => (COMPACT_UI ? '' : ` (${letter})`);
        const buttons: Array<[string, () => void]> = [[`Level Up${key('L')}`, actions.levelUp], [`Reset${key('R')}`, actions.reset]];
        if (actions.equipment) buttons.push([`Equipment${key('I')}`, actions.equipment]);
        this.buttons = buttons.map(([label, onTap]) => {
            const button = scene.add.text(0, 0, label, {
                ...UI_TEXT, fontSize: px(p.fontSize), color: p.buttonColor, backgroundColor: p.buttonBackground,
                padding: { x: p.padding.x, y: p.buttonPaddingY },
            }).setInteractive({ useHandCursor: true });
            button.on(Phaser.Input.Events.POINTER_DOWN, (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
                // The tap is the button's only: it must not also move the player or aim.
                event.stopPropagation();
                onTap();
            });
            layer.addFixed(button);
            return button;
        });
        this.show({ dpsNow: 0, dpsAverage: 0, total: 0, biggest: 0, hits: 0, crits: 0, seconds: 0 });
    }

    public update(deltaMs: number, meter: TrainingMeter): void {
        if ((this.refreshInMs -= deltaMs) > 0) return;
        this.refreshInMs = TRAINING_PANEL.refreshMs;
        this.show(meter);
    }

    private show(meter: TrainingMeter): void {
        const n = (value: number) => Math.round(value).toLocaleString('en-US');
        const critShare = meter.hits > 0 ? Math.round((meter.crits / meter.hits) * 100) : 0;
        this.text.setText([
            'Training',
            `DPS (last ${TRAINING.dpsWindowMs / 1000} s): ${n(meter.dpsNow)}`,
            `Average DPS: ${n(meter.dpsAverage)}`,
            `Total: ${n(meter.total)} in ${Math.floor(meter.seconds)} s`,
            `Biggest hit: ${n(meter.biggest)}`,
            `Hits: ${n(meter.hits)} · Crits: ${critShare}%`,
        ]);
        // The buttons in a row under the numbers.
        let x = TRAINING_PANEL.x;
        const y = TRAINING_PANEL.y + this.text.height + TRAINING_PANEL.buttonGap;
        for (const button of this.buttons) {
            button.setPosition(x, y);
            x += button.width + TRAINING_PANEL.buttonGap;
        }
    }
}
