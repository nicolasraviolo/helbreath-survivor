// Helbreath Off (Fase Off-2): los monstruos de los pits con los números del servidor original (NPC.cfg, ver
// docs/hb-wiki/monstruos-comportamiento.md y monstruos.md). Sprite, sonidos, ritmo (ATime), daño, puntería, defensa y
// valentía se toman de Survivors (data/enemies.ts), que ya los tiene del original; aquí va lo que Survivors cambió:
// - Vida: dados de vida (HitDice) del original, no la vida comprimida de Survivors.
// - Experiencia: la del original (se usa en el bloque Off-2B).
// - Rabbit neutral (propietario, 6-nov-2026): no busca a nadie; solo ataca a quien le pega.
// - Giant Ant, Snake, Orc y Giant Scorpion (Fase Off-5C), para los pits de las ciudades. Experiencia de monstruos.md.
//   El tamaño (Size de NPC.cfg) no está en el repo: los cuatro van como pequeños, igual que el Slime.
// - Resistencia a la magia (Fase Off-6B): la columna Magic Resistance de monstruos.md (el m_cResistMagic del servidor).
//   Su elemento es el de Survivors (`base.element`, de la wiki).
// - Skeleton, Zombie, Clay Golem, Stone Golem, Troll y Cyclops (Fase Off-7A), para Promiseland. HitDice de NPC.cfg
//   (monstruos-comportamiento.md); los de los Golems no están en el repo y salen de la vida de helbreathnemesis.com
//   (Clay 151–180 → 30, Stone 126–150 → 25; la fórmula de abajo da justo esos márgenes, como con el Troll y el Cyclops).
//   Experiencia, resistencia a la magia y alcance de vista de monstruos.md. Tamaño: los Golems, el Troll y el Cyclops
//   van como grandes (Claude: el Size de NPC.cfg no está en el repo, pero en el original son monstruos grandes).
import { ENEMIES, type EnemyDef } from '../../data/enemies';
import type { OffSpellId } from './offSpells';

export type OffMonsterId =
    | 'slime' | 'rabbit' | 'giantAnt' | 'snake' | 'orc' | 'giantScorpion'
    | 'skeleton' | 'zombie' | 'clayGolem' | 'stoneGolem' | 'troll' | 'cyclops';

export interface OffMonsterDef {
    /** Survivors' monster with the same sprite, sounds and original combat numbers. */
    base: EnemyDef;
    /** Display name (over the head when marked). */
    name: string;
    /** NPC.cfg HitDice: health = HD d4 + HD when HD ≤ 5, else HD×4 + HD + 1dHD (server, at spawn). */
    hitDice: number;
    /** NPC.cfg search range: it notices a player this many tiles away (square around it). 0 = never looks. */
    searchRange: number;
    /** NPC.cfg experience: a random value between the two, at spawn. */
    exp: readonly [number, number];
    /** NPC.cfg Size: small monsters take the weapons' small-size dice (Dagger 1d5), large ones the large dice. */
    size: 'small' | 'large';
    /** Never starts a fight (propietario: the Rabbits). */
    neutral: boolean;
    /** Magic resistance (wiki): the higher, the more often it resists a spell (OffSpellRules). */
    magicResist: number;
    /** The spell it casts at a player it cannot reach yet (Off-7A: the Cyclops' Fire Strike, wiki). */
    spell?: OffSpellId;
}

/**
 * Monsters that cast (server NpcBehavior_Attack): when the player is out of reach of its blow but within 9 tiles across
 * and 7 up or down, half the times it casts instead of stepping closer. The wait after casting (2 s) is Survivors'
 * reading of the server. Npc.cfg (their mana) is not in the repo: they never run out.
 */
export const OFF_MONSTER_CAST = { chance: 0.5, rangeX: 9, rangeY: 7, waitMs: 2000 } as const;

