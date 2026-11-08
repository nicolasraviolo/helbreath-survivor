// Helbreath Off (Fase Off-7B): atributos de las armas y armaduras que sueltan los monstruos, como en el servidor
// original (reference/Server.cpp, NpcDeadItemGenerator, líneas 48718–49020; docs/DROPS-ORIGINAL.md).
// Decisiones del propietario (8-nov-2026):
// - El primer y el segundo atributo salen de listas distintas, como el original (en Survivors se mezclan).
// - Primer atributo de las armas: solo los de Survivors (Sharp, Ancient, Poison) y además Critical, para que ya quede
//   (Off no tiene golpes críticos todavía: Critical se ve, pero no hace nada hasta que los haya).
// - Primer atributo de las armaduras (original): Light, Experience y Gold. Strong (aguante) queda fuera: no hay desgaste.
// - Segundo atributo (original): armas Hitting Probability, Gold y Experience; armaduras Defense Ratio, Magic Resistance,
//   HP / MP / SP Recovery y Physical / Magic Absorption. Fuera (no harían nada en Off): Consecutive Attack Damage y
//   Poison Resistance.
// - Valor del 1 al 7 con la tabla del original (ATTRIBUTE_VALUE_WEIGHTS de Survivors, con el mismo tope de 7), el
//   40 % con segundo atributo. Lo de la tienda no trae atributo.
// - Pesos: los de Survivors para Sharp / Ancient / Poison (10 / 1 / 5); Critical 9 (original: 15 % frente al 16 % de
//   Sharp). El resto, los del original. Mínimos de valor del original (Poison 4, Critical 5, Light 4; Hitting, DR, MR y
//   absorciones 3). Gold y Experience de arma tienen valor fijo en el original (5 y 2); los de armadura, (v + 1) / 2,
//   como mucho 2 en monstruos de nivel 3 o menos.
// - Cada punto vale +7 % (absorciones +3 %, Gold y Experience +10 %, Light −4 % de peso = de STR para ponérselo),
//   como el cliente original (Client.cpp:30205). Sharp +10 % y Ancient +20 % de daño, como Survivors.
// - Magic Resistance: el jugador de Off no tenía; aquí es la probabilidad de librarse de la magia de un monstruo.
//
// Un objeto con atributos se guarda como texto: "longSword:sharp:hittingProbability4" (id, primero, segundo; el número
// pegado es el valor). Un objeto normal es solo su id, así que las partidas de antes valen tal cual.
import { ATTRIBUTE_VALUE_MAX, ATTRIBUTE_VALUE_WEIGHTS, MAX_ABSORPTION, POISON } from '../../data/attributes';

export type OffAttributeEffect =
    | 'damage' | 'poison' | 'critical' | 'light' | 'hitting' | 'gold' | 'experience'
    | 'defenseRatio' | 'magicResistance' | 'hpRecovery' | 'mpRecovery' | 'spRecovery' | 'physicalAbsorption' | 'magicAbsorption';

export type OffAttributeEffects = Partial<Record<OffAttributeEffect, number>>;

export interface OffAttributeDef {
    name: string;
    /** Weight in the roll among the attributes of its list. */
    weight: number;
    effect: OffAttributeEffect;
    /** Effect per point of value; missing = no value, the effect is `fixed`. */
    perValue?: number;
    fixed?: number;
    /** Added to the value's effect (Poison: 0.2 + 0.05 × value, as Survivors). */
    base?: number;
    /** Rolls below this become it (original minimums). */
    minValue?: number;
    /** The value is always this (original: weapon Gold 5, weapon Experience 2). */
    fixedValue?: number;
    /** Armour Experience and Gold: the value is (roll + 1) / 2, at most 2 from monsters of level 3 or less. */
    halfValue?: boolean;
    /** Put before the item's name ("Sharp Long Sword"); none = the name stays. */
    prefix?: string;
}

