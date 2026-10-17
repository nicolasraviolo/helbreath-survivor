// Partículas de impacto (Fase 10, bloque 10C): chispas al golpear a un monstruo y una nube de polvo con chispas al morir.
// El original no tiene esto (solo el destello fx.hit), así que las texturas son dos puntos dibujados aquí, no assets.
// Cada tipo es un emisor de Phaser, que recicla sus partículas (regla 5); MAX_ALIVE_PARTICLES las limita en el móvil.
import Phaser from 'phaser';
import { DEPTH_DAMAGE_NUMBERS, DEPTH_GEMS } from '../config/gameConfig';
import { HIT_SPARK_SPREAD_DEGREES, MAX_ALIVE_PARTICLES, PARTICLES, type ParticleBurstDef } from '../data/feedback';

/** Generated textures (not files, so they are not in the asset manifest). */
const SPARK_TEXTURE = 'particle.spark';
const DUST_TEXTURE = 'particle.dust';
const SPARK_SIZE = 3;
const DUST_RADIUS = 4;

export class HitParticles {
    private readonly hitSparks: Phaser.GameObjects.Particles.ParticleEmitter;
    private readonly deathDust: Phaser.GameObjects.Particles.ParticleEmitter;
    private readonly deathSparks: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene) {
        createTextures(scene);
        // Sparks over everything but the damage numbers; the dust under the XP gems, which must never be hidden.
        this.hitSparks = createEmitter(scene, SPARK_TEXTURE, PARTICLES.hit, DEPTH_DAMAGE_NUMBERS - 1);
        this.deathDust = createEmitter(scene, DUST_TEXTURE, PARTICLES.deathDust, DEPTH_GEMS - 2);
        this.deathSparks = createEmitter(scene, SPARK_TEXTURE, PARTICLES.deathSparks, DEPTH_GEMS - 1);
    }

    /** A blow from (fromX, fromY) landed at (x, y): sparks fly away from it. */
    public hit(x: number, y: number, fromX: number, fromY: number): void {
        const angle = x === fromX && y === fromY ? -90 : Phaser.Math.RadToDeg(Math.atan2(y - fromY, x - fromX));
        const half = HIT_SPARK_SPREAD_DEGREES / 2;
        this.hitSparks.setEmitterAngle({ min: angle - half, max: angle + half });
        this.hitSparks.explode(PARTICLES.hit.count, x, y);
    }

    /** A monster died with its feet at (x, y) and its body at bodyY. */
    public death(x: number, y: number, bodyY: number): void {
        this.deathDust.explode(PARTICLES.deathDust.count, x, y);
        this.deathSparks.explode(PARTICLES.deathSparks.count, x, bodyY);
    }

    /** Particles alive now (debug panel). */
    public get active(): number {
        return this.hitSparks.getAliveParticleCount() + this.deathDust.getAliveParticleCount() + this.deathSparks.getAliveParticleCount();
    }
}

function createEmitter(scene: Phaser.Scene, texture: string, def: ParticleBurstDef, depth: number): Phaser.GameObjects.Particles.ParticleEmitter {
    return scene.add.particles(0, 0, texture, {
        emitting: false,
        speed: { min: def.speedMin, max: def.speedMax },
        angle: { min: 0, max: 360 },
        lifespan: def.lifespanMs,
        scale: { start: def.scaleStart, end: def.scaleEnd },
        alpha: { start: 1, end: 0 },
        gravityY: def.gravityY,
        tint: [...def.tints],
        blendMode: def.additive ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
        maxAliveParticles: MAX_ALIVE_PARTICLES,
    }).setDepth(depth);
}

/** Draws the two particle textures once (they stay for the whole game). */
function createTextures(scene: Phaser.Scene): void {
    if (scene.textures.exists(SPARK_TEXTURE)) return;
    const graphics = scene.make.graphics({}, false);
    graphics.fillStyle(0xffffff).fillRect(0, 0, SPARK_SIZE, SPARK_SIZE);
    graphics.generateTexture(SPARK_TEXTURE, SPARK_SIZE, SPARK_SIZE);
    graphics.clear();
    graphics.fillStyle(0xffffff, 0.35).fillCircle(DUST_RADIUS, DUST_RADIUS, DUST_RADIUS);
    graphics.fillStyle(0xffffff, 0.6).fillCircle(DUST_RADIUS, DUST_RADIUS, DUST_RADIUS / 2);
    graphics.generateTexture(DUST_TEXTURE, DUST_RADIUS * 2, DUST_RADIUS * 2);
    graphics.destroy();
}
