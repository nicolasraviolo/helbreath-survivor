// Ajustes del jugador (Fase 8): volumen de música, volumen de efectos y barra de vida sobre el personaje.
// Fase 10: en el móvil, además, el estilo de la interfaz de la partida (barra clásica abajo o compacta arriba),
// y en todos, el temblor de cámara (bloque 10C).
// Se guardan en el navegador (localStorage), así que siguen ahí la próxima vez que se abre el juego.

/** In-game HUD on phones: the original bottom bar, or a small block at the top (more of the map visible). */
export type HudStyle = 'classic' | 'compact';
export const HUD_STYLES: readonly HudStyle[] = ['classic', 'compact'];
export const HUD_STYLE_NAMES: Readonly<Record<HudStyle, string>> = { classic: 'Classic', compact: 'Compact' };

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
}

export const DEFAULT_SETTINGS: Readonly<GameSettings> = {
    musicVolume: 0.8,
    sfxVolume: 0.8,
    showPlayerHealthBar: true,
    hudStyle: 'compact',
    screenShake: true,
};

/** Each press of ← / → changes a volume by this much. */
export const VOLUME_STEP = 0.1;

/** Key in the browser's localStorage. Change the version if the format changes. */
export const SETTINGS_STORAGE_KEY = 'hb-survivors.settings.v1';
