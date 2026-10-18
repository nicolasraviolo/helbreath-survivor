// Controles táctiles (Fase 9): joystick que aparece donde se pone el dedo, botón de pausa y aviso de girar el móvil.
// Fase 15C: segundo stick para apuntar (mitad derecha) y esquina reservada para el botón del crit (Fase 16).
// Solo se usan en pantallas táctiles; con teclado, ratón o mando no se ve nada de esto.

/** Look of a floating stick (movement or aim). */
export interface TouchStickStyle {
    /** Distance from the centre at which the stick gives full strength (screen pixels). */
    radius: number;
    /** Below this fraction of the radius the stick gives nothing (a resting thumb). */
    deadzone: number;
    /** If the finger goes further than the radius, the base follows it (so the direction can change quickly). */
    baseFollows: boolean;
    baseColor: number;
    baseAlpha: number;
    ringColor: number;
    ringAlpha: number;
    ringWidth: number;
    knobRadius: number;
    knobColor: number;
    knobAlpha: number;
}

/** Floating joystick: appears where the finger touches the game area and follows it. */
export const TOUCH_JOYSTICK: Readonly<TouchStickStyle> = {
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
};

/**
 * Aim stick (Fase 15C): with "Aim Stick" on in Settings, the left half of the screen moves and the right half opens
 * this second stick, which aims like the gamepad's right stick. Same size, another colour.
 */
export const TOUCH_AIM_STICK: Readonly<TouchStickStyle> = {
    ...TOUCH_JOYSTICK,
    ringColor: 0xff9a5a,
    knobColor: 0xff9a5a,
};

/**
 * Bottom-right corner of the game area kept free for the crit button (Fase 16): a finger that lands here opens no
 * stick. Sizes in screen pixels, measured from the right edge and from the bottom of the game area.
 */
export const TOUCH_RESERVED_CORNER = { width: 130, height: 130 } as const;

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

/** Fingers tracked at once: one to move, one to aim (Fase 15C) and one for buttons (pause, cards). */
export const TOUCH_POINTERS = 3;
