// Barra inferior al estilo del Helbreath original: vida, maná, experiencia, tiempo y bajas, y 6 botones.
// Corre como escena aparte por encima de la partida, así que no se mueve con la cámara.
// Las barras usan la imagen original llena y tapan la parte que falta con la pieza gris "vacía".
// De momento solo el botón del disquete hace algo: abre una pausa sencilla (el menú real llega en la Fase 8).
import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import {
    HUD_BUTTONS,
    HUD_DEPTH_TEXT,
    HUD_FRAME,
    HUD_HP,
    HUD_INFO,
    HUD_INFO_STYLE,
    HUD_MENU_BUTTON,
    HUD_MP,
    HUD_TEXT_STYLE,
    HUD_TEXTURE,
    HUD_TOP,
    HUD_XP,
    PAUSE_SHADE_ALPHA,
} from '../config/hud';
import { Action, InputSystem } from '../systems/InputSystem';
import { formatTime } from '../utils/format';

/** What the bar shows, read every frame from the game. */
export interface HudState {
    hp: number;
    maxHp: number;
    /** Undefined while the character has no mana: the gauge stays full and shows "— / —". */
    mana: number | undefined;
    maxMana: number;
    /** 0..1 progress towards the next level (always 0 until Phase 5). */
    xpRatio: number;
    elapsedMs: number;
    kills: number;
    /** While the player is dead the pause menu stays closed (the Game Over screen is showing). */
    isGameOver: boolean;
}

export interface HudSceneData {
    getState: () => HudState;
    /** Scene paused while the pause menu is open. */
    gameSceneKey: string;
}

interface Gauge {
    empty: Phaser.GameObjects.Image;
    width: number;
    shownRatio: number;
}

export class HudScene extends Phaser.Scene {
    private getState!: () => HudState;
    private gameSceneKey!: string;
    private inputSystem!: InputSystem;
    private hp!: Gauge;
    private mp!: Gauge;
    private xp!: Gauge;
    private hpText!: Phaser.GameObjects.Text;
    private mpText!: Phaser.GameObjects.Text;
    private infoText!: Phaser.GameObjects.Text;
    private pauseOverlay!: Phaser.GameObjects.Container;
    private paused = false;
    /** The pause opened this frame: ignore the same click / key as "continue". */
    private pauseJustOpened = false;

    constructor() {
        super('Hud');
    }

    init(data: HudSceneData): void {
        this.getState = data.getState;
        this.gameSceneKey = data.gameSceneKey;
        this.paused = false;
    }

    create(): void {
        this.add.image(0, HUD_TOP, HUD_TEXTURE, HUD_FRAME.panel).setOrigin(0);
        this.hp = this.createGauge(HUD_HP, HUD_FRAME.gaugeEmpty);
        this.mp = this.createGauge(HUD_MP, HUD_FRAME.gaugeEmpty);
        this.xp = this.createGauge(HUD_XP, HUD_FRAME.xpEmpty);
        this.hpText = this.createCenteredText(HUD_HP, HUD_TEXT_STYLE);
        this.mpText = this.createCenteredText(HUD_MP, HUD_TEXT_STYLE);
        this.infoText = this.createCenteredText(HUD_INFO, HUD_INFO_STYLE);
        this.createButtons();
        this.createPauseOverlay();
        this.inputSystem = new InputSystem(this);
    }

    override update(): void {
        this.inputSystem.update();
        const state = this.getState();
        this.handlePause(state.isGameOver);
        this.setGauge(this.hp, state.hp / state.maxHp);
        this.hpText.setText(`${Math.ceil(state.hp)} / ${state.maxHp}`);
        if (state.mana === undefined) {
            this.setGauge(this.mp, 1);
            this.mpText.setText('— / —');
        } else {
            this.setGauge(this.mp, state.mana / state.maxMana);
            this.mpText.setText(`${Math.ceil(state.mana)} / ${state.maxMana}`);
        }
        this.setGauge(this.xp, state.xpRatio);
        this.infoText.setText(`${formatTime(state.elapsedMs)} · ${state.kills} bajas`);
    }

