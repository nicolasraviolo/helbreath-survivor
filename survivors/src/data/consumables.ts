// Objetos que se gastan (Fase 21D). Solo el Zem: Abaddon's Blood (21E) no es un objeto sino una mejora permanente (data/abaddon.ts).
// - Zemstone of Sacrifice (objeto 650 del original, Item3.cfg:31; icono en item-pack hoja 15, frame 39): se pone en su
//   hueco antes de la partida. Si mueres con él y la partida encontró algo, conservas ese botín y el Zem se gasta.
//   Si no encontraste nada, no se gasta (no había nada que salvar). Un Zem encontrado en la partida va a la bolsa.
// - Es un objeto normal: vive en el inventario o en el baúl como cualquier arma. Por eso la tienda de la Fase 24 solo
//   tendrá que meter uno más en el inventario (propietario, 20-oct-2026: el Zem también se podrá comprar).
import type { ItemIconFrame } from './itemTypes';

export const ZEM_ID = 'zemstone';
export type ConsumableId = typeof ZEM_ID;

/** Where an item can come from. 'shop' arrives with the Fase 24. */
export type ItemSource = 'bossDrop' | 'shop';

export interface ConsumableDef {
    name: string;
    icon: ItemIconFrame;
    /** What it does, for Equipment and the warehouse. */
    description: string;
    sources: readonly ItemSource[];
}

export const CONSUMABLES: Readonly<Record<ConsumableId, ConsumableDef>> = {
    zemstone: {
        name: 'Zemstone of Sacrifice',
        icon: { sheet: 15, frame: 39 },
        description: 'If you die, you keep the items found in that run. Used up when it saves something',
        // Fase 24: add 'shop'.
        sources: ['bossDrop'],
    },
};

export function isConsumableId(id: string): id is ConsumableId {
    return Object.prototype.hasOwnProperty.call(CONSUMABLES, id);
}
