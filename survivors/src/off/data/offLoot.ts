// Helbreath Off (Fase Off-4A): el botín que sueltan los monstruos, con las tiradas del servidor original
// (reference/Server.cpp, NpcDeadItemGenerator y DeleteNpc). Decisión del propietario (7-nov-2026): probabilidades del
// original, con multiplicadores aquí para subirlas si se hace lento (se miden en la Off-7, como la experiencia).
// - 35 % de los monstruos sueltan algo (tirada 1d10000 ≥ 6500). De eso, 60 % oro y 40 % objeto.
// - Objeto: 90 % uno normal (pociones, tabla de 1d12000) y 10 % uno valioso (arma o escudo según el "nivel" del
//   monstruo; Slime y Rabbit son de nivel 1).
//   · Arma (60 %): 80 % cuerpo a cuerpo (Dagger, Short Sword o Light Axe); el 20 % de varitas no da nada en el nivel 1.
//   · Escudo (40 %): Wood Shield o Targe Shield.
// - Además, al desaparecer el cuerpo, el Slime suelta Slime Jelly 1 de cada 25 veces (DeleteNpc).
// - Fuera de momento (nada en su lugar): caramelos, Power Green Potion, piedras, tablillas y bolas de la tabla normal.
// - El oro de cada monstruo sale de Npc.cfg, que no está en el repo. Desde la Off-7A, el de helbreathnemesis.com
//   (propietario, 8-nov-2026), para todos: unas 8 veces más que el que puso Claude. Se ajusta con `goldMultiplier` (Off-7C).
// - Off-7B (propietario, 8-nov-2026): el arma o escudo valioso depende del "nivel de botín" de cada monstruo, como el
//   original (Server.cpp:48364, un switch por tipo; docs/DROPS-ORIGINAL.md): 1 Slime, Rabbit, Giant Ant, Snake · 2 Orc,
//   Giant Scorpion, Skeleton, Zombie · 3 Clay y Stone Golem · 5 Troll y Cyclops. Lo que Survivors no sabe dibujar va
//   cambiado por lo más parecido (Main Gauche y Gradius → Short Sword, Sexon Axe → Light Axe, Sabre → Scimitar, Esterk
//   y Black Shadow Sword → Rapier, Lagi Shield → Leather Shield, Hauberk → Chain Mail; War Axe+1 → War Axe). Los Golems
//   no sueltan la Great Sword del original sino Long Sword y Broad Sword (propietario). Las varitas (el 20 % de las
//   armas) no dan nada todavía. Todo lo valioso trae atributos (off/data/offAttributes.ts).
// - Tiempo en el suelo: el servidor del repo no lo dice; 3 minutos (Claude, aceptado con el plan de la Off-4).
// - Off-4B: como mucho 20 pociones en total, del tipo que sea (propietario, 7-nov-2026); la que no cabe se queda en el suelo.
import type { OffMonsterId } from './offMonsters';
import type { OffGoodId } from './offGoods';
import type { OffItemId } from './offItems';

export const OFF_LOOT = {
    /** Chance that a killed monster drops anything (server: 1d10000 ≥ 6500). */
    dropChance: 0.35,
    /** Of a drop, the share that is gold (the rest is an item). */
    goldShare: 0.6,
    /** Of an item drop, the share that is valuable: a weapon or a shield (the rest is a potion). */
    valuableShare: 0.1,
    /** Of a valuable drop, the share that is a weapon (the rest is a shield). */
    weaponShare: 0.6,
    /** Of a weapon drop, the share that is melee (the rest would be a wand: nothing until there are wands). */
    meleeShare: 0.8,
    /** Multiplies `dropChance` (1 = the original; capped at always). */
    dropMultiplier: 1,
    /**
     * Multiplies the gold of every gold drop (1 = Nemesis' amounts). Off-7D (owner, 8-nov-2026: on reaching a level you
     * can about buy its gear and your potions): measured, 1 is just that up to level 20; later the gold is more than the
     * shops ask (`check offbalance`, goldForGear).
     */
    goldMultiplier: 1,
    /** Multiplies `valuableShare` (1 = the original). */
    valuableMultiplier: 1,
    /** Time an item stays on the ground before it disappears. */
    groundLifeMs: 180_000,
    /** It blinks during its last seconds. */
    blinkMs: 10_000,
    blinkPeriodMs: 250,
    /** Small shifts (px) of the items sharing a tile, so all of them show. */
    groundNudges: [[0, 0], [8, 4], [-8, 4], [0, -6]] as ReadonlyArray<readonly [number, number]>,
    /** Off-7E: ground pictures drawn this much bigger than the original (owner: they looked too small; no glow). */
    groundScale: 1.5,
    /** Most items in the bag (the original's DEF_MAXITEMS). */
    bagSize: 50,
    /**
     * Most potions carried, of any kind together (owner, 7-nov-2026: 20 in all, mixed as the player likes). They also
     * take their place in the bag.
     */
    potionLimit: 20,
} as const;

