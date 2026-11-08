// Helbreath Off (Fase Off-7D): calculadora de equilibrio. Solo desarrollo: la carga `pnpm check offbalance` con lo que
// midieron las situaciones offfarm* (.check/offfarm.json); el juego no la usa.
// - Ritmo de niveles: cada nivel se caza en el sitio medido más alto que no pase de él, con sus muertes por minuto;
//   la experiencia por muerte sale de offKillExp (media de la del monstruo), probada con varios multiplicadores.
// - Oro: oro que cae por minuto (con goldMultiplier) frente a lo que cuestan las pociones bebidas y el equipo de cada
//   personaje medido.
// - Magias: daño medio por lanzamiento contra un monstruo (directo + área en su casilla), contando fallar al lanzar y
//   que el monstruo la resista, frente al golpe del arma de un guerrero del mismo nivel.
import { offMaxMana } from '../data/offCharacter';
import { offAttackMs } from '../data/offCombat';
import { OFF_GOODS } from '../data/offGoods';
import { isOffItemId, OFF_ITEMS, type OffWeaponItem } from '../data/offItems';
import { OFF_LEVEL, offExpForLevel, offKillExp } from '../data/offLevel';
import { OFF_LOOT } from '../data/offLoot';
import { isOffMonsterId, OFF_MONSTERS, type OffMonsterId } from '../data/offMonsters';
import { OFF_CASTING, OFF_SPELLS, type OffSpellDice, type OffSpellId } from '../data/offSpells';
import { offCastChance, offElementMatch, offLandChance, offMagicHit, offPrepareMs } from '../systems/OffSpellRules';
import { offHitChance, offPlayerHitRatio } from '../systems/OffCombatRules';
import { elementMultiplier } from '../../data/elements';

/** One offfarm* result (scripts/check.mjs). */
export interface OffFarmSample {
    level: number;
    monster: string;
    gear: string;
    seconds: number;
    died: boolean;
    kills: number;
    killsPerMin: number;
    goldPerMin: number;
    potionsPerMin: number;
    valuablesPerMin: number;
    hurtPerMin: number;
    drunk: number;
}

/** Experience multipliers tried for the level pace (the current one first). */
const EXP_MULTIPLIERS = [OFF_LEVEL.expMultiplier, 0.05, 0.1, 0.25];
/** Owner (8-nov-2026, Off-7D): hours of hunting from level 1 to the top milestone. */
const TARGET_HOURS = 3.5;
/** Levels whose total time is reported. */
const MILESTONES = [5, 10, 20, 30, 40, 50, 60];
/** Mage builds for the spell table: level, INT, MAG. */
const MAGES = [
    { level: 20, int: 30, mag: 40 },
    { level: 40, int: 50, mag: 60 },
    { level: 60, int: 60, mag: 90 },
];
/** Warrior compared with each mage (same level): weapon, STR, DEX. */
const WARRIORS: Record<number, { weapon: keyof typeof OFF_ITEMS; str: number; dex: number }> = {
    20: { weapon: 'broadSword', str: 34, dex: 30 },
    40: { weapon: 'greatSword', str: 55, dex: 50 },
    60: { weapon: 'flamberge', str: 90, dex: 60 },
};
/** Monsters each spell row is tried against. */
const SPELL_TARGETS: readonly OffMonsterId[] = ['orc', 'skeleton', 'clayGolem', 'troll'];

const round = (value: number, digits = 1): number => Math.round(value * 10 ** digits) / 10 ** digits;
const diceAverage = ([count, sides, bonus]: OffSpellDice): number => (count * (sides + 1)) / 2 + bonus;
const averageExp = (monster: OffMonsterId): number => (OFF_MONSTERS[monster].exp[0] + OFF_MONSTERS[monster].exp[1]) / 2;

function samplesOf(raw: Record<string, OffFarmSample>): (OffFarmSample & { name: string; monster: OffMonsterId })[] {
    return Object.entries(raw)
        .filter(([name, s]) => isOffMonsterId(s.monster) && !name.endsWith('naked') && s.kills > 0)
        .map(([name, s]) => ({ ...s, name, monster: s.monster as OffMonsterId }))
        .sort((a, b) => a.level - b.level);
}

type Samples = ReturnType<typeof samplesOf>;

/** The spot hunted at that level: the highest measured one not above it. */
function spotFor(samples: Samples, level: number): Samples[number] {
    return [...samples].reverse().find((s) => s.level <= level) ?? samples[0];
}

