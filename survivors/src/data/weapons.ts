// Armas cuerpo a cuerpo del Guerrero. Los hechizos de la Maga están en data/spells.ts.
import type { SoundKey, SpriteKey } from '../config/assetManifest';
import type { EffectKey } from '../config/effects';
import type { LinePathDef } from './activeSpells';
import type { AddedColor } from '../hb/playerAppearance';
import type { EquipRequirement, ItemIcon } from './itemTypes';
import { UNIQUE_LEVEL } from './uniques';

// ---------------------------------------------------------------------------------------------------------
// Armas cuerpo a cuerpo del Guerrero (Fase 6, bloque 6A; decidido con el propietario el 16-oct-2026).
// - Solo se lleva UNA arma en la mano. Las cartas ofrecen el siguiente eslabón de la familia o cambiar de familia.
// - Números PROPIOS (no los del original): requisito de Str, daño, ritmo y alcance pensados para que haya que
//   elegir: las cortas hacen más daño por segundo a un enemigo; las largas golpean a más enemigos y empujan más.
// - Fase 13C: daño ×1,5 para igualar al Guerrero con la Maga (simulación `levelpace`).
// - Las familias con `enabled: false` existen solo como datos: no salen en las cartas ni tienen ataque propio aún.
// - Fase 20B: `equip` = requisito ORIGINAL para ponérsela en la pantalla de equipo (Str = peso/100 y Level mínimo de
//   reference/Item*.cfg), con las stats permanentes del personaje. Desde la Fase 20C las cartas ya no dan armas.
//   `icon` = dibujo del objeto en item-pack.spr (hoja = Spr − 1, frame = SFrame del Item.cfg).

export type MeleeFamilyId = 'shortSword' | 'longSword' | 'hammer' | 'fencing' | 'axe';

export interface MeleeWeaponDef {
    name: string;
    family: MeleeFamilyId;
    /** Base physical damage to every enemy inside the swing (grows with Str). */
    damage: number;
    /** Time between swings in milliseconds (shortened by Dex). */
    cooldownMs: number;
    /** Length of the attack animation in milliseconds (shortened by Dex like the cooldown). */
    swingMs: number;
    /** How far the blade reaches from the player's feet, in pixels. */
    range: number;
    /** Width of the swing, in degrees, centred on the target. */
    arcDegrees: number;
    /** Push given to hit enemies (px/s). */
    knockback: number;
    /** Weapon layer drawn in the hand (msw.spr: one block of 56 sheets per sword). Undefined = no sprite yet. */
    sprite?: { key: SpriteKey; startSheet: number };
    /** What the Equipment screen asks of the permanent stats (Fase 20B). Undefined = not in the catalog. */
    equip?: EquipRequirement;
    /** Picture in item-pack.spr (Equipment screen). */
    icon?: ItemIcon;
    /** Hammers (bloque C): the Critical Strike's crack towards the target, `length` px long (× HAMMER_SLAM.critCrackLength), `damage` to each monster on it (scaled like the strike). */
    crack?: { damage: number; length: number };
    /** Unique weapons (Fase 30B): every hit slows the monster like the ice spells (ICE_SLOW). */
    chills?: boolean;
    /** Unique weapons: colour added to the blade in hand and on the ground, like the original's glare (when it has no attribute). */
    glow?: AddedColor;
}

/**
 * How a family's Critical Strike looks: a long swing towards the target (swords), a spin all around (axes) or a ground
 * slam (hammers). The normal blow is the same swing in an arc for every family (owner, 31-oct-2026).
 */
export type MeleeAttackStyle = 'swing' | 'spin' | 'slam';

export interface MeleeFamilyDef {
    name: string;
    enabled: boolean;
    /** Shape of this family's Critical Strike (data/critStrike.ts); the normal blow is always a swing. */
    critStyle: MeleeAttackStyle;
    /** Played when a normal blow hits something (the hammers' dull blow); the sword's hit when left out. */
    hitSound?: SoundKey;
    /** Links from weakest to strongest. */
    links: readonly MeleeWeaponId[];
}

/** Shared by every melee weapon. */
export const MELEE_SWING_SOUND: SoundKey = 'sfx.melee.swing';
export const MELEE_HIT_SOUND: SoundKey = 'sfx.melee.hit';
/** Damage lands at this point of the swing animation (the original hits on frame 2 of 8). */
export const MELEE_HIT_MOMENT = 0.25;
/**
 * The player stands still from the start of the swing until this point (decided by the owner on 16-oct-2026, as in
 * the original, where you can't move while attacking): just past the blow, so frames 0–2 of the swing show
 * (dagger ≈ 0,13 s, long sword ≈ 0,21 s). Then moving cuts the rest of the animation and the run starts again.
 */
