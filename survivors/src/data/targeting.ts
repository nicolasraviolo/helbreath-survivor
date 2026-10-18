// Apuntado automático (Fase 15A): a quién atacan las armas cuando el jugador no apunta a mano.
// Por defecto, al más cercano. Pero un jefe a media distancia tiene prioridad: si no, el jugador solo pega a los
// pequeños que lo rodean y el jefe casi no recibe daño (decidido por el propietario el 18-oct-2026).

export const AUTO_AIM = {
    /** A boss closer than this (px, from the player's feet) is attacked before anything else, if the weapon reaches it. */
    bossPriorityRadius: 250,
    /** Spells with several shots at once (Triple Energy Bolt): how many of them go to that boss; the rest, to the nearest. */
    bossShots: 1,
} as const;
