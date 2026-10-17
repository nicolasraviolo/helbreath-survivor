// Interfaz compacta de la partida (Fase 10, solo en el móvil): sin barra abajo, así se ve más mapa.
// Barras de vida, maná y experiencia de la interfaz "V2" del original (dialogsv2.spr), algo transparentes, y nivel,
// tiempo y bajas. Van en columna arriba a la izquierda o en fila a lo largo del borde de abajo (HUD_COMPACT_LAYOUT).
// Arriba a la derecha, el botón del panel de stats junto al de pausa.
// Cada barra es el marco vacío con el relleno de color encima, recortado según lo que queda.
import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/gameConfig';
import { HUD_COMPACT, HUD_COMPACT_LAYOUT, HUD_DEPTH_TEXT, HUD_INFO_STYLE, HUD_TEXT_STYLE } from '../config/hud';
import { formatTime } from '../utils/format';
import type { HudBar, HudBarActions, HudBarState } from './hudLayout';

interface Gauge {
    fill: Phaser.GameObjects.Image;
    /** Width of the fill's own frame (the crop is in frame pixels, before stretching). */
    frameWidth: number;
    shownRatio: number;
}

/** Top-left corner of each gauge on screen, and their scale. */
interface GaugeLayout {
    scale: number;
    positions: ReadonlyArray<{ x: number; y: number }>;
}

export class CompactHud implements HudBar {
    private readonly objects: Phaser.GameObjects.GameObject[] = [];
    private readonly hp: Gauge;
    private readonly mp: Gauge;
    private readonly xp: Gauge;
    private readonly hpText: Phaser.GameObjects.Text;
    private readonly mpText: Phaser.GameObjects.Text;
    private readonly infoText: Phaser.GameObjects.Text;

    constructor(private readonly scene: Phaser.Scene, actions: HudBarActions) {
        const c = HUD_COMPACT;
        const frame = scene.textures.getFrame(c.texture, c.gaugeFrame);
        const layout = gaugeLayout(frame.width, frame.height);
        const at = (i: number) => layout.positions[i] ?? { x: 0, y: 0 };
        this.hp = this.createGauge(at(0), layout.scale, c.hpFillFrame);
        this.mp = this.createGauge(at(1), layout.scale, c.mpFillFrame);
        this.xp = this.createGauge(at(2), layout.scale, c.xpFillFrame);
        const centre = (i: number) => ({ x: at(i).x + (frame.width * layout.scale) / 2, y: at(i).y + (frame.height * layout.scale) / 2 });
        this.hpText = this.addText(centre(0).x, centre(0).y, HUD_TEXT_STYLE).setOrigin(0.5);
        this.mpText = this.addText(centre(1).x, centre(1).y, HUD_TEXT_STYLE).setOrigin(0.5);
        // Info line: under the column, or above the row (its first gauge).
        const height = frame.height * layout.scale;
        this.infoText = HUD_COMPACT_LAYOUT === 'top'
            ? this.addText(at(0).x, at(2).y + height + c.infoGap, HUD_INFO_STYLE)
            : this.addText(at(0).x, at(0).y - c.infoGap, HUD_INFO_STYLE).setOrigin(0, 1);

        const b = c.statsButton;
        const button = scene.add.image(b.x, b.y, c.texture, b.frame).setScale(b.scale).setDepth(HUD_DEPTH_TEXT)
            .setInteractive({ useHandCursor: true });
        button.on(Phaser.Input.Events.POINTER_OVER, () => button.setFrame(b.litFrame));
        button.on(Phaser.Input.Events.POINTER_OUT, () => button.setFrame(b.frame));
        button.on(Phaser.Input.Events.POINTER_DOWN, actions.toggleStats);
        this.objects.push(button);
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
        for (const object of this.objects) object.destroy();
    }

    /** Empty frame with the colour fill stretched over its inside, both a bit see-through. */
    private createGauge(at: { x: number; y: number }, scale: number, fillFrame: number): Gauge {
        const c = HUD_COMPACT;
        const frame = this.scene.add.image(at.x, at.y, c.texture, c.gaugeFrame).setOrigin(0).setScale(scale);
        const fill = this.scene.add.image(at.x + c.fill.x * scale, at.y + c.fill.y * scale, c.texture, fillFrame).setOrigin(0)
            .setDisplaySize(c.fill.width * scale, c.fill.height * scale);
        for (const image of [frame, fill]) image.setAlpha(c.gaugeAlpha);
        this.objects.push(frame, fill);
        const gauge = { fill, frameWidth: fill.frame.width, shownRatio: -1 };
        setGauge(gauge, 1);
        return gauge;
    }

    private addText(x: number, y: number, style: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text {
        const text = this.scene.add.text(x, y, '', style).setDepth(HUD_DEPTH_TEXT);
        this.objects.push(text);
        return text;
    }
}

/** Where the three gauges go for HUD_COMPACT_LAYOUT (`width` × `height` = one gauge at scale 1). */
function gaugeLayout(width: number, height: number): GaugeLayout {
    if (HUD_COMPACT_LAYOUT === 'top') {
        const t = HUD_COMPACT.top;
        return { scale: t.gaugeScale, positions: [0, 1, 2].map((i) => ({ x: t.x, y: t.y + i * t.gaugeStep })) };
    }
    const b = HUD_COMPACT.bottom;
    const y = GAME_HEIGHT - b.marginBottom - height * b.gaugeScale;
    return { scale: b.gaugeScale, positions: [0, 1, 2].map((i) => ({ x: b.x + i * (width * b.gaugeScale + b.gap), y })) };
}

/** Shows only the left part of the fill, as much as is left. */
function setGauge(gauge: Gauge, ratio: number): void {
    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    if (clamped === gauge.shownRatio) return;
    gauge.shownRatio = clamped;
    gauge.fill.setVisible(clamped > 0);
    gauge.fill.setCrop(0, 0, Math.round(gauge.frameWidth * clamped), gauge.fill.frame.height);
}
