// Interfaz de la partida: la barra (clásica abajo, o compacta arriba en el móvil: ui/ClassicHud.ts, ui/CompactHud.ts),
// la barra del jefe, los avisos, la cuenta atrás del portal (Fase 13), las mejoras activas de los cofres
// el aviso de logro conseguido (Fase 14B, abajo a la izquierda) y el minimapa (Fase 16A, arriba a la derecha).
// Corre como escena aparte por encima de la partida, así que no se mueve con la cámara.
// El casco (o C / Y del mando) pausa y abre la ventana Character del original (Fase 20A, CharacterInfoScene), y el disquete o Esc / Start abren la pausa (PauseScene).
// Si se desconecta el mando en plena partida, la pausa se abre sola.
// En pantallas táctiles hay además un botón de pausa arriba a la derecha, y la pausa se abre sola al poner el móvil
// en vertical (el juego es apaisado y queda tapado por el aviso de girarlo), y el botón del Critical Strike (Fase 19A)
// abajo a la derecha.
// Si se cambia el estilo de la barra en los ajustes (desde la pausa), la barra se cambia al momento.
import Phaser from 'phaser';
import { DEBUG_START } from '../config/debugStart';
import { COMPACT_UI } from '../config/device';
import { GAME_WIDTH } from '../config/gameConfig';
import {
    ANNOUNCE_EVENT,
    HUD_ACHIEVEMENT,
    HUD_ANNOUNCE,
    HUD_BOSS,
    HUD_BUFF,
    HUD_COMPACT,
    HUD_COMPACT_LAYOUT,
    HUD_DEPTH_TEXT,
    HUD_PORTAL,
} from '../config/hud';
import type { HudStyle } from '../config/settings';
import { addTouchPauseButton } from '../ui/TouchPauseButton';
import { addTouchFullscreenButton } from '../ui/fullscreen';
import { ACHIEVEMENT_EVENT } from '../data/achievements';
import { dodgeChance, resistChance } from '../data/defense';
import { PASSIVE_IDS, PASSIVES } from '../data/passives';
import { getMagic, MAGIC_IDS, magicMaxRank, type MagicId } from '../data/passiveMagic';
import type { CharacterId } from '../data/characters';
import type { CharacterStats } from '../entities/CharacterStats';
import { Action, InputSystem } from '../systems/InputSystem';
import { SETTINGS_CHANGED, settings } from '../systems/Settings';
import { SpriteText } from '../hb/SpriteText';
import { ClassicHud } from '../ui/ClassicHud';
import { CritButton, type CritButtonDrag } from '../ui/CritButton';
import { TOUCH_SPELL_DRAG } from '../config/touch';
import { CompactHud } from '../ui/CompactHud';
import { activeHudStyle, overlayBottom, type HudBar, type HudBarState } from '../ui/hudLayout';
import { Minimap, type MinimapInfo, type MinimapMarkers } from '../ui/Minimap';
import { MINIMAP } from '../data/minimap';
import { openOverlay } from './MenuOverlayScene';
import type { CharacterInfoSceneData } from './CharacterInfoScene';
import type { PauseSceneData } from './PauseScene';

/** What the HUD shows, read every frame from the game. */
export interface HudState extends HudBarState {
    /** True while the pause menu can't open (Game Over or level-up cards showing). */
    pauseLocked: boolean;
    /** For the Character window (tecla C). */
    stats: Readonly<CharacterStats>;
    /** Weapon or spell in hand. */
    weaponName: string | undefined;
    /** Stats panel row of the active skill (Fase 19): the Mage's spell and its recharge, or the Warrior's charges. */
    skillRow: [string, string] | undefined;
    /** Share of damage removed by armor (0..1). */
    defense: number;
    /** Defense ratio against monster blows: Dex plus armor (data/defense.ts). */
    defenseRatio: number;
    /** Magic resistance against spells: Magic plus armor (data/defense.ts). */
    magicResistance: number;
    /** Rank of each passive. */
    passiveRanks: Readonly<Record<keyof typeof PASSIVES, number>>;
    /** Total bonus of each passive (0.7 = +70%; Fase 28½A: Rare and Epic cards are worth more than their rank). */
    passiveBonuses: Readonly<Record<keyof typeof PASSIVES, number>>;
    /** Rank of each magic of the run (Fase 28). */
    magicRanks: Readonly<Record<MagicId, number>>;
    /** Boss shown on the big bar at the top, if one is alive. */
    /** Bosses alive, the final one first (one bar each, up to HUD_BOSS.maxShown). */
    bosses: ReadonlyArray<{ name: string; hp: number; maxHp: number }>;
    /** Seconds left to step into the portal after the final boss, if it is open. */
    portalSecondsLeft: number | undefined;
    /** Buffs from chests that are on (they can be combined), with their seconds left. */
    buffs: ReadonlyArray<{ name: string; secondsLeft: number; color: number }>;
    /** What the minimap marks (Fase 16A). */
    minimap: MinimapMarkers;
}

