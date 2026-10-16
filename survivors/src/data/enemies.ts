// Contenido de enemigos. Velocidades inspiradas en multiplayer/server/Config/Monsters.json
// (allí son ms por casilla: Slime 800, Orc 700, Ant/Bunny 220), suavizadas para que el jugador
// (150 px/s) pueda escapar. Vida y daño son nuestros; se ajustarán jugando.
import type { SpriteKey } from '../config/assetManifest';

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
    /** Body radius in pixels, for contact with the player and separation between enemies. */
    radius: number;
}

export const ENEMIES = {
    slime: { name: 'Slime', sprite: 'enemy.slime', temporalCoefficient: 1, hasShadow: false, maxHp: 10, speed: 45, contactDamage: 4, radius: 10 },
    bunny: { name: 'Bunny', sprite: 'enemy.bunny', temporalCoefficient: 1, hasShadow: true, maxHp: 8, speed: 75, contactDamage: 3, radius: 8 },
    ant: { name: 'Ant', sprite: 'enemy.ant', temporalCoefficient: 1, hasShadow: false, maxHp: 12, speed: 65, contactDamage: 5, radius: 10 },
    orc: { name: 'Orc', sprite: 'enemy.orc', temporalCoefficient: 1, hasShadow: true, maxHp: 30, speed: 55, contactDamage: 8, radius: 12 },
} as const satisfies Record<string, EnemyDef>;

export type EnemyId = keyof typeof ENEMIES;
