// Atributos de las armas y, desde la Fase 24A, de las armaduras (Fase 21B; decididos por el propietario el 20-oct-2026, docs/DECISIONES.md):
// - Solo armas: las del Guerrero y las varitas de la Maga. Poison nunca sale en una varita.
// - Probabilidad al caer (hasta la Fase 24A): Ancient 1%, Poison 5%, Sharp 10% (el resto, normal). Desde la 24A, siempre uno.
// - Sharp +10% de daño y Ancient +20% (el original sumaba +1 o +2 al dado, ≈ +11% y +22%). En la Maga, a sus hechizos.
// - Las cartas Xelima también suben las armas Ancient (el original no lo dejaba; el propietario prefirió ignorarlo).
// - Poison, como el veneno de los jugadores del original (reference/Server.cpp:33105, PoisonEffect): al golpear envenena
//   si el monstruo no lo estaba; cada tic quita 1d(nivel) y tiene un 10% de curarse solo (no dura un tiempo fijo). A
//   diferencia del jugador, PUEDE MATAR (propietario, 20-oct-2026; como el Poison Cloud del original con los monstruos).
//   El nivel es número NUESTRO: parte del golpe que envenenó. Mientras dura, la nube verde del original encima
//   (effect9 hoja 15, Client.cpp:42148). Números verdes.
// - Color del arma (Server.cpp:48721 y Client.cpp:702): el original tiñe el DIBUJO del arma según el atributo, sumando
//   un poco a cada píxel (en la mano, el icono y el suelo): Sharp "Heavy-blue", Poisoning "Green", Ancient "Violet".
// Fase 24A (propietario, 21-oct-2026): ya no caen armas ni armaduras básicas (se compran al herrero, 24C). Todo lo que
// cae trae un atributo: las armas, Sharp, Poison o Ancient (con los mismos pesos 10/5/1 de antes); las armaduras, uno de
// los "stats" de las armaduras del original con sus nombres (docs/hb-wiki/armaduras.md, "Armor Attributes"):
// HP Recovery, MP Recovery, Defense Ratio y Magic Resistance. Valores fijos nuestros. MP Recovery solo en la ropa de la
// Maga; desde la Fase 26A rellena el maná un 30% más deprisa.
// Revisión del original C (1-nov-2026, docs/REVISION-ORIGINAL.md): cada atributo con valor del 1 al 13 (tabla del
// original; tope 7 en monstruos normales) y el 40 % del botín con un segundo atributo (SECONDARY_ATTRIBUTES). Cada punto
// vale +7 % (absorciones +3 %, Gold y Experience +10 %); Sharp y Ancient siguen fijos. Los objetos guardados antes no
// tienen valor y cuentan como `legacyValue` (lo más parecido a lo que daban, nunca menos).
import type { ArmorSetId } from './armor';
import type { AddedColor } from '../hb/playerAppearance';

export type WeaponAttribute = 'sharp' | 'poison' | 'ancient';
export type ArmorAttribute = 'hpRecovery' | 'mpRecovery' | 'defenseRatio' | 'magicResistance';
export type ItemAttribute = WeaponAttribute | ArmorAttribute;

export const WEAPON_ATTRIBUTES: readonly WeaponAttribute[] = ['sharp', 'poison', 'ancient'];
export const ARMOR_ATTRIBUTES: readonly ArmorAttribute[] = ['hpRecovery', 'defenseRatio', 'magicResistance', 'mpRecovery'];
export const ITEM_ATTRIBUTES: readonly ItemAttribute[] = [...WEAPON_ATTRIBUTES, ...ARMOR_ATTRIBUTES];

/**
 * What an attribute does (Revisión del original C, 1-nov-2026). Every attribute, first or second, adds to one of these;
 * the Equipment adds them up over the weapon in hand and the armor worn.
 * damage: +x of the weapon's damage · poison: hits poison, its level a share x of the blow · hpRecovery / mpRecovery:
 * +x regeneration · defenseRatio / magicResistance: the player's total ×(1 + x) · hitting: blows and spells land more,
 * hit ratio ×(1 + x) · gold / experience: +x of the gold and EXP picked up · physicalAbsorption / magicAbsorption: −x of
 * the damage of blows and arrows / of spells.
 */
export type AttributeEffect =
    | 'damage' | 'poison' | 'hpRecovery' | 'mpRecovery' | 'defenseRatio' | 'magicResistance'
    | 'hitting' | 'gold' | 'experience' | 'physicalAbsorption' | 'magicAbsorption';

export type AttributeEffects = Partial<Record<AttributeEffect, number>>;

