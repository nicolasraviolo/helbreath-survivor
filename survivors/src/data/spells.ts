// Hechizos de la Maga (Fase 6, bloque 6B; decidido con el propietario el 16-oct-2026).
// - Igual que el Guerrero con su arma: UN solo hechizo automático "en la mano". Desde la Fase 20C las cartas ya no dan
//   hechizos; desde el 20D se elige en la pantalla Equipment (hueco Spell 1, data/items.ts).
// - Fase 20D (propietario, 19-oct-2026): los círculos 1–5 son automáticos (hueco 1) y los 6–10, activos (hueco 2,
//   data/activeSpells.ts). Energy Strike y Mass Fire Strike (círculo 7) se quedan aquí solo como proyectil: los usa su
//   versión activa. Requisito: la Int del original (reference/Magic.cfg), sin Level.
// - Energy: rápido, a un objetivo. Fire: lento y en área. Lightning (Fase 26C): a un objetivo y fuerte. Ice (26C): cae
//   del cielo en zona (Chill Wind no ralentiza: decidido por el propietario el 22-oct-2026).
// - Fase 26C (propietario, 22-oct-2026): la Int pedida ya no es la del original, sino una escalera para ir abriendo
//   hechizos poco a poco, uno cada pocos Level. Spell 1: Energy Bolt (gratis) → Fire Ball 26 → Lightning Arrow 30 →
//   Fire Strike 34 → Chill Wind 40 → Triple Energy Bolt 45 → Lightning Bolt 55. Spell 2 en data/activeSpells.ts.
//   Lightning Bolt (círculo 6 en el original) va aquí, como automático.
// - Visuales y sonidos de sp-client/src/game/spells/ y constants/Effects.ts (ver NOTES.md).
// - Daños orientados por la wiki (docs/hb-wiki/hechizos.md), adaptados a un survivors.
import type { SoundKey } from '../config/assetManifest';
import type { EffectKey } from '../config/effects';

export type SpellFamilyId = 'energy' | 'fire' | 'lightning' | 'ice';

/** One explosion drawn at impact, `delayMs` after it and moved by (dx, dy) pixels. */
export interface SpellBurst {
    effect: EffectKey;
    dx: number;
    dy: number;
    delayMs: number;
    sound?: SoundKey;
    /** Drawn `fallPx` above its point and falling onto it in `fallMs` while it animates (Chill Wind's drops). */
    fallPx?: number;
    fallMs?: number;
}

/** Sparks left behind a flying projectile, one every `everyMs`, up to `spread` px off its path (Lightning Arrow). */
export interface SpellTrail {
    effect: EffectKey;
    everyMs: number;
    spread: number;
}

