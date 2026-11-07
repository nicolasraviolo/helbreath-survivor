// Helbreath Off (Fase Off-6B): las cuentas de lanzar una magia, del servidor original (reference/Server.cpp,
// PlayerMagicHandler y bCheckResistingMagicSuccess). Los números están en off/data/offSpells.ts (OFF_CASTING).
// - Si sale o falla: depende de la habilidad (MAG × 2, decisión del propietario), el círculo, la INT y el nivel.
// - Si el monstruo la resiste: el acierto de la magia contra su resistencia.
// - El daño: los dados de la magia con el bonus de MAG y el elemento (±20 %, como Survivors).
import Phaser from 'phaser';
import { elementMatch, elementMultiplier, type ElementMatch, type MagicElement } from '../../data/elements';
import { OFF_CASTING, type OffSpellDef, type OffSpellDice } from '../data/offSpells';
import { rollDice } from './OffCombatRules';

/** What the caster brings: its level and stats. */
export interface OffCaster {
    level: number;
    int: number;
    mag: number;
}

/** The original's Magic skill, from the MAG (owner): MAG × 2, up to 100. */
export function offMagicSkill(mag: number): number {
    return Math.min(OFF_CASTING.maxSkill, mag * OFF_CASTING.skillPerMag);
}

/** Server: a circle above level / 10 loses part of its penalty; one below gains a little. */
function levelAdjustment(circle: number, level: number): number {
    const c = OFF_CASTING;
    const levelCircle = Math.floor(level / c.levelsPerCircle);
    if (circle === levelCircle) return 0;
    const gap = Math.abs(circle - levelCircle);
    if (circle < levelCircle) return c.lowerCircleBonus * gap;
    const penalty = gap * (c.levelPenalty[circle] ?? 0);
    const intoTen = level - levelCircle * c.levelsPerCircle;
    const earned = Math.trunc((intoTen / (gap * c.levelsPerCircle)) * penalty);
    return -Math.abs(penalty - earned);
}

/** Chance (%) that casting a spell of this circle works; 100 or more = never fails. */
export function offCastChance(circle: number, caster: OffCaster): number {
    const c = OFF_CASTING;
    let chance = Math.trunc((offMagicSkill(caster.mag) / 100) * (c.circleChance[circle] ?? 0));
    if (caster.int > c.statBonusFrom) chance += Math.floor((caster.int - c.statBonusFrom) / c.intDivisor);
    chance += levelAdjustment(circle, caster.level);
    return Math.max(1, chance);
}

/** Rolls whether the cast works (server: 1d100 must not beat the chance). */
export function rollCastWorks(circle: number, caster: OffCaster): boolean {
    const chance = offCastChance(circle, caster);
    return chance >= OFF_CASTING.sureChance || Phaser.Math.Between(1, 100) <= chance;
}

/** How well the spell gets through magic resistance: skill + (MAG − 50) above 50, with the level adjustment. */
export function offMagicHit(circle: number, caster: OffCaster): number {
    const c = OFF_CASTING;
    let hit = offMagicSkill(caster.mag);
    if (caster.mag > c.statBonusFrom) hit += caster.mag - c.statBonusFrom;
    hit += levelAdjustment(circle, caster.level);
    return Math.max(1, hit);
}

/** Chance (%) that the spell gets through a monster's resistance. */
export function offLandChance(hit: number, resist: number): number {
    const c = OFF_CASTING;
    const chance = Math.trunc((hit / Math.max(1, resist)) * c.resistFactor);
    return Phaser.Math.Clamp(chance, c.resistMinPercent, c.resistMaxPercent);
}

/** Rolls whether the monster resists (true = no effect on it). */
export function rollResisted(hit: number, resist: number): boolean {
    return Phaser.Math.Between(1, 100) > offLandChance(hit, resist);
}

/** Time to prepare a spell (owner): 2 s at MAG 10, 1 s from MAG 50, in a straight line between. */
export function offPrepareMs(mag: number): number {
    const p = OFF_CASTING.prepare;
    const t = Phaser.Math.Clamp((mag - p.slowMag) / (p.fastMag - p.slowMag), 0, 1);
    return Math.round(p.slowMs + (p.fastMs - p.slowMs) * t);
}

/** One roll of a spell's dice with the MAG bonus and the element against the monster (at least 1). */
export function rollSpellDamage(dice: OffSpellDice, mag: number, match: ElementMatch): number {
    const [count, sides, bonus] = dice;
    const raw = rollDice(count, sides) + bonus;
    const withMag = raw * (1 + mag / OFF_CASTING.magDivisor / 100);
    return Math.max(1, Math.round(withMag * elementMultiplier(match)));
}

/** How the spell's element fares against the monster's. */
export function offElementMatch(spell: OffSpellDef, monsterElement: MagicElement): ElementMatch {
    return elementMatch(spell.element, monsterElement);
}