export const OFF_MONSTERS: Record<OffMonsterId, OffMonsterDef> = {
    // NPC.cfg Slime: ATime 2100, 1d4, HitDice 2, search 2; wiki: 7 HP, 400–499 XP, HR 30, DR 10.
    slime: { base: ENEMIES.slime, name: 'Slime', hitDice: 2, searchRange: 2, exp: [400, 499], size: 'small', neutral: false, magicResist: 5 },
    // NPC.cfg Rabbit: ATime 1500, 1d5, HitDice 4, search 2; wiki: 14 HP, 250 XP, HR 35, DR 10.
    rabbit: { base: ENEMIES.bunny, name: 'Rabbit', hitDice: 4, searchRange: 2, exp: [250, 250], size: 'small', neutral: true, magicResist: 5 },
    // NPC.cfg Giant-Ant: ATime 1200, 2d3, HitDice 3, search 2; wiki: 10 HP, 700–1,749 XP, HR 40, DR 15.
    giantAnt: { base: ENEMIES.ant, name: 'Giant Ant', hitDice: 3, searchRange: 2, exp: [700, 1749], size: 'small', neutral: false, magicResist: 10 },
    // NPC.cfg Amphis: ATime 1000, 2d4, HitDice 4, search 3; wiki: 13 HP, 1,000–2,499 XP, HR 50, DR 30.
    snake: { base: ENEMIES.snake, name: 'Snake', hitDice: 4, searchRange: 3, exp: [1000, 2499], size: 'small', neutral: false, magicResist: 20 },
    // NPC.cfg Orc: ATime 1200, 3d3, HitDice 4, search 5; wiki: 20 HP, 1,300–3,249 XP, HR 60, DR 40.
    orc: { base: ENEMIES.orc, name: 'Orc', hitDice: 4, searchRange: 5, exp: [1300, 3249], size: 'small', neutral: false, magicResist: 25 },
    // NPC.cfg Scorpion: ATime 1200, 5d3, HitDice 6, search 4; wiki: 30 HP, 2,200–5,499 XP, HR 70, DR 45.
    giantScorpion: { base: ENEMIES.scorpion, name: 'Giant Scorpion', hitDice: 6, searchRange: 4, exp: [2200, 5499], size: 'small', neutral: false, magicResist: 30 },
    // NPC.cfg Skeleton: ATime 800, range 2, 5d4, HitDice 8, search 5; wiki: 2,600–6,500 XP, MR 40. Nemesis: 41–48 HP.
    skeleton: { base: ENEMIES.skeleton, name: 'Skeleton', hitDice: 8, searchRange: 5, exp: [2600, 6500], size: 'small', neutral: false, magicResist: 40 },
    // NPC.cfg Zombie: ATime 1500, 4d4, HitDice 10, search 6; wiki: 2,600–6,500 XP, MR 30. Nemesis: 51–60 HP.
    zombie: { base: ENEMIES.zombie, name: 'Zombie', hitDice: 10, searchRange: 6, exp: [2600, 6500], size: 'small', neutral: false, magicResist: 30 },
    // Clay Golem: 7d4; wiki: 4,400–11,000 XP, MR 50, aggro 5. Nemesis: 151–180 HP (HitDice 30).
    clayGolem: { base: ENEMIES.clayGolem, name: 'Clay Golem', hitDice: 30, searchRange: 5, exp: [4400, 11000], size: 'large', neutral: false, magicResist: 50 },
    // Stone Golem: 7d4; wiki: 4,000–9,999 XP, MR 50, aggro 5. Nemesis: 126–150 HP (HitDice 25).
    stoneGolem: { base: ENEMIES.stoneGolem, name: 'Stone Golem', hitDice: 25, searchRange: 5, exp: [4000, 9999], size: 'large', neutral: false, magicResist: 50 },
    // NPC.cfg Troll: ATime 700, 8d5, HitDice 55, search 7; wiki: 6,500–16,250 XP, MR 72. Nemesis: 276–330 HP.
    troll: { base: ENEMIES.troll, name: 'Troll', hitDice: 55, searchRange: 7, exp: [6500, 16250], size: 'large', neutral: false, magicResist: 72 },
    // NPC.cfg Cyclops: ATime 1200, range 3, 8d6, HitDice 60, search 7, magic 5 (Fire Strike); wiki: 8,500–21,249 XP,
    // MR 78. Nemesis: 301–360 HP.
    cyclops: { base: ENEMIES.cyclops, name: 'Cyclops', hitDice: 60, searchRange: 7, exp: [8500, 21249], size: 'large', neutral: false, magicResist: 78, spell: 'fireStrike' },
};

/** Health of a new monster (server, at spawn). */
export function isOffMonsterId(id: string): id is OffMonsterId {
    return Object.prototype.hasOwnProperty.call(OFF_MONSTERS, id);
}

export function rollMonsterHp(hitDice: number, roll: (count: number, sides: number) => number): number {
    return hitDice <= 5 ? roll(hitDice, 4) + hitDice : hitDice * 4 + hitDice + roll(1, hitDice);
}
