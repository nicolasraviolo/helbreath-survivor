// Hechizos de la Maga (Fase 6, bloque 6B; decidido con el propietario el 16-oct-2026).
// - Igual que el Guerrero con su arma: UN solo hechizo "en la mano". Las cartas ofrecen el siguiente eslabón
//   de la familia o cambiar de familia. Requisito: Int (números PROPIOS, no los del original).
// - Energy: rápido, a un objetivo. Fire: lento y en área.
// - Visuales y sonidos de sp-client/src/game/spells/ y constants/Effects.ts (ver NOTES.md).
// - Daños orientados por la wiki (docs/hb-wiki/hechizos.md), adaptados a un survivors.
import type { SoundKey } from '../config/assetManifest';
import type { EffectKey } from '../config/effects';

export type SpellFamilyId = 'energy' | 'fire';

/** One explosion drawn at impact, `delayMs` after it and moved by (dx, dy) pixels. */
export interface SpellBurst {
    effect: EffectKey;
    dx: number;
    dy: number;
    delayMs: number;
    sound?: SoundKey;
}

export interface SpellDef {
    name: string;
    family: SpellFamilyId;
    /** Int needed for the card to appear. */
    intRequired: number;
    /** Damage to the enemy the projectile hits. */
    directDamage: number;
    /** Damage to every enemy inside the explosion (the hit enemy too, as in Helbreath). */
    areaDamage: number;
    /** Explosion radius in pixels. */
    areaRadius: number;
    /** Time between casts in milliseconds (shortened by Dex and the Mage bonus). */
    cooldownMs: number;
    /** Only casts at enemies closer than this (pixels). */
    range: number;
    /** Distance a projectile flies before exploding on its own. */
    maxDistance: number;
    /** Projectile speed in pixels per second. */
    speed: number;
    /** Projectile body radius for hitting enemies, in pixels. */
    projectileRadius: number;
    /** Push given to hit enemies (px/s). */
    knockback: number;
    /** Projectiles per cast. */
    shots: number;
    /** Time between projectiles of the same cast (0 = all at once). */
    shotIntervalMs: number;
    /**
     * Where each projectile goes: 'targets' = a different nearby enemy each (the nearest first);
     * 'scatter' = random points around the nearest enemy, within `scatterRadius`.
     */
    aim: 'targets' | 'scatter';
    scatterRadius?: number;
    /** Flight effect. Directional effects pick their frames by the flight angle (config/effects.ts). */
    flyEffect: EffectKey;
    /** Explosions drawn at impact (the damage is applied once, at impact). */
    bursts: readonly SpellBurst[];
    /** Played once per projectile launched. */
    castSound?: SoundKey;
    /** Pixels above the caster's feet where projectiles start. */
    originOffsetY: number;
    /**
     * Camera shake, in pixels, when an impact is a critical hit (data/feedback.ts).
     * Only the big explosions, as in the original (Fire Ball, Fire Strike, Mass Fire Strike, Energy Strike).
     */
    impactShakePx?: number;
}

export interface SpellFamilyDef {
    name: string;
    enabled: boolean;
    links: readonly SpellId[];
}

/** Fire Strike / Mass Fire Strike explosions (sp-client FireStrike.ts:84 and MassFireStrike.ts:222). */
const FIRE_STRIKE_BURSTS: readonly SpellBurst[] = [
    { effect: 'fx.fireBall.explode', dx: 0, dy: 0, delayMs: 0, sound: 'sfx.explosion' },
    { effect: 'fx.fireBall.explode', dx: 20, dy: 30, delayMs: 60, sound: 'sfx.explosion' },
    { effect: 'fx.fireBall.explode', dx: 35, dy: -30, delayMs: 100, sound: 'sfx.explosion' },
    { effect: 'fx.fireBall.explode', dx: -30, dy: -15, delayMs: 140, sound: 'sfx.explosion' },
];
const MASS_FIRE_STRIKE_BURSTS: readonly SpellBurst[] = [
    { effect: 'fx.explosion1', dx: 0, dy: 0, delayMs: 0, sound: 'sfx.explosion' },
    { effect: 'fx.explosion2', dx: -30, dy: -15, delayMs: 60, sound: 'sfx.explosion' },
    { effect: 'fx.explosion2', dx: 35, dy: -30, delayMs: 100, sound: 'sfx.explosion' },
    { effect: 'fx.explosion2', dx: 20, dy: 30, delayMs: 140, sound: 'sfx.explosion' },
];

/** Energy Bolt cast height (sp-client ENERGY_BOLT_ORIGIN_OFFSET_Y = 50; a bit lower here). */
const ENERGY_ORIGIN_Y = 40;
/** Fire Ball and other directional projectiles (sp-client DirectionalProjectile: 40). */
const FIRE_ORIGIN_Y = 40;

