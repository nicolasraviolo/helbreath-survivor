// Objetos que se gastan (Fase 21D): el Zem y, desde la Fase 24C, la Stone of Xelima. Abaddon's Blood (21E) no es un
// objeto sino una mejora permanente (data/abaddon.ts).
// - Zemstone of Sacrifice (objeto 650 del original, Item3.cfg:31; icono en item-pack hoja 15, frame 39): se pone en su
//   hueco antes de la partida. Si mueres con él y la partida encontró algo, conservas todo ese botín y el Zem se gasta
//   (Fase 24A: sin Zem se pierde la mitad, redondeando en contra del jugador).
//   Si no encontraste nada, no se gasta (no había nada que salvar). Un Zem encontrado en la partida va a la bolsa.
// - Es un objeto normal: vive en el inventario o en el baúl como cualquier arma. Por eso la tienda de la Fase 24 solo
//   tendrá que meter uno más en el inventario (propietario, 20-oct-2026: el Zem también se podrá comprar).
// - Stone of Xelima (Fase 24C, propietario 22-oct-2026): cae muy poco de cualquier monstruo (LOOT_XELIMA_CHANCE en
//   data/loot.ts) y cuenta como botín (al morir sin Zem se puede perder). El herrero pedirá una por cada + al mejorar
//   un arma (24D). No va en ningún hueco: solo vive en el inventario o el baúl. Tom también la compra.
//   No confundir con la carta "Stone of Xelima" de la partida (data/passives.ts): mismo dibujo, otra cosa.
import type { ItemIconFrame } from './itemTypes';

export const ZEM_ID = 'zemstone';
export const XELIMA_STONE_ID = 'xelimaStone';
export type ConsumableId = typeof ZEM_ID | typeof XELIMA_STONE_ID;

/** Where an item can come from. */
export type ItemSource = 'bossDrop' | 'monsterDrop' | 'shop';

export interface ConsumableDef {
    name: string;
    icon: ItemIconFrame;
    /** What it does, for Equipment and the warehouse. */
    description: string;
    sources: readonly ItemSource[];
    /** The Equipment slot it is put in; none for the ones that only wait in the inventory (the Xelima stone). */
    slot?: 'zem';
}

export const CONSUMABLES: Readonly<Record<ConsumableId, ConsumableDef>> = {
    zemstone: {
        name: 'Zemstone of Sacrifice',
        icon: { sheet: 15, frame: 39 },
        description: 'If you die, you keep the items found in that run. Used up when it saves something',
        // Fase 24B: also sold by the Shop Keeper (data/shop.ts).
        sources: ['bossDrop', 'shop'],
        slot: 'zem',
    },
    xelimaStone: {
        name: 'Stone of Xelima',
        // The same drawing as the Stone of Xelima card (data/passives.ts).
        icon: { sheet: 5, frame: 128 },
        description: 'The blacksmith needs one for each + when upgrading a weapon (soon)',
        sources: ['monsterDrop'],
    },
};

export function isConsumableId(id: string): id is ConsumableId {
    return Object.prototype.hasOwnProperty.call(CONSUMABLES, id);
}
