// Contenido de enemigos. Por ahora solo lo necesario para animarlos; vida, velocidad y daño llegan en la Fase 3.
import type { SpriteKey } from '../config/assetManifest';

export interface EnemyDef {
    name: string;
    sprite: SpriteKey;
    /** Animation speed multiplier from sp-client (constants/Monsters.ts). 1 = normal. */
    temporalCoefficient: number;
}

export const ENEMIES = {
    orc: { name: 'Orc', sprite: 'enemy.orc', temporalCoefficient: 1 },
} as const satisfies Record<string, EnemyDef>;

export type EnemyId = keyof typeof ENEMIES;