export const SPELLS = {
    // Energy: rápido, a un objetivo.
    energyBolt: {
        // wiki: 10 directo + 7 en área 3×3.
        name: 'Energy Bolt', family: 'energy', intRequired: 0,
        directDamage: 10, areaDamage: 7, areaRadius: 48, cooldownMs: 1100,
        range: 320, maxDistance: 480, speed: 420, projectileRadius: 8, knockback: 160,
        shots: 1, shotIntervalMs: 0, aim: 'targets',
        flyEffect: 'fx.energyBolt.fly',
        bursts: [{ effect: 'fx.energyBolt.explode', dx: 0, dy: 0, delayMs: 0, sound: 'sfx.energyBolt.impact' }],
        castSound: 'sfx.energyBolt.cast', originOffsetY: ENERGY_ORIGIN_Y,
    },
    tripleEnergyBolt: {
        // wiki: 10 directo + 19 en área 5×5. Aquí: 3 bolas a 3 enemigos distintos.
        name: 'Triple Energy Bolt', family: 'energy', intRequired: 20,
        directDamage: 10, areaDamage: 9, areaRadius: 48, cooldownMs: 1200,
        range: 340, maxDistance: 500, speed: 440, projectileRadius: 8, knockback: 160,
        shots: 3, shotIntervalMs: 0, aim: 'targets',
        flyEffect: 'fx.energyBolt.fly',
        bursts: [{ effect: 'fx.energyBolt.explode', dx: 0, dy: 0, delayMs: 0, sound: 'sfx.energyBolt.impact' }],
        castSound: 'sfx.energyBolt.cast', originOffsetY: ENERGY_ORIGIN_Y,
    },
    energyStrike: {
        // wiki: 42 de área 5×5. Aquí: 8 descargas, una cada 80 ms, alrededor del enemigo (como en sp-client).
        // Fase 13C: 8 por descarga (antes 14): a un jefe le caían casi todas y lo mataba en segundos.
        name: 'Energy Strike', family: 'energy', intRequired: 32,
        directDamage: 0, areaDamage: 8, areaRadius: 44, cooldownMs: 1800,
        range: 360, maxDistance: 520, speed: 560, projectileRadius: 8, knockback: 120,
        shots: 8, shotIntervalMs: 80, aim: 'scatter', scatterRadius: 64,
        flyEffect: 'fx.energyStrike.fly',
        bursts: [
            { effect: 'fx.explosion3', dx: 0, dy: 0, delayMs: 0, sound: 'sfx.energyBolt.impact' },
            { effect: 'fx.explosion4', dx: 0, dy: 0, delayMs: 0 },
        ],
        castSound: 'sfx.energyBolt.cast', originOffsetY: ENERGY_ORIGIN_Y, impactShakePx: 3,
    },
    // Fire: lento, en área.
    fireBall: {
        name: 'Fire Ball', family: 'fire', intRequired: 17,
        directDamage: 8, areaDamage: 14, areaRadius: 64, cooldownMs: 1500,
        range: 320, maxDistance: 480, speed: 380, projectileRadius: 10, knockback: 200,
        shots: 1, shotIntervalMs: 0, aim: 'targets',
        flyEffect: 'fx.fireBall.fly',
        bursts: [{ effect: 'fx.fireBall.explode', dx: 0, dy: 0, delayMs: 0, sound: 'sfx.explosion' }],
        originOffsetY: FIRE_ORIGIN_Y, impactShakePx: 3,
    },
    fireStrike: {
        // wiki: 8 directo + 13 en área 5×5.
        name: 'Fire Strike', family: 'fire', intRequired: 24,
        directDamage: 8, areaDamage: 20, areaRadius: 80, cooldownMs: 1600,
        range: 320, maxDistance: 480, speed: 380, projectileRadius: 10, knockback: 220,
        shots: 1, shotIntervalMs: 0, aim: 'targets',
        flyEffect: 'fx.fireBall.fly', bursts: FIRE_STRIKE_BURSTS, originOffsetY: FIRE_ORIGIN_Y, impactShakePx: 4,
    },
    massFireStrike: {
        // wiki: 11 directo + 43 en área 5×5.
        name: 'Mass Fire Strike', family: 'fire', intRequired: 36,
        directDamage: 11, areaDamage: 32, areaRadius: 96, cooldownMs: 1800,
        range: 340, maxDistance: 500, speed: 380, projectileRadius: 10, knockback: 240,
        shots: 1, shotIntervalMs: 0, aim: 'targets',
        flyEffect: 'fx.fireBall.fly', bursts: MASS_FIRE_STRIKE_BURSTS, originOffsetY: FIRE_ORIGIN_Y, impactShakePx: 6,
    },
} as const satisfies Record<string, SpellDef>;

export type SpellId = keyof typeof SPELLS;

export const SPELL_FAMILIES = {
    energy: { name: 'Energy', enabled: true, links: ['energyBolt', 'tripleEnergyBolt', 'energyStrike'] },
    fire: { name: 'Fire', enabled: true, links: ['fireBall', 'fireStrike', 'massFireStrike'] },
} as const satisfies Record<SpellFamilyId, SpellFamilyDef>;

/**
 * Familias previstas pero aún sin hacer (visuales más complejos). Solo como referencia de diseño:
 * no tienen datos de juego todavía. Int = requisito propio provisional.
 */
export const PLANNED_SPELL_FAMILIES = [
    { name: 'Lightning', links: [{ name: 'Lightning', int: 22 }, { name: 'Lightning Bolt', int: 30 }, { name: 'Lightning Strike', int: 44 }] },
    { name: 'Ice', links: [{ name: 'Chill Wind', int: 20 }, { name: 'Ice Strike', int: 28 }, { name: 'Mass Ice Strike', int: 42 }] },
    { name: 'Meteor', links: [{ name: 'Meteor Strike', int: 50 }] },
] as const;

/**
 * Cast animation: the original takes 1500 ms (16 frames), far too slow for a survivors; it is squeezed to this.
 * The caster stands still until the spell leaves (CAST_RELEASE_MOMENT of it) and then may run again.
 */
export const CAST_ANIMATION_MS = 480;
export const CAST_RELEASE_MOMENT = 0.35;
/** Cast sound (C16, PLAYER_CAST), squeezed to the cast animation like in the original. */
export const CAST_SOUND: SoundKey = 'sfx.cast';

export function getSpell(id: SpellId): SpellDef {
    return SPELLS[id];
}
