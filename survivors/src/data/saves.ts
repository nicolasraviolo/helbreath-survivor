// Partidas guardadas (Fase 12, bloque 12B): cuántas caben y cada cuánto se guarda la que se está jugando.
// Al continuar no vuelven los monstruos uno a uno: la oleada de ese minuto empieza de nuevo tras unos segundos de calma.

/** Runs kept at the same time; with all of them in use, Play asks which one to delete. */
export const SAVE_SLOT_COUNT = 3;

/** The run being played is saved this often (game time), and also when the tab goes to the background. */
export const AUTOSAVE_EVERY_MS = 5000;

/** After Continue, no monster appears for this long (the bosses that were alive come back when it ends). */
export const RESUME_CALM_MS = 5000;
