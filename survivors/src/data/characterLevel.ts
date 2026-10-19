// Level permanente del personaje (Fase 20A). Es distinto del "Power" de la partida (data/leveling.ts):
// - al terminar una partida (ganando o muriendo), toda la EXP ganada en ella pasa al personaje;
// - cada Level da 3 puntos que el jugador reparte en la ventana Character (no se pueden reasignar);
// - cada stat empieza en el de la clase y no pasa de 200, como en el original (S:5424); Level máximo 140.
// Curva propia (no la tabla del original), pensada en tiempo: EXP acumulada = escala · (Level − 1)^potencia.
// Una partida entera (Power ~27 en 13½ min, `pnpm check levelpace`) da ~70.000 EXP. Con 300 y 2,24 sale
// (docs/PLAN-2.md, Fase 20): 1.ª partida (muere hacia Power 15–20, 5.000–15.000 EXP) → Level 4–7 · ~9 partidas
// enteras (2 h) → ~30 · ~27 (6 h) → ~50 · ~75 (17 h) → ~80 · ~130 (30 h) → ~100 · ~265 (60 h) → 140.
// Es una primera aproximación: se ajusta con las métricas (con equipo y más stats se llegará más lejos cada partida).

export const CHARACTER_LEVEL_MAX = 140;
/** Stat points earned on every Level. */
export const STAT_POINTS_PER_LEVEL = 3;
/** No stat can be raised past this with Level points. */
export const STAT_POINT_CAP = 200;

/** Total EXP to reach a Level = LEVEL_EXP_SCALE · (Level − 1)^LEVEL_EXP_POWER (see the header). */
export const LEVEL_EXP_SCALE = 300;
export const LEVEL_EXP_POWER = 2.24;

/** Total EXP needed to reach `level` from Level 1, rounded to tens. */
export function totalExpForLevel(level: number): number {
    return Math.round((LEVEL_EXP_SCALE * Math.max(0, level - 1) ** LEVEL_EXP_POWER) / 10) * 10;
}

/** EXP needed to go from `level` to `level + 1` (0 at the maximum). */
export function expToNextCharacterLevel(level: number): number {
    if (level >= CHARACTER_LEVEL_MAX) return 0;
    return totalExpForLevel(level + 1) - totalExpForLevel(level);
}
