// Qué objeto cae (Fase 21A, data/loot.ts): un hueco que la clase puede usar (con su peso) y, en él, una tirada sobre la
// "escalera" de objetos de ese hueco, de menos a más requisito (la misma lista que la pantalla Equipment).
// El escalón del personaje es el mejor objeto que sus stats PERMANENTES y su Level ya le dejan poner.
// Fase 21B: los objetos raros (Berserk y Kloness Wand) casi siempre se cambian por el mejor no raro de debajo, y las
// armas y varitas tiran su atributo (data/attributes.ts).
// Fase 21D: la escalera solo lleva lo que puede caer (isLootDrop: ni el Zem ni los hechizos que se saben con la Int).
// Fase 24A: todo lo que cae lleva atributo (de arma o de armadura); lo normal se compra al herrero.
// Revisión del original C (1-nov-2026): el atributo trae un valor del 1 al 13 con la tabla del original (tope 7 en
// los monstruos normales) y el 40 % trae además un segundo atributo (data/attributes.ts).
import { DEBUG_START } from '../config/debugStart';
import {
    ATTRIBUTE_VALUE_CAP_NORMAL, ATTRIBUTE_VALUE_MAX, ATTRIBUTE_VALUE_WEIGHTS, ATTRIBUTES, ITEM_ATTRIBUTES, SECONDARY_ATTRIBUTE_CHANCE,
    SECONDARY_ATTRIBUTE_IDS, SECONDARY_ATTRIBUTES, type ItemAttribute, type ItemRolls, type SecondaryAttribute,
} from '../data/attributes';
import {
    catalog, canChangeSlot, canEquip, canHaveAttribute, canHaveSecondary, EQUIP_SLOT_IDS, isLootDrop, rollsOf, type EquipSlotId, type ItemId,
} from '../data/items';
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
 * A value 1..13 with the original's table (Revisión del original C), at most `cap` (a higher roll becomes the cap, as in
 * the original) and at least `min`.
 */
export function rollAttributeValue(cap: number, min = 1): number {
    let roll = Math.random() * ATTRIBUTE_VALUE_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
    let value = ATTRIBUTE_VALUE_MAX;
    for (let i = 0; i < ATTRIBUTE_VALUE_WEIGHTS.length; i++) {
        roll -= ATTRIBUTE_VALUE_WEIGHTS[i] ?? 0;
        if (roll < 0) {
            value = i + 1;
            break;
        }
    }
    return Math.max(min, Math.min(cap, value));
}

/**
 * All the attributes of a dropped item: the first with its value, and a second one 40% of the time. `strong` (elites,
 * bosses, the Champion) can reach 13; ordinary monsters stop at 7.
 */
export function rollItemRolls(id: ItemId, strong: boolean): ItemRolls {
    const cap = strong ? ATTRIBUTE_VALUE_MAX : ATTRIBUTE_VALUE_CAP_NORMAL;
    const attribute = rollAttribute(id);
    const def = attribute ? ATTRIBUTES[attribute] : undefined;
    const attributeValue = def?.perValue === undefined ? undefined : DEBUG_START.attributeValue ?? rollAttributeValue(cap, def.minValue);
    let secondary: SecondaryAttribute | undefined;
    if (DEBUG_START.secondary) secondary = canHaveSecondary(id, DEBUG_START.secondary, attribute) ? DEBUG_START.secondary : undefined;
    else if (Math.random() < SECONDARY_ATTRIBUTE_CHANCE) {
        secondary = pickWeighted(SECONDARY_ATTRIBUTE_IDS.filter((s) => canHaveSecondary(id, s, attribute))
            .map((s): [SecondaryAttribute, number] => [s, SECONDARY_ATTRIBUTES[s].weight]));
    }
    const secondaryValue = secondary
        ? (DEBUG_START.secondary ? DEBUG_START.secondaryValue : undefined) ?? rollAttributeValue(cap, SECONDARY_ATTRIBUTES[secondary].minValue)
        : undefined;
    return rollsOf({ attribute, attributeValue, secondary, secondaryValue });
}

/** ?attr= / ?attr2= (debug): those attributes on a starting weapon or wand, if it can have them; none without them. */
export function debugRolls(id: ItemId): ItemRolls {
    const { attribute, attributeValue, secondary, secondaryValue } = DEBUG_START;
    const first = attribute && canHaveAttribute(id, attribute) ? attribute : undefined;
    const second = secondary && canHaveSecondary(id, secondary, first) ? secondary : undefined;
    return rollsOf({
        attribute: first,
        attributeValue: first && ATTRIBUTES[first].perValue !== undefined ? Math.max(attributeValue ?? 1, ATTRIBUTES[first].minValue ?? 1) : undefined,
        secondary: second,
        secondaryValue: second ? Math.max(secondaryValue ?? 1, SECONDARY_ATTRIBUTES[second].minValue ?? 1) : undefined,
    });
}

/**
 * An item for that character, or undefined if its class has nothing to drop. `tierWeights` changes the kinds of roll
 * (the Champion's guaranteed item, Fase 21½C: only its next step or a big jump).
 */
export function rollLoot(
    classId: CharacterId, stats: Readonly<Stats>, level: number,
    tierWeights: Readonly<Partial<Record<LootTier, number>>> = LOOT_TIER_WEIGHTS, strong = false,
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
    return { id, ...rollItemRolls(id, strong) };
}
