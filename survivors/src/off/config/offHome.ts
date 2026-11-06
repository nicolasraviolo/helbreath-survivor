// Medidas de la escena vacía de Helbreath Off (Fase Off-0): todo dentro del panel del menú principal (MAIN_MENU),
// que tapa los botones del original pintados en el fondo.
import { byDevice } from '../../config/device';

export const OFF_HOME = {
    /** From the panel's centre (MAIN_MENU.panelY). */
    titleOffsetY: byDevice(-62, -70),
    titleScale: byDevice(2, 2.4),
    textOffsetY: byDevice(0, 0),
    backOffsetY: byDevice(62, 72),
    title: 'Helbreath Off',
    text: 'Coming soon',
} as const;
