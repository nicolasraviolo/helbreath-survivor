// Qué interfaz de partida se usa (Fase 10): en el PC siempre la barra clásica; en el móvil, la que elija el jugador
// en Settings → HUD. De ella depende hasta dónde llega la zona de juego (con la compacta, hasta abajo del todo).
import { COMPACT_UI } from '../config/device';
import { GAME_HEIGHT } from '../config/gameConfig';
import { HUD_TOP } from '../config/hud';
import type { HudStyle } from '../config/settings';
import { settings } from '../systems/Settings';

export function activeHudStyle(): HudStyle {
    return COMPACT_UI ? settings.current.hudStyle : 'classic';
}

/** Bottom of the game area on screen: the top of the classic bar, or the bottom of the screen. */
export function playAreaBottom(): number {
    return activeHudStyle() === 'classic' ? HUD_TOP : GAME_HEIGHT;
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
}

/** What the bar's buttons do. */
export interface HudBarActions {
    toggleStats: () => void;
    openPause: () => void;
}
