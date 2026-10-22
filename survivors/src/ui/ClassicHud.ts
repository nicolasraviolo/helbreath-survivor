// Barra inferior clásica, al estilo del Helbreath original: vida, maná, experiencia, tiempo y bajas, y 6 botones.
// Usa la imagen original llena y tapa la parte que falta de cada barra con la pieza gris "vacía".
// El icono rojo (se vuelve violeta un momento al lanzar) lleva las cargas del Critical Strike (Fase 19A), donde lo ponía el original.
// A la izquierda de las barras, el Red Ball de Abaddon's Blood (Fase 21E) si está desbloqueado.
// El casco muestra el panel de stats y el disquete abre la pausa; los demás botones se iluminan pero no hacen nada.
// En el móvil se dibuja un 25 % más grande (HUD_SCALE), centrada abajo.
import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import {
    HUD_BUTTONS,
    HUD_CHARACTER_BUTTON,
    HUD_CRIT,
    HUD_FRAME,
    HUD_HP,
    HUD_INFO,
    HUD_INFO_STYLE,
    HUD_MENU_BUTTON,
    HUD_MP,
    HUD_REVIVE,
    HUD_SCALE,
    HUD_TEXT_STYLE,
    HUD_TEXTURE,
    HUD_TOP,
    HUD_XP,
} from '../config/hud';
import { formatGold } from '../data/gold';
import { formatTime } from '../utils/format';
import { ReviveIcon } from './ReviveIcon';
import { CritIconState, sameOrb, type SkillOrb, type HudBar, type HudBarActions, type HudBarState } from './hudLayout';

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
    private readonly critIcon: Phaser.GameObjects.Image;
    private readonly critText: Phaser.GameObjects.Text;
    private shownCrit: SkillOrb | undefined | null = null;
    private readonly critState = new CritIconState();
    private readonly revive: ReviveIcon;

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
        // Its frame carries the original's pivot: centred by hand.
        this.critIcon = scene.add.image(HUD_CRIT.x, HUD_CRIT.y, HUD_TEXTURE, HUD_CRIT.frame).setOrigin(0.5);
        this.critText = scene.add.text(HUD_CRIT.numberX, HUD_CRIT.numberY, '', HUD_CRIT.style).setOrigin(0.5);
        this.bar.add([this.critIcon, this.critText]);
        this.revive = new ReviveIcon(scene, HUD_REVIVE.classic.x, HUD_REVIVE.classic.y, this.bar);
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
        this.infoText.setText(`Power ${state.level}  ${formatTime(state.elapsedMs)}  ${state.kills} kills  ${formatGold(state.gold)} gold`);
        this.showCrit(state.skillOrb);
        this.revive.update(state.revive);
        if (state.skillOrb) this.critIcon.setFrame(this.critState.frame(state.skillUses, this.scene.time.now, HUD_CRIT), false, false);
    }

    /**
     * The red orb with the Critical Strike charges or the seconds left of the Mage's spell; dimmed when it cannot be
     * used, hidden for a character without either.
     */
    private showCrit(orb: SkillOrb | undefined): void {
        if (sameOrb(orb, this.shownCrit)) return;
        this.shownCrit = orb && { ...orb };
        this.critIcon.setVisible(orb !== undefined).setAlpha(orb?.ready ? 1 : HUD_CRIT.emptyAlpha);
        this.critText.setVisible(orb !== undefined).setText(orb?.text ?? '');
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
