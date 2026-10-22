// Herrero Tom (Fase 24C; decidido por el propietario el 21 y 22-oct-2026, docs/DECISIONES.md, "Fase 24"):
// - Buy: vende las armas (o varitas) y armaduras BÁSICAS de la clase, sin atributo; lo especial solo cae como botín.
//   Se ven todas, pero solo se compra lo que el personaje ya puede ponerse (requisitos en rojo y Purchase apagado).
//   No vende el equipo de salida (la daga, la varita MS0: no se acaban) ni las varitas raras (Kloness y Berserk, solo
//   botín). Lo comprado va al inventario del personaje de la ciudad.
// - Sell: compra lo que el personaje lleva en el INVENTARIO (no lo puesto ni el baúl) a ¼ del precio; con atributo,
//   más (decidido por Claude, ajustable). También compra las Stone of Xelima.
// - Upgrade (+1/+2/+3, +10% de daño cada uno, 1 Stone of Xelima + oro; siempre sale bien): Fase 24D.
// Precios "challenging" (~1.000 de oro por hora, data/gold.ts): según lo que pide el objeto, de 200 a 6.000.
// Ventana: scenes/SmithScene.ts (medidas en config/smith.ts).
import type { ItemAttribute } from './attributes';
import { XELIMA_STONE_ID } from './consumables';
import type { CharacterId } from './characters';
import { catalog, GEAR_SLOT_IDS, isFreeItem, itemInfo, type EquipSlotId, type ItemId } from './items';
import type { OwnedItem } from './loot';
import { getWand, isWandId } from './wands';

/** Price to buy = base + each requirement point × its weight, rounded and kept between min and max. */
export const SMITH_PRICE = {
    base: 200,
    perStr: 40,
    perMag: 20,
    perInt: 20,
    perLevel: 40,
    roundTo: 50,
    min: 200,
    max: 6000,
} as const;

/** Selling gives this part of the buying price (owner: ¼). */
export const SMITH_SELL_SHARE = 0.25;

/** Selling price × this for an item with that attribute (decided by Claude, 22-oct-2026; to check with the metrics). */
export const SMITH_ATTRIBUTE_SELL_FACTOR: Readonly<Record<ItemAttribute, number>> = {
    sharp: 1.5,
    poison: 1.5,
    ancient: 3,
    hpRecovery: 1.5,
    mpRecovery: 1.5,
    defenseRatio: 1.5,
    magicResistance: 1.5,
};

/** Items that are never bought, with a fixed selling price (the Xelima stone; the Zem is the Shop Keeper's). */
export const SMITH_FIXED_SELL_PRICES: Readonly<Partial<Record<ItemId, number>>> = {
    [XELIMA_STONE_ID]: 250,
};

/** The two tabs of the window. Upgrade comes in Fase 24D. */
export type SmithTab = 'buy' | 'sell';

export const SMITH_TEXT = {
    banner: { buy: 'Item for Sale', sell: 'Exchange Item' },
    notEnoughGold: 'Not enough gold.',
    noCharacter: 'Choose a character first: Tom trades with the one in town.',
    cantWear: 'You can\'t use it yet.',
    nothingToSell: 'Nothing to sell: your inventory is empty.\nItems worn or in the warehouse are not sold.',
    bought: (name: string) => `You bought ${name}. It is in your inventory.`,
    sold: (name: string, price: string) => `You sold ${name} for ${price} gold.`,
    confirmSell: (name: string, price: string) => `Sell ${name} for ${price} gold?\nPress Sell again.`,
    gold: (amount: string) => `Your gold: ${amount}`,
} as const;

/** Buying price of a basic item: from what it asks for. */
export function smithBuyPrice(id: ItemId): number {
    const req = itemInfo(id)?.equip ?? {};
    const p = SMITH_PRICE;
    const raw = p.base + (req.str ?? 0) * p.perStr + (req.mag ?? 0) * p.perMag + (req.int ?? 0) * p.perInt + (req.level ?? 0) * p.perLevel;
    return Math.min(p.max, Math.max(p.min, Math.round(raw / p.roundTo) * p.roundTo));
}

/** What Tom pays for an item of the inventory. */
export function smithSellPrice(item: Readonly<OwnedItem>): number {
    const fixed = SMITH_FIXED_SELL_PRICES[item.id];
    if (fixed !== undefined) return fixed;
    const factor = item.attribute ? SMITH_ATTRIBUTE_SELL_FACTOR[item.attribute] : 1;
    return Math.round((smithBuyPrice(item.id) * SMITH_SELL_SHARE * factor) / 10) * 10;
}

/** Whether Tom buys it at all: gear, spells' manuals and the Xelima stone; never the Zem (it isn't his trade). */
export function smithBuysFromYou(id: ItemId): boolean {
    return SMITH_FIXED_SELL_PRICES[id] !== undefined || (itemInfo(id)?.slot !== undefined && itemInfo(id)?.slot !== 'zem');
}

/** Rare items (Kloness and Berserk wands) only come as loot. */
function isRareItem(id: ItemId): boolean {
    return isWandId(id) && getWand(id).rare === true;
}

export interface SmithSection {
    slot: EquipSlotId;
    items: ItemId[];
}

/** What Tom sells to that class, by slot, from the easiest requirement to the hardest. */
export function smithStock(classId: CharacterId): SmithSection[] {
    return GEAR_SLOT_IDS
        .map((slot) => ({ slot, items: catalog(classId, slot).filter((id) => !isFreeItem(classId, id) && !isRareItem(id)) }))
        .filter((section) => section.items.length > 0);
}

