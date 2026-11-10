// Helbreath Off, Fase Off-13A: medidas de la ventana de pregunta (off/scenes/OffDialogScene.ts), con el estilo de la
// Off-12 (off/config/offTheme.ts). Una ventana fija de 360 × 200 centrada en 800 × 600: título, separador, pregunta
// (hasta dos líneas) con su aviso, dos botones y, solo con mando, las pistas A / B. La fila de pistas se reserva
// siempre para que la ventana no cambie de tamaño al coger el mando (revisor-ui, 10-nov-2026).
import { MENU_INPUT_DELAY_MS } from '../../config/menus';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';

const WIDTH = 360;
const HEIGHT = 200;

export const OFF_DIALOG = {
    x: (GAME_WIDTH - WIDTH) / 2,
    y: (GAME_HEIGHT - HEIGHT) / 2,
    w: WIDTH,
    h: HEIGHT,
    /** Shade over the paused scene underneath (as the character window's). */
    shadeAlpha: 0.55,
    /** Inner margin left and right: texts are this much narrower than the window on each side. */
    sidePad: 20,
    /** From the window's top: the title, the divider, and the zone where question + warning are centred. */
    titleTop: 16,
    dividerTop: 54,
    textTop: 64,
    textBottom: 124,
    /** Space between the question and its warning. */
    warningGap: 4,
    /** From the window's top: the buttons, and the centre of the pad hints row. */
    buttonsTop: 136,
    buttonWidth: 110,
    buttonGap: 16,
    hintsCentreY: 180,
    /** Space between a pad badge and its word, and between the two hints. */
    hintBadgeGap: 6,
    hintGap: 18,
    /** The press that opened the question doesn't answer it. */
    inputDelayMs: MENU_INPUT_DELAY_MS,
} as const;

/** Words of the pad hints row. */
export const OFF_DIALOG_TEXT = {
    choose: 'Choose',
    yes: 'Yes',
    no: 'No',
} as const;