/** First attribute of a weapon. */
export const OFF_WEAPON_PRIMARY = {
    sharp: { name: 'Sharp', weight: 10, effect: 'damage', fixed: 0.1, prefix: 'Sharp' },
    ancient: { name: 'Ancient', weight: 1, effect: 'damage', fixed: 0.2, prefix: 'Ancient' },
    poison: { name: 'Poison', weight: 5, effect: 'poison', base: 0.2, perValue: 0.05, minValue: 4, prefix: 'Poisoning' },
    critical: { name: 'Critical', weight: 9, effect: 'critical', perValue: 1, minValue: 5, prefix: 'Critical' },
} as const satisfies Record<string, OffAttributeDef>;

/** First attribute of an armour piece or shield. */
export const OFF_ARMOR_PRIMARY = {
    light: { name: 'Light', weight: 30, effect: 'light', perValue: 0.04, minValue: 4, prefix: 'Light' },
    experience: { name: 'Experience', weight: 5.55, effect: 'experience', perValue: 0.1, halfValue: true },
    gold: { name: 'Gold', weight: 4.45, effect: 'gold', perValue: 0.1, halfValue: true },
} as const satisfies Record<string, OffAttributeDef>;

/** Second attribute of a weapon. */
export const OFF_WEAPON_SECONDARY = {
    hittingProbability: { name: 'Hitting Probability', weight: 50, effect: 'hitting', perValue: 0.07, minValue: 3 },
    gold: { name: 'Gold', weight: 10, effect: 'gold', perValue: 0.1, fixedValue: 5 },
    experience: { name: 'Experience', weight: 5, effect: 'experience', perValue: 0.1, fixedValue: 2 },
} as const satisfies Record<string, OffAttributeDef>;

/** Second attribute of an armour piece or shield. */
export const OFF_ARMOR_SECONDARY = {
    defenseRatio: { name: 'Defense Ratio', weight: 10, effect: 'defenseRatio', perValue: 0.07, minValue: 3 },
    magicResistance: { name: 'Magic Resistance', weight: 19, effect: 'magicResistance', perValue: 0.07, minValue: 3 },
    hpRecovery: { name: 'HP Recovery', weight: 10, effect: 'hpRecovery', perValue: 0.07 },
    mpRecovery: { name: 'MP Recovery', weight: 10, effect: 'mpRecovery', perValue: 0.07 },
    spRecovery: { name: 'SP Recovery', weight: 15, effect: 'spRecovery', perValue: 0.07 },
    physicalAbsorption: { name: 'Physical Absorption', weight: 4, effect: 'physicalAbsorption', perValue: 0.03, minValue: 3 },
    magicAbsorption: { name: 'Magic Absorption', weight: 2, effect: 'magicAbsorption', perValue: 0.03, minValue: 3 },
} as const satisfies Record<string, OffAttributeDef>;

export type OffPrimaryId = keyof typeof OFF_WEAPON_PRIMARY | keyof typeof OFF_ARMOR_PRIMARY;
export type OffSecondaryId = keyof typeof OFF_WEAPON_SECONDARY | keyof typeof OFF_ARMOR_SECONDARY;

export const OFF_ATTRIBUTES = {
    /** Share of the drops with a second attribute (original: 40 %). */
    secondaryChance: 0.4,
    /** Highest value (Survivors' cap, the original's for weak monsters). */
    valueMax: ATTRIBUTE_VALUE_MAX,
    /** Armour Experience / Gold: at most this value from monsters of this level or less (original). */
    halfValueCap: 2,
    halfValueCapLevel: 3,
    /** Absorptions of all the gear together never take more than this share of a hit (Survivors' number). */
    maxAbsorption: MAX_ABSORPTION,
    /** Colour of a special item's name, as the original client (green). */
    nameColor: '#40ff40',
    /** Poison on monsters: Survivors' numbers (data/attributes.ts POISON). */
    poisonTickMs: POISON.tickMs,
    poisonCureChance: POISON.cureChance,
    poisonNumberColor: POISON.numberColor,
} as const;

/** The attributes of one item. */
export interface OffRolls {
    primary?: OffPrimaryId;
    primaryValue?: number;
    secondary?: OffSecondaryId;
    secondaryValue?: number;
}

type Kind = 'weapon' | 'armor';

function primaryTable(kind: Kind): Readonly<Record<string, OffAttributeDef>> {
    return kind === 'weapon' ? OFF_WEAPON_PRIMARY : OFF_ARMOR_PRIMARY;
}

