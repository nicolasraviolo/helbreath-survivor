// Barra inferior al estilo del Helbreath original: vida, maná, experiencia, tiempo y bajas, y 6 botones.
// Corre como escena aparte por encima de la partida, así que no se mueve con la cámara.
// Las barras usan la imagen original llena y tapan la parte que falta con la pieza gris "vacía".
// Botones con función: el casco (o C / Y del mando) muestra el panel de stats, y el disquete abre una pausa
// sencilla (el menú real llega en la Fase 8). Los demás se iluminan pero aún no hacen nada.
import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import {
    HUD_BUTTONS,
    HUD_CHARACTER_BUTTON,
    HUD_DEPTH_TEXT,
    HUD_FRAME,
    HUD_HP,
    HUD_INFO,
    HUD_INFO_STYLE,
    HUD_MENU_BUTTON,
    HUD_MP,
    HUD_TEXT_STYLE,
    HUD_TEXTURE,
    HUD_STATS_PANEL,
    HUD_STATS_STYLE,
    HUD_STATS_TITLE_STYLE,
    HUD_TOP,
    HUD_XP,
    PAUSE_SHADE_ALPHA,
} from '../config/hud';
import { px, UI_FONT, UI_FONT_SIZE } from '../config/ui';
import { STAT_IDS, STAT_INFO } from '../data/stats';
import type { CharacterStats } from '../entities/CharacterStats';
import { Action, InputSystem } from '../systems/InputSystem';
import { formatTime } from '../utils/format';

/** What the bar shows, read every frame from the game. */
export interface HudState {
    hp: number;
    maxHp: number;
    /** Undefined while the character has no mana: the gauge stays full and shows "— / —". */
    mana: number | undefined;
    maxMana: number;
    /** 0..1 progress towards the next level. */
    xpRatio: number;
    level: number;
    elapsedMs: number;
    kills: number;
    /** True while the pause menu can't open (Game Over or level-up cards showing). */
    pauseLocked: boolean;
    /** For the stats panel. */
    stats: Readonly<CharacterStats>;
    /** Melee weapon in hand, if any. */
    weaponName: string | undefined;
    /** Share of damage removed by armor (0..1). */
    defense: number;
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
    private statsPanel!: Phaser.GameObjects.Container;
    private statsTitle!: Phaser.GameObjects.Text;
    private statCells: Phaser.GameObjects.Text[] = [];
    private derivedLabels!: Phaser.GameObjects.Text;
    private derivedValues!: Phaser.GameObjects.Text;
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
        this.createStatsPanel();
        this.createButtons();
        this.createPauseOverlay();
        this.inputSystem = new InputSystem(this);
    }

    override update(): void {
        this.inputSystem.update();
        const state = this.getState();
        this.handlePause(state.pauseLocked);
        if (this.inputSystem.justPressed(Action.ToggleStats)) this.toggleStats();
        if (this.statsPanel.visible) this.refreshStats(state);
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
        this.infoText.setText(`Lv ${state.level}  ${formatTime(state.elapsedMs)}  ${state.kills} kills`);
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
                    if (!this.getState().pauseLocked) this.setPaused(!this.paused);
                });
            }
            if (i === HUD_CHARACTER_BUTTON) {
                zone.on(Phaser.Input.Events.POINTER_DOWN, () => this.toggleStats());
            }
        }
    }

    /** Small panel above the bar with level, the six stats and what they give. Hidden until asked for. */
    // The UI font is not monospaced, so the stats are laid out in fixed columns instead of padded strings.
    private createStatsPanel(): void {
        const { x, width, padding, marginY, columnWidth, gap } = HUD_STATS_PANEL;
        this.statsTitle = this.add.text(padding, padding, ' ', HUD_STATS_TITLE_STYLE);
        const lineHeight = this.statsTitle.height;
        const gridTop = padding + lineHeight + gap;
        this.statCells = STAT_IDS.map((_, i) => this.add.text(
            padding + (i % 3) * columnWidth,
            gridTop + Math.floor(i / 3) * lineHeight,
            '',
            HUD_STATS_STYLE,
        ));
        const derivedTop = gridTop + 2 * lineHeight + gap;
        this.derivedLabels = this.add.text(padding, derivedTop, '', HUD_STATS_STYLE);
        this.derivedValues = this.add.text(width - padding, derivedTop, '', { ...HUD_STATS_STYLE, align: 'right' }).setOrigin(1, 0);
        // Filled once now so the panel height fits its rows at any font size.
        this.refreshStats(this.getState());
        const height = derivedTop + this.derivedLabels.height + padding;
        const back = this.add.rectangle(0, 0, width, height, 0x1c140c, 0.9).setOrigin(0).setStrokeStyle(2, 0x8a7038);
        this.statsPanel = this.add.container(x, HUD_TOP - height - marginY, [
            back, this.statsTitle, ...this.statCells, this.derivedLabels, this.derivedValues,
        ]).setVisible(false);
    }

    private refreshStats(state: HudState): void {
        const stats = state.stats;
        this.statsTitle.setText(`${stats.def.name} · Level ${stats.level}`);
        STAT_IDS.forEach((id, i) => this.statCells[i]?.setText(`${STAT_INFO[id].short} ${stats.stats[id]}`));
        const rows = describeDerived(state);
        this.derivedLabels.setText(rows.map(([label]) => label));
        this.derivedValues.setText(rows.map(([, value]) => value));
    }

    private toggleStats(): void {
        this.statsPanel.setVisible(!this.statsPanel.visible);
    }

    /** Provisional pause: darkens the game and waits for "continue" (Phase 8 brings the real menu). */
    private createPauseOverlay(): void {
        const shade = this.add.rectangle(0, 0, GAME_WIDTH, HUD_TOP, 0x000000, PAUSE_SHADE_ALPHA).setOrigin(0);
        const title = this.add.text(GAME_WIDTH / 2, HUD_TOP / 2 - 30, 'PAUSED', {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.title), fontStyle: 'bold', color: '#e0d090', stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5);
        const hint = this.add.text(GAME_WIDTH / 2, HUD_TOP / 2 + 25, 'Resume: Enter, Esc, A, Start or click', {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.normal), color: '#e0d090',
        }).setOrigin(0.5);
        this.pauseOverlay = this.add.container(0, 0, [shade, title, hint]).setVisible(false);
    }

    private handlePause(locked: boolean): void {
        const input = this.inputSystem;
        if (locked) {
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

/** Label / value rows under the stat grid. */
function describeDerived(state: HudState): [string, string][] {
    const stats = state.stats;
    const bonus = (multiplier: number) => `${multiplier >= 1 ? '+' : ''}${Math.round((multiplier - 1) * 100)}%`;
    const gear: [string, string][] = [];
    if (state.weaponName) gear.push(['Weapon', state.weaponName]);
    // Always shown for classes with armor, so the panel keeps the height it was built with.
    if (stats.def.canWearArmor) gear.push(['Damage taken', `−${Math.round(state.defense * 100)}%`]);
    return [
        ...gear,
        ['Health', String(stats.maxHp)],
        ['Mana', String(stats.maxMana)],
        ['Magic damage', bonus(stats.damageMultiplier('magic'))],
        ['Physical damage', bonus(stats.damageMultiplier('physical'))],
        ['Critical', `${Math.round(stats.critChance * 100)}%`],
        ['Speed', bonus(stats.moveSpeedMultiplier)],
        ['Cooldown', `${Math.round(stats.cooldownMultiplier * 100)}%`],
    ];
}