export interface SpellDef {
    name: string;
    family: SpellFamilyId;
    /** Circle of the original (Magic.cfg id / 10 + 1): 1–5 cast themselves, 6–10 are active spells. */
    circle: number;
    /** Permanent Int needed to equip it (the original's ReqInt). */
    int: number;
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
     * 'scatter' = random points around the nearest enemy, within `scatterRadius`;
     * 'pattern' = all at once, each to the nearest enemy moved by its `pattern` offset (a small area, like the original);
     * 'sky' = no projectile: it falls from the sky on the nearest enemy (its bursts, and the damage after `skyImpactMs`).
     */
    aim: 'targets' | 'scatter' | 'pattern' | 'sky';
    /** 'sky': time from the cast to the damage (the drops' fall); 0 = at once (a lightning). */
    skyImpactMs?: number;
    /** 'sky': a lightning drawn from far above onto the target as it strikes (sp-client LightningBolt). */
    skyLightning?: boolean;
    /** Sparks left while flying. */
    trail?: SpellTrail;
    scatterRadius?: number;
    /** 'pattern': offset (px) from the target of each shot, one per shot. */
    pattern?: ReadonlyArray<readonly [number, number]>;
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

/** Chill Wind: 4 drops falling 200 px at 1500 px/s, at the original's offsets (sp-client ChillWind.ts, Client.cpp 15103). */
const CHILL_WIND_FALL_PX = 200;
const CHILL_WIND_FALL_MS = 133;
const CHILL_WIND_BURSTS: readonly SpellBurst[] = [
    { effect: 'fx.chillWind.drop', dx: 0, dy: 0, delayMs: 0, sound: 'sfx.chillWind', fallPx: CHILL_WIND_FALL_PX, fallMs: CHILL_WIND_FALL_MS },
    { effect: 'fx.chillWind.drop', dx: -30, dy: -15, delayMs: 40, fallPx: CHILL_WIND_FALL_PX, fallMs: CHILL_WIND_FALL_MS },
    { effect: 'fx.chillWind.drop', dx: 35, dy: -30, delayMs: 80, fallPx: CHILL_WIND_FALL_PX, fallMs: CHILL_WIND_FALL_MS },
    { effect: 'fx.chillWind.drop', dx: 20, dy: 30, delayMs: 120, fallPx: CHILL_WIND_FALL_PX, fallMs: CHILL_WIND_FALL_MS },
];

/** Energy Bolt cast height (sp-client ENERGY_BOLT_ORIGIN_OFFSET_Y = 50; a bit lower here). */
const ENERGY_ORIGIN_Y = 40;
/** Fire Ball and other directional projectiles (sp-client DirectionalProjectile: 40). */
const FIRE_ORIGIN_Y = 40;

export const SPELLS = {
    // Energy: rápido, a un objetivo.
    energyBolt: {
        // wiki: 10 directo + 7 en área 3×3.
        name: 'Energy Bolt', family: 'energy', circle: 2, int: 24,
        directDamage: 10, areaDamage: 7, areaRadius: 48, cooldownMs: 1100,
        range: 320, maxDistance: 480, speed: 420, projectileRadius: 8, knockback: 160,
        shots: 1, shotIntervalMs: 0, aim: 'targets',
        flyEffect: 'fx.energyBolt.fly',
        bursts: [{ effect: 'fx.energyBolt.explode', dx: 0, dy: 0, delayMs: 0, sound: 'sfx.energyBolt.impact' }],
        castSound: 'sfx.energyBolt.cast', originOffsetY: ENERGY_ORIGIN_Y,
    },
    tripleEnergyBolt: {
        // wiki: 10 directo + 19 en área 5×5. Como en el original (sp-client TripleEnergyBolt.ts), las 3 bolas caen en una
        // zona pequeña: una en el objetivo y dos en casillas en diagonal a él (lista de bugs del 19-oct-2026, M14; antes
        // iban a 3 enemigos distintos).
        name: 'Triple Energy Bolt', family: 'energy', circle: 5, int: 45,
        directDamage: 10, areaDamage: 9, areaRadius: 48, cooldownMs: 1200,
        range: 340, maxDistance: 500, speed: 440, projectileRadius: 8, knockback: 160,
        shots: 3, shotIntervalMs: 0, aim: 'pattern', pattern: [[0, 0], [-32, -32], [32, 32]],
        flyEffect: 'fx.energyBolt.fly',
        bursts: [{ effect: 'fx.energyBolt.explode', dx: 0, dy: 0, delayMs: 0, sound: 'sfx.energyBolt.impact' }],
        castSound: 'sfx.energyBolt.cast', originOffsetY: ENERGY_ORIGIN_Y,
    },
    energyStrike: {
        // wiki: 42 de área 5×5. Aquí: 8 descargas, una cada 80 ms, alrededor del enemigo (como en sp-client).
        // Fase 13C: 8 por descarga (antes 14): a un jefe le caían casi todas y lo mataba en segundos.
        name: 'Energy Strike', family: 'energy', circle: 7, int: 67,
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
        name: 'Fire Ball', family: 'fire', circle: 3, int: 26,
        directDamage: 8, areaDamage: 14, areaRadius: 64, cooldownMs: 1500,
        range: 320, maxDistance: 480, speed: 380, projectileRadius: 10, knockback: 200,
        shots: 1, shotIntervalMs: 0, aim: 'targets',
        flyEffect: 'fx.fireBall.fly',
        bursts: [{ effect: 'fx.fireBall.explode', dx: 0, dy: 0, delayMs: 0, sound: 'sfx.explosion' }],
        originOffsetY: FIRE_ORIGIN_Y, impactShakePx: 3,
    },
    fireStrike: {
        // wiki: 8 directo + 13 en área 5×5.
        name: 'Fire Strike', family: 'fire', circle: 4, int: 34,
        directDamage: 8, areaDamage: 20, areaRadius: 80, cooldownMs: 1600,
        range: 320, maxDistance: 480, speed: 380, projectileRadius: 10, knockback: 220,
        shots: 1, shotIntervalMs: 0, aim: 'targets',
        flyEffect: 'fx.fireBall.fly', bursts: FIRE_STRIKE_BURSTS, originOffsetY: FIRE_ORIGIN_Y, impactShakePx: 4,
    },
    massFireStrike: {
        // wiki: 11 directo + 43 en área 5×5.
        name: 'Mass Fire Strike', family: 'fire', circle: 7, int: 75,
        directDamage: 11, areaDamage: 32, areaRadius: 96, cooldownMs: 1800,
        range: 340, maxDistance: 500, speed: 380, projectileRadius: 10, knockback: 240,
        shots: 1, shotIntervalMs: 0, aim: 'targets',
        flyEffect: 'fx.fireBall.fly', bursts: MASS_FIRE_STRIKE_BURSTS, originOffsetY: FIRE_ORIGIN_Y, impactShakePx: 6,
    },
    // Lightning (Fase 26C): fuerte contra uno solo.
    lightningArrow: {
        // wiki: 30 al objetivo, sin área (círculo 4). Aquí: rápida y de largo alcance, buena contra jefes. Propietario
        // (23-oct-2026): también un poco a los de al lado, en un área pequeña y con menos daño, como Lightning Bolt.
        name: 'Lightning Arrow', family: 'lightning', circle: 4, int: 30,
        directDamage: 30, areaDamage: 9, areaRadius: 36, cooldownMs: 800,
        range: 380, maxDistance: 560, speed: 700, projectileRadius: 8, knockback: 120,
        shots: 1, shotIntervalMs: 0, aim: 'targets',
        flyEffect: 'fx.lightningArrow.fly',
        trail: { effect: 'fx.lightningArrow.spark', everyMs: 25, spread: 10 },
        bursts: [{ effect: 'fx.energyBolt.explode', dx: 0, dy: 0, delayMs: 0, sound: 'sfx.energyBolt.impact' }],
        castSound: 'sfx.energyBolt.cast', originOffsetY: ENERGY_ORIGIN_Y,
    },
    lightningBolt: {
        // wiki: 30 al objetivo + 12 en el camino y la zona (círculo 6). Propietario (22-oct-2026): automático, mucho daño y
        // poco alcance. Un rayo cae del cielo sobre el más cercano (como sp-client LightningBolt sin origen).
        name: 'Lightning Bolt', family: 'lightning', circle: 6, int: 55,
        directDamage: 60, areaDamage: 22, areaRadius: 60, cooldownMs: 1200,
        range: 180, maxDistance: 0, speed: 0, projectileRadius: 24, knockback: 180,
        shots: 1, shotIntervalMs: 0, aim: 'sky', skyImpactMs: 0, skyLightning: true,
        flyEffect: 'fx.energyBolt.fly',
        bursts: [{ effect: 'fx.energyBolt.explode', dx: 0, dy: 0, delayMs: 0, sound: 'sfx.lightning' }],
        originOffsetY: ENERGY_ORIGIN_Y, impactShakePx: 4,
    },
    // Ice (Fase 26C): cae del cielo en zona.
    chillWind: {
        // wiki: 19 en área 3×3 (círculo 5). Sin ralentizar (propietario, 22-oct-2026). Cuatro gotas alrededor del objetivo;
        // el daño, una vez, cuando caen.
        name: 'Chill Wind', family: 'ice', circle: 5, int: 40,
        directDamage: 0, areaDamage: 22, areaRadius: 80, cooldownMs: 1500,
        range: 320, maxDistance: 0, speed: 0, projectileRadius: 0, knockback: 140,
        shots: 1, shotIntervalMs: 0, aim: 'sky', skyImpactMs: CHILL_WIND_FALL_MS + 60,
        flyEffect: 'fx.energyBolt.fly', bursts: CHILL_WIND_BURSTS, originOffsetY: 0,
    },
} as const satisfies Record<string, SpellDef>;

export type SpellId = keyof typeof SPELLS;

/** The spells of circles 1–5 (they go in the first slot and cast themselves), in the order of their requirement. */
export const AUTO_SPELL_IDS = ['energyBolt', 'fireBall', 'lightningArrow', 'fireStrike', 'chillWind', 'tripleEnergyBolt', 'lightningBolt'] as const satisfies readonly SpellId[];
export type AutoSpellId = (typeof AUTO_SPELL_IDS)[number];

export function isAutoSpellId(id: string): id is AutoSpellId {
    return (AUTO_SPELL_IDS as readonly string[]).includes(id);
}

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

/** Lightning drawn from the sky (Lightning Bolt, Fase 26C): sp-client LightningBolt.ts, without a caster origin. */
export const LIGHTNING_LOOK = {
    /** It starts this far above the target (LIGHTNING_SOURCE_OFFSET_Y). */
    fromDy: 600,
    segments: 20,
    /** Random sideways shift of each joint (px); the original's jitter is 1 tile-ish, a bit wider here. */
    jitterPx: 14,
    /** Redrawn every `redrawMs` while it lasts `durationMs`. */
    redrawMs: 20,
    durationMs: 120,
    core: { width: 3, color: 0xffffff, alpha: 0.95 },
    glow: { width: 1, color: 0x6464ff, alpha: 0.6, offsetPx: 2 },
} as const;
