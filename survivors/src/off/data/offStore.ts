// Helbreath Off (Fase Off-5B): la tienda, el herrero y el almacén de cada ciudad. Se abren al pisar su puerta
// (off/data/offPlaces.ts, `doors`); ventanas en off/scenes/OffStoreScene.ts y off/scenes/OffWarehouseScene.ts.
// - Decidido por el propietario (7-nov-2026): la tienda vende pociones, el herrero armas, escudos y armaduras (todo lo
//   que hay dibujado), y los dos compran cualquier cosa de la bolsa a mitad de precio. Sin desgaste ni reparar.
// - Precios de Item.cfg (en off/data/offItems.ts y off/data/offGoods.ts).
// - Almacén: 120 huecos, como el banco del original (DEF_MAXBANKITEMS). El oro va siempre contigo.
// - La tienda de magia (Off-6A) es la pestaña Magic de la tienda (propietario, 7-nov-2026); las magias, en offSpells.ts.
import { OFF_GOODS, type OffGoodId } from './offGoods';
import { OFF_ITEMS, type OffItemDef, type OffItemId, type OffSlotId } from './offItems';
import type { OffBuildingKind } from './offPlaces';

export const OFF_STORE = {
    /** Part of the price a shop pays for what you sell (rounded down, at least 1). */
    sellShare: 0.5,
    warehouseSize: 120,
} as const;

/** The two buildings that buy and sell. */
export type OffStoreKind = Exclude<OffBuildingKind, 'warehouse'>;

/** What the shop sells, in order. */
const SHOP_GOODS: readonly OffGoodId[] = ['redPotion', 'bigRedPotion', 'bluePotion', 'bigBluePotion', 'greenPotion', 'bigGreenPotion'];

/** The blacksmith's sections, in this order; each with its items cheapest STR first (then price). */
// Off-11A: the wands in their own section, after the weapons; the rare ones (negative Item.cfg price) are not sold.
const SMITH_SECTIONS: readonly { title: string; slots: readonly OffSlotId[]; wands?: true }[] = [
    { title: 'Weapons', slots: ['weapon'] },
    { title: 'Wands', slots: ['weapon'], wands: true },
    { title: 'Shields', slots: ['shield'] },
    { title: 'Armor', slots: ['helm', 'body', 'legs', 'boots', 'cape'] },
];

export interface OffStoreSection<T extends string> {
    title: string;
    items: readonly T[];
}

function smithSections(): OffStoreSection<OffItemId>[] {
    const ids = Object.keys(OFF_ITEMS) as OffItemId[];
    const isWand = (id: OffItemId): boolean => { const item: OffItemDef = OFF_ITEMS[id]; return item.kind === 'weapon' && item.wand !== undefined; };
    const isRare = (id: OffItemId): boolean => { const item: OffItemDef = OFF_ITEMS[id]; return item.rare === true; };
    return SMITH_SECTIONS.map(({ title, slots, wands }) => ({
        title,
        items: ids
            .filter((id) => slots.includes(OFF_ITEMS[id].slot) && !isRare(id) && isWand(id) === (wands === true))
            .sort((a, b) => slots.indexOf(OFF_ITEMS[a].slot) - slots.indexOf(OFF_ITEMS[b].slot)
                || OFF_ITEMS[a].strToEquip - OFF_ITEMS[b].strToEquip
                || OFF_ITEMS[a].price - OFF_ITEMS[b].price),
    }));
}

/** What each store sells, by sections. */
export const OFF_STORE_STOCK: Record<OffStoreKind, readonly OffStoreSection<OffGoodId | OffItemId>[]> = {
    shop: [{ title: 'Potions', items: SHOP_GOODS }],
    smith: smithSections(),
};

/** Price of anything that can be in the bag. */
export function offPrice(id: OffGoodId | OffItemId): number {
    return id in OFF_ITEMS ? OFF_ITEMS[id as OffItemId].price : Math.abs(OFF_GOODS[id as OffGoodId].price);
}

/** What a shop pays for it. */
export function offSellPrice(id: OffGoodId | OffItemId): number {
    return Math.max(1, Math.floor(offPrice(id) * OFF_STORE.sellShare));
}

export const OFF_STORE_TEXT = {
    title: { shop: 'Shop', smith: 'Blacksmith' } satisfies Record<OffStoreKind, string>,
    warehouseTitle: 'Warehouse',
    tabs: { buy: 'Buy', sell: 'Sell', magic: 'Magic' },
    /** The left button's label on each tab. */
    actButton: { buy: 'Buy', sell: 'Sell', magic: 'Learn' },
    learned: 'Learned',
    learnt: (name: string, price: number) => `You learned ${name} for ${price.toLocaleString('en-US')} gold.`,
    cantLearn: { known: 'You already know it.', int: 'Your Int is too low (in red).', gold: 'Not enough gold.' },
    closeButton: 'Close',
    itemHeader: 'ITEM',
    priceHeader: 'PRICE',
    gold: (amount: number) => `Gold: ${amount.toLocaleString('en-US')}`,
    bought: (name: string, price: number) => `You bought the ${name} for ${price.toLocaleString('en-US')} gold.`,
    sold: (name: string, price: number) => `You sold the ${name} for ${price.toLocaleString('en-US')} gold.`,
    noGold: 'Not enough gold.',
    bagFull: 'Your bag is full.',
    potionLimit: "You can't carry more potions.",
    nothingToSell: 'Your bag is empty. What you wear is not for sale.',
    cantWear: 'You could not wear it yet (in red).',
    stored: (name: string) => `You stored the ${name}.`,
    taken: (name: string) => `You took the ${name}.`,
    warehouseFull: 'The warehouse is full.',
    bagLabel: (count: number, size: number) => `Bag ${count} / ${size}`,
    warehouseLabel: (count: number, size: number) => `Warehouse ${count} / ${size}`,
    /** Help line, by device. */
    storeHelpMouse: 'Click: mark · Double-click or Enter: buy / sell / learn · Tab: change tab · Esc: close',
    storeHelpPad: 'A: buy / sell / learn · LB / RB: change tab · B: close',
    warehouseHelpMouse: 'Click: move it to the other side · Tab: change side · Esc: close',
    warehouseHelpPad: 'A: move it to the other side · LB / RB: change side · B: close',
} as const;