export interface HudSceneData {
    getState: () => HudState;
    /** Scene paused while the pause menu is open. */
    gameSceneKey: string;
    minimap: MinimapInfo;
    /** The touch button of the Critical Strike was pressed. */
    launchCritStrike: () => void;
    /** Fase 26B: the Mage drags that button to aim the Spell 2; undefined for the Warrior (a tap launches). */
    spellDrag: CritButtonDrag | undefined;
    /** Saved character playing (its Level shows in the Character window); undefined in debug runs. */
    characterUid: string | undefined;
    classId: CharacterId;
}

export class HudScene extends Phaser.Scene {
    private getState!: () => HudState;
    private gameSceneKey!: string;
    private minimapInfo!: MinimapInfo;
    private launchCritStrike!: () => void;
    private spellDrag: CritButtonDrag | undefined;
    private characterUid: string | undefined;
    private classId!: CharacterId;
    private critButton: CritButton | undefined;
    private minimap!: Minimap;
    private inputSystem!: InputSystem;
    private bar!: HudBar;
    private barStyle!: HudStyle;
    private readonly bossNames: SpriteText[] = [];
    private bossBar!: Phaser.GameObjects.Graphics;
    /** Names and health of the bars drawn now, to redraw only when something changes. */
    private shownBosses = '';
    private portalText!: SpriteText;
    private shownPortalSeconds = -1;
    private announce!: SpriteText;
    private announceLeftMs = 0;
    /** Names of the achievements still to show, and the notice on screen (if any) with its time on screen. */
    private readonly achievementQueue: string[] = [];
    private achievementNotice: Phaser.GameObjects.Container | undefined;
    private achievementShownMs = 0;
    private achievementWidth = 0;
    /** One line per active buff, created when first needed. */
    private readonly buffTexts: SpriteText[] = [];

    constructor() {
        super('Hud');
    }

    init(data: HudSceneData): void {
        this.getState = data.getState;
        this.gameSceneKey = data.gameSceneKey;
        this.minimapInfo = data.minimap;
        this.launchCritStrike = data.launchCritStrike;
        this.spellDrag = data.spellDrag;
        this.characterUid = data.characterUid;
        this.classId = data.classId;
    }

