// Qué interfaz de partida se usa (Fase 10): en el PC siempre la barra clásica; en el móvil, la que elija el jugador
// en Settings → HUD. De ella depende hasta dónde llega la zona de juego (con la compacta, hasta abajo del todo).
import { COMPACT_UI } from '../config/device';
import { GAME_HEIGHT } from '../config/gameConfig';
import { HUD_COMPACT, HUD_COMPACT_LAYOUT, HUD_TOP } from '../config/hud';
import type { HudStyle } from '../config/settings';
import type { ReviveHudState } from '../systems/AbaddonRevive';
import { settings } from '../systems/Settings';

export function activeHudStyle(): HudStyle {
    return COMPACT_UI ? settings.current.hudStyle : 'classic';
}

/** Bottom of the game area on screen: the top of the classic bar, or the bottom of the screen. */
export function playAreaBottom(): number {
    return activeHudStyle() === 'classic' ? HUD_TOP : GAME_HEIGHT;
}

/**
 * Lowest Y free for things drawn over the game (buffs, stats panel, level-up hint): the play area, minus the strip of
 * the compact gauges when they run along the bottom (they are see-through, so the map still goes under them).
 */
export function overlayBottom(): number {
    if (activeHudStyle() === 'compact' && HUD_COMPACT_LAYOUT === 'bottom') return GAME_HEIGHT - HUD_COMPACT.bottom.reserve;
    return playAreaBottom();
}

/** The part of the HUD that changes with the style: the classic bottom bar or the compact block (ui/ClassicHud.ts, ui/CompactHud.ts). */
export interface HudBar {
    /** Called every frame with what to show. */
    update(state: HudBarState): void;
    destroy(): void;
}

export interface HudBarState {
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
    /** Gold picked up this run (Fase 24A). */
    gold: number;
    /**
     * Orb of the active skill (Fase 19): the Warrior's Critical Strike charges, or the seconds left until the Mage's
     * spell is ready (nothing when it is). Undefined for a character without one.
     */
    skillOrb: SkillOrb | undefined;
    /** Skills used so far: when it grows, the icon shows pressed for a moment. */
    skillUses: number;
    /** Abaddon's Blood (Fase 21E): lit while it can still bring you back, dark once used, hidden if not unlocked. */
    revive: ReviveHudState;
}

/** What the skill orb shows: a number over it, and dimmed when it cannot be used. */
export interface SkillOrb {
    text: string;
    ready: boolean;
}

/** True when both show the same (`null` = nothing shown yet). */
export function sameOrb(a: SkillOrb | undefined, b: SkillOrb | undefined | null): boolean {
    if (b === null) return false;
    return a === b || (a !== undefined && b !== undefined && a.text === b.text && a.ready === b.ready);
}

/** Red sword icon of the Critical Strike: which frame to show (purple for a moment after each launch). */
export class CritIconState {
    private lastLaunches = -1;
    private pressedUntil = 0;

    /** Frame for now (`now` in ms, the scene clock). */
    public frame(launches: number, now: number, frames: { frame: number; pressedFrame: number; pressedMs: number }): number {
        if (this.lastLaunches >= 0 && launches > this.lastLaunches) this.pressedUntil = now + frames.pressedMs;
        this.lastLaunches = launches;
        return now < this.pressedUntil ? frames.pressedFrame : frames.frame;
    }
}

/** What the bar's buttons do. */
export interface HudBarActions {
    toggleStats: () => void;
    openPause: () => void;
}
