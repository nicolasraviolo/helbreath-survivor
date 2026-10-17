// Textos de la página "How to play" (Fase 11): cómo se juega y los controles de cada dispositivo.
// Es el ÚNICO sitio del juego que explica teclas, botones y gestos: la partida y los menús no muestran textos de controles.
// Al añadir un control nuevo (apuntado, crit, tótems...), se añade aquí.

/** Gamepad buttons drawn as Xbox icons (scenes/HowToPlayScene.ts). */
export type PadIcon = 'A' | 'B' | 'Y' | 'Start' | 'LeftStick' | 'Dpad';

export interface ControlRow {
    /** Key, mouse or touch control, as text. */
    control?: string;
    /** Gamepad buttons, drawn as icons. */
    pad?: readonly PadIcon[];
    action: string;
}

export interface HowToPlayPage {
    /** Shown in the sprite font of the menus, which has no '&': keep it to plain letters. */
    name: string;
    /** Plain paragraph lines (the "Basics" page). */
    lines?: readonly string[];
    /** Two columns: control → what it does. */
    rows?: readonly ControlRow[];
}

export const HOW_TO_PLAY_PAGES: readonly HowToPlayPage[] = [
    {
        name: 'Basics',
        lines: [
            'Move around and stay alive.',
            'Your weapons and spells attack on their own.',
            'Pick up the gems that enemies drop to gain experience.',
            'Each level up, choose one of the cards to grow stronger.',
            'Survive the waves and defeat the final boss to win.',
        ],
    },
    {
        name: 'Keyboard',
        rows: [
            { control: 'WASD or arrow keys', action: 'Move' },
            { control: 'Hold left click', action: 'Walk towards the pointer' },
            { control: 'C', action: 'Show or hide your stats' },
            { control: 'Esc', action: 'Pause' },
            { control: 'Arrows + Enter, or click', action: 'Choose in menus and cards' },
            { control: 'Esc or Backspace', action: 'Go back' },
        ],
    },
    {
        name: 'Gamepad',
        rows: [
            { pad: ['LeftStick', 'Dpad'], action: 'Move' },
            { pad: ['Y'], action: 'Show or hide your stats' },
            { pad: ['Start'], action: 'Pause' },
            { pad: ['Dpad', 'A'], action: 'Choose in menus and cards' },
            { pad: ['B'], action: 'Go back' },
        ],
    },
    {
        name: 'Touch',
        rows: [
            { control: 'Touch and drag anywhere', action: 'Move' },
            { control: 'Stats button', action: 'Show or hide your stats' },
            { control: 'Pause button', action: 'Pause' },
            { control: 'Tap a card or option', action: 'Choose it' },
            { control: 'Fullscreen (top-right icon or Settings)', action: 'Hide the browser bar' },
        ],
    },
];