function secondaryTable(kind: Kind): Readonly<Record<string, OffAttributeDef>> {
    return kind === 'weapon' ? OFF_WEAPON_SECONDARY : OFF_ARMOR_SECONDARY;
}

export function offPrimaryDef(kind: Kind, id: OffPrimaryId): OffAttributeDef | undefined {
    return primaryTable(kind)[id];
}

export function offSecondaryDef(kind: Kind, id: OffSecondaryId): OffAttributeDef | undefined {
    return secondaryTable(kind)[id];
}

// ---- Rolls ----

function pickWeighted(table: Readonly<Record<string, OffAttributeDef>>, random: () => number): string | undefined {
    const entries = Object.entries(table);
    const total = entries.reduce((sum, [, def]) => sum + def.weight, 0);
    let roll = random() * total;
    for (const [id, def] of entries) {
        if (roll < def.weight) return id;
        roll -= def.weight;
    }
    return entries[entries.length - 1]?.[0];
}

/** A value 1..13 with the original's table, capped at OFF_ATTRIBUTES.valueMax. */
function rollValue(random: () => number): number {
    const total = ATTRIBUTE_VALUE_WEIGHTS.reduce((sum, w) => sum + w, 0);
    let roll = random() * total;
    let value = ATTRIBUTE_VALUE_WEIGHTS.length;
    for (let i = 0; i < ATTRIBUTE_VALUE_WEIGHTS.length; i++) {
        const weight = ATTRIBUTE_VALUE_WEIGHTS[i] ?? 0;
        if (roll < weight) {
            value = i + 1;
            break;
        }
        roll -= weight;
    }
    return Math.min(value, OFF_ATTRIBUTES.valueMax);
}

/** The value an attribute gets, with its minimum, fixed value or halving. Undefined when it has no value. */
function valueFor(def: OffAttributeDef, monsterLevel: number, random: () => number): number | undefined {
    if (def.perValue === undefined) return undefined;
    if (def.fixedValue !== undefined) return def.fixedValue;
    let value = Math.max(rollValue(random), def.minValue ?? 1);
    if (def.halfValue) {
        value = Math.max(1, Math.floor((value + 1) / 2));
        if (monsterLevel <= OFF_ATTRIBUTES.halfValueCapLevel) value = Math.min(value, OFF_ATTRIBUTES.halfValueCap);
    }
    return value;
}

/** The attributes of a weapon or armour that a monster of that level drops (always a first one; 40 % a second). */
export function rollOffAttributes(kind: Kind, monsterLevel: number, random: () => number = Math.random): OffRolls {
    const rolls: OffRolls = {};
    const primary = pickWeighted(primaryTable(kind), random) as OffPrimaryId | undefined;
    if (primary) {
        rolls.primary = primary;
        const def = offPrimaryDef(kind, primary);
        const value = def ? valueFor(def, monsterLevel, random) : undefined;
        if (value !== undefined) rolls.primaryValue = value;
    }
    if (random() < OFF_ATTRIBUTES.secondaryChance) {
        const secondary = pickWeighted(secondaryTable(kind), random) as OffSecondaryId | undefined;
        const def = secondary ? offSecondaryDef(kind, secondary) : undefined;
        const value = def ? valueFor(def, monsterLevel, random) : undefined;
        if (secondary && value !== undefined) {
            rolls.secondary = secondary;
            rolls.secondaryValue = value;
        }
    }
    return rolls;
}

// ---- Text form ("longSword:sharp:hittingProbability4") ----

/** "sharp", "poison6": the attribute and its value. */
function token(id: string | undefined, value: number | undefined): string {
    return id ? `${id}${value ?? ''}` : '';
}

function readToken(text: string | undefined): { id: string; value?: number } | undefined {
    if (!text) return undefined;
    const match = /^([a-zA-Z]+)(\d+)?$/.exec(text);
    if (!match?.[1]) return undefined;
    return match[2] ? { id: match[1], value: Number(match[2]) } : { id: match[1] };
}

/** The rolls written after an item's id ('' when none). */
export function offRollsText(rolls: Readonly<OffRolls>): string {
    const first = token(rolls.primary, rolls.primaryValue);
    const second = token(rolls.secondary, rolls.secondaryValue);
    if (!first && !second) return '';
    return second ? `:${first}:${second}` : `:${first}`;
}