/** Potion table of a normal item drop: weights out of 12000 (server). The rest of the 12000 gives nothing. */
export const OFF_STANDARD_DROPS: ReadonlyArray<{ id: OffGoodId; weight: number }> = [
    { id: 'greenPotion', weight: 3000 },
    { id: 'redPotion', weight: 1000 },
    { id: 'bluePotion', weight: 1500 },
    { id: 'bigGreenPotion', weight: 1500 },
    { id: 'bigRedPotion', weight: 1500 },
    { id: 'bigBluePotion', weight: 700 },
];
export const OFF_STANDARD_DROP_TOTAL = 12000;

/** A monster's loot level (original iGenLevel): which valuable drops it has. */
export type OffLootLevel = 1 | 2 | 3 | 5;

/**
 * Valuable drops by loot level (original lists, with our stand-ins; see the top). Each entry equally likely within its
 * group, as the original's iDice; a stand-in that appears twice is twice as likely (two original items became it).
 */
export const OFF_VALUABLE_DROPS: Readonly<Record<OffLootLevel, { weapons: readonly OffItemId[]; armor: readonly OffItemId[] }>> = {
    // Dagger, ShortSword, LightAxe · WoodShield, TargeShield.
    1: { weapons: ['dagger', 'shortSword', 'lightAxe'], armor: ['woodShield', 'targeShield'] },
    // MainGauche, Gradius, SexonAxe, Tomahoc, Sabre, Esterk · WoodShield, TargeShield.
    2: { weapons: ['shortSword', 'shortSword', 'lightAxe', 'tomahawk', 'scimitar', 'rapier'], armor: ['woodShield', 'targeShield'] },
    // (GreatSword → Long Sword and Broad Sword, owner), DoubleAxe, Sabre, Esterk · LagiShield, Hauberk, ChainHose.
    3: { weapons: ['longSword', 'broadSword', 'doubleAxe', 'scimitar', 'rapier'], armor: ['leatherShield', 'chainMail', 'chainHose'] },
    // Esterk, Rapier, WarAxe+1, BlackShadowSword · LeatherArmor, TowerShield, Hauberk, ChainHose.
    5: { weapons: ['rapier', 'rapier', 'warAxe', 'rapier'], armor: ['leatherArmor', 'towerShield', 'chainMail', 'chainHose'] },
};

export interface OffMonsterLoot {
    /** Loot level (original iGenLevel): which weapons and armour it drops (OFF_VALUABLE_DROPS). */
    level: OffLootLevel;
    /** Gold of a gold drop: a random amount between the two (server: 1d(max − min) + min). */
    gold: readonly [number, number];
    /** Extra item when the body goes away (server, DeleteNpc), with its chance. */
    extra?: { id: OffGoodId; chance: number };
}

export const OFF_MONSTER_LOOT: Record<OffMonsterId, OffMonsterLoot> = {
    // Gold: helbreathnemesis.com, action=monster (Off-7A, owner, 8-nov-2026). Slime Jelly: 1 in 25 (DeleteNpc).
    slime: { level: 1, gold: [51, 100], extra: { id: 'slimeJelly', chance: 1 / 25 } },
    rabbit: { level: 1, gold: [101, 200] },
    giantAnt: { level: 1, gold: [101, 200] },
    snake: { level: 1, gold: [151, 300] },
    orc: { level: 2, gold: [251, 500] },
    giantScorpion: { level: 2, gold: [351, 700] },
    skeleton: { level: 2, gold: [501, 1000] },
    zombie: { level: 2, gold: [401, 800] },
    clayGolem: { level: 3, gold: [1251, 2500] },
    stoneGolem: { level: 3, gold: [1251, 2500] },
    troll: { level: 5, gold: [2501, 5000] },
    cyclops: { level: 5, gold: [2751, 5500] },
};

/** Texts of the loot (the list at the bottom left). */
export const OFF_LOOT_TEXT = {
    gotGold: (amount: number) => `You got ${amount} Gold.`,
    gotItem: (name: string) => `You got ${name}.`,
    bagFull: 'Your bag is full.',
    potionLimit: "You can't carry more potions.",
} as const;
