// Helbreath Off (Fase Off-3A): el personaje y sus stats.
// - 5 stats, sin Charisma (PLAN-OFF, "Cómo lo simplificamos").
// - Crear personaje como el original (propietario, 7-nov-2026): todos empiezan en 10, ninguno pasa de 14 al crearlo y
//   se reparten 10 puntos (el original: 6 stats, 60 + 10 = 70; aquí 5 stats, 50 + 10 = 60).
// - Los botones Warrior y Magician de la pantalla del original no eran clases: reparten los puntos de golpe.
// - Fórmulas del servidor original (reference/Server.cpp, divisiones enteras):
//   vida = VIT×3 + Level×2 + STR/2 · maná = MAG×2 + Level×2 + INT/2 · estamina = STR×2 + Level×2.
// Fase Off-3B, también del servidor original:
// - Recuperación por tandas (TimeHitPointsUp / TimeManaPointsUp / TimeStaminarPointsUp): vida cada 15 s
//   (el mayor de 1d(VIT) y VIT/2), maná cada 20 s (1d(MAG)), estamina cada 12 s (1d(VIT/3) + 15 hasta el nivel 20,
//   + 10 hasta el 40, + 5 hasta el 60). El hambre del original, fuera.
// - Correr gasta 1 de estamina por casilla; andar y golpear, nada. Sin estamina se anda (propietario, 7-nov-2026:
//   la estamina solo se gasta al correr).
// - Subir de nivel llena vida, maná y estamina. Los 3 puntos por nivel se reparten en la ventana Character; ningún
//   stat pasa de 200 (DEF_CHARPOINTLIMIT).
import Phaser from 'phaser';
import type { StatId } from '../../data/stats';

/** Off's stats, in the original window's order (Charisma left out). */
export const OFF_STAT_IDS = ['str', 'vit', 'dex', 'int', 'mag'] as const satisfies readonly StatId[];
export type OffStatId = (typeof OFF_STAT_IDS)[number];

export function isOffStatId(id: string): id is OffStatId {
    return (OFF_STAT_IDS as readonly string[]).includes(id);
}
export type OffStats = Record<OffStatId, number>;

export const OFF_CREATION = {
    /** Every stat starts here (original). */
    base: 10,
    /** No stat goes above this while creating the character (original). */
    max: 14,
    /** Points to spend while creating the character (original). */
    points: 10,
    /** Name when none is typed. */
    defaultName: 'Novice',
} as const;

/** Stats of a character made before Off-3A (no creation yet): the 60 points split evenly. */
export const OFF_OLD_SAVE_STATS: Readonly<OffStats> = { str: 12, vit: 12, dex: 12, int: 12, mag: 12 };

/** The original's Warrior and Magician buttons: they spend the 10 points in one go. */
export const OFF_PRESETS = {
    warrior: { str: 14, vit: 12, dex: 14, int: 10, mag: 10 },
    magician: { str: 10, vit: 12, dex: 10, int: 14, mag: 14 },
} as const satisfies Record<string, OffStats>;
export type OffPresetId = keyof typeof OFF_PRESETS;

export function offBaseStats(): OffStats {
    return { str: OFF_CREATION.base, vit: OFF_CREATION.base, dex: OFF_CREATION.base, int: OFF_CREATION.base, mag: OFF_CREATION.base };
}

/** Creation points still to spend with these stats. */
export function offCreationPointsLeft(stats: Readonly<OffStats>): number {
    return OFF_CREATION.points - OFF_STAT_IDS.reduce((sum, id) => sum + stats[id] - OFF_CREATION.base, 0);
}

type Level = { level: number };

/** Original max health: VIT×3 + Level×2 + STR/2. */
export function offMaxHp(s: Level & Pick<OffStats, 'str' | 'vit'>): number {
    return s.vit * 3 + s.level * 2 + Math.floor(s.str / 2);
}

/** Original max mana: MAG×2 + Level×2 + INT/2. */
export function offMaxMana(s: Level & Pick<OffStats, 'int' | 'mag'>): number {
    return s.mag * 2 + s.level * 2 + Math.floor(s.int / 2);
}

