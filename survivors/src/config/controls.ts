// Controles que el jugador puede cambiar (Fase 19C, Settings → Controls). Decidido por el propietario el 19-oct-2026:
// solo el Critical Strike / Meteor Strike y el panel de stats, en teclado y en mando. Lo demás (moverse, confirmar,
// volver, pausa) queda fijo para que nunca te quedes sin poder salir de un menú.
// How to Play enseña siempre las teclas de serie, con una línea que avisa de que se pueden cambiar.
import Phaser from 'phaser';

/** Standard Gamepad API button indices (Xbox layout; triggers and bumpers named like the owner's pad: L1/R1, L2/R2). */
export const GAMEPAD_BUTTON = {
    A: 0, B: 1, X: 2, Y: 3, L1: 4, R1: 5, L2: 6, R2: 7, View: 8, Start: 9, L3: 10, R3: 11,
    DpadUp: 12, DpadDown: 13, DpadLeft: 14, DpadRight: 15, Home: 16,
} as const;

/** Names shown in Settings → Controls. */
const GAMEPAD_BUTTON_NAMES: Readonly<Record<number, string>> = Object.fromEntries(
    Object.entries(GAMEPAD_BUTTON).map(([name, index]) => [index, name]),
);

export type RemappableControl = 'critStrike' | 'toggleStats';
export const REMAPPABLE_CONTROLS: readonly RemappableControl[] = ['critStrike', 'toggleStats'];

export interface ControlBindings {
    /** Phaser key code per control. */
    keyboard: Record<RemappableControl, number>;
    /** Gamepad button index per control. */
    gamepad: Record<RemappableControl, number>;
}

const KEY = Phaser.Input.Keyboard.KeyCodes;

export const DEFAULT_CONTROLS: Readonly<ControlBindings> = {
    keyboard: { critStrike: KEY.SPACE, toggleStats: KEY.C },
    // Owner, 18-oct-2026: R2 on the gamepad (it was X in the 19A).
    gamepad: { critStrike: GAMEPAD_BUTTON.R2, toggleStats: GAMEPAD_BUTTON.Y },
};

/**
 * Keys that cannot be picked: movement, Enter, Esc and Backspace (menus). In development, also the debug keys
 * (systems/InputSystem.ts), so a test key doesn't fire at the same time.
 */
const RESERVED_KEYS: readonly number[] = [
    KEY.W, KEY.A, KEY.S, KEY.D, KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT, KEY.ENTER, KEY.ESC, KEY.BACKSPACE,
    ...(import.meta.env.DEV ? [KEY.F1, KEY.T, KEY.N, KEY.K, KEY.G, KEY.X, KEY.V, KEY.B, KEY.P, KEY.J, KEY.L, KEY.M, KEY.H] : []),
];

/** Buttons that cannot be picked: A / B / Start (menus and pause), the d-pad (movement), View (debug) and Home (the system's). */
const RESERVED_BUTTONS: readonly number[] = [
    GAMEPAD_BUTTON.A, GAMEPAD_BUTTON.B, GAMEPAD_BUTTON.Start, GAMEPAD_BUTTON.View, GAMEPAD_BUTTON.Home,
    GAMEPAD_BUTTON.DpadUp, GAMEPAD_BUTTON.DpadDown, GAMEPAD_BUTTON.DpadLeft, GAMEPAD_BUTTON.DpadRight,
];

/** Phaser's key code → name ("SPACE", "NUMPAD_ONE"...). */
const KEY_NAMES: ReadonlyMap<number, string> = new Map(
    Object.entries(KEY).map(([name, code]) => [code, name]),
);

export function canBindKey(code: number): boolean {
    return KEY_NAMES.has(code) && !RESERVED_KEYS.includes(code);
}

export function canBindButton(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < GAMEPAD_BUTTON.Home && !RESERVED_BUTTONS.includes(index);
}

/** "Space", "C", "Numpad One". */
export function keyName(code: number): string {
    const name = KEY_NAMES.get(code);
    if (!name) return `Key ${code}`;
    return name.split('_').map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
}

/** "R2", "Y", "L3". */
export function buttonName(index: number): string {
    return GAMEPAD_BUTTON_NAMES[index] ?? `Button ${index}`;
}

/** Bindings read from storage: anything missing, unknown or reserved goes back to its default. */
export function readControls(stored: unknown): ControlBindings {
    const source = typeof stored === 'object' && stored !== null ? stored as Partial<Record<keyof ControlBindings, unknown>> : {};
    const read = (device: keyof ControlBindings, valid: (value: number) => boolean): Record<RemappableControl, number> => {
        const values = typeof source[device] === 'object' && source[device] !== null
            ? source[device] as Partial<Record<RemappableControl, unknown>> : {};
        const result = { ...DEFAULT_CONTROLS[device] };
        for (const control of REMAPPABLE_CONTROLS) {
            const value = values[control];
            if (typeof value === 'number' && valid(value)) result[control] = value;
        }
        // Two controls on the same key (edited by hand): back to the defaults.
        return new Set(Object.values(result)).size === REMAPPABLE_CONTROLS.length ? result : { ...DEFAULT_CONTROLS[device] };
    };
    return { keyboard: read('keyboard', canBindKey), gamepad: read('gamepad', canBindButton) };
}

/** `control` moves to `value` on `device`; whichever control had it takes the old one (they swap). */
export function rebind(current: ControlBindings, device: keyof ControlBindings, control: RemappableControl, value: number): ControlBindings {
    const map = { ...current[device] };
    const previous = map[control];
    for (const other of REMAPPABLE_CONTROLS) {
        if (other !== control && map[other] === value) map[other] = previous;
    }
    map[control] = value;
    return { ...current, [device]: map };
}
