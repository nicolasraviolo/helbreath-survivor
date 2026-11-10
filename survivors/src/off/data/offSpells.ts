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
//   cualquier golpe o magia que le haga daño la rompía (corregido en la Off-8C: ver abajo). El fuego que arde no.
// - Curar y escudos te los lanzas a ti: en Off juegas solo, así que cualquier clic sirve (decisión de Claude, aceptada).
// - Mando (propietario): RT + A/B/X/Y preparan las 4 magias del mando (elegidas en el libro); al estar lista sale sola
//   (desde el 9-nov-2026 sin soltar RT) donde apunta el stick derecho (OFF_PAD_AIM) o, sin stick, al monstruo marcado o
//   al más cercano.
// Fase Off-6B, lanzar (OFF_CASTING; fórmulas en off/systems/OffSpellRules.ts):
// - Off no tiene habilidades. Propietario (7-nov-2026): la habilidad "Magic" del original (0–100) sale de la MAG:
//   MAG × 2, tope 100 (con MAG 50 se lanza como un mago entrenado). Lo demás, con las tablas del servidor.
// - Preparar (propietario): 2 s con MAG 10, más rápido con más MAG, 1 s desde MAG 50.
// - Elementos como en Survivors (propietario): ±20 % según el elemento del monstruo, quemadura con el fuego y frenado
//   con el hielo (data/elements.ts, ICE_SLOW de data/activeSpells.ts).
// Fase Off-8C (propietario, 8-nov-2026), arreglo de Paralyze: el servidor (iCalculateAttackEffect, Effect_Damage_Spot)
//   separa las dos por su v4. **Hold Person (1) se quita con cualquier golpe; Paralyze (2) aguanta los golpes**, salvo
//   en monstruos de más de 50 de HitDice (Troll, Cyclops), que se libran 1 de cada 10 golpes. **Una magia que hace daño
//   quita las dos.** La duración es fija (30 s y 50 s). OFF_HOLD lo dice en números.
// Fase Off-8C (propietario, 8-nov-2026): Berserk (Magic.cfg 50: círculo 6, INT 59, 57 de maná, 2.200 de oro, 40 s). Se
//   aprende en la tienda y también la lanza la maga mercenaria. Como el servidor (bIsAttackerBerserk, iAttackMode < 20):
//   **dobla el daño de los golpes normales**, no el del Critical Strike. Es un estado aparte de los escudos (se pueden
//   tener los dos); con Berserk ya puesto no hace nada. Se lanza a ti o a tu mercenario, como Heal.
import type { SpellElement } from '../../data/elements';
import type { SpellId } from '../../data/spells';
import type { EffectKey } from '../../config/effects';
import type { OffExtraLookId } from '../config/offSpellLook';

export type OffSpellId =
    | 'magicMissile' | 'heal'
    | 'energyBolt' | 'defenseShield'
    | 'fireBall' | 'greatHeal' | 'holdPerson'
    | 'fireStrike' | 'lightningArrow' | 'paralyze' | 'protectionFromMagic'
    | 'tripleEnergyBolt' | 'chillWind' | 'lightning'
    | 'berserk'
    | 'lightningBolt' | 'massLightningArrow' | 'iceStrike'
    | 'energyStrike' | 'massChillWind' | 'absoluteMagicProtection'
    | 'lightningStrike' | 'massIceStrike'
    | 'meteorStrike' | 'massMagicMissile'
    | 'earthShockWave' | 'blizzard';

export type OffSpellKind = 'damage' | 'heal' | 'shield' | 'hold' | 'berserk';

/**
 * Where a damage spell hits (Off-11B, server PlayerMagicHandler):
 * - spot (default): `direct` on the target, `area` on every monster of the square around it.
 * - bolt (DAMAGE_LINEAR, Lightning Bolt; ICE_LINEAR, Blizzard, Off-11C): `direct` on the target, `area` on every monster of the line from you to it
 *   (each step and its four neighbours) and of the square around it, once each.
 * - wave (DAMAGE_LINEAR_SPDOWN, Earth Shock Wave): `area` and `direct` on every monster of the line, `lineSteps` tiles
 *   long, also past the target.
 */
export type OffSpellShape = 'spot' | 'bolt' | 'wave';

