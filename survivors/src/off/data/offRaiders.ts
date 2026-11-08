// Helbreath Off (Fase Off-9A): los Raiders. Decisiones del propietario (8-nov-2026):
// - 1 o 2 personajes de la otra ciudad (Guerrero o Mago), con el nombre en rojo, de nivel parecido al tuyo; si son
//   dos, cada uno algo más flojo. **Solo en Promiseland**, al azar.
// - Usan **el mismo cerebro que los mercenarios** (OffRaiderAI reutiliza sus piezas: golpes, poción, huir, magias),
//   en el bando contrario: van a por ti y a por tu mercenario.
// - Los monstruos **sí** les atacan, pero ellos no se distraen: siguen a por ti o tu mercenario (8-nov-2026).
// - Al morir sueltan **oro** y nada más por ahora. Si mueres o te vas de Promiseland, desaparecen.
// Números nuestros; se ajustan en la 9C.
import type { CharacterLook } from '../../data/appearance';
import type { DyeColorId, WornColors } from '../../data/dyes';
import { OFF_MERCENARIES, type OffMercenaryDef, type OffMercenaryId } from './offMercenary';
import type { OffFaction } from './offPlaceIds';

/** When and how many come (ms, shares and levels). */
export const OFF_RAIDS = {
    /** Every this long in a place with raids (Promiseland), a roll... */
    everyMs: 180_000,
    /** ...that brings them this often. */
    chance: 0.5,
    /** Of the raids, this share are two Raiders instead of one... */
    pairChance: 1 / 3,
    /** ...each this many levels under yours. */
    pairLevelsUnder: 3,
    /** A lone one is your level, give or take this many. */
    levelSpread: 2,
    /** Warrior or Mage: this share are Warriors. */
    warriorChance: 0.6,
    /** They appear this many tiles from you (out of sight), on a tile they can walk to you from... */
    spawnTiles: 18,
    /** ...looking this far round that spot for a free tile. */
    spawnSearchTiles: 6,
    /** Two together appear this close to each other. */
    pairGapTiles: 2,
    /** No tile found for them (walls all round): another try this soon (ms). */
    retryMs: 2000,
    /** Gold they drop: this much × their level (Off-9A: only gold). */
    goldPerLevel: 20,
} as const;

/** How they fight (tiles, ms and shares). The rest, as the mercenaries (OFF_MERCENARY, _CASTER, _POTION, _FLEE). */
export const OFF_RAIDER = {
    /** Walking to you from afar, it looks for a way again this often (ms)... */
    repathMs: 1200,
    /** ...and runs while farther than this from its victim (tiles)... */
    runTiles: 4,
    /**
     * It only starts running away with at least this much stamina, and stops (turns and fights) when it has none
     * left: you catch it (the owner, 8-nov-2026: it may get away a little, but runs out of stamina as you do).
     */
    fleeMinStamina: 30,
    /**
     * ...and runs for this long at most (ms), then turns and fights; it doesn't run away again for `fleeAgainMs`.
     * First try: with stamina only, you both ran the same and it stayed 4 tiles ahead for over a minute.
     */
    fleeMaxMs: 6000,
    fleeAgainMs: 20_000,
    /** ...searching this many tiles for a way (they come from afar, round rocks and rivers). */
    pathMaxTiles: 1500,
    /** Hit by the other one (you or your mercenary), it turns on that one this often (as the mercenary's taunt). */
    switchChance: 0.5,
    /** Chance (1–100 scale, as a monster's) that it shrugs off your spells. */
    magicResist: 20,
} as const;

/**
 * How a Mage Raider fights (the owner, 8-nov-2026): it never stands still while hit, casts from afar and runs away
 * sooner. Being hit while preparing a spell loses it (OffSpells.interrupt), so a Warrior on top of it wins.
 */
export const OFF_RAIDER_MAGE = {
    /** You this close (tiles): it runs this many tiles away before casting again (only with stamina to run). */
    keepAwayTiles: 4,
    retreatTiles: 5,
    /** It casts from this far (and only walks closer when farther): from afar, as soon as it sees you (the owner, 9-nov-2026). */
    castTiles: 8,
    /**
     * ...at most this often (ms), so it gets its spell out in between (first try: it walked away again and again and
     * cast once in 45 s).
     */
    retreatEveryMs: 2500,
    /** It runs away under this share of its health (a Warrior, OFF_MERCENARY_FLEE.below), with or without mana to heal. */
    fleeBelow: 0.4,
    /** While you are held, it heals itself under this share of its health (it uses the time). */
    heldHealBelow: 0.8,
    /**
     * After a hold took, it casts another one only this long later (ms): first try, it held you again the moment you
     * were free and never hurt you.
     */
    holdEveryMs: 12_000,
} as const;