/** What any attribute, first or second, has. */
interface AttributeBase {
    kind: 'weapon' | 'armor';
    name: string;
    /** Short name for tight lists (the blacksmith's rows: "Plate Mail (HP Rec +21%)"). */
    short: string;
    /** Weight in the roll among the attributes the item can have. */
    weight: number;
    effect: AttributeEffect;
    /**
     * Effect per point of value (1–13, ATTRIBUTE_VALUE_WEIGHTS): 0.07 = +7% per point (original: secondaries ×7%,
     * absorptions ×3%, Gold and Experience ×10%). Missing = the attribute has no value and gives `fixed` (Sharp, Ancient).
     */
    perValue?: number;
    /** Effect without value (Sharp +10%, Ancient +20%). */
    fixed?: number;
    /** Effect = base + perValue × value (Poison: 0.2 + 0.05 × value). */
    base?: number;
    /** Lowest value it can have (original: Poisoning ≥4, Defense Ratio ≥3...): a lower roll is raised to it. */
    minValue?: number;
    /** Armor attributes only on that set's pieces (MP Recovery: the Mage's clothes). */
    onlySet?: ArmorSetId;
    /** Colour of the name (cards, Equipment) and of the frame on the end screen. */
    color: number;
}

export interface AttributeDef extends AttributeBase {
    /** Whether a wand can have it (weapon attributes). */
    onWands: boolean;
    /**
     * Value of an item saved before values existed (before 1-nov-2026): the one closest to what it gave then, never
     * less (HP Recovery +30% → 4, +28%; Defense Ratio +10 → 3, +21%; Magic Resistance +8 → 4, +28%; Poison 40% → 4).
     */
    legacyValue?: number;
    /**
     * Weapons: added to every pixel of the weapon's picture (in hand, icon, ground): the original's weapon colour minus its
     * base RGB(100,100,100) (reference/Client.cpp:705-709). Armor isn't tinted.
     */
    pictureAdd?: readonly [number, number, number];
}

const WHITE_GREY = 0xe0e0e0;

export const ATTRIBUTES: Readonly<Record<ItemAttribute, AttributeDef>> = {
    ancient: {
        kind: 'weapon', name: 'Ancient', short: 'Ancient', weight: 1, effect: 'damage', fixed: 0.2, onWands: true, color: 0xff90e0, pictureAdd: [20, 0, 20],
    },
    poison: {
        kind: 'weapon', name: 'Poison', short: 'Poison', weight: 5, effect: 'poison', base: 0.2, perValue: 0.05, minValue: 4, legacyValue: 4, onWands: false,
        color: 0x60e060, pictureAdd: [-30, 0, -30],
    },
    sharp: {
        kind: 'weapon', name: 'Sharp', short: 'Sharp', weight: 10, effect: 'damage', fixed: 0.1, onWands: true, color: 0x80c8ff, pictureAdd: [-58, -47, 11],
    },
    hpRecovery: {
        kind: 'armor', name: 'HP Recovery', short: 'HP Rec', weight: 30, effect: 'hpRecovery', perValue: 0.07, legacyValue: 4, onWands: false, color: 0xff8070,
    },
    defenseRatio: {
        kind: 'armor', name: 'Defense Ratio', short: 'DR', weight: 30, effect: 'defenseRatio', perValue: 0.07, minValue: 3, legacyValue: 3, onWands: false,
        color: 0xffd060,
    },
    magicResistance: {
        kind: 'armor', name: 'Magic Resistance', short: 'MR', weight: 25, effect: 'magicResistance', perValue: 0.07, minValue: 3, legacyValue: 4, onWands: false,
        color: 0xc090ff,
    },
    mpRecovery: {
        kind: 'armor', name: 'MP Recovery', short: 'MP Rec', weight: 15, effect: 'mpRecovery', perValue: 0.07, legacyValue: 4, onWands: false, onlySet: 'mage',
        color: 0x70b0ff,
    },
};

/**
 * Second attributes (Revisión del original C): 40% of the items that drop have one besides the first, as in the
 * original (NpcDeadItemGenerator, Server.cpp:48238; weights and minimums from there, docs/REVISION-ORIGINAL.md).
 * Left out: Consecutive Attack Damage (no "blows in a row" here), Poison Resistance (monsters don't poison) and SP
 * Recovery (no SP). Weapons and wands: Hitting Probability, Gold, Experience. Armor: the rest.
 */
export type SecondaryAttribute =
    | 'hittingProbability' | 'gold' | 'experience'
    | 'defenseRatio2' | 'magicResistance2' | 'hpRecovery2' | 'mpRecovery2' | 'physicalAbsorption' | 'magicAbsorption';

export type SecondaryDef = AttributeBase;

