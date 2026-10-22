// Botín en partida (Fase 21A; plan aprobado por el propietario el 20-oct-2026, docs/PLAN-2.md "Fase 21").
// - Caen objetos de los monstruos (poco; algo más de los élite) y siempre de los jefes (Ettin y Demon, 1 y a veces 2;
//   el jefe final, 2). Se ven con su dibujo del inventario y un brillo dorado que late, para no confundirlos con las gemas.
// - Qué cae se calcula con las stats PERMANENTES y el Level del personaje (systems/LootRoller.ts): se elige un hueco que
//   su clase puede usar y, en ese hueco, su "escalón" = el mejor objeto que ya podría ponerse. Reparto decidido por el
//   propietario (20-oct-2026): 50% de su escalón, 25% del siguiente, 15% peor, 10% un salto grande.
// - Al cogerlo, carta de comparación (scenes/LootScene.ts): "Equip" o "Keep in bag".
// - La bolsa va al inventario del personaje al terminar la partida (propietario, 20-oct-2026). Fase 21D: al morir sin
//   Zem se pierde lo encontrado; el baúl compartido se llena a mano desde Select Character (data/warehouse.ts).
// - Fase 21D: los hechizos solo caen si piden Manual (ninguno de los de hoy); el Zem cae aparte, de los jefes.
// - Atributos (21B, decididos el 20-oct-2026): Sharp 10%, Poison 5%, Ancient 1%, solo en armas y varitas
//   (data/attributes.ts). Fase 24A: todo lo que cae lleva atributo (armas o armaduras) y cae mucho menos (3–4 por
//   partida); lo normal se compra al herrero. Las varitas de la Maga caen menos que sus hechizos, y Berserk y Kloness muchísimo menos.
import type { SoundKey } from '../config/assetManifest';
import type { ItemAttribute } from './attributes';
import type { CharacterId } from './characters';
import type { ItemIconFrame } from './itemTypes';
import type { EquipSlotId, ItemId } from './items';

/** One item the character owns or found, with its attribute if it has one (Fase 21B). */
export interface OwnedItem {
    id: ItemId;
    attribute?: ItemAttribute;
}

/**
 * Chance that a monster drops an item when it dies (0..1). Fase 24A (owner: 3–4 items a run, now that only special
 * ones drop): before, 0.3% and 4% (~8 items a run). A 15-minute run (~3.000 kills, ~40 elites) gives ~1 from monsters.
 */
export const LOOT_DROP_CHANCE = {
    normal: 0.0002,
    elite: 0.01,
} as const;

/**
 * Items dropped by a boss: always `count`, and one more with chance `extraChance`. Fase 24A: mini-bosses 1 at 40%
 * (before 1 + 30%), the final boss 1 (before 2). With the Champion's one, a won run gives ~3–4 items.
 */
export const LOOT_BOSS_DROPS = {
    miniBoss: { count: 0, extraChance: 0.4 },
    finalBoss: { count: 1, extraChance: 0 },
} as const;

/** Chance that each boss also drops a Zemstone of Sacrifice (owner, 20-oct-2026: 10%). ?debug=zem makes it always. */
export const LOOT_ZEM_BOSS_CHANCE = 0.1;

/**
 * Chance that any monster drops a Stone of Xelima when it dies, apart from the normal roll (owner, 22-oct-2026: "any
 * monster, very rare"). A 15-minute run (~3.000 kills) gives ~1–2. ?debug=xelima raises it to `debug`.
 */
export const LOOT_XELIMA_CHANCE = { normal: 0.0005, debug: 0.05 } as const;

/** How far apart the items of one boss fall (px). */
export const LOOT_BOSS_SPREAD = 40;

/** Kind of roll: how far from the character's own step on the ladder of items of that slot. */
export type LootTier = 'same' | 'next' | 'worse' | 'jump';

/** Weights of each kind of roll (owner, 20-oct-2026: 50 / 25 / 15 / 10). */
export const LOOT_TIER_WEIGHTS: Readonly<Record<LootTier, number>> = { same: 50, next: 25, worse: 15, jump: 10 };

/** A "big jump": this many steps above the character's own (picked at random between both, clamped to the best item). */
export const LOOT_JUMP_STEPS = { min: 2, max: 3 } as const;

/** How often each slot is chosen (the Warrior's weapon and the Mage's spells come out more). */
export const LOOT_SLOT_WEIGHTS: Readonly<Record<EquipSlotId, number>> = {
    weapon: 3,
    shield: 1,
    helm: 1,
    body: 1,
    legs: 1,
    boots: 1,
    cape: 1,
    spell1: 2,
    spell2: 2,
    // Never from the normal roll: it has its own (LOOT_ZEM_BOSS_CHANCE).
    zem: 0,
};

/** Class exceptions to LOOT_SLOT_WEIGHTS: the Mage's wands come out less than its spells (Fase 21B). */
export const LOOT_SLOT_WEIGHTS_BY_CLASS: Readonly<Partial<Record<CharacterId, Partial<Record<EquipSlotId, number>>>>> = {
    mage: { weapon: 1 },
};

/**
 * Rare items (the Berserk and Kloness wands, owner 20-oct-2026): when the roll lands on one, it is kept only with this
 * chance; otherwise the best item below it that is not rare drops instead.
 */
export const LOOT_RARE_KEEP_CHANCE = 0.1;

/** Picture of the spells (they have no icon of their own yet): the original's "Manual", a book (item-pack and item-ground 5/92). */
export const SPELL_ITEM_ICON: ItemIconFrame = { sheet: 5, frame: 92 };

/** Look of an item on the ground. */
export const LOOT_GROUND = {
    /** Its item-ground.spr picture, grown like the potions on the ground (data/pickups.ts). */
    scale: 1.5,
    /** Golden glow under it, growing and fading in a loop. */
    glowColor: 0xffd860,
    glowRadius: 18,
    glowPulseMs: 900,
    glowAlpha: { min: 0.25, max: 0.7 },
    glowScale: { min: 0.8, max: 1.25 },
    /** Small up-and-down float of the picture. */
    bobPx: 3,
    /** Picked up when the player's feet are this close (px). */
    pickupRadius: 26,
} as const;

/** Sounds (sp-client SoundFileNames: E20 pick up, E29 into the bag, E28 equip; E12 dropped). */
export const LOOT_SOUNDS = {
    drop: 'sfx.itemDrop',
    pickup: 'sfx.pickup',
    equip: 'sfx.itemEquip',
    bag: 'sfx.itemBag',
} as const satisfies Record<string, SoundKey>;

/** ?debug=loot: an item falls this far from the player, every this many ms. */
export const LOOT_DEBUG = { distance: 60, everyMs: 6000 } as const;