/** Off-9A (the owner, 9-nov-2026: essential): a Warrior Raider uses Critical Strike, with your charges' rules. */
export const OFF_RAIDER_CRIT = {
    /** With a charge, each blow is a Critical Strike this often... */
    chance: 0.3,
    /** ...and always when its victim is under this share of its health (to finish it). */
    finishBelow: 0.3,
    /** "Crit!" over it when it strikes. */
    word: 'Crit!',
} as const;

/** Their health and blows, times these (a raider is not a tank: the mercenaries' are stronger). */
export const OFF_RAIDER_FACTORS: Readonly<Record<OffMercenaryId, Pick<OffMercenaryDef, 'hpFactor' | 'damageFactor' | 'defenseBonus'>>> = {
    // 8-nov-2026, first try at your level with your gear: it outlasted you (its gear is the mercenary's). Softer:
    warrior: { hpFactor: 0.8, damageFactor: 0.8, defenseBonus: -15 },
    // The owner (8-nov-2026): mages have little health and are flimsy at low levels; their spells balance it later.
    mage: { hpFactor: 0.75, damageFactor: 0.3, defenseBonus: 0 },
};

/** Their names, by city (random; the same name twice in a pair is avoided). */
export const OFF_RAIDER_NAMES: Readonly<Record<OffFaction, readonly string[]>> = {
    aresden: ['Draven', 'Korrin', 'Brakus', 'Velda', 'Mordrek', 'Sarnia', 'Torvald', 'Ysolde', 'Garrik', 'Rhona'],
    elvine: ['Aelric', 'Lysandra', 'Theron', 'Elowen', 'Caelan', 'Seraphine', 'Faelan', 'Ilyra', 'Dorian', 'Maelis'],
};

/** Their capes and boots: their city's colour (dye numbers, data/dyes.ts: 14 = Red, 10 = Blue). */
export const OFF_RAIDER_DYES: Readonly<Record<OffFaction, DyeColorId>> = { aresden: 14, elvine: 10 };

export function offRaiderColors(faction: OffFaction): Readonly<WornColors> {
    const dye = OFF_RAIDER_DYES[faction];
    return { cape: dye, boots: dye };
}

/** Bodies they may have (skin, hair, gender), picked at random. */
export const OFF_RAIDER_BODIES: readonly CharacterLook[] = [
    { gender: 'male', skin: 1, hairStyle: 1, hairColor: 3, underwear: 1 },
    { gender: 'male', skin: 2, hairStyle: 3, hairColor: 0, underwear: 2 },
    { gender: 'male', skin: 3, hairStyle: 5, hairColor: 6, underwear: 4 },
    { gender: 'female', skin: 1, hairStyle: 2, hairColor: 5, underwear: 2 },
    { gender: 'female', skin: 2, hairStyle: 6, hairColor: 1, underwear: 6 },
];

/** How they look over their heads: the name in red (yours and your mercenary's are blue). */
export const OFF_RAIDER_LOOK = {
    nameColor: '#ff5a4a',
    /** "Enemy Kill!!" over one you (or your mercenary) killed: big yellow letters with a black edge (the original, owner's capture). */
    killWord: { fontFamily: 'Georgia, serif', fontSize: 22, color: '#f5e04a', stroke: '#1a1200', strokeThickness: 4, aboveFeetPx: 90, risePx: 24, showMs: 2200, fadeMs: 600 },
} as const;

/** What the world says about them. */
export const OFF_RAIDER_TEXT = {
    kind: { warrior: 'Warrior', mage: 'Mage' } satisfies Record<OffMercenaryId, string>,
    city: { aresden: 'Aresden', elvine: 'Elvine' } satisfies Record<OffFaction, string>,
    /** Over a Raider you or your mercenary killed (as the original). */
    enemyKill: 'Enemy Kill!!',
    fell: (name: string) => `${name} fell to the monsters!`,
} as const;

/** A raider's own def: the mercenary's of that kind, with its name, body and raider factors. */
export function offRaiderDef(kind: OffMercenaryId, name: string, body: CharacterLook): OffMercenaryDef {
    return { ...OFF_MERCENARIES[kind], ...OFF_RAIDER_FACTORS[kind], name, body };
}
