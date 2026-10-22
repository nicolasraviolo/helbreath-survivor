// Medidas de la pantalla Select Map (Fase 22A): cuatro tarjetas en fila, una por mapa, sobre el fondo del menú.
import { byDevice } from './device';
import { px, UI_FONT_SIZE, UI_TEXT } from './ui';

export const MAP_SELECT = {
    title: { y: 46, scale: 2.4, color: 0xffd860 },
    /** Dark veil over the menu background, so the cards stand out. */
    veil: { color: 0x000000, alpha: 0.55 },
    card: {
        width: 180, height: 345, gap: 12, top: 96,
        color: 0x1a140c, alpha: 0.92,
        border: 0x6a5a3a, focusedBorder: 0xffd860, borderWidth: 2, focusedBorderWidth: 3,
        /** Square picture of the play area, cut out of the map's minimap. */
        thumbnail: { size: 164, top: 8 },
        /** Lines of text under the picture. */
        textTop: 182, textWidth: 168,
        /** The map's one-line description: not on phones (the bigger letters don't fit). */
        showDescription: byDevice(true, false),
        /** Locked or "Coming soon": picture and name dimmed. */
        lockedAlpha: 0.4,
    },
    /** Play and Back, centred under the cards. */
    buttons: { y: 476, width: 150, height: 34, gap: 24, color: 0x1a140c, border: 0x6a5a3a, litBorder: 0xffd860 },
    help: { y: 528, width: 720 },
} as const;

const BASE = { ...UI_TEXT, stroke: '#000000', strokeThickness: 3, align: 'center' } as const;

export const MAP_SELECT_STYLES = {
    name: { ...BASE, fontSize: px(UI_FONT_SIZE.normal + 2), fontStyle: 'bold', color: '#ffd860' },
    line: { ...BASE, fontSize: px(UI_FONT_SIZE.small), color: '#e9e1cf' },
    description: { ...BASE, fontSize: px(UI_FONT_SIZE.small), color: '#a39a86', fontStyle: 'italic' },
    /** Recommended Level when the character is below it. */
    lowLevel: { ...BASE, fontSize: px(UI_FONT_SIZE.small), color: '#ff7060' },
    lock: { ...BASE, fontSize: px(UI_FONT_SIZE.small), color: '#ff9a60' },
    won: { ...BASE, fontSize: px(UI_FONT_SIZE.small), color: '#9fdf7a' },
    button: { ...BASE, fontSize: px(UI_FONT_SIZE.normal), color: '#e9e1cf' },
    help: { ...BASE, fontSize: px(UI_FONT_SIZE.normal), color: '#c8b88a' },
} as const;
