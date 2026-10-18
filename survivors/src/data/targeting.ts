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
// Manda sobre todo lo de arriba, jefes incluidos; al soltar vuelve el automático. En el móvil no existe.
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