    create(): void {
        this.buildBar();
        // ?debug=stats: the Character window open from the start, to check it (src/config/debugStart.ts).
        if (DEBUG_START.actions.includes('stats')) this.time.delayedCall(0, () => this.openCharacterInfo());
        this.createBossBar();
        this.announce = new SpriteText(this, GAME_WIDTH / 2, HUD_ANNOUNCE.y, '', HUD_ANNOUNCE.color, 'center');
        this.announce.container.setScale(HUD_ANNOUNCE.scale).setDepth(HUD_DEPTH_TEXT).setVisible(false);
        const game = this.scene.get(this.gameSceneKey);
        const onAnnounce = (message: string) => this.showAnnouncement(message);
        game.events.on(ANNOUNCE_EVENT, onAnnounce);
        const onAchievement = (name: string) => this.achievementQueue.push(name);
        game.events.on(ACHIEVEMENT_EVENT, onAchievement);
        this.achievementQueue.length = 0;
        this.achievementNotice = undefined;
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            game.events.off(ANNOUNCE_EVENT, onAnnounce);
            game.events.off(ACHIEVEMENT_EVENT, onAchievement);
        });
        this.inputSystem = new InputSystem(this);
        // Gamepad unplugged (or out of battery) mid-run: pause so the player doesn't die without controls.
        const onPadLost = () => this.openPause();
        window.addEventListener('gamepaddisconnected', onPadLost);
        // Phone turned upright: the "rotate" notice covers the game, so pause it.
        const onResize = () => {
            if (isPortraitTouch()) this.openPause();
        };
        window.addEventListener('resize', onResize);
        // Tab in the background (phone locked, another app, minimised): paused when the player comes back (Fase 12).
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') this.openPause();
        };
        document.addEventListener('visibilitychange', onVisibility);
        this.minimap = new Minimap(this, this.minimapInfo, HUD_DEPTH_TEXT);
        this.minimap.setVisible(settings.current.showMinimap);
        // Settings → HUD changed (from the pause menu): swap the bar right away. Same with the minimap.
        const onSettings = () => {
            if (activeHudStyle() !== this.barStyle) this.rebuildBar();
            this.minimap.setVisible(settings.current.showMinimap);
        };
        settings.on(SETTINGS_CHANGED, onSettings);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.removeEventListener('gamepaddisconnected', onPadLost);
            window.removeEventListener('resize', onResize);
            document.removeEventListener('visibilitychange', onVisibility);
            settings.off(SETTINGS_CHANGED, onSettings);
        });
        // The compact HUD has no floppy disk button: it needs the round one (also when forced with ?ui=compact on a PC).
        if (this.sys.game.device.input.touch || COMPACT_UI) {
            addTouchPauseButton(this, HUD_DEPTH_TEXT, () => this.openPause());
            addTouchFullscreenButton(this, HUD_DEPTH_TEXT);
            this.minimap.setTop(MINIMAP.topUnderButtons);
            this.critButton = new CritButton(this, () => this.launchCritStrike(), this.spellDrag);
            this.critButton.place(overlayBottom());
            // ?debug=spelldrag: a pretend finger drags the Mage's button to the right (Fase 26B).
            if (DEBUG_START.actions.includes('spelldrag')) this.critButton.debugDrag(TOUCH_SPELL_DRAG.followRadius, 0);
        } else {
            this.critButton = undefined;
        }
    }

    override update(_time: number, delta: number): void {
        this.inputSystem.update();
        const state = this.getState();
        this.showBosses(state.bosses);
        this.showPortal(state.portalSecondsLeft);
        this.updateAnnouncement(delta);
        this.updateAchievementNotice(delta);
        if (this.inputSystem.justPressed(Action.Pause)) this.openPause();
        if (this.inputSystem.justPressed(Action.ToggleStats)) this.openCharacterInfo();
        this.bar.update(state);
        this.critButton?.update(state.skillOrb, state.skillUses);
        this.showBuffs(state.buffs);
        this.minimap.update(state.minimap, this.time.now);
    }

    /** The bar of the style chosen in the settings (the PC always gets the classic one). */
    private buildBar(): void {
        this.barStyle = activeHudStyle();
        const actions = { toggleStats: () => this.openCharacterInfo(), openPause: () => this.openPause() };
        this.bar = this.barStyle === 'classic' ? new ClassicHud(this, actions) : new CompactHud(this, actions);
    }

    /** Swaps the bar and moves what depends on it (stats panel, buffs, boss bar). */
    private rebuildBar(): void {
        this.bar.destroy();
        this.buildBar();
        this.critButton?.place(overlayBottom());
        this.buffTexts.forEach((text, i) => {
            text.container.y = this.buffY(i);
        });
        this.shownBosses = '';
        this.shownPortalSeconds = -1;
    }

    private createBossBar(): void {
        for (let i = 0; i < HUD_BOSS.maxShown; i++) {
            const name = new SpriteText(this, GAME_WIDTH / 2, 0, '', HUD_BOSS.nameColor, 'center');
            name.container.setScale(HUD_BOSS.nameScale).setDepth(HUD_DEPTH_TEXT).setVisible(false);
            this.bossNames.push(name);
        }
        this.bossBar = this.add.graphics().setDepth(HUD_DEPTH_TEXT).setVisible(false);
        this.portalText = new SpriteText(this, GAME_WIDTH / 2, HUD_PORTAL.y, '', HUD_PORTAL.color, 'center');
        this.portalText.container.setScale(HUD_PORTAL.scale).setDepth(HUD_DEPTH_TEXT).setVisible(false);
    }

    /** Countdown of the portal, where the boss bar was. Its text changes only once a second. */
    private showPortal(seconds: number | undefined): void {
        this.portalText.container.setVisible(seconds !== undefined);
        if (seconds === undefined || seconds === this.shownPortalSeconds) return;
        this.shownPortalSeconds = seconds;
        const between = this.barStyle === 'compact' && HUD_COMPACT_LAYOUT === 'top';
        this.portalText.setText(`${HUD_PORTAL.label} ${seconds}`);
        this.portalText.container.x = between ? HUD_COMPACT.top.bossCenterX : GAME_WIDTH / 2;
    }

    /** Name and health of each boss, one under the other; hidden when there is none. Redrawn only when something changes. */
    private showBosses(all: HudState['bosses']): void {
        const bosses = all.slice(0, HUD_BOSS.maxShown);
        const key = bosses.map((boss) => `${boss.name}:${boss.hp}/${boss.maxHp}`).join('|');
        if (key === this.shownBosses) return;
        this.shownBosses = key;
        this.bossBar.clear().setVisible(bosses.length > 0);
        // The compact HUD with its column at the top left (and buttons at the top right): the bar goes between them.
        const between = this.barStyle === 'compact' && HUD_COMPACT_LAYOUT === 'top';
        const centerX = between ? HUD_COMPACT.top.bossCenterX : GAME_WIDTH / 2;
        const width = between ? HUD_COMPACT.top.bossWidth : HUD_BOSS.width;
        const { height } = HUD_BOSS;
        const left = centerX - width / 2;
        this.bossNames.forEach((name, i) => {
            const boss = bosses[i];
            name.container.setVisible(boss !== undefined);
            if (!boss) return;
            const y = HUD_BOSS.y + i * HUD_BOSS.rowGap;
            const ratio = Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1);
            name.setText(boss.name);
            name.container.setPosition(centerX, HUD_BOSS.nameY + i * HUD_BOSS.rowGap);
            this.bossBar
                .fillStyle(HUD_BOSS.backColor, 0.85).fillRect(left, y, width, height)
                .fillStyle(HUD_BOSS.fillColor, 1).fillRect(left, y, width * ratio, height)
                .lineStyle(2, HUD_BOSS.borderColor, 1).strokeRect(left - 1, y - 1, width + 2, height + 2);
        });
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

    /** One "Achievement unlocked" notice at a time: slides in from the left, stays, fades out; then the next one. */
    private updateAchievementNotice(deltaMs: number): void {
        // Waits while the game is paused (level-up cards, pause menu), so it isn't missed under them.
        if (this.scene.isPaused(this.gameSceneKey)) return;
        const { slideMs, showMs, fadeMs } = HUD_ACHIEVEMENT;
        if (!this.achievementNotice) {
            const name = this.achievementQueue.shift();
            if (name === undefined) return;
            this.achievementNotice = this.createAchievementNotice(name);
            this.achievementShownMs = 0;
        }
        const notice = this.achievementNotice;
        const t = (this.achievementShownMs += deltaMs);
        if (t >= showMs) {
            notice.destroy();
            this.achievementNotice = undefined;
            return;
        }
        const slide = Math.min(1, t / slideMs);
        notice.x = HUD_ACHIEVEMENT.left - (1 - slide) * (this.achievementWidth + HUD_ACHIEVEMENT.left);
        notice.y = overlayBottom() - HUD_ACHIEVEMENT.bottomGap;
        notice.setAlpha(Math.min(1, (showMs - t) / fadeMs));
    }

    /** Dark box with a gold border: the header line over the achievement's name. Its origin is the bottom left corner. */
    private createAchievementNotice(name: string): Phaser.GameObjects.Container {
        const { padX, padY, lineGap } = HUD_ACHIEVEMENT;
        const header = this.add.text(padX, padY, HUD_ACHIEVEMENT.header, HUD_ACHIEVEMENT.headerStyle);
        const title = this.add.text(padX, padY + header.height + lineGap, name, HUD_ACHIEVEMENT.nameStyle);
        const width = Math.max(header.width, title.width) + padX * 2;
        const height = title.y + title.height + padY;
        const box = this.add.graphics()
            .fillStyle(HUD_ACHIEVEMENT.backColor, HUD_ACHIEVEMENT.backAlpha).fillRect(0, 0, width, height)
            .lineStyle(2, HUD_ACHIEVEMENT.borderColor, 1).strokeRect(0, 0, width, height);
        this.achievementWidth = width;
        const notice = this.add.container(-width, 0, [box, header, title]).setDepth(HUD_DEPTH_TEXT);
        for (const part of [box, header, title]) part.y -= height;
        return notice;
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

    /**
     * The original Character window (Fase 20A), with the game paused underneath: this run's stats and, beside them,
     * what they and the gear give. Not while the cards or the end screen show.
     */
    private openCharacterInfo(): void {
        const state = this.getState();
        if (!this.scene.isActive() || state.pauseLocked) return;
        const stats = state.stats;
        const data: CharacterInfoSceneData = {
            characterUid: this.characterUid,
            classId: this.classId,
            run: {
                gameSceneKey: this.gameSceneKey,
                power: stats.level,
                stats: { ...stats.stats },
                hp: state.hp,
                maxHp: state.maxHp,
                maxMana: state.maxMana,
                kills: state.kills,
                details: describeDerived(state),
            },
        };
        this.scene.pause(this.gameSceneKey);
        openOverlay(this, 'CharacterInfo', data);
    }

    /** Freezes the game and this bar and opens the pause menu on top (not while cards or the end screen show). */
    private openPause(): void {
        if (!this.scene.isActive() || this.getState().pauseLocked) return;
        this.scene.pause(this.gameSceneKey);
        const data: Omit<PauseSceneData, 'returnTo'> = { gameSceneKey: this.gameSceneKey };
        openOverlay(this, 'Pause', data);
    }
}

