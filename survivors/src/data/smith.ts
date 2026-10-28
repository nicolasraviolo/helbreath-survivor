// Herrero Tom (Fase 24C; decidido por el propietario el 21 y 22-oct-2026, docs/DECISIONES.md, "Fase 24"):
// - Buy: vende las armas (o varitas) y armaduras BÁSICAS de la clase, sin atributo; lo especial solo cae como botín.
//   Se ven todas, pero solo se compra lo que el personaje ya puede ponerse (requisitos en rojo y Purchase apagado).
//   No vende el equipo de salida (la daga, la varita MS0: no se acaban) ni las varitas raras (Kloness y Berserk, solo
//   botín). Lo comprado va al inventario del personaje de la ciudad.
// - Sell: compra lo que el personaje lleva en el INVENTARIO (no lo puesto ni el baúl) a ¼ del precio; con atributo,
//   más (decidido por Claude, ajustable). También compra las Stone of Xelima.
// - Upgrade (Fase 24D): el arma o varita puesta y las del inventario suben a +1/+2/+3 (+10% de daño cada uno,
//   data/upgrades.ts). Cada "+" cuesta 1 Stone of Xelima del inventario y oro: 1×, 2,5× y 6× el precio del arma
//   (decidido por Claude, ajustable). Siempre sale bien. Al vender, Tom devuelve también ¼ del oro de las mejoras.
// Precios "challenging" (~1.000 de oro por hora, data/gold.ts): según lo que pide el objeto, de 200 a 6.000.
// Ventana: scenes/SmithScene.ts (medidas en config/smith.ts).
import type { ItemAttribute } from './attributes';
import { XELIMA_STONE_ID } from './consumables';
import type { CharacterId } from './characters';
import { isUniqueItem } from './uniques';
import { catalog, GEAR_SLOT_IDS, isFreeItem, itemInfo, type EquipSlotId, type ItemId } from './items';
import type { OwnedItem } from './loot';
import { upgradeOf } from './upgrades';
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

/**
 * Gold of each "+", × the item's buying price: [to +1, to +2, to +3] (decided by Claude on 22-oct-2026, approved
 * with the plan; to check with the metrics). A 1.000-gold sword: 500, 1.500 and 3.000 (5.000 and 3 stones in all).
 */
// Revisión de la dificultad (E, propietario 22-oct-2026): antes 1×, 2,5× y 6× (una Broad Sword a +3 costaba 12.500).
export const SMITH_UPGRADE_PRICE_FACTORS: readonly number[] = [0.5, 1.5, 3];

/** Items that are never bought, with a fixed selling price (the Xelima stone; the Zem is the Shop Keeper's). */
export const SMITH_FIXED_SELL_PRICES: Readonly<Partial<Record<ItemId, number>>> = {
    [XELIMA_STONE_ID]: 250,
};

/** The three tabs of the window (Upgrade, Fase 24D). */
export const SMITH_TABS = ['buy', 'sell', 'upgrade'] as const;
export type SmithTab = (typeof SMITH_TABS)[number];

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
    // Fase 24D, Upgrade.
    worn: 'Equipped',
    inventory: 'Inventory',
    maxed: 'It is at +3: it can\'t go higher.',
    max: 'Max',
    noStone: 'You need a Stone of Xelima in your inventory.',
    nothingToUpgrade: 'Nothing to upgrade: only weapons and wands, worn or in your inventory.',
    upgradeInfo: (from: number, to: number, bonus: string) => `+${from} → +${to}: ${bonus} damage in all. Always succeeds.`,
    upgradeCost: (have: number) => `Costs a Stone of Xelima (you have ${have}) and the gold shown.`,
    confirmUpgrade: (name: string, to: number, price: string) => `Upgrade ${name} to +${to} for ${price} gold and a Stone of Xelima?\nPress Upgrade again.`,
    upgraded: (name: string) => `Done! Your weapon is now ${name}.`,
} as const;

/** Buying price of a basic item: from what it asks for. */
export function smithBuyPrice(id: ItemId): number {
    const req = itemInfo(id)?.equip ?? {};
    const p = SMITH_PRICE;
    const raw = p.base + (req.str ?? 0) * p.perStr + (req.mag ?? 0) * p.perMag + (req.int ?? 0) * p.perInt + (req.level ?? 0) * p.perLevel;
    return Math.min(p.max, Math.max(p.min, Math.round(raw / p.roundTo) * p.roundTo));
}

/** What Tom pays for an item of the inventory: with an attribute, more; with a "+", also ¼ of the upgrades' gold. */
export function smithSellPrice(item: Readonly<OwnedItem>): number {
    const fixed = SMITH_FIXED_SELL_PRICES[item.id];
    if (fixed !== undefined) return fixed;
    const factor = item.attribute ? SMITH_ATTRIBUTE_SELL_FACTOR[item.attribute] : 1;
    const value = smithBuyPrice(item.id) * factor + smithUpgradeGoldSpent(item.id, upgradeOf(item));
    return Math.round((value * SMITH_SELL_SHARE) / 10) * 10;
}

/** Gold to take that item from +(toLevel − 1) to +toLevel (Fase 24D), rounded like the buying prices. */
export function smithUpgradePrice(id: ItemId, toLevel: number): number {
    const factor = SMITH_UPGRADE_PRICE_FACTORS[toLevel - 1] ?? 0;
    return Math.round((smithBuyPrice(id) * factor) / SMITH_PRICE.roundTo) * SMITH_PRICE.roundTo;
}

/** All the gold spent to take that item to +upgrade. */
export function smithUpgradeGoldSpent(id: ItemId, upgrade: number): number {
    let total = 0;
    for (let level = 1; level <= upgrade; level++) total += smithUpgradePrice(id, level);
    return total;
}

/** Whether Tom buys it at all: gear, spells' manuals and the Xelima stone; never the Zem (it isn't his trade). */
export function smithBuysFromYou(id: ItemId): boolean {
    return SMITH_FIXED_SELL_PRICES[id] !== undefined || (itemInfo(id)?.slot !== undefined && itemInfo(id)?.slot !== 'zem');
}

/** Rare items (Kloness and Berserk wands) only come as loot; the uniques (Fase 30B) only from their map's final boss. */
function isRareItem(id: ItemId): boolean {
    return (isWandId(id) && getWand(id).rare === true) || isUniqueItem(id);
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

