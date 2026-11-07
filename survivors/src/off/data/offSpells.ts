// Helbreath Off (Fase Off-6): las magias. Se aprenden en la pestaña Magic de la tienda (INT mínima + oro, como el
// original) y se ven en el libro de magias (B), donde se elige qué tecla F1–F8 lanza cada una.
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
import type { SpellElement } from '../../data/elements';

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
    /** Strength of a shield (v4 in the cfg; what it adds comes in the Off-6C). */
    power?: number;
    element?: SpellElement;
}

export const OFF_SPELLS: Record<OffSpellId, OffSpellDef> = {
    // ---- Circle 1 ----
    magicMissile: { name: 'Magic Missile', magicId: 0, circle: 1, kind: 'damage', mana: 8, reqInt: 18, price: 100, direct: [1, 8, 0], element: 'lightning' },
    heal: { name: 'Heal', magicId: 1, circle: 1, kind: 'heal', mana: 15, reqInt: 20, price: 100, direct: [2, 6, 10] },
    // ---- Circle 2 ----
    energyBolt: { name: 'Energy Bolt', magicId: 10, circle: 2, kind: 'damage', mana: 15, reqInt: 24, price: 200, direct: [2, 4, 1], area: [2, 4, 1], areaRange: 2, element: 'lightning' },
    defenseShield: { name: 'Defense Shield', magicId: 13, circle: 2, kind: 'shield', mana: 19, reqInt: 26, price: 200, durationSec: 60, power: 3 },
    // ---- Circle 3 ----
    fireBall: { name: 'Fire Ball', magicId: 20, circle: 3, kind: 'damage', mana: 27, reqInt: 26, price: 500, direct: [2, 6, 2], area: [2, 6, 2], areaRange: 2, element: 'fire' },
    greatHeal: { name: 'Great Heal', magicId: 21, circle: 3, kind: 'heal', mana: 28, reqInt: 28, price: 500, direct: [4, 10, 20] },
    holdPerson: { name: 'Hold Person', magicId: 25, circle: 3, kind: 'hold', mana: 24, reqInt: 26, price: 500, durationSec: 30 },
    // ---- Circle 4 ----
    fireStrike: { name: 'Fire Strike', magicId: 30, circle: 4, kind: 'damage', mana: 36, reqInt: 34, price: 1000, direct: [2, 8, 3], area: [2, 8, 3], areaRange: 2, element: 'fire' },
    lightningArrow: { name: 'Lightning Arrow', magicId: 37, circle: 4, kind: 'damage', mana: 32, reqInt: 38, price: 1100, direct: [4, 5, 10], element: 'lightning' },
    paralyze: { name: 'Paralyze', magicId: 35, circle: 4, kind: 'hold', mana: 35, reqInt: 36, price: 1000, durationSec: 50 },
    protectionFromMagic: { name: 'Protection From Magic', magicId: 33, circle: 4, kind: 'shield', mana: 35, reqInt: 32, price: 850, durationSec: 60, power: 2 },
    // ---- Circle 5 ----
    tripleEnergyBolt: { name: 'Triple Energy Bolt', magicId: 47, circle: 5, kind: 'damage', mana: 40, reqInt: 45, price: 1700, direct: [2, 4, 2], area: [3, 8, 3], areaRange: 2, element: 'lightning' },
    chillWind: { name: 'Chill Wind', magicId: 45, circle: 5, kind: 'damage', mana: 48, reqInt: 50, price: 2000, direct: [2, 8, 3], area: [2, 8, 3], areaRange: 2, element: 'ice' },
    lightning: { name: 'Lightning', magicId: 43, circle: 5, kind: 'damage', mana: 44, reqInt: 47, price: 1700, direct: [4, 7, 12], element: 'lightning' },
};

/** Every spell, by circle and then by the cfg number (the order of the shop and the book). */
export const OFF_SPELL_IDS: readonly OffSpellId[] = (Object.keys(OFF_SPELLS) as OffSpellId[])
    .sort((a, b) => OFF_SPELLS[a].circle - OFF_SPELLS[b].circle || OFF_SPELLS[a].magicId - OFF_SPELLS[b].magicId);

/** How many spell keys there are: F1–F8. */
export const OFF_SPELL_KEY_COUNT = 8;

/** Which spell each key F1–F8 casts (undefined = none). */
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

/** "F3" for the key at index 2. */
export function offSpellKeyName(index: number): string {
    return `F${index + 1}`;
}
