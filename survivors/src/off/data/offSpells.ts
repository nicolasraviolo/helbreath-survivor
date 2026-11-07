// Helbreath Off (Fase Off-6): las magias. Se aprenden en la pestaña Magic de la tienda (INT mínima + oro, como el
// original) y se ven en el libro de magias (B), donde se elige qué tecla 1–8 lanza cada una.
// - Decidido por el propietario (7-nov-2026): 14 magias de 5 círculos, también escudos y paralizar, y Protection From
//   Magic aunque ningún monstruo de Off lance hechizos todavía.
// - Todos los números salen de reference/Magic.cfg (columna entre paréntesis):
//   maná (ManaCost), INT mínima (ReqInt), precio (Cost), dados directos (effect456 = v4 d v5 + v6), dados de área
//   (effect789), tamaño del área (range23: casillas a cada lado del objetivo), duración (Last, en segundos), elemento
//   (Attr: 1 tierra, 2 rayo, 3 fuego, 4 hielo) y fuerza de los escudos (v4). Círculo = número del original / 10 + 1.
// - Qué hace cada tipo (`kind`), del servidor (Server.cpp, PlayerMagicHandler):
//   damage = daño en el monstruo (y, si tiene área, otra tirada en cada casilla del área, también la del centro);
//   heal = vida para ti; shield = sube tu defensa (Defense Shield) o tu resistencia a la magia (Protection From Magic);
//   hold = el monstruo se queda quieto (Hold Person, Paralyze). Lanzarlas llega en la Off-6B y 6C.
// Fase Off-6C (servidor, PlayerMagicHandler y Effect_HpUp_Spot):
// - Heal / Great Heal: suman sus dados a tu vida (sin pasar de la máxima). La MAG no los sube.
// - Defense Shield (fuerza 3) suma +40 a tu defensa contra golpes; Protection From Magic (fuerza 2) deja el daño mágico
//   a la mitad (ningún monstruo de Off lanza magia todavía: queda puesta para cuando lo hagan). Comparten hueco: con uno
//   puesto, el otro no hace nada ("no effect"), como el original.
// - Hold Person / Paralyze: el monstruo no anda ni ataca durante `durationSec`; puede resistirla como el daño, y
//   cualquier golpe o magia que le haga daño la rompe (el servidor la quita al dañar a un NPC). El fuego que arde no.
// - Curar y escudos te los lanzas a ti: en Off juegas solo, así que cualquier clic sirve (decisión de Claude, aceptada).
// - Mando (propietario): RT + A/B/X/Y preparan las 4 magias del mando (elegidas en el libro); soltar RT la lanza al
//   monstruo marcado o, sin él, al más cercano.
// Fase Off-6B, lanzar (OFF_CASTING; fórmulas en off/systems/OffSpellRules.ts):
// - Off no tiene habilidades. Propietario (7-nov-2026): la habilidad "Magic" del original (0–100) sale de la MAG:
//   MAG × 2, tope 100 (con MAG 50 se lanza como un mago entrenado). Lo demás, con las tablas del servidor.
// - Preparar (propietario): 2 s con MAG 10, más rápido con más MAG, 1 s desde MAG 50.
// - Elementos como en Survivors (propietario): ±20 % según el elemento del monstruo, quemadura con el fuego y frenado
//   con el hielo (data/elements.ts, ICE_SLOW de data/activeSpells.ts).
import type { SpellElement } from '../../data/elements';
import type { SpellId } from '../../data/spells';
import type { EffectKey } from '../../config/effects';

export type OffSpellId =
    | 'magicMissile' | 'heal'
    | 'energyBolt' | 'defenseShield'
    | 'fireBall' | 'greatHeal' | 'holdPerson'
    | 'fireStrike' | 'lightningArrow' | 'paralyze' | 'protectionFromMagic'
    | 'tripleEnergyBolt' | 'chillWind' | 'lightning';

export type OffSpellKind = 'damage' | 'heal' | 'shield' | 'hold';

/** Dice as in the cfg: count, sides, bonus (2 6 2 = 2d6 + 2). */
export type OffSpellDice = readonly [number, number, number];

export interface OffSpellDef {
    name: string;
    /** Number in Magic.cfg (the circle comes from it). */
    magicId: number;
    circle: number;
    kind: OffSpellKind;
    mana: number;
    reqInt: number;
    /** Gold at the magic shop. */
    price: number;
    /** Damage (or health) on the target. */
    direct?: OffSpellDice;
    /** Damage on every tile of the area around the target (the centre too). */
    area?: OffSpellDice;
    /** Tiles on each side of the target: 2 = 5 × 5. */
    areaRange?: number;
    /** Seconds a shield or a hold lasts. */
    durationSec?: number;
    /** Strength of a shield (v4 in the cfg: 3 Defense Shield, 2 Protection From Magic; OFF_PROTECT says what it does). */
    power?: number;
    element?: SpellElement;
    /** Survivors' spell whose flight, explosions and sounds it shows (data/spells.ts); only damage spells. */
    look?: SpellId;
    /** Heal, shields and holds (Off-6C): the original's effect where it lands (config/effects.ts). */
    castEffect?: EffectKey;
    /** Shields (Off-6C): drawn in a loop under the player's feet while it lasts. */
    wornEffect?: EffectKey;
}

