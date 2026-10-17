// Barra inferior clásica, al estilo del Helbreath original: vida, maná, experiencia, tiempo y bajas, y 6 botones.
// Usa la imagen original llena y tapa la parte que falta de cada barra con la pieza gris "vacía".
// El casco muestra el panel de stats y el disquete abre la pausa; los demás botones se iluminan pero no hacen nada.
// En el móvil se dibuja un 25 % más grande (HUD_SCALE), centrada abajo.
import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import {
    HUD_BUTTONS,
    HUD_CHARACTER_BUTTON,
    HUD_FRAME,
    HUD_HP,
    HUD_INFO,
    HUD_INFO_STYLE,
    HUD_MENU_BUTTON,
    HUD_MP,
    HUD_SCALE,
    HUD_TEXT_STYLE,
    HUD_TEXTURE,
    HUD_TOP,
    HUD_XP,
} from '../config/hud';
import { formatTime } from '../utils/format';
import type { HudBar, HudBarActions, HudBarState } from './hudLayout';

interface Gauge {
    empty: Phaser.GameObjects.Image;
    width: number;
    shownRatio: number;
}

export class ClassicHud implements HudBar {
    /** The bar and everything on it, in the bar's own pixels (scaled up on phones). */
    private readonly bar: Phaser.GameObjects.Container;
    private readonly hp: Gauge;
    private readonly mp: Gauge;
    private readonly xp: Gauge;
    private readonly hpText: Phaser.GameObjects.Text;
    private readonly mpText: Phaser.GameObjects.Text;
    private readonly infoText: Phaser.GameObjects.Text;

    constructor(private readonly scene: Phaser.Scene, actions: HudBarActions) {
        // Scaled around the bottom centre of the screen, so a bigger bar stays centred and on the bottom edge.
        this.bar = scene.add.container(GAME_WIDTH / 2 * (1 - HUD_SCALE), HUD_TOP).setScale(HUD_SCALE);
        this.bar.add(scene.add.image(0, 0, HUD_TEXTURE, HUD_FRAME.panel).setOrigin(0));
        this.hp = this.createGauge(HUD_HP, HUD_FRAME.gaugeEmpty);
        this.mp = this.createGauge(HUD_MP, HUD_FRAME.gaugeEmpty);
        this.xp = this.createGauge(HUD_XP, HUD_FRAME.xpEmpty);
        this.hpText = this.createCenteredText(HUD_HP, HUD_TEXT_STYLE);
        this.mpText = this.createCenteredText(HUD_MP, HUD_TEXT_STYLE);
        this.infoText = this.createCenteredText(HUD_INFO, HUD_INFO_STYLE);
        this.createButtons(actions);
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
        this.infoText.setText(`Lv ${state.level}  ${formatTime(state.elapsedMs)}  ${state.kills} kills`);
    }

    public destroy(): void {
        this.bar.destroy();
    }

    private createGauge(rect: { x: number; y: number; width: number }, emptyFrame: number): Gauge {
        const empty = this.scene.add.image(rect.x, rect.y, HUD_TEXTURE, emptyFrame).setOrigin(0);
        this.bar.add(empty);
        const gauge = { empty, width: rect.width, shownRatio: -1 };
        setGauge(gauge, 1);
        return gauge;
    }

    private createCenteredText(
        rect: { x: number; y: number; width: number; height: number },
        style: Phaser.Types.GameObjects.Text.TextStyle,
    ): Phaser.GameObjects.Text {
        const text = this.scene.add.text(rect.x + rect.width / 2, rect.y + rect.height / 2, '', style).setOrigin(0.5);
        this.bar.add(text);
        return text;
    }

    /** The lit version of each button appears on hover; the helmet shows the stats and the floppy disk pauses. */
    private createButtons(actions: HudBarActions): void {
        for (let i = 0; i < HUD_BUTTONS.count; i++) {
            const x = HUD_BUTTONS.x + i * HUD_BUTTONS.step;
            const y = HUD_BUTTONS.y;
            const lit = this.scene.add.image(x, y, HUD_TEXTURE, HUD_FRAME.firstButtonLit + i).setOrigin(0).setVisible(false);
            const zone = this.scene.add.zone(x, y, HUD_BUTTONS.width, HUD_BUTTONS.height).setOrigin(0).setInteractive({ useHandCursor: true });
            this.bar.add([lit, zone]);
            zone.on(Phaser.Input.Events.POINTER_OVER, () => lit.setVisible(true));
            zone.on(Phaser.Input.Events.POINTER_OUT, () => lit.setVisible(false));
            if (i === HUD_MENU_BUTTON) zone.on(Phaser.Input.Events.POINTER_DOWN, actions.openPause);
            if (i === HUD_CHARACTER_BUTTON) zone.on(Phaser.Input.Events.POINTER_DOWN, actions.toggleStats);
        }
    }
}

/** Shows the grey "empty" piece only over the missing part (right side) of the gauge. */
function setGauge(gauge: Gauge, ratio: number): void {
    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    if (clamped === gauge.shownRatio) return;
    gauge.shownRatio = clamped;
    const filled = Math.round(gauge.width * clamped);
    gauge.empty.setVisible(filled < gauge.width);
    gauge.empty.setCrop(filled, 0, gauge.width - filled, gauge.empty.height);
}