export const MELEE_ROOT_MOMENT = 0.375;
/** Swords are drawn from msw.spr in blocks of 56 sheets (7 states × 8 directions); see sp-client Items.ts. */
const SWORD_SPRITE: SpriteKey = 'gear.swords.m';
/** Axes in item-pack.spr (Item.cfg Spr 15). */
const AXE_ICON_SHEET = 14;

/**
 * Round trail of the axes' Critical Strike (bloque B, 25-oct-2026; 31-oct-2026): the character swings towards the
 * target (turning round looked odd) while the trail sweeps the whole circle that is hit.
 */
export const AXE_SPIN = {
    /** The trail turns clockwise on screen. */
    clockwise: true,
} as const;

/**
 * Ground slam of the hammers' Critical Strike (bloque C, owner 25-oct-2026; only the crit since 31-oct-2026): when the
 * hammer hits the ground a wave hurts every monster in the circle around the player and a crack runs towards the target.
 */
export const HAMMER_SLAM = {
    /** The hammer hits the ground at this point of the swing (later than a sword's: it is heavy). */
    hitMoment: 0.4,
    /** Stands still until just after the blow. */
    rootMoment: 0.5,
    /** Played when the hammer hits the ground (a dull blow, C5); also on the hammers' normal hits. */
    impactSound: 'sfx.melee.blunt',
    /** Light camera shake on every slam. */
    shakePx: 2,
    shakeMs: 120,
    /** The Critical Strike's crack is this many times as long as the weapon's own. */
    critCrackLength: 1.6,
    /** Dust puffs around the player when the hammer hits the ground, at `dustShare` of the wave's radius (no ring: owner, 26-oct-2026). */
    wave: { dust: 'fx.earthShock.dust', dustCount: 6, dustShare: 0.7 },
} as const satisfies {
    hitMoment: number; rootMoment: number; impactSound: SoundKey; shakePx: number; shakeMs: number; critCrackLength: number;
    wave: { dust: EffectKey; dustCount: number; dustShare: number };
};

/**
 * The hammers' crack (bloque C): the Earth Shock Wave's rocks (systems/LineSpell.ts), short and physical. Each monster on
 * it takes the weapon's `crack.damage` once (here `pathDamage` 1 × that damage, passed as the cast's power).
 */
export const HAMMER_CRACK: LinePathDef = {
    look: 'earthShock', damageType: 'physical', bigNumbers: false,
    travelMs: 0, speed: 900, stepEveryMs: 40, holdMs: 0, holdStepMs: 0,
    pathRadius: 36, pathDamage: 1, pathHits: 1, pathHitDelayMs: 0,
    targetRadius: 0, targetDamage: 0, targetHitDelaysMs: [],
    slows: false, knockback: 140, shakePx: 0, shakeMs: 0,
};

