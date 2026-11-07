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
// - El oro de cada monstruo sale de Npc.cfg, que no está en el repo: el de Slime y Rabbit lo pone Claude (7-nov-2026).
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
    /** Of a weapon drop, the share that is melee (the rest would be a wand: nothing at monster level 1). */
    meleeShare: 0.8,
    /** Multiplies `dropChance` (1 = the original; capped at always). */
    dropMultiplier: 1,
    /** Multiplies `valuableShare` (1 = the original). */
    valuableMultiplier: 1,
    /** Time an item stays on the ground before it disappears. */
    groundLifeMs: 180_000,
    /** It blinks during its last seconds. */
    blinkMs: 10_000,
    blinkPeriodMs: 250,
    /** Small shifts (px) of the items sharing a tile, so all of them show. */
    groundNudges: [[0, 0], [8, 4], [-8, 4], [0, -6]] as ReadonlyArray<readonly [number, number]>,
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

/** Valuable drops of monster level 1 (Slime, Rabbit...), each equally likely within its group. */
export const OFF_VALUABLE_DROPS: { weapons: readonly OffItemId[]; shields: readonly OffItemId[] } = {
    weapons: ['dagger', 'shortSword', 'lightAxe'],
    shields: ['woodShield', 'targeShield'],
};

export interface OffMonsterLoot {
    /** Gold of a gold drop: a random amount between the two (server: 1d(max − min) + min). */
    gold: readonly [number, number];
    /** Extra item when the body goes away (server, DeleteNpc), with its chance. */
    extra?: { id: OffGoodId; chance: number };
}

export const OFF_MONSTER_LOOT: Record<OffMonsterId, OffMonsterLoot> = {
    // Gold: Claude's numbers (Npc.cfg is not in the repo). Slime Jelly: 1 in 25 (DeleteNpc).
    slime: { gold: [4, 12], extra: { id: 'slimeJelly', chance: 1 / 25 } },
    rabbit: { gold: [6, 16] },
};

/** Texts of the loot (the list at the bottom left). */
export const OFF_LOOT_TEXT = {
    gotGold: (amount: number) => `You got ${amount} Gold.`,
    gotItem: (name: string) => `You got ${name}.`,
    bagFull: 'Your bag is full.',
    potionLimit: "You can't carry more potions.",
} as const;
