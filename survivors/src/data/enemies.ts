// Contenido de enemigos. Velocidades inspiradas en multiplayer/server/Config/Monsters.json
// (allí son ms por casilla: Slime 800, Orc 700, Ant/Bunny 220), suavizadas para que el jugador
// (150 px/s) pueda escapar. Vida y daño son nuestros; se ajustarán jugando.
// XP: proporcional a la Base XP de la wiki (docs/hb-wiki/monstruos.md): Rabbit 250, Slime 400, Giant Ant 700, Orc 1.300.
import type { SoundKey, SpriteKey } from '../config/assetManifest';

export interface EnemyDef {
    name: string;
    sprite: SpriteKey;
    /** Animation speed multiplier (1 = 10 fps for an 8-frame sheet). */
    temporalCoefficient: number;
    /** sp-client MonsterShadow.BodyShadow: draws a squashed black copy of the sprite. */
    hasShadow: boolean;
    maxHp: number;
    /** Pixels per second. */
    speed: number;
    /** Damage dealt to the player on contact. */
    contactDamage: number;
    /** XP of the gem dropped on death. */
    xp: number;
    /** Body radius in pixels, for contact with the player and separation between enemies. */
    radius: number;
    /** Height above the feet where projectiles aim and hit, in pixels. */
    bodyOffsetY: number;
    /** Sounds from sp-client/src/constants/Monsters.ts (takeDamage / death). */
    hitSound: SoundKey;
    deathSound: SoundKey;
}

export const ENEMIES = {
    slime: { name: 'Slime', sprite: 'enemy.slime', temporalCoefficient: 1, hasShadow: false, maxHp: 10, speed: 45, contactDamage: 4, xp: 2, radius: 10, bodyOffsetY: 10, hitSound: 'sfx.slime.hit', deathSound: 'sfx.slime.death' },
    bunny: { name: 'Bunny', sprite: 'enemy.bunny', temporalCoefficient: 1, hasShadow: true, maxHp: 8, speed: 75, contactDamage: 3, xp: 1, radius: 8, bodyOffsetY: 10, hitSound: 'sfx.bunny.hit', deathSound: 'sfx.bunny.death' },
    ant: { name: 'Ant', sprite: 'enemy.ant', temporalCoefficient: 1, hasShadow: false, maxHp: 12, speed: 65, contactDamage: 5, xp: 3, radius: 10, bodyOffsetY: 12, hitSound: 'sfx.ant.hit', deathSound: 'sfx.ant.death' },
    orc: { name: 'Orc', sprite: 'enemy.orc', temporalCoefficient: 1, hasShadow: true, maxHp: 30, speed: 55, contactDamage: 8, xp: 5, radius: 12, bodyOffsetY: 28, hitSound: 'sfx.orc.hit', deathSound: 'sfx.orc.death' },
} as const satisfies Record<string, EnemyDef>;

export type EnemyId = keyof typeof ENEMIES;
