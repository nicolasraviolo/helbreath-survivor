// Qué objeto cae (Fase 21A, data/loot.ts): un hueco que la clase puede usar (con su peso) y, en él, una tirada sobre la
// "escalera" de objetos de ese hueco, de menos a más requisito (la misma lista que la pantalla Equipment).
// El escalón del personaje es el mejor objeto que sus stats PERMANENTES y su Level ya le dejan poner.
// Fase 21B: los objetos raros (Berserk y Kloness Wand) casi siempre se cambian por el mejor no raro de debajo, y las
// armas y varitas tiran su atributo (data/attributes.ts).
// Fase 21D: la escalera solo lleva lo que puede caer (isLootDrop: ni el Zem ni los hechizos que se saben con la Int).
// Fase 24A: todo lo que cae lleva atributo (de arma o de armadura); lo normal se compra al herrero.
import { DEBUG_START } from '../config/debugStart';
import { ATTRIBUTES, ITEM_ATTRIBUTES, type ItemAttribute } from '../data/attributes';
import { catalog, canChangeSlot, canEquip, canHaveAttribute, EQUIP_SLOT_IDS, isLootDrop, type EquipSlotId, type ItemId } from '../data/items';
import type { CharacterId } from '../data/characters';
import {
    LOOT_JUMP_STEPS, LOOT_RARE_KEEP_CHANCE, LOOT_SLOT_WEIGHTS, LOOT_SLOT_WEIGHTS_BY_CLASS, LOOT_TIER_WEIGHTS, type LootTier, type OwnedItem,
} from '../data/loot';
import type { Stats } from '../data/stats';
import { getWand, isWandId } from '../data/wands';

/** A random key of `weights`, each with its chance. */
function pickWeighted<K extends string>(weights: ReadonlyArray<readonly [K, number]>): K | undefined {
    const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;
    for (const [key, weight] of weights) {
        roll -= weight;
        if (roll < 0) return key;
    }
    return weights[weights.length - 1]?.[0];
}

function randomInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
}

/** Index of the item that kind of roll gives, on a ladder of `count` items where the character stands on `own`. */
export function tierIndex(tier: LootTier, own: number, count: number): number {
    const last = count - 1;
    switch (tier) {
        case 'same':
            return own;
        case 'next':
            return Math.min(last, own + 1);
        case 'worse':
            return own > 0 ? randomInt(0, own - 1) : 0;
        case 'jump':
            return Math.min(last, own + randomInt(LOOT_JUMP_STEPS.min, LOOT_JUMP_STEPS.max));
    }
}

function isRare(id: ItemId): boolean {
    return isWandId(id) && getWand(id).rare === true;
}

/** A rare item stays only with LOOT_RARE_KEEP_CHANCE; otherwise the best item below it that is not rare. */
function rareCheck(ladder: readonly ItemId[], index: number): number {
    const id = ladder[index];
    if (id === undefined || !isRare(id) || Math.random() < LOOT_RARE_KEEP_CHANCE) return index;
    for (let below = index - 1; below >= 0; below--) {
        const other = ladder[below];
        if (other !== undefined && !isRare(other)) return below;
    }
    return index;
}

/**
 * The attribute of a dropped item (Fase 24A: every weapon and armor piece drops with one; the plain ones are sold by
 * the blacksmith). Weighted among those the item can have; undefined only for items that can have none.
 */
export function rollAttribute(id: ItemId): ItemAttribute | undefined {
    if (DEBUG_START.attribute) return canHaveAttribute(id, DEBUG_START.attribute) ? DEBUG_START.attribute : undefined;
    return pickWeighted(ITEM_ATTRIBUTES.filter((attribute) => canHaveAttribute(id, attribute))
        .map((attribute): [ItemAttribute, number] => [attribute, ATTRIBUTES[attribute].weight]));
}

/**
 * An item for that character, or undefined if its class has nothing to drop. `tierWeights` changes the kinds of roll
 * (the Champion's guaranteed item, Fase 21½C: only its next step or a big jump).
 */
export function rollLoot(
    classId: CharacterId, stats: Readonly<Stats>, level: number,
    tierWeights: Readonly<Partial<Record<LootTier, number>>> = LOOT_TIER_WEIGHTS,
): OwnedItem | undefined {
    const weights = { ...LOOT_SLOT_WEIGHTS, ...LOOT_SLOT_WEIGHTS_BY_CLASS[classId] };
    // ?attr= (debug): only items that can have it drop (weapons for Sharp, armor for HP Recovery...), to see it every time.
    const ladderOf = (slot: EquipSlotId): ItemId[] => catalog(classId, slot).filter(isLootDrop);
    const debugAttribute = DEBUG_START.attribute;
    const slots = EQUIP_SLOT_IDS.filter((slot) => canChangeSlot(classId, slot) && weights[slot] > 0 && ladderOf(slot).length > 0)
        .filter((slot) => !debugAttribute || ladderOf(slot).some((id) => canHaveAttribute(id, debugAttribute)))
        .map((slot): [EquipSlotId, number] => [slot, weights[slot]]);
    const slot = pickWeighted(slots);
    if (!slot) return undefined;
    const ladder = ladderOf(slot);
    // Its own step: the best item it can already wear (the first one if it can wear none).
    let own = 0;
    ladder.forEach((id, index) => {
        if (canEquip(id, stats, level)) own = index;
    });
    const tier = pickWeighted(Object.entries(tierWeights) as Array<[LootTier, number]>) ?? 'same';
    const id = ladder[rareCheck(ladder, tierIndex(tier, own, ladder.length))];
    if (!id) return undefined;
    const attribute = rollAttribute(id);
    return attribute ? { id, attribute } : { id };
}
