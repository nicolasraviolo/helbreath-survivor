// Helbreath Off (Fase Off-4A): qué suelta un monstruo al morir, con las tiradas del original (off/data/offLoot.ts).
// Off-7B: el arma o armadura valiosa según el nivel de botín del monstruo, siempre con atributos (offAttributes.ts).
// Desarrollo: ?offdrop=all hace que todos suelten algo; ?offdrop=valuable, siempre un arma o un escudo.
import { OFF_ITEMS, offGearKey, offGearKind, type OffBagItemKey, type OffItemDef, type OffItemId } from '../data/offItems';
import { rollOffAttributes } from '../data/offAttributes';
import { OFF_LOOT, OFF_MONSTER_LOOT, OFF_STANDARD_DROP_TOTAL, OFF_STANDARD_DROPS, OFF_VALUABLE_DROPS, type OffLootLevel } from '../data/offLoot';
import type { OffMonsterId } from '../data/offMonsters';

export type OffDropMode = 'normal' | 'all' | 'valuable';

export interface OffKillLoot {
    /** Gold dropped (0 = none). */
    gold: number;
    items: OffBagItemKey[];
}

/** `random` returns 0..1 (Math.random, or a fixed sequence in tests). */
export function rollKillLoot(monster: OffMonsterId, mode: OffDropMode, random: () => number = Math.random): OffKillLoot {
    const loot: OffKillLoot = { gold: 0, items: [] };
    const table = OFF_MONSTER_LOOT[monster];
    const chance = Math.min(1, OFF_LOOT.dropChance * OFF_LOOT.dropMultiplier);
    if (mode === 'valuable') {
        // Always something: a wand roll of level 1 (it has no wand) rolls again.
        let item: OffBagItemKey | undefined;
        for (let i = 0; i < 20 && !item; i++) item = rollValuable(table.level, random);
        if (item) loot.items.push(item);
    } else if (mode === 'all' || random() < chance) {
        if (random() < OFF_LOOT.goldShare) {
            const [min, max] = table.gold;
            loot.gold = Math.max(1, Math.round((min + Math.floor(random() * (max - min + 1))) * OFF_LOOT.goldMultiplier));
        } else if (random() < Math.min(1, OFF_LOOT.valuableShare * OFF_LOOT.valuableMultiplier)) {
            const item = rollValuable(table.level, random);
            if (item) loot.items.push(item);
        } else {
            const item = rollStandard(random);
            if (item) loot.items.push(item);
        }
    }
    if (table.extra && random() < table.extra.chance) loot.items.push(table.extra.id);
    if (OFF_LOOT.rareWandLevels.includes(table.level) && random() < 1 / OFF_LOOT.rareWandOneIn) {
        const id = pick(OFF_RARE_WANDS, random);
        if (id) loot.items.push(offGearKey(id, rollOffAttributes(offGearKind(id), table.level, random)));
    }
    return loot;
}

/** A potion from the 1d12000 table (or nothing: the candies, stones... left out). */
function rollStandard(random: () => number): OffBagItemKey | undefined {
    let roll = random() * OFF_STANDARD_DROP_TOTAL;
    for (const entry of OFF_STANDARD_DROPS) {
        if (roll < entry.weight) return entry.id;
        roll -= entry.weight;
    }
    return undefined;
}

/** A weapon (or the level's wand, Off-11A) or an armour piece of that loot level, with its attributes. */
function rollValuable(level: OffLootLevel, random: () => number): OffBagItemKey | undefined {
    const drops = OFF_VALUABLE_DROPS[level];
    let id: OffItemId | undefined;
    if (random() < OFF_LOOT.weaponShare) {
        id = pick(random() < OFF_LOOT.meleeShare ? drops.weapons : drops.wands, random);
    } else {
        id = pick(drops.armor, random);
    }
    return id ? offGearKey(id, rollOffAttributes(offGearKind(id), level, random)) : undefined;
}

/** Off-11A: the wands the smith doesn't sell. */
const OFF_RARE_WANDS: readonly OffItemId[] = (Object.keys(OFF_ITEMS) as OffItemId[]).filter((id) => {
    const item: OffItemDef = OFF_ITEMS[id];
    return item.kind === 'weapon' && item.wand !== undefined && item.rare === true;
});

function pick<T>(list: readonly T[], random: () => number): T | undefined {
    return list[Math.floor(random() * list.length)];
}
