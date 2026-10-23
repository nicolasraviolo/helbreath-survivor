// Stats de personaje (los seis de Helbreath) y lo que hace cada uno en el survivors.
// Decidido con el propietario (16-oct-2026):
// - Str: daño físico de armas y requisito de armas y armaduras.
// - Vit: vida máxima y curación poco a poco (Fase 13C: más Vit, más rápido).
// - Dex: velocidad de movimiento y de ataque, y desde la Fase 18A esquiva (2 de defensa por punto, data/defense.ts).
// - Int: requisito de hechizos y de equipo de mago (varitas, túnicas). Da un poco de maná (fórmula original).
// - Mag: daño mágico y maná, y desde la Fase 18B resistencia mágica (1 por punto, data/defense.ts).
// - Chr: probabilidad de crítico.
// Los efectos están simplificados y exagerados respecto al original (docs/hb-wiki/personaje.md):
// allí +1 punto apenas se nota, y aquí una carta de +3 tiene que notarse en la partida.

export const STAT_IDS = ['str', 'vit', 'dex', 'int', 'mag', 'chr'] as const;
export type StatId = (typeof STAT_IDS)[number];
export type Stats = Record<StatId, number>;

export interface StatInfo {
    /** Short name as in Helbreath (Str, Vit…). */
    short: string;
    /** Full name for cards and panels (the game is in English). */
    name: string;
    /** One line for the level-up card. */
    effect: string;
    /** Badge colour on the card. */
    color: number;
}

export const STAT_INFO: Record<StatId, StatInfo> = {
    str: { short: 'Str', name: 'Strength', effect: 'Physical damage. Required by weapons and armor', color: 0xc03828 },
    vit: { short: 'Vit', name: 'Vitality', effect: 'Maximum health and slow healing', color: 0x38a040 },
    dex: { short: 'Dex', name: 'Dexterity', effect: 'Movement and attack speed, dodge', color: 0xd09020 },
    int: { short: 'Int', name: 'Intelligence', effect: 'Required by spells', color: 0x3070d0 },
    mag: { short: 'Mag', name: 'Magic', effect: 'Magic damage and mana, magic resist', color: 0x8040c0 },
    chr: { short: 'Chr', name: 'Charisma', effect: 'Critical hit chance', color: 0xe0c040 },
};

/** Stat value that counts as "neutral" for the percentage effects (the original minimum is 10). */
export const STAT_BASELINE = 10;

/** Vida: base del personaje + Vit + nivel (en el original 2 por Vit y ~2,5 por nivel). */
export const HP_PER_VIT = 4;
export const HP_PER_LEVEL = 2;
/** Vida que se recupera sola cada segundo por punto de Vit (Vit 10 → 0,2/s, unos 12 por minuto). */
export const HP_REGEN_PER_VIT = 0.02;

/** Maná, fórmula original: 2·Mag + 2·nivel + Int/2 (docs/hb-wiki/personaje.md, Leveling). */
export const MANA_PER_MAG = 2;
export const MANA_PER_LEVEL = 2;
export const MANA_PER_INT = 0.5;
/**
 * Maná que se recupera solo cada segundo (Fase 26A, propietario 22-oct-2026: "solo con Mag", como el original):
 * base + porPunto·Mag. Ajustado para que, de media, el Spell 2 salga como con la antigua recarga: Mag 14 → 2,7/s
 * (un Energy Strike cada ~12 s, como antes), Mag 40 → 4,4/s (~7 s; antes 8,4), Mag 60 → 5,7/s (~6 s, como antes).
 * La ropa con MP Recovery lo sube un 30%.
 */
export const MANA_REGEN_BASE = 1.8;
export const MANA_REGEN_PER_MAG = 0.065;

/** Daño físico +3% por punto de Str sobre 10 (en el original, +0,2%). Igual que Mag (Fase 13C). */
export const PHYSICAL_DAMAGE_PER_STR = 0.03;
/** Daño mágico +3% por punto de Mag sobre 10 (en el original, +0,3%). Era +4% hasta la Fase 13C. */
export const MAGIC_DAMAGE_PER_MAG = 0.03;

/**
 * Daño de todo tipo por cada Power de la partida, aparte de los stats (revisión de la dificultad, G, propietario
 * 22-oct-2026): el daño del personaje crecía mucho menos que la vida de los monstruos y se formaba una "bola".
 * 0,04 = +4% por Power: a Power 25, ×1,96.
 */
export const DAMAGE_PER_POWER = 0.04;

/** Dex: +1% de velocidad de movimiento y +1% de velocidad de ataque por punto sobre 10. */
export const MOVE_SPEED_PER_DEX = 0.01;
export const ATTACK_SPEED_PER_DEX = 0.01;

/** Crítico: 5% de base + 1% por punto de Chr sobre 10; hace el doble de daño. */
export const CRIT_BASE_CHANCE = 0.05;
export const CRIT_CHANCE_PER_CHR = 0.01;
export const CRIT_MAX_CHANCE = 0.75;
export const CRIT_DAMAGE_MULTIPLIER = 2;

/** Cartas al subir de nivel: cuántas se muestran (los puntos de cada carta, según su rareza: data/cardRarity.ts). */
export const LEVEL_UP_CHOICES = 3;
/** Most passive cards (Xelima, Merien, Magnet Amulet) among the choices: the rest are always stat cards (Fase 20C). */
export const MAX_ITEM_CARDS = 2;
