// Controles táctiles (Fase 9): joystick que aparece donde se pone el dedo, botón de pausa y aviso de girar el móvil.
// Solo se usan en pantallas táctiles; con teclado, ratón o mando no se ve nada de esto.

/** Floating joystick: appears where the finger touches the game area and follows it. */
export const TOUCH_JOYSTICK = {
    /** Distance from the centre at which the stick gives full speed (screen pixels). */
    radius: 56,
    /** Below this fraction of the radius the player doesn't move (a resting thumb). */
    deadzone: 0.15,
    /** If the finger goes further than the radius, the base follows it (so the player can change direction quickly). */
    baseFollows: true,
    baseColor: 0x000000,
    baseAlpha: 0.3,
    ringColor: 0xe8dcc0,
    ringAlpha: 0.75,
    ringWidth: 2,
    knobRadius: 22,
    knobColor: 0xe8dcc0,
    knobAlpha: 0.7,
} as const;

/** Pause button for touch screens, at the top right of the game area. */
export const TOUCH_PAUSE_BUTTON = {
    x: 760,
    y: 40,
    radius: 24,
    /** Clickable area around it (a finger is less precise than a mouse). */
    hitRadius: 36,
    color: 0x000000,
    alpha: 0.45,
    ringColor: 0xe8dcc0,
    barColor: 0xe8dcc0,
    barWidth: 6,
    barHeight: 18,
    barGap: 6,
} as const;

/** Fingers tracked at once: one for the joystick plus one for buttons (pause, cards). */
export const TOUCH_POINTERS = 2;
