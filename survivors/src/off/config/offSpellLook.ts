import type { EffectKey } from '../../config/effects';
import { byDevice } from '../../config/device';
import { UI_TEXT } from '../../config/ui';
import { ACTIVE_SPELLS, ICE_SHARD_LOOK, LINE_SPELL_LOOKS, type IceShardSpellDef } from '../../data/activeSpells';
import { AURA_RING_ALPHA } from '../../data/passiveMagic';
import { BUFFS } from '../../data/pickups';
import { SPELLS, type SpellBurst, type SpellDef } from '../../data/spells';

// Helbreath Off (Fase Off-11B): cómo se ven las magias de los círculos 6–10 que Survivors no tiene como hechizo de
// proyectil (data/spells.ts). Lo que dibuja el cliente original (reference/Client.cpp, efecto 100 + número de magia):
// - Mass Lightning Arrow (156): cuatro Lightning Arrow seguidas, una cada 130 ms, al mismo objetivo.
// - Mass Chill Wind (163): la gota de Chill Wind en el objetivo, tres más alrededor y cuatro al azar (8).
// - Lightning Strike (174): varios rayos del cielo por la zona (como el Lightning Bolt de Survivors, repetido).
// - Ice Strike (157): 15 trozos grandes y 6 pequeños a ±50 px (la lluvia de hielo de Survivors, ICE_SHARD_LOOK).
// - Earth Shock Wave: el chorro de rocas y su polvo en cada casilla de la línea (el del hechizo activo de Survivors).
// Off-11C (círculos 8–10):
// - Mass Ice Strike: la lluvia de hielo de Survivors, con los trozos del Mass Ice Strike activo (24 grandes y 8 pequeños).
// - Meteor Strike: el meteoro del hechizo activo de Survivors (entities/Meteor.ts, METEOR_LOOK).
// - Mass Magic Missile (182): un misil (effect11 hoja 9) que deja humo y estalla en cuatro explosiones alrededor del
//   objetivo. El original usa otros sprites para tres de ellas; el propietario recordaba Explosion 3 (effect3 hoja 5).
// - Blizzard: la lluvia de hielo en línea de Survivors (LINE_SPELL_LOOKS.blizzard), desde ti hasta el objetivo.
const ACTIVE_SPELLS_MASS_ICE = ACTIVE_SPELLS.massIceStrike as IceShardSpellDef;
const CHILL_DROP_FALL = { fallPx: 200, fallMs: 133 } as const;
const MASS_CHILL_WIND_BURSTS: readonly SpellBurst[] = [
    ...SPELLS.chillWind.bursts,
    { effect: 'fx.chillWind.drop', dx: -40, dy: 25, delayMs: 160, ...CHILL_DROP_FALL },
    { effect: 'fx.chillWind.drop', dx: 45, dy: 10, delayMs: 200, ...CHILL_DROP_FALL },
    { effect: 'fx.chillWind.drop', dx: -10, dy: -45, delayMs: 240, ...CHILL_DROP_FALL },
    { effect: 'fx.chillWind.drop', dx: 5, dy: 50, delayMs: 280, sound: 'sfx.chillWind', ...CHILL_DROP_FALL },
];

/** Mass Magic Missile: four explosions at the original's offsets (Client.cpp 15280), the later ones a little delayed. */
const MASS_MAGIC_MISSILE_BURSTS: readonly SpellBurst[] = [
    { effect: 'fx.explosion3', dx: 6, dy: -31, delayMs: 0, sound: 'sfx.explosion' },
    { effect: 'fx.explosion3', dx: -38, dy: -23, delayMs: 0 },
    { effect: 'fx.explosion3', dx: 14, dy: -38, delayMs: 80, sound: 'sfx.explosion' },
    { effect: 'fx.explosion3', dx: -4, dy: 6, delayMs: 160 },
];

/** Off's own projectile looks, shown like Survivors' spells (OffSpells.showSpell). */
export const OFF_EXTRA_LOOKS = {
    massLightningArrow: { ...SPELLS.lightningArrow, name: 'Mass Lightning Arrow', shots: 4, shotIntervalMs: 130 },
    massChillWind: { ...SPELLS.chillWind, name: 'Mass Chill Wind', bursts: MASS_CHILL_WIND_BURSTS, skyImpactMs: 280 + CHILL_DROP_FALL.fallMs + 60 },
    lightningStrike: { ...SPELLS.lightningBolt, name: 'Lightning Strike', shots: 5, shotIntervalMs: 90, scatterRadius: 48 },
    // Off-11C: one missile, faster than an Energy Bolt, leaving puffs of smoke (the original's "Burst", effect 8).
    massMagicMissile: {
        ...SPELLS.energyBolt, name: 'Mass Magic Missile', speed: 650, flyEffect: 'fx.massMagicMissile.fly',
        trail: { effect: 'fx.meteor.burst', everyMs: 40, spread: 10 }, bursts: MASS_MAGIC_MISSILE_BURSTS,
    },
} as const satisfies Record<string, SpellDef>;

/** Looks drawn by OffSpells' own code instead of as a projectile. */
export type OffDrawnLookId = 'iceStrike' | 'earthShockWave' | 'massIceStrike' | 'meteorStrike' | 'blizzard';
export type OffExtraLookId = keyof typeof OFF_EXTRA_LOOKS | OffDrawnLookId;

