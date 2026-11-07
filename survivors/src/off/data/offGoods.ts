// Helbreath Off (Fase Off-4A): lo que se lleva en la bolsa y no se pone encima: pociones y Slime Jelly. Números de
// reference/Item.cfg (efecto, dados, precio); dibujos de item-ground.spr / item-pack.spr como en sp-client Items.ts
// (hoja 5; Survivors usa los mismos en data/pickups.ts).
// - Pociones (Item.cfg 91–96): roja = vida, azul = maná, verde = estamina. Normal 2d12+10, grande 3d8+40 (roja) o
//   4d8+50 (azul y verde). Beberlas llega en la Off-4B (inventario).
// - Slime Jelly (Item.cfg 220): solo para vender (precio 10, que no está en la tienda); vender llega en la Off-5.
import type { ItemIconFrame } from '../../data/itemTypes';

export type OffGoodKind = 'potion' | 'material';
export type OffPotionRestores = 'hp' | 'mana' | 'stamina';

export interface OffGoodDef {
    kind: OffGoodKind;
    name: string;
    /** item-ground.spr (on the ground) and item-pack.spr (in the bag): same sheet and frame. */
    picture: ItemIconFrame;
    /** Item.cfg price (gold); a shop buys it back for half. */
    price: number;
    /** Potions: what they fill and how much (dice count, sides, bonus). */
    restores?: { what: OffPotionRestores; dice: readonly [number, number, number] };
}

export const OFF_GOODS = {
    redPotion: { kind: 'potion', name: 'Red Potion', picture: { sheet: 5, frame: 1 }, price: 10, restores: { what: 'hp', dice: [2, 12, 10] } },
    bigRedPotion: { kind: 'potion', name: 'Big Red Potion', picture: { sheet: 5, frame: 2 }, price: 65, restores: { what: 'hp', dice: [3, 8, 40] } },
    bluePotion: { kind: 'potion', name: 'Blue Potion', picture: { sheet: 5, frame: 3 }, price: 10, restores: { what: 'mana', dice: [2, 12, 10] } },
    bigBluePotion: { kind: 'potion', name: 'Big Blue Potion', picture: { sheet: 5, frame: 4 }, price: 65, restores: { what: 'mana', dice: [4, 8, 50] } },
    greenPotion: { kind: 'potion', name: 'Green Potion', picture: { sheet: 5, frame: 5 }, price: 10, restores: { what: 'stamina', dice: [2, 12, 10] } },
    bigGreenPotion: { kind: 'potion', name: 'Big Green Potion', picture: { sheet: 5, frame: 6 }, price: 65, restores: { what: 'stamina', dice: [4, 8, 50] } },
    slimeJelly: { kind: 'material', name: 'Slime Jelly', picture: { sheet: 5, frame: 49 }, price: 10 },
} as const satisfies Record<string, OffGoodDef>;

export type OffGoodId = keyof typeof OFF_GOODS;

export function isOffGoodId(id: string): id is OffGoodId {
    return Object.prototype.hasOwnProperty.call(OFF_GOODS, id);
}

/** Gold on the ground: the original's "Gold" (Item.cfg 90; item-ground 5/0). */
export const OFF_GOLD_PICTURE: ItemIconFrame = { sheet: 5, frame: 0 };
