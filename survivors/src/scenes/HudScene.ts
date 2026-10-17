// Barra inferior al estilo del Helbreath original: vida, maná, experiencia, tiempo y bajas, y 6 botones.
// Corre como escena aparte por encima de la partida, así que no se mueve con la cámara.
// Las barras usan la imagen original llena y tapan la parte que falta con la pieza gris "vacía".
// Botones con función: el casco (o C / Y del mando) muestra el panel de stats, y el disquete abre una pausa
// sencilla (el menú real llega en la Fase 8). Los demás se iluminan pero aún no hacen nada.
import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import {
    ANNOUNCE_EVENT,
    HUD_ANNOUNCE,
    HUD_BOSS,
    HUD_BUFF,
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
import { PASSIVE_IDS, PASSIVES } from '../data/passives';
import { STAT_IDS, STAT_INFO } from '../data/stats';
import type { CharacterStats } from '../entities/CharacterStats';
import { Action, InputSystem } from '../systems/InputSystem';
import { formatTime } from '../utils/format';
import { SpriteText } from '../hb/SpriteText';

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
    /** Weapon or spell in hand. */
    weaponName: string | undefined;
    /** Share of damage removed by armor (0..1). */
    defense: number;
    /** Rank of each passive. */
    passiveRanks: Readonly<Record<keyof typeof PASSIVES, number>>;
    /** Boss shown on the big bar at the top, if one is alive. */
    boss: { name: string; hp: number; maxHp: number } | undefined;
    /** Buffs from chests that are on (they can be combined), with their seconds left. */
    buffs: ReadonlyArray<{ name: string; secondsLeft: number; color: number }>;
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
    private bossName!: SpriteText;
    private bossBar!: Phaser.GameObjects.Graphics;
    private shownBossRatio = -1;
    private announce!: SpriteText;
    private announceLeftMs = 0;
    /** One line per active buff, created when first needed. */
    private readonly buffTexts: SpriteText[] = [];
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
        this.createBossBar();
        this.announce = new SpriteText(this, GAME_WIDTH / 2, HUD_ANNOUNCE.y, '', HUD_ANNOUNCE.color, 'center');
        this.announce.container.setScale(HUD_ANNOUNCE.scale).setDepth(HUD_DEPTH_TEXT).setVisible(false);
        const game = this.scene.get(this.gameSceneKey);
        const onAnnounce = (message: string) => this.showAnnouncement(message);
        game.events.on(ANNOUNCE_EVENT, onAnnounce);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => game.events.off(ANNOUNCE_EVENT, onAnnounce));
        this.createButtons();
        this.createPauseOverlay();
        this.inputSystem = new InputSystem(this);
    }

    override update(_time: number, delta: number): void {
        this.inputSystem.update();
        const state = this.getState();
        this.showBoss(state.boss);
        this.updateAnnouncement(delta);
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
        this.showBuffs(state.buffs);
    }

    private createBossBar(): void {
        this.bossName = new SpriteText(this, GAME_WIDTH / 2, 0, '', HUD_BOSS.nameColor, 'center');
        this.bossName.container.setDepth(HUD_DEPTH_TEXT).setVisible(false);
        this.bossBar = this.add.graphics().setDepth(HUD_DEPTH_TEXT).setVisible(false);
    }

    /** Name and health of the boss; hidden when there is none. Redrawn only when its health changes. */
    private showBoss(boss: HudState['boss']): void {
        const visible = boss !== undefined;
        this.bossName.container.setVisible(visible);
        this.bossBar.setVisible(visible);
        if (!boss) {
            this.shownBossRatio = -1;
            return;
        }
        const ratio = Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1);
        if (ratio === this.shownBossRatio) return;
        this.shownBossRatio = ratio;
        const { y, width, height } = HUD_BOSS;
        const left = (GAME_WIDTH - width) / 2;
        this.bossName.setText(boss.name);
        this.bossName.container.setPosition(GAME_WIDTH / 2, HUD_BOSS.nameY);
        this.bossBar.clear()
            .fillStyle(HUD_BOSS.backColor, 0.85).fillRect(left, y, width, height)
            .fillStyle(HUD_BOSS.fillColor, 1).fillRect(left, y, width * ratio, height)
            .lineStyle(2, HUD_BOSS.borderColor, 1).strokeRect(left - 1, y - 1, width + 2, height + 2);
    }

    private showAnnouncement(message: string): void {
        this.announce.setText(message);
        this.announce.container.setVisible(true).setAlpha(1);
        this.announceLeftMs = HUD_ANNOUNCE.showMs;
    }

    private updateAnnouncement(deltaMs: number): void {
        if (this.announceLeftMs <= 0) return;
        this.announceLeftMs -= deltaMs;
        if (this.announceLeftMs <= 0) {
            this.announce.container.setVisible(false);
            return;
        }
        this.announce.container.setAlpha(Math.min(1, this.announceLeftMs / HUD_ANNOUNCE.fadeMs));
    }

    /** One line per active buff at the top of the screen: name and seconds left, in its colour. */
    private showBuffs(buffs: HudState['buffs']): void {
        while (this.buffTexts.length < buffs.length) {
            const y = HUD_TOP - HUD_BUFF.bottomGap - this.buffTexts.length * HUD_BUFF.lineHeight;
            const text = new SpriteText(this, GAME_WIDTH - HUD_BUFF.right, y, '', 0xffffff, 'right');
            text.container.setDepth(HUD_DEPTH_TEXT);
            this.buffTexts.push(text);
        }
        this.buffTexts.forEach((text, i) => {
            const buff = buffs[i];
            text.container.setVisible(buff !== undefined);
            if (buff) text.setText(`${buff.name} ${buff.secondsLeft}s`).setColor(buff.color);
        });
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
    if (state.weaponName) gear.push([stats.def.startWeapon.kind === 'spell' ? 'Spell' : 'Weapon', state.weaponName]);
    // Always shown (every class can wear something), so the panel keeps the height it was built with.
    gear.push(['Damage taken', `−${Math.round(state.defense * 100)}%`]);
    // Always shown, at any rank (0 too), so the panel keeps the height it was built with.
    for (const id of PASSIVE_IDS) gear.push([PASSIVES[id].name, `${state.passiveRanks[id]}/${PASSIVES[id].maxRank}`]);
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
