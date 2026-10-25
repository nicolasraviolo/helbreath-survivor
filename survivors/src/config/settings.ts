// Ajustes del jugador (Fase 8): volumen de música, volumen de efectos y barra de vida sobre el personaje.
// Fase 10: en el móvil, además, el estilo de la interfaz de la partida (barra clásica abajo o compacta arriba),
// y en todos, el temblor de cámara (bloque 10C).
// Fase 11: los árboles grandes se pueden quitar, para ver mejor (Fase 12C: ya no hay modo "siempre transparentes";
// con On se vuelven transparentes al pasar por detrás, y un 'transparent' guardado pasa a On al cargar).
// Fase 14A: enviar estadísticas anónimas (activado de serie; se explica con una línea en Settings).
// Fase 15C: en el móvil, stick de apuntar en la mitad derecha de la pantalla (activado de serie).
// Fase 16A: minimapa arriba a la derecha (activado de serie).
// Fase 19C: vibración del mando (activada de serie) y los controles cambiados en Settings → Controls (config/controls.ts).
// Se guardan en el navegador (localStorage), así que siguen ahí la próxima vez que se abre el juego.

import { DEFAULT_CONTROLS, type ControlBindings } from './controls';

/** In-game HUD on phones: the original bottom bar, or a small block at the top (more of the map visible). */
export type HudStyle = 'classic' | 'compact';
export const HUD_STYLES: readonly HudStyle[] = ['classic', 'compact'];
export const HUD_STYLE_NAMES: Readonly<Record<HudStyle, string>> = { classic: 'Classic', compact: 'Compact' };

/** Large map trees: drawn as in the original (see-through while the player is behind), or hidden (with their shadows). */
export type TreeMode = 'on' | 'off';
export const TREE_MODES: readonly TreeMode[] = ['on', 'off'];
export const TREE_MODE_NAMES: Readonly<Record<TreeMode, string>> = { on: 'On', off: 'Off' };

export interface GameSettings {
    /** 0..1, multiplies the music volume of data/audio.ts. */
    musicVolume: number;
    /** 0..1, multiplies the sound-effect volume of data/audio.ts. */
    sfxVolume: number;
    /** Small health bar over the player's head. */
    showPlayerHealthBar: boolean;
    /** Only used on phones (config/device.ts); the PC always shows the classic bar. */
    hudStyle: HudStyle;
    /** Camera shake when hurt and with big explosions (the original also lets you turn it off). */
    screenShake: boolean;
    /** Large trees of the map (walls and houses never change). */
    largeTrees: TreeMode;
    /** Send an anonymous summary of each run to tune the difficulty (Fase 14A, config/metrics.ts). */
    anonymousStats: boolean;
    /** Touch screens only: the right half of the screen opens a second stick that aims (Fase 15C). Off = touch anywhere to move. */
    aimStick: boolean;
    /** Small map at the top right with the player, bosses and totems (Fase 16A, data/minimap.ts). */
    showMinimap: boolean;
    /** Gamepad vibration when hurt and with the Critical / Meteor Strike (Fase 19C, data/feedback.ts). */
    vibration: boolean;
    /** xBR filter on the sprites that move: character, monsters, NPCs, effects, ground items (Fase 28¾, hb/XbrPipeline.ts). */
    smoothSprites: boolean;
    /** Keys and buttons picked in Settings → Controls (Fase 19C). */
    controls: ControlBindings;
}

export const DEFAULT_SETTINGS: Readonly<GameSettings> = {
    musicVolume: 0.8,
    sfxVolume: 0.8,
    showPlayerHealthBar: true,
    hudStyle: 'compact',
    screenShake: true,
    largeTrees: 'on',
    anonymousStats: true,
    aimStick: true,
    showMinimap: true,
    vibration: true,
    // On on PC and phones (owner, 25-oct-2026): it ran well on their phone.
    smoothSprites: true,
    controls: DEFAULT_CONTROLS,
};

/** Each press of ← / → changes a volume by this much. */
export const VOLUME_STEP = 0.1;

/** Key in the browser's localStorage. Change the version if the format changes. */
export const SETTINGS_STORAGE_KEY = 'hb-survivors.settings.v1';
