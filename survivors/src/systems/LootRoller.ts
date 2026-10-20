// Qué objeto cae (Fase 21A, data/loot.ts): un hueco que la clase puede usar (con su peso) y, en él, una tirada sobre la
// "escalera" de objetos de ese hueco, de menos a más requisito (la misma lista que la pantalla Equipment).
// El escalón del personaje es el mejor objeto que sus stats PERMANENTES y su Level ya le dejan poner.
import { catalog, canChangeSlot, canEquip, EQUIP_SLOT_IDS, type EquipSlotId, type ItemId } from '../data/items';
import type { CharacterId } from '../data/characters';
import { LOOT_JUMP_STEPS, LOOT_SLOT_WEIGHTS, LOOT_TIER_WEIGHTS, type LootTier, type OwnedItem } from '../data/loot';
import type { Stats } from '../data/stats';

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

/** An item for that character, or undefined if its class has nothing to drop. */
export function rollLoot(classId: CharacterId, stats: Readonly<Stats>, level: number): OwnedItem | undefined {
    const slots = EQUIP_SLOT_IDS.filter((slot) => canChangeSlot(classId, slot) && catalog(classId, slot).length > 0)
        .map((slot): [EquipSlotId, number] => [slot, LOOT_SLOT_WEIGHTS[slot]]);
    const slot = pickWeighted(slots);
    if (!slot) return undefined;
    const ladder: ItemId[] = catalog(classId, slot);
    // Its own step: the best item it can already wear (the first one if it can wear none).
    let own = 0;
    ladder.forEach((id, index) => {
        if (canEquip(id, stats, level)) own = index;
    });
    const tier = pickWeighted(Object.entries(LOOT_TIER_WEIGHTS) as Array<[LootTier, number]>) ?? 'same';
    const id = ladder[tierIndex(tier, own, ladder.length)];
    return id ? { id } : undefined;
}