/** Lines (Off-11B, server GetPoint2 from 2 to 9): the first and last step from the caster. */
export const OFF_SPELL_LINE = { firstStep: 2, lastStep: 9 } as const;

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
    /** Strength of a shield or a hold (v4 in the cfg: 3 Defense Shield, 2 Protection From Magic, OFF_PROTECT; 1 Hold Person, 2 Paralyze, OFF_HOLD). */
    power?: number;
    element?: SpellElement;
    /** Off-11B: where it hits (default spot). */
    shape?: OffSpellShape;
    /** Off-11B: ice spells, seconds the monster stays slowed (the cfg's v10; default ICE_SLOW.normal). */
    freezeSec?: number;
    /** Survivors' spell whose flight, explosions and sounds it shows (data/spells.ts), or Off's own (OFF_EXTRA_LOOKS). */
    look?: SpellId | OffExtraLookId;
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
    defenseShield: { name: 'Defense Shield', magicId: 13, circle: 2, kind: 'shield', mana: 19, reqInt: 26, price: 200, durationSec: 60, power: 3, castEffect: 'fx.defenseShield.cast', wornEffect: 'fx.defenseShield.aura' },
    // ---- Circle 3 ----
    fireBall: { name: 'Fire Ball', magicId: 20, circle: 3, kind: 'damage', mana: 27, reqInt: 26, price: 500, direct: [2, 6, 2], area: [2, 6, 2], areaRange: 2, element: 'fire', look: 'fireBall' },
    greatHeal: { name: 'Great Heal', magicId: 21, circle: 3, kind: 'heal', mana: 28, reqInt: 28, price: 500, direct: [4, 10, 20], castEffect: 'fx.heal.cast' },
    holdPerson: { name: 'Hold Person', magicId: 25, circle: 3, kind: 'hold', mana: 24, reqInt: 26, price: 500, durationSec: 30, power: 1, castEffect: 'fx.hold.cast' },
    // ---- Circle 4 ----
    fireStrike: { name: 'Fire Strike', magicId: 30, circle: 4, kind: 'damage', mana: 36, reqInt: 34, price: 1000, direct: [2, 8, 3], area: [2, 8, 3], areaRange: 2, element: 'fire', look: 'fireStrike' },
    lightningArrow: { name: 'Lightning Arrow', magicId: 37, circle: 4, kind: 'damage', mana: 32, reqInt: 38, price: 1100, direct: [4, 5, 10], element: 'lightning', look: 'lightningArrow' },
    paralyze: { name: 'Paralyze', magicId: 35, circle: 4, kind: 'hold', mana: 35, reqInt: 36, price: 1000, durationSec: 50, power: 2, castEffect: 'fx.hold.cast' },
    protectionFromMagic: { name: 'Protection From Magic', magicId: 33, circle: 4, kind: 'shield', mana: 35, reqInt: 32, price: 850, durationSec: 60, power: 2, wornEffect: 'fx.aura.ring' },
    // ---- Circle 5 ----
    tripleEnergyBolt: { name: 'Triple Energy Bolt', magicId: 47, circle: 5, kind: 'damage', mana: 40, reqInt: 45, price: 1700, direct: [2, 4, 2], area: [3, 8, 3], areaRange: 2, element: 'lightning', look: 'tripleEnergyBolt' },
    chillWind: { name: 'Chill Wind', magicId: 45, circle: 5, kind: 'damage', mana: 48, reqInt: 50, price: 2000, direct: [2, 8, 3], area: [2, 8, 3], areaRange: 2, element: 'ice', look: 'chillWind' },
    lightning: { name: 'Lightning', magicId: 43, circle: 5, kind: 'damage', mana: 44, reqInt: 47, price: 1700, direct: [4, 7, 12], element: 'lightning', look: 'lightningBolt' },
    // ---- Circle 6 (Off-8C) ----
    berserk: { name: 'Berserk', magicId: 50, circle: 6, kind: 'berserk', mana: 57, reqInt: 59, price: 2200, durationSec: 40, castEffect: 'fx.berserk.cast' },
    // ---- Off-11B: circles 6–8 and 10 (Magic.cfg; ice v10 = seconds frozen) ----
    lightningBolt: { name: 'Lightning Bolt', magicId: 51, circle: 6, kind: 'damage', mana: 58, reqInt: 58, price: 2500, direct: [4, 5, 18], area: [4, 2, 6], areaRange: 2, shape: 'bolt', element: 'lightning', look: 'lightningBolt' },
    // Server: one target only (DAMAGE_SPOT); the client draws four arrows to it.
    massLightningArrow: { name: 'Mass Lightning Arrow', magicId: 56, circle: 6, kind: 'damage', mana: 55, reqInt: 53, price: 3000, direct: [5, 6, 20], element: 'lightning', look: 'massLightningArrow' },
    // Server ICE: the v4 dice on every monster of the square (no separate direct roll), then frozen v10 s.
    iceStrike: { name: 'Ice Strike', magicId: 57, circle: 6, kind: 'damage', mana: 59, reqInt: 60, price: 4200, area: [5, 6, 12], areaRange: 2, freezeSec: 4, element: 'ice', look: 'iceStrike' },
    // Server DAMAGE_AREA_NOSPOT: only the square.
    energyStrike: { name: 'Energy Strike', magicId: 60, circle: 7, kind: 'damage', mana: 65, reqInt: 67, price: 5000, area: [7, 6, 17], areaRange: 2, element: 'lightning', look: 'energyStrike' },
    massChillWind: { name: 'Mass Chill Wind', magicId: 63, circle: 7, kind: 'damage', mana: 90, reqInt: 93, price: 9800, area: [3, 8, 6], areaRange: 2, freezeSec: 10, element: 'ice', look: 'massChillWind' },
    // Server: protect 5 = every monster spell is resisted (OFF_PROTECT.magicImmunePowers). Shares the shields' slot.
    absoluteMagicProtection: { name: 'Absolute Magic Protection', magicId: 65, circle: 7, kind: 'shield', mana: 90, reqInt: 112, price: 13500, durationSec: 60, power: 5, castEffect: 'fx.amp.cast', wornEffect: 'fx.amp.aura' },
    lightningStrike: { name: 'Lightning Strike', magicId: 74, circle: 8, kind: 'damage', mana: 90, reqInt: 123, price: 35000, area: [7, 7, 20], areaRange: 2, element: 'lightning', look: 'lightningStrike' },
    // ---- Off-11C: circles 8–10 (Magic.cfg) ----
    // Server ICE, as Ice Strike: 7d8+25 on every monster of the 5 × 5 square, frozen 7 s.
    massIceStrike: { name: 'Mass Ice Strike', magicId: 72, circle: 8, kind: 'damage', mana: 120, reqInt: 133, price: 21000, area: [7, 8, 25], areaRange: 2, freezeSec: 7, element: 'ice', look: 'massIceStrike' },
    // Server DAMAGE_AREA_NOSPOT: only the square (its v4–v6, 6 8 12, are never read).
    meteorStrike: { name: 'Meteor Strike', magicId: 81, circle: 9, kind: 'damage', mana: 120, reqInt: 169, price: 40000, area: [7, 12, 18], areaRange: 2, element: 'fire', look: 'meteorStrike' },
    // Server DAMAGE_AREA_NOSPOT on a 7 × 7 square.
    massMagicMissile: { name: 'Mass Magic Missile', magicId: 82, circle: 9, kind: 'damage', mana: 160, reqInt: 185, price: 45000, area: [7, 7, 30], areaRange: 3, element: 'lightning', look: 'massMagicMissile' },
    // Owner (9-nov-2026): INT 190 and 185 mana (helbreath.net and the wiki; the cfg says 200 and 180) and sold at the
    // shop for 50.000 (the original only gave it by talent or manual).
    earthShockWave: { name: 'Earth Shock Wave', magicId: 96, circle: 10, kind: 'damage', mana: 185, reqInt: 190, price: 50000, direct: [5, 1, 20], area: [7, 8, 16], shape: 'wave', element: 'earth', look: 'earthShockWave' },
    // Server ICE_LINEAR: Lightning Bolt's line (up to the target) and a 7 × 7 square with v7–v9, v4–v6 on the target,
    // and all of them frozen 2 s.
    blizzard: { name: 'Blizzard', magicId: 91, circle: 10, kind: 'damage', mana: 170, reqInt: 195, price: 43000, direct: [5, 1, 20], area: [7, 8, 16], areaRange: 3, shape: 'bolt', freezeSec: 2, element: 'ice', look: 'blizzard' },
};