export const SECONDARY_ATTRIBUTES: Readonly<Record<SecondaryAttribute, SecondaryDef>> = {
    hittingProbability: { kind: 'weapon', name: 'Hitting Probability', short: 'Hit', weight: 50, effect: 'hitting', perValue: 0.07, minValue: 3, color: WHITE_GREY },
    gold: { kind: 'weapon', name: 'Gold', short: 'Gold', weight: 10, effect: 'gold', perValue: 0.1, color: 0xffd700 },
    experience: { kind: 'weapon', name: 'Experience', short: 'EXP', weight: 5, effect: 'experience', perValue: 0.1, color: 0x90ff90 },
    defenseRatio2: { kind: 'armor', name: 'Defense Ratio', short: 'DR', weight: 10, effect: 'defenseRatio', perValue: 0.07, minValue: 3, color: WHITE_GREY },
    magicResistance2: { kind: 'armor', name: 'Magic Resistance', short: 'MR', weight: 19, effect: 'magicResistance', perValue: 0.07, minValue: 3, color: WHITE_GREY },
    hpRecovery2: { kind: 'armor', name: 'HP Recovery', short: 'HP Rec', weight: 10, effect: 'hpRecovery', perValue: 0.07, color: WHITE_GREY },
    mpRecovery2: { kind: 'armor', name: 'MP Recovery', short: 'MP Rec', weight: 10, effect: 'mpRecovery', perValue: 0.07, onlySet: 'mage', color: WHITE_GREY },
    physicalAbsorption: { kind: 'armor', name: 'Physical Absorption', short: 'Phys Abs', weight: 4, effect: 'physicalAbsorption', perValue: 0.03, minValue: 3, color: WHITE_GREY },
    magicAbsorption: { kind: 'armor', name: 'Magic Absorption', short: 'Mag Abs', weight: 2, effect: 'magicAbsorption', perValue: 0.03, minValue: 3, color: WHITE_GREY },
};

export const SECONDARY_ATTRIBUTE_IDS = Object.keys(SECONDARY_ATTRIBUTES) as SecondaryAttribute[];

/**
 * Chance of each value 1..13 (original, 1d30000): 1 = 33.3% · 2 = 24.7% · 3 = 16.7% · 4 = 10% · 5 = 6.7% · 6 = 3.3% ·
 * 7 = 1.7% · 8 = 1.3% · 9 = 1% · 10 = 0.67% · 11 = 0.33% · 12 = 0.23% · 13 = 0.1%.
 */
export const ATTRIBUTE_VALUE_WEIGHTS: readonly number[] = [10000, 7400, 5000, 3000, 2000, 1000, 500, 400, 300, 200, 100, 70, 30];
export const ATTRIBUTE_VALUE_MAX = ATTRIBUTE_VALUE_WEIGHTS.length;

/** Highest value an item from an ordinary monster can have (original: weak monsters, iGenLevel ≤ 2, top out at 7). Elites, bosses and the Champion reach 13. */
export const ATTRIBUTE_VALUE_CAP_NORMAL = 7;

/** Share of the dropped items with a second attribute (original: 40%). */
export const SECONDARY_ATTRIBUTE_CHANCE = 0.4;

/** Absorptions of all the armor together never remove more than this share of a hit (our number). */
export const MAX_ABSORPTION = 0.6;

/** The attributes of one item: the first (with its value, when it has one) and maybe a second. */
export interface ItemRolls {
    attribute?: ItemAttribute;
    /** 1–13; missing on items saved before values existed (they count as `legacyValue`). */
    attributeValue?: number;
    secondary?: SecondaryAttribute;
    secondaryValue?: number;
}

/** The first attribute's value (its legacyValue on old items); undefined when it has none (Sharp, Ancient). */
export function attributeValueOf(rolls: Readonly<ItemRolls>): number | undefined {
    const def = rolls.attribute ? ATTRIBUTES[rolls.attribute] : undefined;
    if (!def || def.perValue === undefined) return undefined;
    return rolls.attributeValue ?? def.legacyValue ?? 1;
}

function effectAmount(def: AttributeBase, value: number | undefined): number {
    if (def.perValue === undefined) return def.fixed ?? 0;
    return (def.base ?? 0) + def.perValue * (value ?? 1);
}

/** What an item's attributes add, effect by effect. */
export function rollEffects(rolls: Readonly<ItemRolls>): AttributeEffects {
    const effects: AttributeEffects = {};
    if (rolls.attribute) {
        const def = ATTRIBUTES[rolls.attribute];
        effects[def.effect] = (effects[def.effect] ?? 0) + effectAmount(def, attributeValueOf(rolls));
    }
    if (rolls.secondary && rolls.secondaryValue) {
        const def = SECONDARY_ATTRIBUTES[rolls.secondary];
        effects[def.effect] = (effects[def.effect] ?? 0) + effectAmount(def, rolls.secondaryValue);
    }
    return effects;
}

