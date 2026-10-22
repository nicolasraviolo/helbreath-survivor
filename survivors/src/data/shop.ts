// Tienda de la Shop Keeper (Fase 24B; decidido por el propietario el 21-oct-2026, docs/DECISIONES.md, "Fase 24").
// Vende con el oro del dispositivo (systems/GoldStore.ts):
// - Zemstone of Sacrifice: objeto normal; va al inventario del personaje que pasea por la ciudad. Sin límite.
// - Abaddon's Blood: mejora permanente de los 4 personajes (UnlockStore.unlock). Una sola compra: luego "Sold out".
// - Dado y vino: +1 Reroll / +1 Skip por partida (UnlockStore.buy), hasta 3 de cada; cada uno cuesta más que el
//   anterior. Al tener los 3, "Sold out".
// Precios "challenging" (~1.000 de oro por hora de juego, data/gold.ts): nada importante en las primeras horas.
// Ventana: scenes/ShopScene.ts (medidas en config/shop.ts).
import { ABADDON, type UnlockId } from './abaddon';
import { CONSUMABLES, ZEM_ID, type ConsumableId } from './consumables';
import type { ItemIconFrame } from './itemTypes';
import { STACKABLE_UNLOCKS, WINE_ICON, type StackableUnlockId } from './rerollSkip';

/** How an entry is bought: an item for the inventory, a one-time upgrade, or an upgrade bought a few times. */
export type ShopGood =
    | { kind: 'item'; id: ConsumableId }
    | { kind: 'unlock'; id: UnlockId }
    | { kind: 'stackable'; id: StackableUnlockId };

/** Its picture: an item-pack drawing of the original, or the die drawn with code (ui/DiceIcon.ts). */
export type ShopPicture = { kind: 'item'; frame: ItemIconFrame } | { kind: 'dice' };

export interface ShopEntry {
    name: string;
    good: ShopGood;
    picture: ShopPicture;
    /** Price of each purchase in order (the last one repeats for an item without a limit). */
    prices: readonly number[];
    /** What it does, under the list. */
    description: string;
}

export interface ShopSection {
    title: string;
    entries: readonly ShopEntry[];
}

export const SHOP_SECTIONS: readonly ShopSection[] = [
    {
        title: 'Stones',
        entries: [{
            name: CONSUMABLES[ZEM_ID].name,
            good: { kind: 'item', id: ZEM_ID },
            picture: { kind: 'item', frame: CONSUMABLES[ZEM_ID].icon },
            prices: [1500],
            description: 'If you die, you keep everything found in that run. Goes to your inventory: equip it before a run.',
        }],
    },
    {
        title: 'Blessings',
        entries: [{
            name: ABADDON.name,
            good: { kind: 'unlock', id: 'abaddon' },
            picture: { kind: 'item', frame: ABADDON.icon },
            prices: [10000],
            description: 'Once per run, you rise again when you die. For all your characters, forever.',
        }],
    },
    {
        title: 'Power Cards',
        entries: [
            {
                name: STACKABLE_UNLOCKS.dice.name,
                good: { kind: 'stackable', id: 'dice' },
                picture: { kind: 'dice' },
                prices: [2000, 4000, 8000],
                description: '+1 Reroll per run: new Power cards to choose from. For all your characters.',
            },
            {
                name: STACKABLE_UNLOCKS.wine.name,
                good: { kind: 'stackable', id: 'wine' },
                picture: { kind: 'item', frame: WINE_ICON },
                prices: [2000, 4000, 8000],
                description: '+1 Skip per run: take no card and heal a little. For all your characters.',
            },
        ],
    },
];

export const SHOP_TEXT = {
    soldOut: 'Sold out',
    notEnoughGold: 'Not enough gold.',
    noCharacter: 'Choose a character first: the Zemstone goes to its inventory.',
    bought: (name: string) => `You bought ${name}.`,
    gold: (amount: string) => `Your gold: ${amount}`,
} as const;