/**
 * Holds (Off-8C, server iCalculateAttackEffect): a blow ends a hold of strength `breaksOnBlow` (Hold Person) at once;
 * a stronger one (Paralyze) only on a monster above `strongHitDice`, `strongBreakChance` of the blows. Spell damage
 * ends any hold.
 */
export const OFF_HOLD = {
    breaksOnBlow: 1,
    strongHitDice: 50,
    strongBreakChance: 0.1,
    /**
     * Off-9A (the owner, 9-nov-2026): on a person (you, your mercenary, a Raider) a hold lasts this long instead, by its
     * power (1 Hold Person, 2 Paralyze): 30 s and 50 s still is unplayable for a player. A blow ends Hold Person, as on a
     * monster, but **spell damage ends none** (unlike a monster): a mage holds you and casts at you from afar (the owner).
     */
    personMs: { 1: 4000, 2: 6000 } as Readonly<Record<number, number>>,
    /** A person's chance (1–100 scale, as a monster's magicResist) of shrugging a hold off; a Magic Resistance attribute adds its own. */
    personResist: 20,
    /** The tint over a held person (pale blue). */
    personTint: 0x8fc8ff,
} as const;

/** Off-9A: how long a hold of that power keeps a person still. */
export function offPersonHoldMs(power: number): number {
    return OFF_HOLD.personMs[power] ?? OFF_HOLD.personMs[1] ?? 0;
}