/** Label / value rows of the details panel beside the Character window. */
function describeDerived(state: HudState): [string, string][] {
    const stats = state.stats;
    const bonus = (multiplier: number) => `${multiplier >= 1 ? '+' : ''}${Math.round((multiplier - 1) * 100)}%`;
    const gear: [string, string][] = [];
    if (state.weaponName) gear.push([stats.def.startWeapon.kind === 'spell' ? 'Spell' : 'Weapon', state.weaponName]);
    if (state.skillRow) gear.push(state.skillRow);
    // Always shown (every class can wear something), so the panel keeps the height it was built with.
    gear.push(['Damage taken', `−${Math.round(state.defense * 100)}%`]);
    // General chance of dodging a blow and of resisting a spell, against a typical monster (Fases 18A and 18B).
    gear.push(['Dodge', `${Math.round(dodgeChance(state.defenseRatio) * 100)}%`]);
    gear.push(['Magic resist', `${Math.round(resistChance(state.magicResistance) * 100)}%`]);
    // Always shown, at any rank (0 too), so the panel keeps the height it was built with.
    for (const id of PASSIVE_IDS) {
        const rank = state.passiveRanks[id];
        const value = rank > 0 ? ` ${PASSIVES[id].sign}${Math.round(state.passiveBonuses[id] * 100)}%` : '';
        gear.push([PASSIVES[id].name, `${rank}/${PASSIVES[id].maxRank}${value}`]);
    }
    // Fase 28: the magics that already work, also always shown.
    for (const id of MAGIC_IDS) {
        if (getMagic(id).ready) gear.push([getMagic(id).name, `${state.magicRanks[id]}/${magicMaxRank(id)}`]);
    }
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