export const OFF_SPELLS: Record<OffSpellId, OffSpellDef> = {
    // ---- Circle 1 ----
    magicMissile: { name: 'Magic Missile', magicId: 0, circle: 1, kind: 'damage', mana: 8, reqInt: 18, price: 100, direct: [1, 8, 0], element: 'lightning', look: 'energyBolt' },
    heal: { name: 'Heal', magicId: 1, circle: 1, kind: 'heal', mana: 15, reqInt: 20, price: 100, direct: [2, 6, 10], castEffect: 'fx.heal.cast' },
    // ---- Circle 2 ----
    energyBolt: { name: 'Energy Bolt', magicId: 10, circle: 2, kind: 'damage', mana: 15, reqInt: 24, price: 200, direct: [2, 4, 1], area: [2, 4, 1], areaRange: 2, element: 'lightning', look: 'energyBolt' },
    defenseShield: { name: 'Defense Shield', magicId: 13, circle: 2, kind: 'shield', mana: 19, reqInt: 26, price: 200, durationSec: 60, power: 3, castEffect: 'fx.defenseShield.cast' },
    // ---- Circle 3 ----
    fireBall: { name: 'Fire Ball', magicId: 20, circle: 3, kind: 'damage', mana: 27, reqInt: 26, price: 500, direct: [2, 6, 2], area: [2, 6, 2], areaRange: 2, element: 'fire', look: 'fireBall' },
    greatHeal: { name: 'Great Heal', magicId: 21, circle: 3, kind: 'heal', mana: 28, reqInt: 28, price: 500, direct: [4, 10, 20], castEffect: 'fx.heal.cast' },
    holdPerson: { name: 'Hold Person', magicId: 25, circle: 3, kind: 'hold', mana: 24, reqInt: 26, price: 500, durationSec: 30, castEffect: 'fx.hold.cast' },
    // ---- Circle 4 ----
    fireStrike: { name: 'Fire Strike', magicId: 30, circle: 4, kind: 'damage', mana: 36, reqInt: 34, price: 1000, direct: [2, 8, 3], area: [2, 8, 3], areaRange: 2, element: 'fire', look: 'fireStrike' },
    lightningArrow: { name: 'Lightning Arrow', magicId: 37, circle: 4, kind: 'damage', mana: 32, reqInt: 38, price: 1100, direct: [4, 5, 10], element: 'lightning', look: 'lightningArrow' },
    paralyze: { name: 'Paralyze', magicId: 35, circle: 4, kind: 'hold', mana: 35, reqInt: 36, price: 1000, durationSec: 50, castEffect: 'fx.hold.cast' },
    protectionFromMagic: { name: 'Protection From Magic', magicId: 33, circle: 4, kind: 'shield', mana: 35, reqInt: 32, price: 850, durationSec: 60, power: 2, wornEffect: 'fx.aura.ring' },
    // ---- Circle 5 ----
    tripleEnergyBolt: { name: 'Triple Energy Bolt', magicId: 47, circle: 5, kind: 'damage', mana: 40, reqInt: 45, price: 1700, direct: [2, 4, 2], area: [3, 8, 3], areaRange: 2, element: 'lightning', look: 'tripleEnergyBolt' },
    chillWind: { name: 'Chill Wind', magicId: 45, circle: 5, kind: 'damage', mana: 48, reqInt: 50, price: 2000, direct: [2, 8, 3], area: [2, 8, 3], areaRange: 2, element: 'ice', look: 'chillWind' },
    lightning: { name: 'Lightning', magicId: 43, circle: 5, kind: 'damage', mana: 44, reqInt: 47, price: 1700, direct: [4, 7, 12], element: 'lightning', look: 'lightningBolt' },
};

/** Every spell, by circle and then by the cfg number (the order of the shop and the book). */
export const OFF_SPELL_IDS: readonly OffSpellId[] = (Object.keys(OFF_SPELLS) as OffSpellId[])
    .sort((a, b) => OFF_SPELLS[a].circle - OFF_SPELLS[b].circle || OFF_SPELLS[a].magicId - OFF_SPELLS[b].magicId);

/** Heal and shields are cast on yourself (Off has no one else to cast them on). */
export function offSpellOnSelf(def: OffSpellDef): boolean {
    return def.kind === 'heal' || def.kind === 'shield';
}

/**
 * What a shield's strength (`power`, v4) does, from the server: 3 = +40 defence against blows (4 = +100, not in Off),
 * 2 = magic damage halved (5 too, not in Off).
 */
