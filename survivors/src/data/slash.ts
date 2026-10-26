// Estela del tajo cuerpo a cuerpo (M15): el propietario eligió "Thin edge + sparks" (20-oct-2026) y pidió guardar
// los demás por si quiere cambiar más adelante. Para probarlos: ?slash=N y la tecla Y en partida (solo desarrollo).
// Radios y grosores en fracción del alcance del arma; tiempos en ms; alfa de 0 a 1.

export type SlashStyleId = 'classic' | 'crescent' | 'sweep' | 'crescentSweep' | 'sparks';

export interface SlashStyle {
    id: SlashStyleId;
    /** Name shown in the debug label. */
    name: string;
    /** How long the whole effect lasts. */
    lifeMs: number;
    /** Time the head takes to travel from one end of the arc to the other (0 = the whole arc at once). */
    sweepMs: number;
    /** Length of the fading trail behind the head, as a fraction of the arc (only with a sweep). */
    trail: number;
    /** Outer edge of the band. */
    outerRadius: number;
    /** Thickness of the band in the middle of the arc. */
    thickness: number;
    /** 0 = same thickness all along; 1 = thin at both tips, thickest in the middle (a crescent). */
    taper: number;
    color: number;
    alpha: number;
    /** Brighter thin line along the outer edge (0 = none). */
    edgeWidth: number;
    edgeColor: number;
    /** Wider, faint copy drawn underneath with additive blending, as a glow (0 = none). */
    glow: number;
    /** Sparks that fly off the end of the arc. */
    sparks: number;
}

const BASE: Omit<SlashStyle, 'id' | 'name'> = {
    lifeMs: 160, sweepMs: 0, trail: 1, outerRadius: 0.9, thickness: 0.22, taper: 1,
    color: 0xf0ead8, alpha: 0.85, edgeWidth: 0, edgeColor: 0xffffff, glow: 0, sparks: 0,
};

export const SLASH_STYLES: readonly SlashStyle[] = [
    // 0: the old one (two thin arcs), kept to compare.
    { ...BASE, id: 'classic', name: 'Classic' },
    // 1: filled crescent, thick in the middle, with a bright outer edge and a soft glow.
    { ...BASE, id: 'crescent', name: 'Crescent', lifeMs: 180, thickness: 0.26, alpha: 0.7, edgeWidth: 2, glow: 0.25 },
    // 2: a band that travels with the blade and leaves a trail that fades behind it.
    { ...BASE, id: 'sweep', name: 'Sweep', lifeMs: 200, sweepMs: 110, trail: 0.55, thickness: 0.12, taper: 0, alpha: 0.9, edgeWidth: 2, glow: 0.2 },
    // 3: the crescent drawn by the sweep.
    { ...BASE, id: 'crescentSweep', name: 'Crescent + sweep', lifeMs: 220, sweepMs: 110, trail: 0.8, thickness: 0.28, alpha: 0.75, edgeWidth: 2, glow: 0.3 },
    // 4: a thin bright edge and a few sparks off the tip: hides the least of the horde.
    { ...BASE, id: 'sparks', name: 'Thin edge + sparks', lifeMs: 320, sweepMs: 80, trail: 1.2, thickness: 0.04, taper: 0.6, color: 0xfff6dc, alpha: 1, glow: 0.18, sparks: 6 },
];

/** Style used in normal play (its position in SLASH_STYLES). */
export const DEFAULT_SLASH_STYLE = SLASH_STYLES.findIndex((style) => style.id === 'sparks');

/** Sparks of the "sparks" style: speed in px/s, life in ms, length in px. */
export const SLASH_SPARK = { minSpeed: 120, maxSpeed: 260, lifeMs: 240, length: 10, width: 2.5, color: 0xffe9a8, spreadDegrees: 50 };

/**
 * Round trail of the axes' spin (bloque B, 25-oct-2026), drawn with the style in use: the head goes round once in the
 * spin's time and the trail behind it is this fraction of the circle. Thicker than the sword's thin edge so the circle reads.
 */
export const SPIN_TRAIL = { trail: 0.55, thickness: 0.1 };

/** Slices the arc is cut into to draw a band whose thickness and alpha change along it. */
export const SLASH_SLICES = 24;