/** Minutes of hunting from `from` to `to` with that experience multiplier. */
function minutesBetween(samples: Samples, from: number, to: number, multiplier: number): number {
    let minutes = 0;
    for (let level = from; level < to; level++) {
        const spot = spotFor(samples, level);
        const need = offExpForLevel(level + 1) - offExpForLevel(level);
        const expPerKill = offKillExp(averageExp(spot.monster), level) * (multiplier / OFF_LEVEL.expMultiplier);
        minutes += need / Math.max(1, expPerKill * spot.killsPerMin);
    }
    return minutes;
}

/** Experience multiplier that makes level 1 → top milestone take TARGET_HOURS. */
function suggestedExpMultiplier(samples: Samples): number {
    const top = MILESTONES[MILESTONES.length - 1];
    const hoursNow = minutesBetween(samples, 1, top, OFF_LEVEL.expMultiplier) / 60;
    return OFF_LEVEL.expMultiplier * (hoursNow / TARGET_HOURS);
}

/**
 * Gold against levels (owner, 8-nov-2026): reaching each measured level, the gold earned since the one before (hunting
 * there, minus the potions drunk) should about pay that level's gear. Uses the suggested experience multiplier.
 */
function goldForGear(samples: Samples, expMultiplier: number): Record<string, unknown> {
    const bigRed = OFF_GOODS.bigRedPotion.price;
    const rows = samples.slice(1).map((s, i) => {
        const before = samples[i];
        const minutes = minutesBetween(samples, before.level, s.level, expMultiplier);
        const netPerMin = before.goldPerMin - (before.drunk / Math.max(1, before.seconds)) * 60 * bigRed;
        const earned = netPerMin * minutes;
        const gearPrice = s.gear.split(',').map((g) => g.split(':')[0]).filter(isOffItemId).reduce((sum, id) => sum + OFF_ITEMS[id].price, 0);
        return { level: s.level, minutesHunting: round(minutes), earned: Math.round(earned), gearPrice, gearShare: round(gearPrice / Math.max(1, earned), 2) };
    }).filter((r) => r.level !== samples[0].level);
    // The level where gold is tightest decides: there it should just pay the gear.
    const tightest = Math.max(...rows.map((r) => r.gearShare));
    return { note: 'gearShare = gear price / gold earned since the level before (1 = just enough)', rows, suggestedGoldMultiplier: round(OFF_LOOT.goldMultiplier * tightest, 2) };
}

/** Minutes for every level 1→60 with each multiplier, and the totals at the milestones (hours). */
function levelPace(samples: Samples): Record<string, unknown> {
    const top = MILESTONES[MILESTONES.length - 1];
    const totals = EXP_MULTIPLIERS.map(() => 0);
    const milestones: Record<string, Record<string, number>> = {};
    const perLevel: Record<string, unknown>[] = [];
    for (let level = 1; level < top; level++) {
        const spot = spotFor(samples, level);
        const need = offExpForLevel(level + 1) - offExpForLevel(level);
        const expPerKill = offKillExp(averageExp(spot.monster), level);
        const minutes = EXP_MULTIPLIERS.map((m) => need / Math.max(1, expPerKill * (m / OFF_LEVEL.expMultiplier) * spot.killsPerMin));
        minutes.forEach((m, i) => (totals[i] += m));
        if ([1, 5, 10, 15, 20, 30, 40, 50, 59].includes(level)) {
            perLevel.push({ level, spot: spot.monster, need, expPerKill, kills: Math.ceil(need / Math.max(1, expPerKill)), minutesNow: round(minutes[0]) });
        }
        if (MILESTONES.includes(level + 1)) {
            milestones[`to${level + 1}`] = Object.fromEntries(EXP_MULTIPLIERS.map((m, i) => [`x${m}`, round(totals[i] / 60, 1)]));
        }
    }
    return { note: 'hours of hunting from level 1, by experience multiplier', milestones, perLevel };
}

