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

/** Off-13D (propietario, 10-nov-2026): the weapons by kind, in this order. Rapier goes with the short swords. */
export type OffWeaponFamily = 'shortSword' | 'longSword' | 'axe' | 'hammer';
const WEAPON_FAMILY: Partial<Record<OffItemId, OffWeaponFamily>> = {
    dagger: 'shortSword', shortSword: 'shortSword', rapier: 'shortSword',
    longSword: 'longSword', scimitar: 'longSword', falchion: 'longSword', broadSword: 'longSword', claymore: 'longSword', greatSword: 'longSword', flamberge: 'longSword',
    lightAxe: 'axe', tomahawk: 'axe', doubleAxe: 'axe', warAxe: 'axe', battleAxe: 'axe',
    hammer: 'hammer', battleHammer: 'hammer',
};

/**
 * The blacksmith's sections, in this order; each with its items cheapest STR first (then price). A weapon missing
 * from WEAPON_FAMILY goes to "Other Weapons" (only shown when it has something).
 */
// Off-11A: the wands in their own section, after the weapons; the rare ones (negative Item.cfg price) are not sold.
const SMITH_SECTIONS: readonly { title: string; slots: readonly OffSlotId[]; wands?: true; family?: OffWeaponFamily | 'other' }[] = [
    { title: 'Short Swords', slots: ['weapon'], family: 'shortSword' },
    { title: 'Long Swords', slots: ['weapon'], family: 'longSword' },
    { title: 'Axes', slots: ['weapon'], family: 'axe' },
    { title: 'Hammers', slots: ['weapon'], family: 'hammer' },
    { title: 'Other Weapons', slots: ['weapon'], family: 'other' },
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
    const inFamily = (id: OffItemId, family: OffWeaponFamily | 'other' | undefined): boolean =>
        family === undefined || (WEAPON_FAMILY[id] ?? 'other') === family;
    return SMITH_SECTIONS.map(({ title, slots, wands, family }) => ({
        title,
        items: ids
            .filter((id) => slots.includes(OFF_ITEMS[id].slot) && !isRare(id) && isWand(id) === (wands === true) && (wands === true || inFamily(id, family)))
            .sort((a, b) => slots.indexOf(OFF_ITEMS[a].slot) - slots.indexOf(OFF_ITEMS[b].slot)
                || OFF_ITEMS[a].strToEquip - OFF_ITEMS[b].strToEquip
                || OFF_ITEMS[a].price - OFF_ITEMS[b].price),
    })).filter((section) => section.items.length > 0);
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

const gold = (n: number): string => n.toLocaleString('en-US');

/** The store windows' words (Off-13D). The warehouse uses warehouseTitle, stored, taken, bagFull, potionLimit, warehouseFull. */
export const OFF_STORE_TEXT = {
    title: { shop: 'Shop', smith: 'Blacksmith' } satisfies Record<OffStoreKind, string>,
    subtitle: {
        shop: 'Potions and spells · buys from your bag at half price',
        smith: 'Weapons, shields and armor · buys from your bag at half price',
    } satisfies Record<OffStoreKind, string>,
    warehouseTitle: 'Warehouse',
    tabs: { buy: 'Buy', sell: 'Sell', magic: 'Magic' },
    goldLabel: 'Gold',
    /** Column labels over the list (shown in capitals). */
    columns: { item: 'Item', spell: 'Spell', needs: 'Needs', price: 'Price', youGet: 'You get' },
    more: (n: number) => `${n} more`,
    /** The card's button on each tab; a stack sells one by one. */
    actButton: { buy: 'Buy', sell: 'Sell', magic: 'Learn' },
    sellOne: 'Sell one',
    learned: 'Learned',
    /** The card's price row. */
    priceLabel: { buy: 'Price', sell: 'You get', magic: 'Price' },
    priceLabelOne: 'You get (one)',
    potionsCarried: 'Potions carried',
    inYourBag: 'In your bag',
    sellAll: (n: number) => `All ${n} sell for`,
    /** Why the button is off (red under it). */
    noGold: (have: number) => `Not enough gold · you have ${gold(have)}`,
    bagFull: 'Your bag is full.',
    potionLimit: "You can't carry more potions.",
    intShort: (need: number, have: number) => `Needs Int ${need} · you have ${have}`,
    known: 'You already know this spell.',
    /** Grey under the button: you may buy it, but not wear it yet. */
    cantWearYet: (needs: string) => `You couldn't wear it yet (${needs})`,
    bought: (name: string, price: number) => `You bought a ${name} for ${gold(price)} gold.`,
    sold: (name: string, price: number) => `You sold a ${name} for ${gold(price)} gold.`,
    learnt: (name: string, price: number) => `You learned ${name} for ${gold(price)} gold.`,
    nothingToSell: 'Your bag is empty.',
    nothingToSellCard: 'Nothing to sell.',
    nothingToSellNote: "What you wear can't be sold: take it off first.",
    pickHint: 'Pick something to see it here.',
    /** Selling a weapon or armour asks first (owner, 10-nov-2026); potions and loot sell one by one. */
    sellTitle: 'Sell',
    sellQuestion: (name: string, price: number) => `Sell the ${name} for ${gold(price)} gold?`,
    sellCalm: 'Shops buy at half price.',
    sellSpecial: "Its attributes can't be bought back.",
    /** Help line, by device: the verb of the tab, left out when the marked row can't be bought / sold / learned. */
    helpMouse: (verb: string | undefined) => (verb
        ? `Click: mark · Double-click or Enter: ${verb} · Wheel: scroll · Tab: change tab · Esc: close`
        : 'Click: mark · Wheel: scroll · Tab: change tab · Esc: close'),
    helpPad: (verb: string | undefined): readonly (readonly [string, string])[] => (verb
        ? [['A', verb], ['LB / RB', 'Change tab'], ['B', 'Close']]
        : [['LB / RB', 'Change tab'], ['B', 'Close']]),
    stored: (name: string) => `You stored the ${name}.`,
    taken: (name: string) => `You took the ${name}.`,
    warehouseFull: 'The warehouse is full.',
} as const;

/** Off-13C: the warehouse window's words (stored / taken / full come from OFF_STORE_TEXT). */
export const OFF_WAREHOUSE_TEXT = {
    subtitle: 'Shared by both cities · your gold stays with you',
    bagLabel: (cells: number, size: number) => `Bag ${cells} / ${size}`,
    warehouseLabel: (cells: number, size: number) => `Warehouse ${cells} / ${size}`,
    storeButton: 'Store →',
    takeButton: '← Take',
    pickHint: 'Pick an item to see it here.',
    bagEmpty: 'Your bag is empty.',
    warehouseEmpty: 'The warehouse is empty.',
    /** Under the columns while there is no result to show, by device. */
    helpMouse: 'Double-click or Enter: move one · Tab: change side · Esc: close',
    helpPad: [['A', 'Move one'], ['LB / RB', 'Change side'], ['B', 'Close']],
} as const;
