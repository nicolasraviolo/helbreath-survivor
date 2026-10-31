// Panel de daño de los Barracks (31-oct-2026): arriba a la izquierda, con los botones Level Up, Reset y Equipment
// (también con las teclas L, R e I; en el móvil se tocan).
import { byDevice } from './device';
import { UI_FONT_SIZE } from './ui';

export const TRAINING_PANEL = {
    x: 10,
    y: 10,
    /** Gap between the panel's lines and between its buttons (px). */
    lineGap: 2,
    buttonGap: 8,
    padding: { x: 8, y: 6 },
    fontSize: UI_FONT_SIZE.normal,
    textColor: '#ffffff',
    buttonColor: '#ffd860',
    background: '#000000a8',
    buttonBackground: '#3a2a10e0',
    /** How often the numbers are written again (ms): they stay readable instead of flickering every frame. */
    refreshMs: 250,
    /** Phones: a bit more room between the buttons, for fingers. */
    buttonPaddingY: byDevice(3, 8),
} as const;