export const MELEE_WEAPONS = {
    // Short Swords: rápidas, poco alcance, poco requisito.
    dagger: {
        name: 'Dagger', family: 'shortSword', damage: 9, cooldownMs: 450, swingMs: 350,
        range: 50, arcDegrees: 90, knockback: 60, sprite: { key: SWORD_SPRITE, startSheet: 0 },
        equip: { str: 2 }, icon: { sheet: 0, frame: 0 },
    },
    shortSword: {
        name: 'Short Sword', family: 'shortSword', damage: 13, cooldownMs: 450, swingMs: 350,
        range: 55, arcDegrees: 90, knockback: 70, sprite: { key: SWORD_SPRITE, startSheet: 56 },
        equip: { str: 8 }, icon: { sheet: 0, frame: 1 },
    },
    falchion: {
        name: 'Falchion', family: 'shortSword', damage: 19, cooldownMs: 500, swingMs: 380,
        range: 60, arcDegrees: 100, knockback: 80, sprite: { key: SWORD_SPRITE, startSheet: 280 },
        equip: { str: 22 }, icon: { sheet: 0, frame: 5 },
    },
    // Long Swords: lentas, arco amplio, empujan más.
    longSword: {
        name: 'Long Sword', family: 'longSword', damage: 21, cooldownMs: 1000, swingMs: 560,
        range: 80, arcDegrees: 150, knockback: 150, sprite: { key: SWORD_SPRITE, startSheet: 112 },
        equip: { str: 14 }, icon: { sheet: 0, frame: 2 },
    },
    // Fase 20B: Scimitar y Claymore, entre las que ya había (mismo dibujo en la mano que el original: bloques 6 y 10 de msw.spr).
    scimitar: {
        name: 'Scimitar', family: 'longSword', damage: 25, cooldownMs: 1000, swingMs: 560,
        range: 82, arcDegrees: 150, knockback: 155, sprite: { key: SWORD_SPRITE, startSheet: 280 },
        equip: { str: 18 }, icon: { sheet: 0, frame: 4 },
    },
    broadSword: {
        name: 'Broad Sword', family: 'longSword', damage: 30, cooldownMs: 1000, swingMs: 560,
        range: 85, arcDegrees: 150, knockback: 165, sprite: { key: SWORD_SPRITE, startSheet: 392 },
        equip: { str: 28 }, icon: { sheet: 0, frame: 7 },
    },
    claymore: {
        name: 'Claymore', family: 'longSword', damage: 35, cooldownMs: 1050, swingMs: 580,
        range: 90, arcDegrees: 155, knockback: 170, sprite: { key: SWORD_SPRITE, startSheet: 504 },
        equip: { str: 40 }, icon: { sheet: 0, frame: 9 },
    },
    greatSword: {
        name: 'Great Sword', family: 'longSword', damage: 40, cooldownMs: 1100, swingMs: 600,
        range: 95, arcDegrees: 160, knockback: 180, sprite: { key: SWORD_SPRITE, startSheet: 560 },
        equip: { str: 52 }, icon: { sheet: 0, frame: 10 },
    },
    flamberge: {
        name: 'Flamberge', family: 'longSword', damage: 54, cooldownMs: 1100, swingMs: 600,
        range: 100, arcDegrees: 170, knockback: 200, sprite: { key: SWORD_SPRITE, startSheet: 616 },
        equip: { str: 60 }, icon: { sheet: 0, frame: 11 },
    },
    // Único de Icebound (Fase 30B, data/uniques.ts): solo lo suelta el Tigerworm. Requisito del original (Str 100, la
    // columna "para equipar" de docs/REQUISITOS_HB.md) y Level 100. Daño ~25% sobre la Flamberge y cada golpe ralentiza.
    // Dibujo: el de la Great Sword en la mano (msw.spr bloque 560, como sp-client Items.ts id 148) con su brillo azul;
    // icono item-pack hoja 0 frame 15.
    iceElementalSword: {
        name: 'Sword of Ice Elemental', family: 'longSword', damage: 68, cooldownMs: 1100, swingMs: 600,
        range: 100, arcDegrees: 170, knockback: 200, sprite: { key: SWORD_SPRITE, startSheet: 560 },
        equip: { str: 100, level: UNIQUE_LEVEL }, icon: { sheet: 0, frame: 15 }, chills: true,
        glow: { id: 'unique-iceElementalSword', add: [-50, -10, 70] },
    },
    // Hammers (bloque C, 26-oct-2026; 31-oct-2026): el golpe normal es un tajo en abanico como el de las espadas; el golpe
    // al suelo (HAMMER_SLAM: onda en círculo y grieta `crack`) queda para el Critical Strike. Lentos y pesados: más daño
    // por golpe y algo más por segundo que la espada de Str parecida, a cambio de su requisito alto.
    // Icono: hoja 14 de item-pack.spr, como las hachas (Item.cfg Spr 15).
    hammer: {
        name: 'Hammer', family: 'hammer', damage: 88, cooldownMs: 1500, swingMs: 650,
        range: 88, arcDegrees: 160, knockback: 240, sprite: { key: 'gear.hammers.hammer', startSheet: 0 },
        equip: { str: 70 }, icon: { sheet: AXE_ICON_SHEET, frame: 7 }, crack: { damage: 42, length: 200 },
    },
    battleHammer: {
        name: 'Battle Hammer', family: 'hammer', damage: 95, cooldownMs: 1550, swingMs: 650,
        range: 95, arcDegrees: 160, knockback: 270, sprite: { key: 'gear.hammers.battle', startSheet: 0 },
        equip: { str: 95 }, icon: { sheet: AXE_ICON_SHEET, frame: 8 }, crack: { damage: 42, length: 240 },
    },
    // Desactivada en Survivors (sin ataque propio). Números provisionales. Off-7B: su dibujo en la mano para Helbreath
    // Off, el bloque 7 de msw.spr (Item.cfg 34, apariencia 7: bloque = apariencia − 1, 56 hojas cada uno).
    rapier: {
        name: 'Rapier', family: 'fencing', damage: 10, cooldownMs: 400, swingMs: 320, range: 90, arcDegrees: 25, knockback: 40,
        sprite: { key: SWORD_SPRITE, startSheet: 336 },
    },
    // Axes (bloque B, 25-oct-2026; 31-oct-2026): el golpe normal es un tajo en abanico como el de las espadas, con un poco
    // más de daño por segundo que la espada larga de Str parecida (algo menos de alcance); el golpe en círculo (AXE_SPIN)
    // queda para el Critical Strike, que es el de área más amplia. Requisitos aprobados por el propietario.
    // Dibujo en la mano: waxe*.spr también para el hombre (maxe* está roto en IdleCombat; ver NOTES.md). Icono: hoja 14.
    lightAxe: {
        name: 'Light Axe', family: 'axe', damage: 20, cooldownMs: 1000, swingMs: 560,
        range: 76, arcDegrees: 150, knockback: 110, sprite: { key: 'gear.axes.light', startSheet: 0 },
        equip: { str: 12 }, icon: { sheet: AXE_ICON_SHEET, frame: 2 },
    },
    tomahawk: {
        name: 'Tomahawk', family: 'axe', damage: 25, cooldownMs: 1000, swingMs: 560,
        range: 78, arcDegrees: 150, knockback: 120, sprite: { key: 'gear.axes.tomahawk', startSheet: 0 },
        equip: { str: 20 }, icon: { sheet: AXE_ICON_SHEET, frame: 3 },
    },
    doubleAxe: {
        name: 'Double Axe', family: 'axe', damage: 33, cooldownMs: 1050, swingMs: 580,
        range: 82, arcDegrees: 150, knockback: 130, sprite: { key: 'gear.axes.double', startSheet: 0 },
        equip: { str: 33 }, icon: { sheet: AXE_ICON_SHEET, frame: 0 },
    },
    warAxe: {
        name: 'War Axe', family: 'axe', damage: 39, cooldownMs: 1050, swingMs: 580,
        range: 86, arcDegrees: 155, knockback: 145, sprite: { key: 'gear.axes.war', startSheet: 0 },
        equip: { str: 46 }, icon: { sheet: AXE_ICON_SHEET, frame: 1 },
    },
    battleAxe: {
        name: 'Battle Axe', family: 'axe', damage: 57, cooldownMs: 1100, swingMs: 600,
        range: 92, arcDegrees: 160, knockback: 170, sprite: { key: 'gear.axes.battle', startSheet: 0 },
        equip: { str: 80 }, icon: { sheet: AXE_ICON_SHEET, frame: 6 },
    },
} as const satisfies Record<string, MeleeWeaponDef>;

