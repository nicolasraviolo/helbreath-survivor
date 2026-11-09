import type { EffectKey } from '../../config/effects';
import { ICE_SHARD_LOOK, LINE_SPELL_LOOKS } from '../../data/activeSpells';
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
const CHILL_DROP_FALL = { fallPx: 200, fallMs: 133 } as const;
const MASS_CHILL_WIND_BURSTS: readonly SpellBurst[] = [
    ...SPELLS.chillWind.bursts,
    { effect: 'fx.chillWind.drop', dx: -40, dy: 25, delayMs: 160, ...CHILL_DROP_FALL },
    { effect: 'fx.chillWind.drop', dx: 45, dy: 10, delayMs: 200, ...CHILL_DROP_FALL },
    { effect: 'fx.chillWind.drop', dx: -10, dy: -45, delayMs: 240, ...CHILL_DROP_FALL },
    { effect: 'fx.chillWind.drop', dx: 5, dy: 50, delayMs: 280, sound: 'sfx.chillWind', ...CHILL_DROP_FALL },
];

/** Off's own projectile looks, shown like Survivors' spells (OffSpells.showSpell). */
export const OFF_EXTRA_LOOKS = {
    massLightningArrow: { ...SPELLS.lightningArrow, name: 'Mass Lightning Arrow', shots: 4, shotIntervalMs: 130 },
    massChillWind: { ...SPELLS.chillWind, name: 'Mass Chill Wind', bursts: MASS_CHILL_WIND_BURSTS, skyImpactMs: 280 + CHILL_DROP_FALL.fallMs + 60 },
    lightningStrike: { ...SPELLS.lightningBolt, name: 'Lightning Strike', shots: 5, shotIntervalMs: 90, scatterRadius: 48 },
} as const satisfies Record<string, SpellDef>;

/** Looks drawn by OffSpells' own code instead of as a projectile. */
export type OffDrawnLookId = 'iceStrike' | 'earthShockWave';
export type OffExtraLookId = keyof typeof OFF_EXTRA_LOOKS | OffDrawnLookId;

/** Ice Strike's rain (Client.cpp 15147): shards inside `spreadPx` of the target; the damage when the last one lands. */
export const OFF_ICE_STRIKE_LOOK = {
    ...ICE_SHARD_LOOK,
    largeShards: 15,
    smallShards: 6,
    spreadPx: 50,
} as const;

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
