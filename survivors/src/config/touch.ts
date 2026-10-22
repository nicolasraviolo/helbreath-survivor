// Controles táctiles (Fase 9): joystick que aparece donde se pone el dedo, botón de pausa y aviso de girar el móvil.
// Fase 15C: segundo stick para apuntar (mitad derecha) y esquina reservada para el botón del crit (Fase 19).
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

/** With the aim stick on: fingers landing right of this share of the screen width aim; the rest move. */
export const TOUCH_AIM_ZONE_START = 0.5;

/**
 * Bottom-right corner of the game area kept free for the Critical Strike button (Fase 19A, ui/CritButton.ts): a finger
 * that lands here opens no stick. Sizes in screen pixels, measured from the right edge and from overlayBottom() (the
 * bottom of the game area, or the top of the compact gauges when they run along the bottom).
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

/**
 * Fase 25: round fullscreen button for touch screens, left of the pause and stats ones (also on a Steam Deck or Legion Go in
 * phone mode, where getting out of fullscreen was hard). Only where the browser allows fullscreen (not on iPhone).
 */
export const TOUCH_FULLSCREEN_BUTTON = {
    /** In a run: left of the stats button (compact HUD). In the town there's none: next to the pause one. */
    x: 640,
    townX: 700,
    y: 40,
    radius: 24,
    hitRadius: 32,
    color: 0x000000,
    alpha: 0.45,
    ringColor: 0xe8dcc0,
    iconColor: 0xe8dcc0,
    /** Side of the four corner brackets, and their length as a share of it. */
    iconSize: 22,
    iconCorner: 0.35,
    iconLineWidth: 3,
} as const;

/** Whether a finger at (x, y) lands on the fullscreen button (no stick opens there). */
export function onTouchFullscreenButton(x: number, y: number, buttonX: number = TOUCH_FULLSCREEN_BUTTON.x): boolean {
    const b = TOUCH_FULLSCREEN_BUTTON;
    return Math.hypot(x - buttonX, y - b.y) <= b.hitRadius;
}

/** Fingers tracked at once: one to move, one to aim (Fase 15C) and one for buttons (pause, cards). */
export const TOUCH_POINTERS = 3;
