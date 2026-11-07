// Helbreath Off (Fase Off-4A): qué suelta un monstruo al morir, con las tiradas del original (off/data/offLoot.ts).
// Desarrollo: ?offdrop=all hace que todos suelten algo; ?offdrop=valuable, siempre un arma o un escudo.
import type { OffBagItemId } from '../data/offItems';
import { OFF_LOOT, OFF_MONSTER_LOOT, OFF_STANDARD_DROP_TOTAL, OFF_STANDARD_DROPS, OFF_VALUABLE_DROPS } from '../data/offLoot';
import type { OffMonsterId } from '../data/offMonsters';

export type OffDropMode = 'normal' | 'all' | 'valuable';

export interface OffKillLoot {
    /** Gold dropped (0 = none). */
    gold: number;
    items: OffBagItemId[];
}

/** `random` returns 0..1 (Math.random, or a fixed sequence in tests). */
export function rollKillLoot(monster: OffMonsterId, mode: OffDropMode, random: () => number = Math.random): OffKillLoot {
    const loot: OffKillLoot = { gold: 0, items: [] };
    const table = OFF_MONSTER_LOOT[monster];
    const chance = Math.min(1, OFF_LOOT.dropChance * OFF_LOOT.dropMultiplier);
    if (mode === 'valuable') {
        // Always something: the wand rolls (nothing at level 1) roll again.
        let item: OffBagItemId | undefined;
        for (let i = 0; i < 20 && !item; i++) item = rollValuable(random);
        if (item) loot.items.push(item);
    } else if (mode === 'all' || random() < chance) {
        if (random() < OFF_LOOT.goldShare) {
            const [min, max] = table.gold;
            loot.gold = min + Math.floor(random() * (max - min + 1));
        } else if (random() < Math.min(1, OFF_LOOT.valuableShare * OFF_LOOT.valuableMultiplier)) {
            const item = rollValuable(random);
            if (item) loot.items.push(item);
        } else {
            const item = rollStandard(random);
            if (item) loot.items.push(item);
        }
    }
    if (table.extra && random() < table.extra.chance) loot.items.push(table.extra.id);
    return loot;
}

/** A potion from the 1d12000 table (or nothing: the candies, stones... left out). */
function rollStandard(random: () => number): OffBagItemId | undefined {
    let roll = random() * OFF_STANDARD_DROP_TOTAL;
    for (const entry of OFF_STANDARD_DROPS) {
        if (roll < entry.weight) return entry.id;
        roll -= entry.weight;
    }
    return undefined;
}

/** A weapon or a shield of monster level 1 (a wand would be nothing). */
function rollValuable(random: () => number): OffBagItemId | undefined {
    if (random() < OFF_LOOT.weaponShare) {
        if (random() >= OFF_LOOT.meleeShare) return undefined;
        return pick(OFF_VALUABLE_DROPS.weapons, random);
    }
    return pick(OFF_VALUABLE_DROPS.shields, random);
}

function pick<T>(list: readonly T[], random: () => number): T | undefined {
    return list[Math.floor(random() * list.length)];
}