/** Original max stamina: STR×2 + Level×2. */
export function offMaxStamina(s: Level & Pick<OffStats, 'str'>): number {
    return s.str * 2 + s.level * 2;
}

/** No stat goes above this when spending level points (original DEF_CHARPOINTLIMIT). */
export const OFF_STAT_MAX = 200;

/** Self-healing batches (original). */
export const OFF_REGEN = {
    hpIntervalMs: 15_000,
    manaIntervalMs: 20_000,
    staminaIntervalMs: 12_000,
    /** Stamina batches get this much more up to each level. */
    staminaLevelBonus: [
        { upToLevel: 20, bonus: 15 },
        { upToLevel: 40, bonus: 10 },
        { upToLevel: 60, bonus: 5 },
    ],
} as const;

/** Stamina a running step costs (original). */
export const OFF_RUN_STEP_STAMINA = 1;

function die(sides: number): number {
    return sides > 0 ? Phaser.Math.Between(1, sides) : 0;
}

/** Health of one batch: the larger of 1d(VIT) and VIT/2. */
export function offHpRegen(vit: number): number {
    return Math.max(die(vit), Math.floor(vit / 2));
}

/** Mana of one batch: 1d(MAG). */
export function offManaRegen(mag: number): number {
    return die(mag);
}

/** Stamina of one batch: 1d(VIT/3) and the low-level bonus. */
export function offStaminaRegen(vit: number, level: number): number {
    const bonus = OFF_REGEN.staminaLevelBonus.find((b) => level <= b.upToLevel)?.bonus ?? 0;
    return die(Math.floor(vit / 3)) + bonus;
}

/**
 * Off-13F (propietario, 10-nov-2026): with the pad there is no keyboard to type a name, so Random (Y) picks one of
 * these. Fantasy names that fit the name box: 10 letters at most, letters only.
 */
export const OFF_RANDOM_NAMES: readonly string[] = [
    'Aldric', 'Brenna', 'Caelum', 'Darian', 'Elowen', 'Faelan', 'Garrick', 'Halvar', 'Ilyra', 'Isolde',
    'Kaelith', 'Lorcan', 'Maelis', 'Mirelle', 'Nerys', 'Orin', 'Perrin', 'Rowan', 'Sabine', 'Seren',
    'Tavish', 'Thorne', 'Ulric', 'Vesna', 'Wynne', 'Ysolde', 'Zarek', 'Brannoc', 'Corwin', 'Eamon',
];

/** A random name from OFF_RANDOM_NAMES, never the one shown now (so each press changes it). */
export function offRandomName(current: string): string {
    const others = OFF_RANDOM_NAMES.filter((name) => name !== current);
    return others[Math.floor(Math.random() * others.length)] ?? OFF_CREATION.defaultName;
}

/** What each stat does in Off, under the Character window (Charisma is not used). */
export const OFF_STAT_HELP: Readonly<Record<OffStatId, string>> = {
    str: 'Strength: more damage, faster weapons, more stamina and a little more health',
    vit: 'Vitality: more health, faster health and stamina recovery, less damage taken',
    dex: 'Dexterity: hit more often, harder to hit',
    int: 'Intelligence: a little more mana; spells will need it',
    mag: 'Magic: more mana and faster mana recovery',
};

/** DEX's help with the hit ratio it gives (Off-7C: weapon skill DEX × 2 and the DEX bonus). */
export const OFF_DEX_HELP = (hitRatio: number): string => `Dexterity: hit more often (Hit Ratio ${hitRatio}), harder to hit`;

/** The batch lines at the bottom left, as the original ("SP" is stamina). */
export const OFF_REGEN_TEXT = {
    hpUp: (points: number) => `HP has been increased by +${points} points.`,
    mpUp: (points: number) => `MP has been increased by +${points} points.`,
    spUp: (points: number) => `SP has been increased by +${points} points.`,
} as const;
