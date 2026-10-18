// Experiencia: curva de niveles y gemas de XP.
// Curva (Fase 13C), en dos tramos:
// - los 4 primeros niveles, a mano y baratos: salen en el primer minuto;
// - desde el 5, cada nivel cuesta un XP_GROWTH más que el anterior (crece en porcentaje, no en línea recta), al
//   ritmo al que crece la XP de los monstruos: uno cada 30–45 s, y pasado el 25 cuesta cada vez más.
// Objetivo: unos 25–30 niveles en una partida de 12–15 min. Antes era una recta (10, 20, 30…) y se llegaba al 100.
// Se mide con `pnpm check levelpace` (partida simulada, systems/SimRun.ts).

/** XP for levels 1→2, 2→3, 3→4 and 4→5. */
export const XP_EARLY_LEVELS: readonly number[] = [15, 30, 50, 80];
/** XP for level 5→6; each level after it costs XP_GROWTH times more (1.24 = 24% more). */
export const XP_AFTER_EARLY = 150;
export const XP_GROWTH = 1.24;

/** XP needed to go from `level` to `level + 1`. */
export function xpToNextLevel(level: number): number {
    const early = XP_EARLY_LEVELS[level - 1];
    if (early !== undefined) return early;
    return Math.round(XP_AFTER_EARLY * XP_GROWTH ** (level - 1 - XP_EARLY_LEVELS.length));
}

export interface GemTier {
    /** Smallest XP value that uses this look. */
    minValue: number;
    /** Frame of the gem in item-ground.spr, sheet 15 (sp-client Items.ts). */
    frame: number;
}

/** Gem looks, from cheapest to most valuable: Emerald, Sapphire, Ruby, Diamond (Fase 13C, for the big monsters). */
export const GEM_SHEET = 15;
export const GEM_TIERS: readonly GemTier[] = [
    { minValue: 1, frame: 45 },
    { minValue: 5, frame: 44 },
    { minValue: 15, frame: 43 },
    { minValue: 60, frame: 42 },
];

/** The original gems are 12–15 px: drawn bigger so they read well among many enemies. */
export const GEM_SCALE = 1.5;

/** Gems start flying to the player inside this radius (px). */
export const GEM_MAGNET_RADIUS = 80;
/** Flying speed: starts at this, accelerates, and never exceeds the max (px/s). */
export const GEM_FLY_START_SPEED = 120;
export const GEM_FLY_ACCELERATION = 900;
export const GEM_FLY_MAX_SPEED = 600;
/** Picked up when this close to the player's body (px). */
export const GEM_PICKUP_RADIUS = 14;
/** Height above the feet the gems fly to (the chest). */
export const GEM_TARGET_OFFSET_Y = 30;
/** Most gems on the ground: past this, new XP is added to an existing gem instead. */
export const GEM_MAX = 400;
