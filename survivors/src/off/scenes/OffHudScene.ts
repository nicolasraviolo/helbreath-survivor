// Helbreath Off (Fase Off-2B): la interfaz del mundo, encima de OffWorldScene. Reutiliza la barra de Survivors (la
// clásica abajo en el PC, la compacta en el móvil: ui/ClassicHud.ts, ui/CompactHud.ts) con la vida, la experiencia y
// el nivel (el maná, desde la Off-3B; se gastará en la Off-6). En la línea de texto, "Level N   Exp N%   N kills" en vez
// de Power, tiempo y oro.
// Además, el aviso grande "Level Up!" (como los avisos de Survivors, HUD_ANNOUNCE) y la lista de mensajes de abajo a la
// izquierda (experiencia ganada y perdida). Los dos llegan por los eventos de la escena del mundo (ANNOUNCE_EVENT,
// EVENT_LIST_EVENT), igual que en Survivors.
// Fase Off-3B: el maná con sus números, la barra verde es la estamina como en el original (propietario, 7-nov-2026; la
// experiencia va en una barra fina dorada debajo y en % en la línea de texto) y el casco abre la ventana Character (OFF_OPEN_CHARACTER_EVENT a la escena del mundo). La pausa
// (disquete) abre la pausa desde la Off-4B (OFF_OPEN_PAUSE_EVENT).
// Fase Off-4A: el oro que llevas va en la línea de texto, en vez de las muertes.
import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config/gameConfig';
import { ANNOUNCE_EVENT, EVENT_LIST_EVENT, HUD_ANNOUNCE, HUD_DEPTH_TEXT, HUD_EVENT_LIST } from '../../config/hud';
import { formatGold } from '../../data/gold';
import { SpriteText } from '../../hb/SpriteText';
import { SETTINGS_CHANGED, settings } from '../../systems/Settings';
import { ClassicHud } from '../../ui/ClassicHud';
import { CompactHud } from '../../ui/CompactHud';
import { EventLineList } from '../../ui/EventLineList';
import { activeHudStyle, overlayBottom, type HudBar, type HudBarState } from '../../ui/hudLayout';
import type { HudStyle } from '../../config/settings';

export const OFF_HUD_SCENE_KEY = 'OffHud';
/** Emitted on the world scene by the HUD's helmet button: open the Character window. */
export const OFF_OPEN_CHARACTER_EVENT = 'off-open-character';
/** Emitted on the world scene by the HUD's disk button: open the pause (Off-4B). */
export const OFF_OPEN_PAUSE_EVENT = 'off-open-pause';

/** What the HUD shows, read every frame from the world. */
/** The info line under the green (stamina) gauge. */
export const OFF_HUD_TEXT = {
    infoLine: (level: number, xpRatio: number, gold: number) => `Level ${level}   Exp ${Math.min(100, Math.max(0, Math.floor(xpRatio * 100)))}%   ${formatGold(gold)} Gold`,
} as const;

export interface OffHudState {
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    stamina: number;
    maxStamina: number;
    level: number;
    /** 0..1 towards the next level. */
    xpRatio: number;
    kills: number;
    /** Gold carried (Off-4A). */
    gold: number;
}

export interface OffHudSceneData {
    worldSceneKey: string;
    getState: () => OffHudState;
}

export class OffHudScene extends Phaser.Scene {
    private worldSceneKey!: string;
    private getState!: () => OffHudState;
    private bar!: HudBar;
    private barStyle!: HudStyle;
    private announce!: SpriteText;
    private announceLeftMs = 0;
    private eventLines!: EventLineList;

    constructor() {
        super(OFF_HUD_SCENE_KEY);
    }

    init(data: OffHudSceneData): void {
        this.worldSceneKey = data.worldSceneKey;
        this.getState = data.getState;
    }

    create(): void {
        this.buildBar();
        this.announce = new SpriteText(this, GAME_WIDTH / 2, HUD_ANNOUNCE.y, '', HUD_ANNOUNCE.color, 'center');
        this.announce.container.setScale(HUD_ANNOUNCE.scale).setDepth(HUD_DEPTH_TEXT).setVisible(false);
        this.announceLeftMs = 0;
        this.eventLines = new EventLineList(this);
        const world = this.scene.get(this.worldSceneKey);
        const onAnnounce = (message: string) => this.showAnnouncement(message);
        const onEventLine = (line: string) => this.eventLines.add(line);
        world.events.on(ANNOUNCE_EVENT, onAnnounce);
        world.events.on(EVENT_LIST_EVENT, onEventLine);
        // Settings → HUD changed: swap the bar right away.
        const onSettings = () => {
            if (activeHudStyle() === this.barStyle) return;
            this.bar.destroy();
            this.buildBar();
        };
        settings.on(SETTINGS_CHANGED, onSettings);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            world.events.off(ANNOUNCE_EVENT, onAnnounce);
            world.events.off(EVENT_LIST_EVENT, onEventLine);
            settings.off(SETTINGS_CHANGED, onSettings);
        });
    }

    override update(_time: number, delta: number): void {
        const state = this.getState();
        const barState: HudBarState = {
            hp: state.hp,
            maxHp: state.maxHp,
            mana: state.mana,
            maxMana: state.maxMana,
            stamina: { value: state.stamina, max: state.maxStamina },
            xpRatio: state.xpRatio,
            level: state.level,
            elapsedMs: 0,
            kills: state.kills,
            gold: state.gold,
            skillOrb: undefined,
            skillUses: 0,
            revive: undefined,
            infoLine: OFF_HUD_TEXT.infoLine(state.level, state.xpRatio, state.gold),
        };
        this.bar.update(barState);
        this.updateAnnouncement(delta);
        this.eventLines.update(delta, false, overlayBottom() - HUD_EVENT_LIST.bottomGap);
    }

    /** The bar of the style chosen in the settings (the PC always gets the classic one). */
    private buildBar(): void {
        this.barStyle = activeHudStyle();
        const actions = {
            toggleStats: () => this.scene.get(this.worldSceneKey).events.emit(OFF_OPEN_CHARACTER_EVENT),
            openPause: () => this.scene.get(this.worldSceneKey).events.emit(OFF_OPEN_PAUSE_EVENT),
        };
        this.bar = this.barStyle === 'classic' ? new ClassicHud(this, actions) : new CompactHud(this, actions);
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
}
