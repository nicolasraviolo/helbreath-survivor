// Ported from sp-client/src/constants/Monsters.ts and docs/MONSTER_MECHANICS.md (MIT, Erko Knoll)
//
import type Phaser from 'phaser';

// Distribución estándar de hojas en los .spr de monstruo: una hoja por estado y dirección.

export enum MonsterState {
    Idle = 'idle',
    Move = 'move',
    Attack = 'attack',
    TakeDamage = 'takeDamage',
    Dead = 'dead',
}

/** First sheet of each state; the sheet for a direction is `base + direction`. */
export const MONSTER_SHEET_BASE: Record<MonsterState, number> = {
    [MonsterState.Idle]: 0,
    [MonsterState.Move]: 8,
    [MonsterState.Attack]: 16,
    [MonsterState.TakeDamage]: 24,
    [MonsterState.Dead]: 32,
};

/** States that loop; the rest play once and stop on their last frame. */
export const MONSTER_LOOPING_STATES: ReadonlySet<MonsterState> = new Set([MonsterState.Idle, MonsterState.Move]);

/** Frames per sheet in the standard layout. Animation speed scales with frameCount / this. */
export const MONSTER_DEFAULT_FRAMES_PER_SHEET = 8;

/**
 * sp-client rule: 10 fps × (frames / 8) × temporalCoefficient, so every animation lasts the same
 * whatever its frame count (the Orc has 4 frames per sheet, others 8).
 */
export function monsterFrameRate(anims: Phaser.Animations.AnimationManager, sheetKey: string, baseFrameRate: number, temporalCoefficient: number): number {
    const frames = anims.get(sheetKey)?.frames.length ?? MONSTER_DEFAULT_FRAMES_PER_SHEET;
    return baseFrameRate * (frames / MONSTER_DEFAULT_FRAMES_PER_SHEET) * temporalCoefficient;
}
