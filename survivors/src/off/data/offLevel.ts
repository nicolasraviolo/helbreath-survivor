// Helbreath Off (Fase Off-2B): niveles y experiencia, con las reglas del servidor original (reference/Server.cpp):
// - Experiencia total para el nivel L: exp(L) = exp(L−1) + L × (50 + L × (L/17)²), divisiones enteras, exp(1) = 0.
//   Nivel 10 = 2.700; nivel 60 = 502.032; nivel 140 = 33.396.014.
// - Por debajo del nivel 80 la experiencia de cada monstruo se multiplica por 1,025 + (80 − nivel) × 0,025 (×3 en el 1).
// - Al morir se pierde 1d(5 × nivel); quien no tiene ciudad (neutral, como el novato hasta la Off-5), un tercio.
// Nuestro (propietario, 6-nov-2026): la experiencia va ×2 respecto al original, se da entera al morir el monstruo (no por
// golpe) y morir nunca baja de nivel. Los 3 puntos de cada nivel se guardan para repartirlos en la Off-3.

export const OFF_LEVEL = {
    max: 140,
    /** Experience multiplier on top of the original's (propietario, 6-nov-2026: ×2; measured again in Off-7). */
    expMultiplier: 2,
    /** Stat points per level (original), kept until Off-3 lets you spend them. */
    pointsPerLevel: 3,
    /** Below this level, the original multiplies every monster's experience (see lowLevelBonus). */
    bonusBelowLevel: 80,
    bonusBase: 1.025,
    bonusPerLevel: 0.025,
    /** Dying loses 1d(this × level) experience (original). */
    deathLossPerLevel: 5,
    /** Characters without a town (neutral) lose only this share of it (original: a third). */
    neutralDeathShare: 1 / 3,
} as const;

/** What the player reads (bottom-left message list, the big announcement, the word over the monster). */
export const OFF_LEVEL_TEXT = {
    levelUp: 'Level Up!',
    expGained: (exp: number) => `+${exp} Exp`,
    expLine: (exp: number) => `You gained ${exp} experience points.`,
    levelLine: (level: number) => `You have reached level ${level}.`,
    expLost: (exp: number) => `You lost ${exp} experience points.`,
} as const;

/** Total experience needed to reach each level (index = level; [0] and [1] are 0). */
const LEVEL_EXP: readonly number[] = (() => {
    const table = [0, 0];
    for (let level = 2; level <= OFF_LEVEL.max; level++) {
        const grow = Math.floor(level / 17) ** 2;
        table.push(table[level - 1] + level * (50 + level * grow));
    }
    return table;
})();

/** Total experience at which `level` starts. */
export function offExpForLevel(level: number): number {
    return LEVEL_EXP[Math.max(1, Math.min(OFF_LEVEL.max, level))] ?? 0;
}

/** Level reached with that much total experience. */
export function offLevelForExp(exp: number): number {
    let level = 1;
    while (level < OFF_LEVEL.max && exp >= offExpForLevel(level + 1)) level++;
    return level;
}

/** 0..1 progress from the start of the current level to the next one (1 at the top level). */
export function offLevelProgress(exp: number, level: number): number {
    if (level >= OFF_LEVEL.max) return 1;
    const start = offExpForLevel(level);
    return (exp - start) / (offExpForLevel(level + 1) - start);
}

/** Experience a kill gives at this level: the monster's, × the original's low-level bonus, × our multiplier. */
export function offKillExp(monsterExp: number, level: number): number {
    const bonus = level < OFF_LEVEL.bonusBelowLevel ? OFF_LEVEL.bonusBase + (OFF_LEVEL.bonusBelowLevel - level) * OFF_LEVEL.bonusPerLevel : 1;
    return Math.floor(monsterExp * bonus * OFF_LEVEL.expMultiplier);
}

/** Experience lost on dying (neutral character), never below the start of the current level. */
export function offDeathExpLoss(exp: number, level: number): number {
    const roll = 1 + Math.floor(Math.random() * OFF_LEVEL.deathLossPerLevel * level);
    const loss = Math.floor(roll * OFF_LEVEL.neutralDeathShare);
    return Math.max(0, Math.min(loss, exp - offExpForLevel(level)));
}