export type MeleeWeaponId = keyof typeof MELEE_WEAPONS;

export const MELEE_FAMILIES = {
    shortSword: { name: 'Short Swords', enabled: true, critStyle: 'swing', links: ['dagger', 'shortSword', 'falchion'] },
    longSword: { name: 'Long Swords', enabled: true, critStyle: 'swing', links: ['longSword', 'scimitar', 'broadSword', 'claymore', 'greatSword', 'flamberge', 'iceElementalSword'] },
    hammer: { name: 'Hammers', enabled: true, critStyle: 'slam', hitSound: HAMMER_SLAM.impactSound, links: ['hammer', 'battleHammer'] },
    fencing: { name: 'Fencing', enabled: false, critStyle: 'swing', links: ['rapier'] },
    axe: { name: 'Axes', enabled: true, critStyle: 'spin', links: ['lightAxe', 'tomahawk', 'doubleAxe', 'warAxe', 'battleAxe'] },
} as const satisfies Record<MeleeFamilyId, MeleeFamilyDef>;

export function getMeleeWeapon(id: MeleeWeaponId): MeleeWeaponDef {
    return MELEE_WEAPONS[id];
}

/** How this weapon's Critical Strike looks (its normal blow is always a swing). */
export function meleeCritStyle(def: MeleeWeaponDef): MeleeAttackStyle {
    return MELEE_FAMILIES[def.family].critStyle;
}

/** Sound of a normal blow that hits something. */
export function meleeHitSound(def: MeleeWeaponDef): SoundKey {
    const family: MeleeFamilyDef = MELEE_FAMILIES[def.family];
    return family.hitSound ?? MELEE_HIT_SOUND;
}
