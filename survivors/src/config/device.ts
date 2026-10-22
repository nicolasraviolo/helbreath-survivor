// Interfaz "compacta" para móviles (Fase 10): el juego se dibuja a 800x600 y se encoge para caber en la pantalla.
// En un móvil en horizontal queda al ~65 %, así que letras, menús, cartas y barra inferior se agrandan.
// Se decide una vez al arrancar: pantalla táctil y pequeña, sin ratón ni touchpad (Fase 25, por las consolas). En el PC (o una tablet grande) todo queda como antes.
// Para probarlo en el PC: añade ?ui=compact a la dirección (o ?ui=normal en el móvil para ver la versión de PC).
import { GAME_HEIGHT, GAME_WIDTH } from './gameConfig';

/** Screens whose short side is at most this many CSS pixels count as phones. */
const COMPACT_MAX_SHORT_SIDE = 600;
/** The game is never painted bigger than this (memory and speed grow with the square of it). */
const MAX_RENDER_SCALE = 3;

function detectCompactUi(): boolean {
    const forced = new URLSearchParams(window.location.search).get('ui');
    if (forced === 'compact') return true;
    if (forced === 'normal') return false;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    // Fase 25: a Steam Deck or Legion Go has a touch screen that can look small (with Windows' scaling), but also a
    // touchpad, which browsers report as a fine pointer. Phones have none: with one, keep the PC interface.
    const finePointer = window.matchMedia('(any-pointer: fine)').matches;
    return touch && !finePointer && Math.min(window.screen.width, window.screen.height) <= COMPACT_MAX_SHORT_SIDE;
}

/** True on phones: bigger text and UI. */
export const COMPACT_UI = detectCompactUi();

/** The desktop value, or the phone one when the compact UI is on. */
export function byDevice<T>(desktop: T, compact: T): T {
    return COMPACT_UI ? compact : desktop;
}

function detectRenderScale(): number {
    const forced = Number(new URLSearchParams(window.location.search).get('scale'));
    if (Number.isInteger(forced) && forced >= 1) return Math.min(MAX_RENDER_SCALE, forced);
    const fit = Math.min(window.screen.width / GAME_WIDTH, window.screen.height / GAME_HEIGHT);
    return Math.min(MAX_RENDER_SCALE, Math.max(1, Math.ceil(window.devicePixelRatio * fit)));
}

/**
 * Nitidez: el juego piensa en 800x600, pero el lienzo se pinta este número de veces más grande (x1, x2 o x3, según
 * la densidad real de la pantalla a su tamaño máximo) y cada cámara hace zoom con él (ui/renderScale.ts). Así el
 * navegador no estira una imagen pequeña y el texto sale nítido. Para probar otro valor: ?scale=1 (o 2, 3).
 */
export const RENDER_SCALE = detectRenderScale();

/** Text is prepared at the same scale it is painted with, so it is drawn 1:1 (sharp, no shrinking). */
export const TEXT_RESOLUTION = RENDER_SCALE;
