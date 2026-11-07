// Helbreath Off (Fase Off-3C): medidas de la pantalla Equipment de Off. Usa las de Survivors (config/equipment.ts y
// config/characterInfo.ts); aquí solo lo nuevo: el cuadro de stats del objeto marcado, entre la lista y el Ok.
import { byDevice } from '../../config/device';
import { UI_TEXT } from '../../config/ui';

/** Stat box of the marked item, inside the right-hand panel (y from the panel's top). */
export const OFF_EQUIPMENT_BOX = {
    top: 340,
    /** Space kept above the Ok button. */
    bottomGap: 8,
    padding: 8,
    lineHeight: byDevice(21, 23),
    background: 0x120c06,
    border: 0x5a4a30,
} as const;

export const OFF_EQUIPMENT_BOX_TITLE_STYLE = { ...UI_TEXT, fontSize: byDevice('15px', '17px'), fontStyle: 'bold', color: '#e8c060' } as const;
export const OFF_EQUIPMENT_BOX_STYLE = { ...UI_TEXT, fontSize: byDevice('13px', '15px'), color: '#e8d9a8' } as const;
/** "(now …)": what the worn item has. Better in green, worse in red, the same in this colour. */
export const OFF_EQUIPMENT_SAME_COLOR = '#b8a878';
