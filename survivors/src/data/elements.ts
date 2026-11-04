// Elementos y quemadura (propietario, 4-nov-2026: "daño de fuego como en Olympia").
// - Elementos de la wiki de Olympia (docs/hb-wiki/hechizos.md "Elements", monstruos.md columna Element): un hechizo hace
//   +20% al elemento débil del monstruo y −20% a su mismo elemento; el resto, normal. Los golpes con arma no tienen elemento.
// - Quemadura: Olympia la tiene (se acumula hasta 3 veces y puede aturdir) pero no publica sus números: los de aquí son
//   nuestros, para ajustar jugando.
import type { SpellFamilyId } from './spells';

export type MagicElement = 'earth' | 'fire' | 'lightning' | 'ice' | 'neutral';
/** What a spell can be (no neutral spells). */
export type SpellElement = Exclude<MagicElement, 'neutral'>;

/** The monster element each spell element hits harder (Olympia's table). Against its own element it hits softer. */
export const ELEMENT_STRONG_AGAINST: Readonly<Record<SpellElement, MagicElement>> = {
    fire: 'earth',
    ice: 'fire',
    lightning: 'ice',
    earth: 'lightning',
};

export const ELEMENT_MODIFIER = {
    /** Spell against the element it beats. */
    bonus: 1.2,
    /** Spell against its own element. */
    penalty: 0.8,
} as const;

/**
 * Colour of a spell's damage numbers by its element (propietario, 4-nov-2026: base white, fire red, critical orange).
 * Weapon hits have no element and stay white; the burn ticks use the fire colour.
 */
export const ELEMENT_NUMBER_COLOR: Readonly<Record<SpellElement, string>> = {
    fire: '#ff3030',
    ice: '#70c8ff',
    lightning: '#ffe040',
    earth: '#c89050',
};

/** The automatic spells' element by family. In Olympia every Energy spell is Lightning. */
export const SPELL_FAMILY_ELEMENT: Readonly<Record<SpellFamilyId, SpellElement>> = {
    energy: 'lightning',
    fire: 'fire',
    lightning: 'lightning',
    ice: 'ice',
};

export type ElementMatch = 'bonus' | 'penalty' | 'neutral';

/** How a spell of `attack` fares against a monster of `target`. */
export function elementMatch(attack: SpellElement | undefined, target: MagicElement): ElementMatch {
    if (!attack || target === 'neutral') return 'neutral';
    if (ELEMENT_STRONG_AGAINST[attack] === target) return 'bonus';
    return attack === target ? 'penalty' : 'neutral';
}

export function elementMultiplier(match: ElementMatch): number {
    if (match === 'bonus') return ELEMENT_MODIFIER.bonus;
    return match === 'penalty' ? ELEMENT_MODIFIER.penalty : 1;
}

/**
 * Burn: every fire spell hit that doesn't kill adds a layer (up to `maxStacks`, as in Olympia) and restarts the fire.
 * Every `tickMs` each layer takes `shareOfHit` of the hit that lit it. Each tick may stun it for a moment.
 */
export const BURN = {
    maxStacks: 3,
    durationMs: 3000,
    tickMs: 1000,
    shareOfHit: 0.1,
    stunChance: 0.1,
    stunMs: 300,
    /** Little fire at its feet while it burns: the original's Positional Fire 1 (config/effects.ts), smaller. */
    flameScale: 0.6,
    flameAlpha: 0.9,
} as const;
