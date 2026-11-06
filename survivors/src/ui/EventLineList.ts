// Lista de mensajes del original, abajo a la izquierda ("HP has been increased by +13 points."): la última abajo,
// cada una dura un rato y se desvanece; si hay demasiadas, se va la más vieja. Sacada de HudScene para usarla también
// en el HUD de Helbreath Off (Off-2B: experiencia ganada y perdida).
import Phaser from 'phaser';
import { HUD_DEPTH_TEXT, HUD_EVENT_LIST } from '../config/hud';

export class EventLineList {
    /** Lines on screen, the oldest first, with their time on screen. */
    private readonly lines: { text: Phaser.GameObjects.Text; shownMs: number }[] = [];

    constructor(private readonly scene: Phaser.Scene) {}

    /** A new line at the bottom; the oldest goes when there are too many. Placed on the next `update`. */
    public add(line: string): void {
        if (this.lines.length >= HUD_EVENT_LIST.maxLines) this.lines.shift()?.text.destroy();
        const text = this.scene.add.text(HUD_EVENT_LIST.left, 0, line, HUD_EVENT_LIST.style).setOrigin(0, 1).setDepth(HUD_DEPTH_TEXT);
        this.lines.push({ text, shownMs: 0 });
    }

    /**
     * Ages the lines (not while `paused`), fades out the old ones and puts the newest with its bottom at `bottom`.
     */
    public update(deltaMs: number, paused: boolean, bottom: number): void {
        if (this.lines.length === 0) return;
        const { showMs, fadeMs } = HUD_EVENT_LIST;
        for (const line of this.lines) {
            if (!paused) line.shownMs += deltaMs;
            line.text.setAlpha(Phaser.Math.Clamp((showMs - line.shownMs) / fadeMs, 0, 1));
        }
        while (this.lines.length > 0 && this.lines[0].shownMs >= showMs) this.lines.shift()?.text.destroy();
        const last = this.lines.length - 1;
        this.lines.forEach((line, i) => {
            line.text.y = bottom - (last - i) * HUD_EVENT_LIST.lineHeight;
        });
    }
}
