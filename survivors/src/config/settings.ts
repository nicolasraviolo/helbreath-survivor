// Ajustes del jugador (Fase 8): volumen de música, volumen de efectos y barra de vida sobre el personaje.
// Se guardan en el navegador (localStorage), así que siguen ahí la próxima vez que se abre el juego.

export interface GameSettings {
    /** 0..1, multiplies the music volume of data/audio.ts. */
    musicVolume: number;
    /** 0..1, multiplies the sound-effect volume of data/audio.ts. */
    sfxVolume: number;
    /** Small health bar over the player's head. */
    showPlayerHealthBar: boolean;
}

export const DEFAULT_SETTINGS: Readonly<GameSettings> = {
    musicVolume: 0.8,
    sfxVolume: 0.8,
    showPlayerHealthBar: true,
};

/** Each press of ← / → changes a volume by this much. */
export const VOLUME_STEP = 0.1;

/** Key in the browser's localStorage. Change the version if the format changes. */
export const SETTINGS_STORAGE_KEY = 'hb-survivors.settings.v1';