    private createGauge(rect: { x: number; y: number; width: number }, emptyFrame: number): Gauge {
        const empty = this.add.image(rect.x, HUD_TOP + rect.y, HUD_TEXTURE, emptyFrame).setOrigin(0);
        const gauge = { empty, width: rect.width, shownRatio: -1 };
        this.setGauge(gauge, 1);
        return gauge;
    }

    /** Shows the grey "empty" piece only over the missing part (right side) of the gauge. */
    private setGauge(gauge: Gauge, ratio: number): void {
        const clamped = Phaser.Math.Clamp(ratio, 0, 1);
        if (clamped === gauge.shownRatio) return;
        gauge.shownRatio = clamped;
        const filled = Math.round(gauge.width * clamped);
        gauge.empty.setVisible(filled < gauge.width);
        gauge.empty.setCrop(filled, 0, gauge.width - filled, gauge.empty.height);
    }

    private createCenteredText(
        rect: { x: number; y: number; width: number; height: number },
        style: Phaser.Types.GameObjects.Text.TextStyle,
    ): Phaser.GameObjects.Text {
        return this.add.text(rect.x + rect.width / 2, HUD_TOP + rect.y + rect.height / 2, '', style)
            .setOrigin(0.5)
            .setDepth(HUD_DEPTH_TEXT);
    }

    /** The lit version of each button appears on hover; the system button opens the pause menu. */
    private createButtons(): void {
        for (let i = 0; i < HUD_BUTTONS.count; i++) {
            const x = HUD_BUTTONS.x + i * HUD_BUTTONS.step;
            const y = HUD_TOP + HUD_BUTTONS.y;
            const lit = this.add.image(x, y, HUD_TEXTURE, HUD_FRAME.firstButtonLit + i).setOrigin(0).setVisible(false);
            const zone = this.add.zone(x, y, HUD_BUTTONS.width, HUD_BUTTONS.height).setOrigin(0).setInteractive({ useHandCursor: true });
            zone.on(Phaser.Input.Events.POINTER_OVER, () => lit.setVisible(true));
            zone.on(Phaser.Input.Events.POINTER_OUT, () => lit.setVisible(false));
            if (i === HUD_MENU_BUTTON) {
                zone.on(Phaser.Input.Events.POINTER_DOWN, () => {
                    if (!this.getState().isGameOver) this.setPaused(!this.paused);
                });
            }
        }
    }

    /** Provisional pause: darkens the game and waits for "continue" (Phase 8 brings the real menu). */
    private createPauseOverlay(): void {
        const shade = this.add.rectangle(0, 0, GAME_WIDTH, HUD_TOP, 0x000000, PAUSE_SHADE_ALPHA).setOrigin(0);
        const title = this.add.text(GAME_WIDTH / 2, HUD_TOP / 2 - 30, 'PAUSA', {
            fontFamily: 'Georgia, serif', fontSize: '40px', color: '#e0d090',
        }).setOrigin(0.5);
        const hint = this.add.text(GAME_WIDTH / 2, HUD_TOP / 2 + 25, 'Continuar: Enter, Esc, A, Start o clic', {
            fontFamily: 'Georgia, serif', fontSize: '16px', color: '#e0d090',
        }).setOrigin(0.5);
        this.pauseOverlay = this.add.container(0, 0, [shade, title, hint]).setVisible(false);
    }

    private handlePause(isGameOver: boolean): void {
        const input = this.inputSystem;
        if (isGameOver) {
            this.setPaused(false);
        } else if (input.justPressed(Action.Pause)) {
            this.setPaused(!this.paused);
        } else if (this.paused && !this.pauseJustOpened && input.justPressed(Action.Confirm)) {
            this.setPaused(false);
        }
        this.pauseJustOpened = false;
    }

    private setPaused(paused: boolean): void {
        if (paused === this.paused) return;
        this.paused = paused;
        this.pauseJustOpened = paused;
        this.pauseOverlay.setVisible(paused);
        if (paused) {
            this.scene.pause(this.gameSceneKey);
        } else {
            this.scene.resume(this.gameSceneKey);
        }
    }
}

