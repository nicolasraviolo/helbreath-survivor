// Armas automáticas. Por ahora solo Energy Bolt (Fase 4). La Espada y las familias llegan en la Fase 6.
// Daño según la wiki (docs/hb-wiki/hechizos.md, Circle 2): 10 de daño directo + 7 en un área de 3×3 casillas.
// Velocidad, recarga y alcance son nuestros, pensados para un survivors.
import type { SoundKey } from '../config/assetManifest';
import type { EffectKey } from '../config/effects';
import type { DamageType } from '../entities/CharacterStats';

export interface ProjectileWeaponDef {
    name: string;
    /** Physical damage grows with Str, magic damage with Mag. */
    damageType: DamageType;
    /** Damage to the enemy the projectile hits. */
    directDamage: number;
    /** Damage to every enemy inside the explosion (the hit enemy too, as in Helbreath). */
    areaDamage: number;
    /** Explosion radius in pixels. */
    areaRadius: number;
    /** Time between shots in milliseconds. */
    cooldownMs: number;
    /** Only fires at enemies closer than this (pixels). */
    range: number;
    /** Distance the projectile flies before exploding on its own (a bit more than `range`). */
    maxDistance: number;
    /** Projectile speed in pixels per second. */
    speed: number;
    /** Projectile body radius for hitting enemies, in pixels. */
    projectileRadius: number;
    /** Initial push speed given to hit enemies (px/s); it fades out quickly. */
    knockback: number;
    flyEffect: EffectKey;
    explodeEffect: EffectKey;
    castSound: SoundKey;
    impactSound: SoundKey;
}

export const WEAPONS = {
    energyBolt: {
        name: 'Energy Bolt',
        damageType: 'magic',
        directDamage: 10,
        areaDamage: 7,
        // 3×3 casillas de 32 px → 1,5 casillas alrededor del impacto.
        areaRadius: 48,
        cooldownMs: 1100,
        range: 320,
        maxDistance: 480,
        speed: 420,
        projectileRadius: 8,
        knockback: 160,
        flyEffect: 'fx.energyBolt.fly',
        explodeEffect: 'fx.energyBolt.explode',
        castSound: 'sfx.energyBolt.cast',
        impactSound: 'sfx.energyBolt.impact',
    },
} as const satisfies Record<string, ProjectileWeaponDef>;

export type WeaponId = keyof typeof WEAPONS;
