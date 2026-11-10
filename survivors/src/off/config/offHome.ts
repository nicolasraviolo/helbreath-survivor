// Medidas y textos de la pantalla de inicio de Helbreath Off (Fase Off-0; Play y Back desde la Off-1).
// Fase Off-13E (propietario, 10-nov-2026): el panel de madera pasa a ser una ventana oscura de la Off-12 con dos botones,
// en el mismo sitio (centrada donde estaba el panel del menú principal, MAIN_MENU), que tapa los botones del original
// pintados en el fondo.
import { MAIN_MENU } from '../../config/menus';

const WIDTH = 330;
const HEIGHT = 214;

export const OFF_HOME = {
    x: MAIN_MENU.panelX - WIDTH / 2,
    y: MAIN_MENU.panelY - HEIGHT / 2,
    w: WIDTH,
    h: HEIGHT,
    /** The main menu's black strip at the bottom. */
    footerColor: 0x000000,
    sidePad: 24,
    titleTop: 14,
    dividerTop: 54,
    /** Play, with Back under it. */
    buttonsTop: 72,
    buttonWidth: 200,
    buttonHeight: 30,
    buttonGap: 12,
    ruleTop: 160,
    hintsCentreY: 188,
    title: 'Helbreath Off',
    play: 'Play',
    back: 'Back',
    hintMove: 'Move',
    hintSelect: 'Select',
    hintBack: 'Back',
} as const;
