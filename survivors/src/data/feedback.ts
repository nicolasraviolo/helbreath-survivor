// Sensación de impacto (Fase 10, bloque 10C): temblor de cámara y partículas de golpe y de muerte.
// El temblor viene del original (sp-client CameraManager.setCameraShake, que se puede quitar en las opciones); cuándo tiembla lo decidió
// el propietario. Las partículas son nuestras: el original solo tiene el destello fx.hit y no hay sangre.
import { byDevice } from '../config/device';

export const SCREEN_SHAKE = {
    /** Shakes weaker than this (pixels) are skipped, like the original ignores degree <= 2. */
    minPx: 1,
    /** Any monster blow or arrow: soft (decided by the owner on 17-oct-2026). */
    hurtPx: 2,
    hurtMs: 150,
    /** A blow or a fireball from a boss: stronger. */
    bossHitPx: 6,
    bossHitMs: 300,
    /** Big spell explosions (SpellDef.impactShakePx) only shake on a critical hit, and at most once in this time. */
    explosionMs: 220,
    explosionCooldownMs: 2500,
} as const;

export interface ParticleBurstDef {
    /** Particles per burst. */
    count: number;
    speedMin: number;
    speedMax: number;
    lifespanMs: number;
    /** Size at the start and the end, as a multiple of the texture. */
    scaleStart: number;
    scaleEnd: number;
    /** Pulls the particles down (pixels per second²); negative floats them up. */
    gravityY: number;
    /** Colours picked at random for each particle. */
    tints: readonly number[];
    /** Light (added on top) or solid. */
    additive: boolean;
}

export const PARTICLES = {
    /** Sparks jumping out of a monster on every hit, away from the blow. */
    hit: {
        count: byDevice(4, 3), speedMin: 60, speedMax: 170, lifespanMs: 260, scaleStart: 1.4, scaleEnd: 0.2,
        gravityY: 300, tints: [0xfff2a8, 0xffc04a, 0xbfe0ff], additive: true,
    },
    /** Dust puff at the feet when a monster dies. */
    deathDust: {
        count: byDevice(7, 4), speedMin: 15, speedMax: 55, lifespanMs: 520, scaleStart: 0.9, scaleEnd: 2.2,
        gravityY: -20, tints: [0x8c7a60, 0xa89478, 0x6e6250], additive: false,
    },
    /** A few sparks with the dust when a monster dies. */
    deathSparks: {
        count: byDevice(6, 3), speedMin: 80, speedMax: 200, lifespanMs: 340, scaleStart: 1.6, scaleEnd: 0.2,
        gravityY: 260, tints: [0xfff2a8, 0xffa040], additive: true,
    },
} as const satisfies Record<string, ParticleBurstDef>;

/** How wide the hit sparks spread around the direction of the blow, in degrees. */
export const HIT_SPARK_SPREAD_DEGREES = 110;

/** Most particles alive at once for each kind (the phone gets fewer). Extra bursts are skipped. */
export const MAX_ALIVE_PARTICLES = byDevice(220, 90);