/** Ice Strike's rain (Client.cpp 15147): shards inside `spreadPx` of the target; the damage when the last one lands. */
export const OFF_ICE_STRIKE_LOOK = {
    ...ICE_SHARD_LOOK,
    largeShards: 15,
    smallShards: 6,
    spreadPx: 50,
} as const;

/** Off-11C, Mass Ice Strike: the rain of Survivors' Mass Ice Strike (more shards, a wider spot) on the 5 × 5 square. */
export const OFF_MASS_ICE_STRIKE_LOOK = {
    ...ICE_SHARD_LOOK,
    largeShards: ACTIVE_SPELLS_MASS_ICE.largeShards,
    smallShards: ACTIVE_SPELLS_MASS_ICE.smallShards,
    spreadPx: ACTIVE_SPELLS_MASS_ICE.spreadRadius,
} as const;

/** Off-11C, Blizzard: shards on each tile of the line, one tile every `stepMs`, more and wider towards the target. */
export const OFF_BLIZZARD_LOOK = { ...LINE_SPELL_LOOKS.blizzard, stepMs: 35 } as const;

/** Earth Shock Wave: a torrent and its dust on each tile of the line, one every `stepMs`. */
export const OFF_EARTH_SHOCK_LOOK = { ...LINE_SPELL_LOOKS.earthShock, stepMs: 40 } as const;

// Helbreath Off (Fase Off-6B): el nombre de la magia sobre la cabeza al empezar a prepararla, como el cliente original
// (reference/Client.cpp: mensaje de tipo 41 "Nombre!", dibujado con PutString_SprFont3 tipo 0 = la letra de las cartas
// de Survivors, SpriteText 'title'): rojo (RGB 75,10,10 × 4), 65 px sobre los pies, sube 1 px cada 32 ms hasta 10 px
// y se quita a los 2 s (DEF_CHATTIMEOUT_C; el valor no está en el repo, de memoria).
export const OFF_SPELL_NAME_LOOK = {
    color: 0xff2828,
    /** After the name (the original writes "Berserk!"). */
    suffix: '!',
    startAboveFeetPx: 65,
    msPerRisePx: 32,
    maxRisePx: 10,
    durationMs: 2000,
} as const;

/** Off-6C: the health Heal gives, over the player (green, as the potions' colour in Survivors). */
export const OFF_HEAL_NUMBER_COLOR = '#5cff6a';

/**
 * Off-6C: bottom right of the HUD, in the same place and letters as Survivors' buffs (HUD_BUFF): the shield on with its
 * seconds (lowest line) and, above it, the spell being prepared or ready.
 */
export const OFF_SPELL_HUD = {
    shieldColor: 0x8ad8ff,
    /** Off-8C: Berserk's line, in the red of Survivors' Berserk buff. */
    berserkColor: BUFFS.berserk.color,
    preparingColor: 0xb0a080,
    readyColor: 0xffd860,
    preparing: (name: string) => `${name}...`,
    ready: (name: string) => `${name} ready`,
    shield: (name: string, seconds: number) => `${name} ${seconds}s`,
} as const;

/**
 * Off-6C (propietario, 7-nov-2026): Defense Shield y Protection From Magic dejan un aura bajo los pies mientras duran
 * (`wornEffect` en off/data/offSpells.ts). Se dibujan a ras de suelo, debajo del personaje; esta es su transparencia
 * (el anillo, como el aura de Survivors).
 */
export const OFF_WORN_ALPHA: Partial<Record<EffectKey, number>> = { 'fx.aura.ring': AURA_RING_ALPHA };

/** The mark on the ground where a gamepad spell will fall (right stick, OFF_PAD_AIM). */
export const OFF_PAD_RETICLE = {
    radius: 14,
    lineWidth: 2,
    /** The cross in the middle, half its size. */
    crossHalf: 5,
    color: 0xfff2c0,
    /** Over a monster: it will take the spell. */
    monsterColor: 0xff7050,
    alpha: 0.85,
} as const;

/**
 * Holding RT (propietario, 9-nov-2026): the four gamepad spells as a cross, like the buttons (Y up, A down, X left,
 * B right), bottom centre over the HUD bar. A box per button with its letter and the spell.
 */
export const OFF_PAD_CROSS = {
    /** Centre of the cross: this far above the bottom of the play area. */
    bottomGap: byDevice(78, 92),
    /** Distance from the centre to each box's centre. */
    spreadX: byDevice(112, 128),
    spreadY: byDevice(40, 46),
    boxWidth: byDevice(150, 172),
    boxHeight: byDevice(30, 34),
    boxColor: 0x14100a,
    boxAlpha: 0.78,
    borderColor: 0x8a7444,
    /** Without the mana for it, or no spell on that button. */
    dimAlpha: 0.45,
    letterRadius: byDevice(10, 11),
    /** A, B, X, Y in the usual colours. */
    letterColors: [0x3fae49, 0xd8423a, 0x3d7fd6, 0xe0b52c],
    letterStyle: { ...UI_TEXT, fontSize: byDevice('13px', '15px'), fontStyle: 'bold', color: '#ffffff' },
    nameStyle: { ...UI_TEXT, fontSize: byDevice('13px', '15px'), color: '#e8d9a8' },
    empty: '-',
} as const;