/**
 * Berserk (Off-8C, server: iAP_SM × 2 when the attacker is berserk and the attack mode is a normal one): what normal
 * blows are multiplied by. Its red glow is Survivors' Berserk buff's (BUFFS.berserk in data/pickups.ts).
 */
export const OFF_BERSERK = {
    damageFactor: 2,
} as const;

/** Every spell, by circle and then by the cfg number (the order of the shop and the book). */
export const OFF_SPELL_IDS: readonly OffSpellId[] = (Object.keys(OFF_SPELLS) as OffSpellId[])
    .sort((a, b) => OFF_SPELLS[a].circle - OFF_SPELLS[b].circle || OFF_SPELLS[a].magicId - OFF_SPELLS[b].magicId);

/** Heal, shields and Berserk are cast on yourself (or, since Off-8B, on your mercenary). */
export function offSpellOnSelf(def: OffSpellDef): boolean {
    return def.kind === 'heal' || def.kind === 'shield' || def.kind === 'berserk';
}

/**
 * What a shield's strength (`power`, v4) does, from the server: 3 = +40 defence against blows (4 = +100, not in Off),
 * 2 = magic damage halved (5 too, not in Off).
 */
export const OFF_PROTECT = {
    defenseByPower: { 3: 40, 4: 100 } as Readonly<Record<number, number>>,
    magicHalvedPowers: [2] as readonly number[],
    /** Off-11B (server bCheckResistingMagicSuccess): Absolute Magic Protection resists every spell. */
    magicImmunePowers: [5] as readonly number[],
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

/** Lowest and highest roll of some dice. */
export function offDiceBounds([count, sides, bonus]: OffSpellDice): readonly [number, number] {
    return [count + bonus, count * sides + bonus];
}

/** "2 – 8" from some dice. */
export function offDiceRange(dice: OffSpellDice): string {
    const [low, high] = offDiceBounds(dice);
    return `${low} – ${high}`;
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
 * Aiming a gamepad spell with the right stick (propietario, 9-nov-2026): the spell falls where the stick points, nearer
 * or farther with how far it is pushed (0..1 after the deadzone), always inside the screen.
 */
export const OFF_PAD_AIM = {
    /** Tiles from you with the stick barely pushed, and pushed to the edge. */
    minTiles: 1.5,
    maxTiles: 9,
    /** Kept this many pixels inside the edges of what the camera shows. */
    screenMarginPx: 24,
    /** A living monster this close to the mark (tiles) takes the spell itself (as a click on it). */
    snapTiles: 1.2,
} as const;

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
    weapon: 'Hold a wand or take off your weapon to cast.',
    shield: 'Take off your shield to cast.',
    tooSoon: 'Too soon to cast again.',
    failed: 'The spell failed!',
    /** Off-9A: hit while preparing a spell or holding it ready (the owner, 8-nov-2026). */
    interrupted: 'Your spell was interrupted!',
    /** Off-9A: a Raider Mage's Hold Person / Paralyze on you, and when it wears off. */
    held: (spell: string) => `${spell}! You can't move.`,
    heldOff: 'You can move again.',
    resistedHold: (spell: string) => `You resisted ${spell}.`,
    noTarget: 'Click on a monster or the ground to cast.',
    /** Gamepad: nothing marked and no monster near for a spell that needs one. */
    noMonster: 'No monster near to cast on.',
    /** A shield while one is on, a hold on a held monster, Hold on the ground (server: MAGIC_NOEFFECT). */
    noEffect: 'The spell had no effect.',
    shieldOn: (name: string) => `${name} is on you.`,
    shieldOff: (name: string) => `${name} has worn off.`,
    berserkOn: 'You feel a berserk rage!',
    berserkOff: 'The berserk rage has worn off.',
} as const;

/** Words over a monster. */
export const OFF_CAST_WORDS = {
    failed: 'Failed!',
    resisted: 'Resisted',
    held: 'Held',
} as const;