/** Adds `more` into `into`. */
export function addEffects(into: AttributeEffects, more: Readonly<AttributeEffects>): void {
    for (const [effect, amount] of Object.entries(more) as Array<[AttributeEffect, number]>) into[effect] = (into[effect] ?? 0) + amount;
}

const percent = (amount: number): string => `+${Math.round(amount * 100)}%`;

/** The line of the first attribute ("Sharp: +10% damage", "HP Recovery +21%", "Poison 6: poisons..."). */
export function attributeLine(rolls: Readonly<ItemRolls>): { text: string; color: number } | undefined {
    if (!rolls.attribute) return undefined;
    const def = ATTRIBUTES[rolls.attribute];
    const value = attributeValueOf(rolls);
    const amount = effectAmount(def, value);
    let text: string;
    if (def.effect === 'damage') text = `${def.name}: ${percent(amount)} damage`;
    else if (def.effect === 'poison') text = `${def.name} ${value ?? ''}: poisons the monsters you hit`;
    else text = `${def.name} ${percent(amount)}${def.effect === 'defenseRatio' ? ' (dodge)' : ''}`;
    return { text, color: def.color };
}

/** The line of the second attribute ("Physical Absorption +9%"), if the item has one. */
export function secondaryLine(rolls: Readonly<ItemRolls>): { text: string; color: number } | undefined {
    if (!rolls.secondary || !rolls.secondaryValue) return undefined;
    const def = SECONDARY_ATTRIBUTES[rolls.secondary];
    return { text: `${def.name} ${percent(effectAmount(def, rolls.secondaryValue))}`, color: def.color };
}

/**
 * Short form of what the item's name doesn't say, for tight lists: the armor attribute and the second one
 * ("HP Rec +91%, Phys Abs +15%"); '' if none.
 */
export function attributesShort(rolls: Readonly<ItemRolls>): string {
    const parts: string[] = [];
    const first = rolls.attribute ? ATTRIBUTES[rolls.attribute] : undefined;
    if (first && first.kind === 'armor') parts.push(`${first.short} ${percent(effectAmount(first, attributeValueOf(rolls)))}`);
    if (rolls.secondary && rolls.secondaryValue) {
        const second = SECONDARY_ATTRIBUTES[rolls.secondary];
        parts.push(`${second.short} ${percent(effectAmount(second, rolls.secondaryValue))}`);
    }
    return parts.join(', ');
}

/** Both lines as one sentence for the panels' detail text ("HP Recovery +21%, Gold +30%."), or ''. */
export function attributesSentence(rolls: Readonly<ItemRolls>): string {
    const lines = [attributeLine(rolls), secondaryLine(rolls)].filter((line) => line !== undefined).map((line) => line.text);
    return lines.length > 0 ? ` ${lines.join(', ')}.` : '';
}

/** Poison on a monster (original: PoisonEffect, Server.cpp:33105). */
export const POISON = {
    /** Time between ticks (the original's DEF_POISONTIME isn't in the reference: our number). */
    tickMs: 1000,
    // Poison level = a share of the blow that poisoned (the Poison attribute: 0.2 + 0.05 × value, 0.4 at value 4 as
    // before values existed); each tick takes 1d(level), about half of it.
    /** Chance of being cured after each tick (the original's minimum, 10%, for a monster without resistance). */
    cureChance: 0.1,
    /** Green numbers of each tick. */
    numberColor: '#60e060',
    /** The original's poison cloud over the poisoned one, drawn 70% opaque (Client.cpp:42148, PutTransSprite70). */
    cloudAlpha: 0.7,
} as const;

export function isItemAttribute(value: unknown): value is ItemAttribute {
    return typeof value === 'string' && (ITEM_ATTRIBUTES as readonly string[]).includes(value);
}

export function isSecondaryAttribute(value: unknown): value is SecondaryAttribute {
    return typeof value === 'string' && (SECONDARY_ATTRIBUTE_IDS as readonly string[]).includes(value);
}

/** Sharp or Ancient: extra damage of the weapon (0.1 = +10%); 0 for the rest. */
export function attributeDamageBonus(attribute: ItemAttribute | undefined): number {
    const def = attribute ? ATTRIBUTES[attribute] : undefined;
    return def?.effect === 'damage' ? def.fixed ?? 0 : 0;
}

/** The colour added to a weapon's picture with that attribute (undefined without one). */
export function attributeColor(attribute: ItemAttribute | undefined): AddedColor | undefined {
    const add = attribute ? ATTRIBUTES[attribute].pictureAdd : undefined;
    return attribute && add ? { id: `attr-${attribute}`, add } : undefined;
}
