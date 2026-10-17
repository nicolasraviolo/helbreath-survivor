// Interfaz de la partida: la barra (clásica abajo, o compacta arriba en el móvil: ui/ClassicHud.ts, ui/CompactHud.ts),
// el panel de stats, la barra del jefe, los avisos y las mejoras activas de los cofres.
// Corre como escena aparte por encima de la partida, así que no se mueve con la cámara.
// El casco (o C / Y del mando) muestra el panel de stats, y el disquete o Esc / Start abren la pausa (PauseScene).
// Si se desconecta el mando en plena partida, la pausa se abre sola.
// En pantallas táctiles hay además un botón de pausa arriba a la derecha, y la pausa se abre sola al poner el móvil
// en vertical (el juego es apaisado y queda tapado por el aviso de girarlo).
// Si se cambia el estilo de la barra en los ajustes (desde la pausa), la barra se cambia al momento.
import Phaser from 'phaser';
import { COMPACT_UI } from '../config/device';
import { GAME_WIDTH } from '../config/gameConfig';
import {
    ANNOUNCE_EVENT,
    HUD_ANNOUNCE,
    HUD_BOSS,
    HUD_BUFF,
    HUD_COMPACT,
    HUD_COMPACT_LAYOUT,
    HUD_DEPTH_TEXT,
    HUD_STATS_PANEL,
    HUD_STATS_STYLE,
    HUD_STATS_TITLE_STYLE,
} from '../config/hud';
import type { HudStyle } from '../config/settings';
import { TOUCH_PAUSE_BUTTON } from '../config/touch';
import { PASSIVE_IDS, PASSIVES } from '../data/passives';
import { STAT_IDS, STAT_INFO } from '../data/stats';
import type { CharacterStats } from '../entities/CharacterStats';
import { Action, InputSystem } from '../systems/InputSystem';
import { SETTINGS_CHANGED, settings } from '../systems/Settings';
import { SpriteText } from '../hb/SpriteText';
import { ClassicHud } from '../ui/ClassicHud';
import { CompactHud } from '../ui/CompactHud';
import { activeHudStyle, overlayBottom, type HudBar, type HudBarState } from '../ui/hudLayout';
import { openOverlay } from './MenuOverlayScene';
import type { PauseSceneData } from './PauseScene';

/** What the HUD shows, read every frame from the game. */
export interface HudState extends HudBarState {
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

export class HudScene extends Phaser.Scene {
    private getState!: () => HudState;
    private gameSceneKey!: string;
    private inputSystem!: InputSystem;
    private bar!: HudBar;
    private barStyle!: HudStyle;
    private bossName!: SpriteText;
    private bossBar!: Phaser.GameObjects.Graphics;
    private shownBossRatio = -1;
    private announce!: SpriteText;
    private announceLeftMs = 0;
    /** One line per active buff, created when first needed. */
    private readonly buffTexts: SpriteText[] = [];
    private statsPanel!: Phaser.GameObjects.Container;
    private statsTitle!: Phaser.GameObjects.Text;
    private statCells: Phaser.GameObjects.Text[] = [];
    private derivedLabels!: Phaser.GameObjects.Text;
    private derivedValues!: Phaser.GameObjects.Text;
    private statsPanelHeight = 0;

    constructor() {
        super('Hud');
    }

    init(data: HudSceneData): void {
        this.getState = data.getState;
        this.gameSceneKey = data.gameSceneKey;
    }