/**
 * The rolls of "sharp:hittingProbability4" (the part after the id) for that kind of item. Unknown attributes are left
 * out; values go back within 1..valueMax (or to the fixed value).
 */
export function readOffRolls(kind: Kind, parts: readonly string[]): OffRolls {
    const rolls: OffRolls = {};
    const first = readToken(parts[0]);
    if (first && first.id in primaryTable(kind)) {
        rolls.primary = first.id as OffPrimaryId;
        const def = offPrimaryDef(kind, rolls.primary);
        const value = def ? cleanValue(def, first.value) : undefined;
        if (value !== undefined) rolls.primaryValue = value;
    }
    const second = readToken(parts[1]);
    if (second && second.id in secondaryTable(kind)) {
        const def = offSecondaryDef(kind, second.id as OffSecondaryId);
        const value = def ? cleanValue(def, second.value) : undefined;
        if (value !== undefined) {
            rolls.secondary = second.id as OffSecondaryId;
            rolls.secondaryValue = value;
        }
    }
    return rolls;
}

function cleanValue(def: OffAttributeDef, value: number | undefined): number | undefined {
    if (def.perValue === undefined) return undefined;
    if (def.fixedValue !== undefined) return def.fixedValue;
    const min = def.minValue ?? 1;
    return Math.max(min, Math.min(OFF_ATTRIBUTES.valueMax, Math.round(value ?? min)));
}

// ---- What they do and how they read ----

function amountOf(def: OffAttributeDef, value: number | undefined): number {
    if (def.perValue === undefined) return def.fixed ?? 0;
    return (def.base ?? 0) + def.perValue * (value ?? 1);
}

/** What an item's attributes add, effect by effect. */
export function offRollEffects(kind: Kind, rolls: Readonly<OffRolls>): OffAttributeEffects {
    const effects: OffAttributeEffects = {};
    const add = (def: OffAttributeDef | undefined, value: number | undefined) => {
        if (def) effects[def.effect] = (effects[def.effect] ?? 0) + amountOf(def, value);
    };
    if (rolls.primary) add(offPrimaryDef(kind, rolls.primary), rolls.primaryValue);
    if (rolls.secondary) add(offSecondaryDef(kind, rolls.secondary), rolls.secondaryValue);
    return effects;
}

export function addOffEffects(into: OffAttributeEffects, more: Readonly<OffAttributeEffects>): void {
    for (const [effect, amount] of Object.entries(more) as Array<[OffAttributeEffect, number]>) into[effect] = (into[effect] ?? 0) + amount;
}

export function hasOffRolls(rolls: Readonly<OffRolls>): boolean {
    return rolls.primary !== undefined || rolls.secondary !== undefined;
}

/** "Sharp Long Sword", "Light Chain Mail" (the first attribute's prefix, if it has one). */
export function offRolledName(kind: Kind, name: string, rolls: Readonly<OffRolls>): string {
    const prefix = rolls.primary ? offPrimaryDef(kind, rolls.primary)?.prefix : undefined;
    return prefix ? `${prefix} ${name}` : name;
}

const percent = (amount: number): string => `${Math.round(amount * 100)}%`;

function line(def: OffAttributeDef, value: number | undefined): string {
    const amount = amountOf(def, value);
    switch (def.effect) {
        case 'damage': return `Damage +${percent(amount)}`;
        case 'poison': return `Poison ${value ?? ''}: poisons what you hit`;
        case 'critical': return `Critical Damage +${value ?? 0}`;
        case 'light': return `Weight -${percent(amount)}`;
        default: return `${def.name} +${percent(amount)}`;
    }
}

/** The lines the item box shows under the name, first attribute then second. */
export function offRollLines(kind: Kind, rolls: Readonly<OffRolls>): string[] {
    const lines: string[] = [];
    const first = rolls.primary ? offPrimaryDef(kind, rolls.primary) : undefined;
    if (first) lines.push(line(first, rolls.primaryValue));
    const second = rolls.secondary ? offSecondaryDef(kind, rolls.secondary) : undefined;
    if (second) lines.push(line(second, rolls.secondaryValue));
    return lines;
}
