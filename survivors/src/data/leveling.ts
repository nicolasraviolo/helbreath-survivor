// Experiencia: curva de niveles y gemas de XP.
// Curva: en el original (docs/hb-wiki/personaje.md, Leveling) lo que cuesta cada nivel crece más o menos en línea recta
// (5.100, 8.300, 13.000, 18.200…). Mantenemos esa forma con números pequeños, pensados para unos
// 25–30 niveles en 12–15 min. Prueba del 16-oct-2026: con 5 + 4·n se llegaba al nivel 11 en 90 s, demasiado rápido.
// Se ajustará con las oleadas de la Fase 7.

/** XP needed to go from `level` to `level + 1`: XP_FIRST_LEVEL + XP_GROWTH_PER_LEVEL·(level − 1). */
export const XP_FIRST_LEVEL = 10;
export const XP_GROWTH_PER_LEVEL = 10;

export function xpToNextLevel(level: number): number {
    return XP_FIRST_LEVEL + XP_GROWTH_PER_LEVEL * (level - 1);
}

export interface GemTier {
    /** Smallest XP value that uses this look. */
    minValue: number;
    /** Frame of the gem in item-ground.spr, sheet 15 (sp-client Items.ts). */
    frame: number;
}

/** Gem looks, from cheapest to most valuable: Emerald, Sapphire, Ruby. */
export const GEM_SHEET = 15;
export const GEM_TIERS: readonly GemTier[] = [
    { minValue: 1, frame: 45 },
    { minValue: 3, frame: 44 },
    { minValue: 5, frame: 43 },
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
