// Medidas de la pantalla de crear personaje de Helbreath Off (Fase Off-3A). Es la "Create New Character" del original
// (config/characterSelect.ts, la misma que tuvo Survivors hasta el 22-oct-2026); aquí solo lo que cambia en Off.
import { SELECT_LOOK, SELECT_STATS } from '../../config/characterSelect';

export const OFF_CREATE = {
    /**
     * The + and − buttons of each stat row, drawn in the background at the same x as the look arrows: + on the left,
     * − on the right (640x480 coordinates).
     */
    plus: SELECT_LOOK.leftArrow,
    minus: SELECT_LOOK.rightArrow,
    /**
     * The background has 6 stat rows; the 6th (Charisma) is covered with a piece of plain wood from the same panel
     * (value box and buttons, x from..to), taken this far below it.
     */
    hiddenRow: { y: SELECT_STATS.firstRowY + 5 * SELECT_STATS.step, fromX: 186, toX: 286, height: SELECT_STATS.step, woodBelow: 2 * SELECT_STATS.step },
    /** The stats title turns into this warning for a while when Create is pressed with points left, ms. */
    warningMs: 2000,
} as const;
