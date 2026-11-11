// Helbreath Off: medidas y textos de la ventana Settings propia de Off (off/scenes/OffSettingsScene.ts), con el estilo de
// la Off-12. Sustituye a la Settings de Survivors en la pausa de Off. Solo las opciones que hacen algo en Off (sin
// móvil, sin métricas, sin barra de vida sobre el personaje). Centrada en 800 × 600.
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { MENU_INPUT_DELAY_MS } from '../../config/menus';
import { OFF_THEME_SIZE } from './offTheme';

const SETTINGS_W = 340;
const ROW = OFF_THEME_SIZE.optionRowHeight;

/** Las secciones, de arriba abajo: cabecera y filas. */
export type OffSettingId = 'music' | 'sound' | 'fullscreen' | 'largeTrees' | 'smoothSprites' | 'minimap' | 'screenShake';

export const OFF_SETTINGS_SECTIONS: readonly { label: string; rows: readonly OffSettingId[] }[] = [
    { label: 'Audio', rows: ['music', 'sound'] },
    { label: 'Display', rows: ['fullscreen', 'largeTrees', 'smoothSprites'] },
    { label: 'Gameplay', rows: ['minimap', 'screenShake'] },
];

const LAYOUT = {
    sidePad: 20,
    titleTop: 16,
    dividerTop: 54,
    /** Primera cabecera de sección. */
    contentTop: 66,
    /** De la cabecera a su primera fila, y espacio antes de la siguiente cabecera. */
    labelGap: 16,
    sectionGap: 10,
    /** Del final de las filas al botón Back, y del botón a la fila de pistas del mando. */
    buttonGap: 16,
    buttonWidth: 110,
    hintsGap: 22,
    bottomPad: 14,
} as const;

const rowsCount = OFF_SETTINGS_SECTIONS.reduce((n, s) => n + s.rows.length, 0);
const contentH = OFF_SETTINGS_SECTIONS.length * LAYOUT.labelGap + rowsCount * ROW + (OFF_SETTINGS_SECTIONS.length - 1) * LAYOUT.sectionGap;
const buttonsTop = LAYOUT.contentTop + contentH + LAYOUT.buttonGap;
const hintsCentreY = buttonsTop + OFF_THEME_SIZE.buttonHeight + LAYOUT.hintsGap;
const SETTINGS_H = hintsCentreY + OFF_THEME_SIZE.badge / 2 + LAYOUT.bottomPad;

export const OFF_SETTINGS = {
    ...LAYOUT,
    x: (GAME_WIDTH - SETTINGS_W) / 2,
    y: Math.round((GAME_HEIGHT - SETTINGS_H) / 2),
    w: SETTINGS_W,
    h: SETTINGS_H,
    rowHeight: ROW,
    buttonsTop,
    hintsCentreY,
    shadeAlpha: 0.55,
    inputDelayMs: MENU_INPUT_DELAY_MS,
} as const;

export const OFF_SETTINGS_TEXT = {
    title: 'Settings',
    back: 'Back',
    toggle: 'Toggle',
    change: 'Change',
    select: 'Select',
    /** Fullscreen con el mando: el navegador solo la deja pedir con teclado o ratón. */
    fullscreenPadNote: 'Keyboard or mouse only',
    fullscreenUnavailable: 'Not available',
    rows: {
        music: 'Music',
        sound: 'Sound',
        fullscreen: 'Fullscreen',
        largeTrees: 'Large Trees',
        smoothSprites: 'Smooth Sprites',
        minimap: 'Minimap',
        screenShake: 'Screen Shake',
    } satisfies Record<OffSettingId, string>,
} as const;