/** Gold per minute, potions' cost and how long the build's gear takes to pay. */
function goldReport(samples: Samples): Record<string, unknown>[] {
    const bigRed = OFF_GOODS.bigRedPotion.price;
    return samples.map((s) => {
        const gearIds = s.gear.split(',').map((g) => g.split(':')[0]).filter(isOffItemId);
        const gearPrice = gearIds.reduce((sum, id) => sum + OFF_ITEMS[id].price, 0);
        const potionCostPerMin = (s.drunk / Math.max(1, s.seconds)) * 60 * bigRed;
        return {
            farm: s.name,
            goldPerMin: Math.round(s.goldPerMin * OFF_LOOT.goldMultiplier),
            potionCostPerMin: Math.round(potionCostPerMin),
            gearPrice,
            minutesForGear: round(gearPrice / Math.max(1, s.goldPerMin - potionCostPerMin)),
            potionsDroppedPerMin: s.potionsPerMin,
            valuablesPerHour: round(s.valuablesPerMin * 60),
            died: s.died,
        };
    });
}

/** Average damage one cast does to that monster, with the chance to fail and to be resisted. */
function spellPerCast(id: OffSpellId, caster: { level: number; int: number; mag: number }, monster: OffMonsterId): number {
    const def = OFF_SPELLS[id];
    const works = Math.min(1, offCastChance(def.circle, caster) / 100);
    const lands = offLandChance(offMagicHit(def.circle, caster), OFF_MONSTERS[monster].magicResist) / 100;
    const dice = (def.direct ? diceAverage(def.direct) : 0) + (def.area ? diceAverage(def.area) : 0);
    const element = elementMultiplier(offElementMatch(def, OFF_MONSTERS[monster].base.element));
    return dice * (1 + caster.mag / OFF_CASTING.magDivisor / 100) * element * works * lands;
}

/** Each damage spell a mage can cast, against some monsters, next to a warrior's weapon of the same level. */
function spellReport(): Record<string, unknown>[] {
    const damageSpells = (Object.keys(OFF_SPELLS) as OffSpellId[]).filter((id) => OFF_SPELLS[id].kind === 'damage');
    return MAGES.map((caster) => {
        const castMs = Math.max(offPrepareMs(caster.mag), OFF_CASTING.betweenCastsMs);
        const maxMana = offMaxMana(caster);
        const warrior = WARRIORS[caster.level];
        const weapon = OFF_ITEMS[warrior.weapon] as OffWeaponItem;
        const meleeDps = Object.fromEntries(SPELL_TARGETS.map((m) => {
            const def = OFF_MONSTERS[m];
            const dice = def.size === 'large' ? weapon.large : weapon.small;
            const hit = offHitChance(offPlayerHitRatio(warrior.dex), def.base.defenseRatio, false);
            const perBlow = diceAverage(dice) * (1 + warrior.str / 500) * hit;
            return [m, round((perBlow * 1000) / offAttackMs(weapon, warrior.str))];
        }));
        const spells = damageSpells.filter((id) => OFF_SPELLS[id].reqInt <= caster.int).map((id) => {
            const def = OFF_SPELLS[id];
            const perCast = Object.fromEntries(SPELL_TARGETS.map((m) => [m, round(spellPerCast(id, caster, m))]));
            return {
                spell: def.name,
                mana: def.mana,
                castsWithFullMana: Math.floor(maxMana / def.mana),
                perCast,
                dpsWhileManaLasts: Object.fromEntries(SPELL_TARGETS.map((m) => [m, round((perCast[m] * 1000) / castMs)])),
            };
        });
        return { mage: caster, maxMana, castMs, warrior: { ...warrior, dps: meleeDps }, spells };
    });
}

/** The whole report (`check offbalance`). */
export function offBalanceReport(raw: Record<string, OffFarmSample>): Record<string, unknown> {
    const all = samplesOf(raw);
    // The level pace and the gold for gear use one spot per level (offfarm40, not offfarm40z / offfarm60troll…).
    const samples = all.filter((s) => /^offfarm\d+$/.test(s.name));
    if (samples.length === 0) return { error: 'no offfarm results: run pnpm check offfarm1 offfarm5 … first' };
    const expMultiplier = suggestedExpMultiplier(samples);
    return {
        suggestedExpMultiplier: round(expMultiplier, 4),
        goldForGear: goldForGear(samples, expMultiplier),
        farms: Object.fromEntries(Object.entries(raw).map(([name, s]) => [name, { kpm: s.killsPerMin, gold: s.goldPerMin, hurt: s.hurtPerMin, drunk: s.drunk, died: s.died, seconds: s.seconds }])),
        levelPace: levelPace(samples),
        gold: goldReport(all),
        spells: spellReport(),
    };
}
