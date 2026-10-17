// Fuente de toda la interfaz del juego: Comic Neue (elegida por el propietario el 16-oct-2026).
// Es una versión libre (licencia OFL) de Comic Sans MS, la letra de los diálogos del Helbreath original.
// Va incluida en el juego (paquete @fontsource/comic-neue, importado en main.ts), así que se ve igual en
// Windows, Mac y móviles. Si por lo que sea no carga, se usa Comic Sans MS del sistema.

import { byDevice, TEXT_RESOLUTION } from './device';

export const UI_FONT_NAME = 'Comic Neue';
export const UI_FONT = `"${UI_FONT_NAME}", "Comic Sans MS", sans-serif`;

/** Font sizes in px. `small` is for the tight boxes of the bottom bar. Bigger on phones (config/device.ts). */
export const UI_FONT_SIZE = byDevice(
    { small: 12, normal: 15, large: 20, title: 36 },
    { small: 16, normal: 20, large: 26, title: 44 },
);

/** Base of every UI text style: the font, drawn sharp at the screen's real pixel density. */
export const UI_TEXT = { fontFamily: UI_FONT, resolution: TEXT_RESOLUTION } as const;

/** Weights included in the game (main.ts imports exactly these). */
const UI_FONT_WEIGHTS = [400, 700] as const;
/** Don't hold the game back for long if the font can't load: the fallback is fine. */
const UI_FONT_TIMEOUT_MS = 3000;

export function px(size: number): string {
    return `${size}px`;
}

/** Resolves once the UI font is ready (or after a timeout, so the game always starts). */
export function loadUiFont(): Promise<void> {
    const loads = UI_FONT_WEIGHTS.map((weight) => document.fonts.load(`${weight} ${px(UI_FONT_SIZE.normal)} "${UI_FONT_NAME}"`));
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, UI_FONT_TIMEOUT_MS));
    return Promise.race([Promise.all(loads).then(() => undefined), timeout]);
}