    create(): void {
        this.buildBar();
        this.createStatsPanel();
        this.createBossBar();
        this.announce = new SpriteText(this, GAME_WIDTH / 2, HUD_ANNOUNCE.y, '', HUD_ANNOUNCE.color, 'center');
        this.announce.container.setScale(HUD_ANNOUNCE.scale).setDepth(HUD_DEPTH_TEXT).setVisible(false);
        const game = this.scene.get(this.gameSceneKey);
        const onAnnounce = (message: string) => this.showAnnouncement(message);
        game.events.on(ANNOUNCE_EVENT, onAnnounce);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => game.events.off(ANNOUNCE_EVENT, onAnnounce));
        this.inputSystem = new InputSystem(this);
        // Gamepad unplugged (or out of battery) mid-run: pause so the player doesn't die without controls.
        const onPadLost = () => this.openPause();
        window.addEventListener('gamepaddisconnected', onPadLost);
        // Phone turned upright: the "rotate" notice covers the game, so pause it.
        const onResize = () => {
            if (isPortraitTouch()) this.openPause();
        };
        window.addEventListener('resize', onResize);
        // Settings → HUD changed (from the pause menu): swap the bar right away.
        const onSettings = () => {
            if (activeHudStyle() !== this.barStyle) this.rebuildBar();
        };
        settings.on(SETTINGS_CHANGED, onSettings);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.removeEventListener('gamepaddisconnected', onPadLost);
            window.removeEventListener('resize', onResize);
            settings.off(SETTINGS_CHANGED, onSettings);
        });
        // The compact HUD has no floppy disk button: it needs the round one (also when forced with ?ui=compact on a PC).
        if (this.sys.game.device.input.touch || COMPACT_UI) this.createTouchPauseButton();
    }

    override update(_time: number, delta: number): void {
        this.inputSystem.update();
        const state = this.getState();
        this.showBoss(state.boss);
        this.updateAnnouncement(delta);
        if (this.inputSystem.justPressed(Action.Pause)) this.openPause();
        if (this.inputSystem.justPressed(Action.ToggleStats)) this.toggleStats();
        if (this.statsPanel.visible) this.refreshStats(state);
        this.bar.update(state);
        this.showBuffs(state.buffs);
    }

    /** The bar of the style chosen in the settings (the PC always gets the classic one). */
    private buildBar(): void {
        this.barStyle = activeHudStyle();
        const actions = { toggleStats: () => this.toggleStats(), openPause: () => this.openPause() };
        this.bar = this.barStyle === 'classic' ? new ClassicHud(this, actions) : new CompactHud(this, actions);
    }

    /** Swaps the bar and moves what depends on it (stats panel, buffs, boss bar). */
    private rebuildBar(): void {
        this.bar.destroy();
        this.buildBar();
        this.placeStatsPanel();
        this.buffTexts.forEach((text, i) => {
            text.container.y = this.buffY(i);
        });
        this.shownBossRatio = -1;
    }

    private createBossBar(): void {
        this.bossName = new SpriteText(this, GAME_WIDTH / 2, 0, '', HUD_BOSS.nameColor, 'center');
        this.bossName.container.setScale(HUD_BOSS.nameScale).setDepth(HUD_DEPTH_TEXT).setVisible(false);
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
        // The compact HUD with its column at the top left (and buttons at the top right): the bar goes between them.
        const between = this.barStyle === 'compact' && HUD_COMPACT_LAYOUT === 'top';
        const centerX = between ? HUD_COMPACT.top.bossCenterX : GAME_WIDTH / 2;
        const width = between ? HUD_COMPACT.top.bossWidth : HUD_BOSS.width;
        const { y, height } = HUD_BOSS;
        const left = centerX - width / 2;
        this.bossName.setText(boss.name);
        this.bossName.container.setPosition(centerX, HUD_BOSS.nameY);
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

    /** Line `index` of the buffs, from the bottom of the game area up. */
    private buffY(index: number): number {
        return overlayBottom() - HUD_BUFF.bottomGap - index * HUD_BUFF.lineHeight;
    }

    /** One line per active buff, bottom right: name and seconds left, in its colour. */
    private showBuffs(buffs: HudState['buffs']): void {
        while (this.buffTexts.length < buffs.length) {
            const text = new SpriteText(this, GAME_WIDTH - HUD_BUFF.right, this.buffY(this.buffTexts.length), '', 0xffffff, 'right');
            text.container.setScale(HUD_BUFF.scale).setDepth(HUD_DEPTH_TEXT);
            this.buffTexts.push(text);
        }
        this.buffTexts.forEach((text, i) => {
            const buff = buffs[i];
            text.container.setVisible(buff !== undefined);
            if (buff) text.setText(`${buff.name} ${buff.secondsLeft}s`).setColor(buff.color);
        });
    }

    /** Small panel (above the classic bar or under the compact block) with level, the six stats and what they give. Hidden until asked for. */
    // The UI font is not monospaced, so the stats are laid out in fixed columns instead of padded strings.
    private createStatsPanel(): void {
        const { x, width, padding, columnWidth, gap } = HUD_STATS_PANEL;
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
        this.statsPanelHeight = height;
        this.statsPanel = this.add.container(x, 0, [
            back, this.statsTitle, ...this.statCells, this.derivedLabels, this.derivedValues,
        ]).setVisible(false);
        this.placeStatsPanel();
    }

    /** Under the compact column at the top, or above the bar / row of gauges at the bottom. */
    private placeStatsPanel(): void {
        this.statsPanel.y = this.barStyle === 'compact' && HUD_COMPACT_LAYOUT === 'top'
            ? HUD_COMPACT.top.statsPanelY
            : overlayBottom() - this.statsPanelHeight - HUD_STATS_PANEL.marginY;
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

    /** Round "II" button for fingers (touch screens only). */
    private createTouchPauseButton(): void {
        const b = TOUCH_PAUSE_BUTTON;
        this.add.graphics({ x: b.x, y: b.y })
            .fillStyle(b.color, b.alpha).fillCircle(0, 0, b.radius)
            .lineStyle(2, b.ringColor, 0.6).strokeCircle(0, 0, b.radius)
            .fillStyle(b.barColor, 1)
            .fillRect(-b.barGap / 2 - b.barWidth, -b.barHeight / 2, b.barWidth, b.barHeight)
            .fillRect(b.barGap / 2, -b.barHeight / 2, b.barWidth, b.barHeight)
            .setDepth(HUD_DEPTH_TEXT);
        const zone = this.add.zone(b.x, b.y, b.hitRadius * 2, b.hitRadius * 2)
            .setInteractive(new Phaser.Geom.Circle(b.hitRadius, b.hitRadius, b.hitRadius), Phaser.Geom.Circle.Contains);
        zone.on(Phaser.Input.Events.POINTER_DOWN, () => this.openPause());
    }

    /** Freezes the game and this bar and opens the pause menu on top (not while cards or the end screen show). */
    private openPause(): void {
        if (!this.scene.isActive() || this.getState().pauseLocked) return;
        this.scene.pause(this.gameSceneKey);
        const data: Omit<PauseSceneData, 'returnTo'> = { gameSceneKey: this.gameSceneKey };
        openOverlay(this, 'Pause', data);
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

/** True on a touch screen held upright (the game needs landscape). */
export function isPortraitTouch(): boolean {
    return window.matchMedia('(pointer: coarse) and (orientation: portrait)').matches;
}