export const OFF_PROTECT = {
    defenseByPower: { 3: 40, 4: 100 } as Readonly<Record<number, number>>,
    magicHalvedPowers: [2, 5] as readonly number[],
    magicDamageFactor: 0.5,
} as const;

/** How many spell keys there are: 1–8. */
export const OFF_SPELL_KEY_COUNT = 8;

/** Which spell each key 1–8 casts (undefined = none). */
export type OffSpellKeys = (OffSpellId | undefined)[];

export function isOffSpellId(value: unknown): value is OffSpellId {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(OFF_SPELLS, value);
}

/** What learning a spell gave (Off-6A). */
export type OffLearnResult = 'ok' | 'known' | 'int' | 'gold';

export const OFF_ELEMENT_NAMES: Record<SpellElement, string> = { earth: 'Earth', fire: 'Fire', lightning: 'Lightning', ice: 'Ice' };

/** The circle as a title ("Circle 3"). */
export function offCircleTitle(circle: number): string {
    return `Circle ${circle}`;
}

/** "2 – 8" from some dice. */
export function offDiceRange([count, sides, bonus]: OffSpellDice): string {
    return `${count + bonus} – ${count * sides + bonus}`;
}

/** The gamepad's spells (Off-6C): RT + A, B, X, Y. */
export const OFF_PAD_SPELL_COUNT = 4;

/** Which spell each gamepad button casts with RT held (undefined = none). */
export type OffPadSpells = (OffSpellId | undefined)[];

/** "RT + X" for the gamepad button at index 2. */
export function offPadSpellName(index: number): string {
    return `RT + ${['A', 'B', 'X', 'Y'][index] ?? '?'}`;
}

/** "3" for the key at index 2 (owner, 7-nov-2026: the number keys, not F1–F8). */
export function offSpellKeyName(index: number): string {
    return `${index + 1}`;
}

/**
 * Casting (Off-6B), from the server (reference/Server.cpp, PlayerMagicHandler) unless said otherwise.
 * - Works or fails: skill% × circleChance[circle] / 100, + (INT − 50) / 2 above INT 50, then the level adjustment:
 *   a circle above level / 10 loses part of levelPenalty (less the further into that ten levels), one below gains
 *   `lowerCircleBonus` per circle. 100 or more never fails. A failure costs no mana.
 * - How well it gets through a monster's magic resistance: skill + (MAG − 50) above MAG 50, with the same level
 *   adjustment. The monster resists unless 1d100 ≤ hit / resistance × `resistFactor` (kept between min and max %).
 * - Damage: the dice × (1 + MAG / 3.3 / 100).
 */
export const OFF_CASTING = {
    /** Owner (Off has no skills): the original's Magic skill = MAG × 2, up to 100. */
    skillPerMag: 2,
    maxSkill: 100,
    /** _tmp_iMCProb, by circle (index 0 unused). */
    circleChance: [0, 300, 250, 200, 150, 100, 80, 70, 60, 50, 40],
    /** _tmp_iMLevelPenalty, by circle. */
    levelPenalty: [0, 5, 5, 8, 8, 10, 14, 28, 32, 36, 40],
    levelsPerCircle: 10,
    lowerCircleBonus: 5,
    /** INT above this adds (INT − it) / intDivisor to the chance; MAG above it adds (MAG − it) to the hit. */
    statBonusFrom: 50,
    intDivisor: 2,
    /** A chance of 100 or more never fails. */
    sureChance: 100,
    resistFactor: 50,
    resistMinPercent: 15,
    resistMaxPercent: 99,
    /** Server: damage × (1 + MAG / magDivisor / 100). */
    magDivisor: 3.3,
    /** Owner: preparing takes slowMs at slowMag (and below), fastMs from fastMag, in a straight line between. */
    prepare: { slowMag: 10, slowMs: 2000, fastMag: 50, fastMs: 1000 },
    /** Server: at least this long between two spells. */
    betweenCastsMs: 1000,
    /** The flinch when it fails (the original shows the damage motion). */
    failFlinchMs: 300,
} as const;

/** Lines of the bottom-left list (in English: the game is English only). */
export const OFF_CAST_TEXT = {
    unknown: (name: string) => `You don't know ${name}.`,
    noMana: 'Not enough mana.',
    weapon: 'Take off your weapon to cast.',
    shield: 'Take off your shield to cast.',
    tooSoon: 'Too soon to cast again.',
    failed: 'The spell failed!',
    noTarget: 'Click on a monster or the ground to cast.',
    /** Gamepad: nothing marked and no monster near for a spell that needs one. */
    noMonster: 'No monster near to cast on.',
    /** A shield while one is on, a hold on a held monster, Hold on the ground (server: MAGIC_NOEFFECT). */
    noEffect: 'The spell had no effect.',
    shieldOn: (name: string) => `${name} is on you.`,
    shieldOff: (name: string) => `${name} has worn off.`,
} as const;

/** Words over a monster. */
export const OFF_CAST_WORDS = {
    failed: 'Failed!',
    resisted: 'Resisted',
    held: 'Held',
} as const;
