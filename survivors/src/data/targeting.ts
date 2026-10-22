// Apuntado automático (Fase 15A): a quién atacan las armas cuando el jugador no apunta a mano.
// Por defecto, al más cercano. Pero un jefe a media distancia tiene prioridad: si no, el jugador solo pega a los
// pequeños que lo rodean y el jefe casi no recibe daño (decidido por el propietario el 18-oct-2026).

export const AUTO_AIM = {
    /** A boss closer than this (px, from the player's feet) is attacked before anything else, if the weapon reaches it. */
    bossPriorityRadius: 250,
    /** Spells with several shots at once (Triple Energy Bolt): how many of them go to that boss; the rest, to the nearest. */
    bossShots: 1,
} as const;

// Apuntado manual (Fase 15B): mantener el clic derecho (hacia el cursor) o el stick derecho del mando.
// Manda sobre todo lo de arriba, jefes incluidos; al soltar vuelve el automático. En el móvil, con el stick de la
// mitad derecha (Fase 15C, config/touch.ts).
export const MANUAL_AIM = {
    /** Right stick: pushes smaller than this (0..1) are ignored (stick drift). */
    stickDeadzone: 0.35,
    /** Spells with several shots (Triple Energy Bolt): degrees between one shot and the next, as a fan. */
    fanDegrees: 14,
    /** Spells that fall in an area (Energy Strike) aimed with the stick: how far they fall, as a share of their range. */
    stickAreaDistance: 0.6,
    /** The arrow shown at the feet while aiming by hand: distance from the feet, size and opacity. */
    arrowDistance: 34,
    arrowLength: 12,
    arrowWidth: 9,
    arrowAlpha: 0.7,
    arrowColor: 0xfff2c0,
} as const;

/**
 * Fase 26B: ring on the ground while the Mage drags the spell button (phones), where the Spell 2 will land. Its size is
 * the spell's own area (activeSpellAreaRadius); dimmed while there is not mana enough.
 */
export const SPELL_AIM_MARKER = {
    color: 0xfff2c0,
    lineWidth: 2,
    alpha: 0.85,
    fillAlpha: 0.12,
    /** Alpha of the whole ring without mana enough for a cast. */
    noManaAlpha: 0.35,
    /** Small dot at the centre (radius, px). */
    dotRadius: 3,
} as const;
