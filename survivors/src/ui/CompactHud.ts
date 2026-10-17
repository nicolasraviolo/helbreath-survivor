// Interfaz compacta de la partida (Fase 10, solo en el móvil): sin barra abajo, así se ve más mapa.
// Arriba a la izquierda, las barras de vida, maná y experiencia de la interfaz "V2" del original (dialogsv2.spr) y,
// debajo, nivel, tiempo y bajas. Arriba a la derecha, el casco (panel de stats) junto al botón de pausa.
// Cada barra es el marco vacío con el relleno de color encima, recortado según lo que queda.
import Phaser from 'phaser';
import { HUD_COMPACT, HUD_DEPTH_TEXT, HUD_INFO_STYLE, HUD_TEXT_STYLE } from '../config/hud';
import { formatTime } from '../utils/format';
import type { HudBar, HudBarActions, HudBarState } from './hudLayout';

interface Gauge {
    fill: Phaser.GameObjects.Image;
    /** Width of the fill's own frame (the crop is in frame pixels, before stretching). */
    frameWidth: number;
    shownRatio: number;
}

export class CompactHud implements HudBar {
    /** Gauges, in gauge pixels (drawn HUD_COMPACT.gaugeScale times bigger). */
    private readonly block: Phaser.GameObjects.Container;
    private readonly hp: Gauge;
    private readonly mp: Gauge;
    private readonly xp: Gauge;
    private readonly hpText: Phaser.GameObjects.Text;
    private readonly mpText: Phaser.GameObjects.Text;
    private readonly infoText: Phaser.GameObjects.Text;
    private readonly statsButton: Phaser.GameObjects.Image;

    constructor(private readonly scene: Phaser.Scene, actions: HudBarActions) {
        const c = HUD_COMPACT;
        this.block = scene.add.container(c.x, c.y).setScale(c.gaugeScale);
        this.hp = this.createGauge(0, c.hpFillFrame);
        this.mp = this.createGauge(1, c.mpFillFrame);
        this.xp = this.createGauge(2, c.xpFillFrame);
        this.hpText = this.createGaugeText(0);
        this.mpText = this.createGaugeText(1);
        const gaugeHeight = scene.textures.getFrame(c.texture, c.gaugeFrame).height * c.gaugeScale;
        this.infoText = scene.add.text(c.x, c.y + 2 * c.gaugeStep + gaugeHeight + c.infoGap, '', HUD_INFO_STYLE)
            .setDepth(HUD_DEPTH_TEXT);

        const b = c.statsButton;
        this.statsButton = scene.add.image(b.x, b.y, c.texture, b.frame).setScale(b.scale).setDepth(HUD_DEPTH_TEXT)
            .setInteractive({ useHandCursor: true });
        this.statsButton.on(Phaser.Input.Events.POINTER_OVER, () => this.statsButton.setFrame(b.litFrame));
        this.statsButton.on(Phaser.Input.Events.POINTER_OUT, () => this.statsButton.setFrame(b.frame));
        this.statsButton.on(Phaser.Input.Events.POINTER_DOWN, actions.toggleStats);
    }

    public update(state: HudBarState): void {
        setGauge(this.hp, state.hp / state.maxHp);
        this.hpText.setText(`${Math.ceil(state.hp)} / ${state.maxHp}`);
        if (state.mana === undefined) {
            setGauge(this.mp, 1);
            this.mpText.setText('— / —');
        } else {
            setGauge(this.mp, state.mana / state.maxMana);
            this.mpText.setText(`${Math.ceil(state.mana)} / ${state.maxMana}`);
        }
        setGauge(this.xp, state.xpRatio);
        this.infoText.setText(`Lv ${state.level}   ${formatTime(state.elapsedMs)}   ${state.kills} kills`);
    }

    public destroy(): void {
        this.block.destroy();
        this.hpText.destroy();
        this.mpText.destroy();
        this.infoText.destroy();
        this.statsButton.destroy();
    }

    /** Top of gauge `row`, in gauge pixels. */
    private rowY(row: number): number {
        return (row * HUD_COMPACT.gaugeStep) / HUD_COMPACT.gaugeScale;
    }

    /** Empty frame with the colour fill stretched over its inside. */
    private createGauge(row: number, fillFrame: number): Gauge {
        const c = HUD_COMPACT;
        const y = this.rowY(row);
        const frame = this.scene.add.image(0, y, c.texture, c.gaugeFrame).setOrigin(0);
        const fill = this.scene.add.image(c.fill.x, y + c.fill.y, c.texture, fillFrame).setOrigin(0)
            .setDisplaySize(c.fill.width, c.fill.height);
        this.block.add([frame, fill]);
        const gauge = { fill, frameWidth: fill.frame.width, shownRatio: -1 };
        setGauge(gauge, 1);
        return gauge;
    }

    /** Numbers centred on gauge `row`, outside the scaled block so they keep the UI font size. */
    private createGaugeText(row: number): Phaser.GameObjects.Text {
        const c = HUD_COMPACT;
        const frame = this.scene.textures.getFrame(c.texture, c.gaugeFrame);
        const x = c.x + (frame.width / 2) * c.gaugeScale;
        const y = c.y + row * c.gaugeStep + (frame.height / 2) * c.gaugeScale;
        return this.scene.add.text(x, y, '', HUD_TEXT_STYLE).setOrigin(0.5).setDepth(HUD_DEPTH_TEXT);
    }
}

/** Shows only the left part of the fill, as much as is left. */
function setGauge(gauge: Gauge, ratio: number): void {
    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    if (clamped === gauge.shownRatio) return;
    gauge.shownRatio = clamped;
    gauge.fill.setVisible(clamped > 0);
    gauge.fill.setCrop(0, 0, Math.round(gauge.frameWidth * clamped), gauge.fill.frame.height);
}
