// Medidas de la pantalla de inicio de Helbreath Off (Fase Off-0; Play y Back desde la Off-1): todo dentro del panel del menú principal (MAIN_MENU),
// que tapa los botones del original pintados en el fondo.
import { byDevice } from '../../config/device';

export const OFF_HOME = {
    /** From the panel's centre (MAIN_MENU.panelY). */
    titleOffsetY: byDevice(-62, -70),
    titleScale: byDevice(2, 2.4),
    /** Play, with Back under it (MAIN_MENU.itemSpacing apart). */
    listOffsetY: byDevice(10, 12),
    title: 'Helbreath Off',
} as const;
