// Helbreath Off, Fase Off-13B: medidas y textos de la pausa propia de Off (off/scenes/OffPauseScene.ts) y de su ventana
// Controls (off/scenes/OffControlsScene.ts), con el estilo de la Off-12. Las dos centradas en 800 × 600, con título,
// separador y, abajo, la fila de pistas del mando (se reserva siempre, como en la pregunta de la 13A).
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { MENU_INPUT_DELAY_MS } from '../../config/menus';

const PAUSE_W = 260;
const PAUSE_H = 260;

export const OFF_PAUSE = {
    x: (GAME_WIDTH - PAUSE_W) / 2,
    y: (GAME_HEIGHT - PAUSE_H) / 2,
    w: PAUSE_W,
    h: PAUSE_H,
    shadeAlpha: 0.55,
    sidePad: 20,
    titleTop: 16,
    dividerTop: 54,
    /** The four buttons, stacked and centred. */
    buttonsTop: 70,
    buttonWidth: 180,
    buttonGap: 10,
    hintsCentreY: 236,
    inputDelayMs: MENU_INPUT_DELAY_MS,
} as const;

export const OFF_PAUSE_TEXT = {
    title: 'Paused',
    resume: 'Resume',
    settings: 'Settings',
    controls: 'Controls',
    quit: 'Quit to Menu',
    select: 'Select',
    /** The question before quitting (No marked first). */
    quitTitle: 'Quit to Menu',
    quitQuestion: 'Return to the title screen?',
    quitNote: 'Your progress is saved.',
} as const;

const CONTROLS_W = 600;
const CONTROLS_H = 486;

export const OFF_CONTROLS = {
    x: (GAME_WIDTH - CONTROLS_W) / 2,
    y: (GAME_HEIGHT - CONTROLS_H) / 2,
    w: CONTROLS_W,
    h: CONTROLS_H,
    shadeAlpha: 0.55,
    sidePad: 24,
    titleTop: 16,
    dividerTop: 54,
    /** Column headers, then one row per control. */
    headerTop: 64,
    rowsTop: 88,
    rowHeight: 24,
    /** Width of the action and keyboard columns; the pad column takes the rest. */
    actionWidth: 150,
    keyboardWidth: 220,
    /** Space between the pieces of a pad cell (badge, pill, word). */
    pieceGap: 4,
    buttonsTop: 412,
    buttonWidth: 110,
    hintsCentreY: 462,
    inputDelayMs: MENU_INPUT_DELAY_MS,
} as const;

export const OFF_CONTROLS_TEXT = {
    title: 'Controls',
    action: 'Action',
    keyboard: 'Keyboard / Mouse',
    gamepad: 'Gamepad',
    back: 'Back',
} as const;
