// Textos de la página "How to play" (Fase 11): cómo se juega y los controles de cada dispositivo.
// Es el ÚNICO sitio del juego que explica teclas, botones y gestos: la partida y los menús no muestran textos de controles.
// Al añadir un control nuevo (apuntado, crit, tótems...), se añade aquí.

/** Gamepad buttons drawn as Xbox icons (scenes/HowToPlayScene.ts). */
export type PadIcon = 'A' | 'B' | 'X' | 'Y' | 'Start' | 'LeftStick' | 'RightStick' | 'Dpad';

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
            'Right click, right stick or right half of the screen: aim yourself.',
            'Pick up the gems that enemies drop to gain experience.',
            'Each level up, choose one of the cards to grow stronger.',
            'Step on the glowing Mana Stones for a power-up. Chests give a free card.',
            'Survive the waves and defeat the final boss to win.',
        ],
    },
    {
        name: 'Keyboard',
        rows: [
            { control: 'WASD or arrow keys', action: 'Move' },
            { control: 'Hold left click', action: 'Walk towards the pointer' },
            { control: 'Hold right click', action: 'Aim your attacks at the pointer' },
            { control: 'C / Esc', action: 'Show your stats / Pause' },
            { control: 'Arrows + Enter, or click', action: 'Choose in menus and cards' },
            { control: 'Esc or Backspace', action: 'Go back' },
        ],
    },
    {
        name: 'Gamepad',
        rows: [
            { pad: ['LeftStick', 'Dpad'], action: 'Move' },
            { pad: ['RightStick'], action: 'Aim your attacks' },
            { pad: ['Y'], action: 'Show or hide your stats' },
            { pad: ['Start'], action: 'Pause' },
            { pad: ['Dpad', 'A'], action: 'Choose in menus and cards' },
            { pad: ['B'], action: 'Go back' },
        ],
    },
    {
        name: 'Touch',
        rows: [
            { control: 'Drag on the left half', action: 'Move' },
            { control: 'Drag on the right half', action: 'Aim (let go: auto aim)' },
            { control: 'Aim Stick off (Settings)', action: 'Drag anywhere to move' },
            { control: 'Stats / Pause buttons', action: 'Show your stats / Pause' },
            { control: 'Tap a card or option', action: 'Choose it' },
            { control: 'Top-right icon', action: 'Fullscreen' },
        ],
    },
    {
        // Fase 19A: Critical Strike del Guerrero; 19B: hechizo activo del Mago (Meteor Strike), con el mismo botón.
        name: 'Crit',
        rows: [
            // Como mucho 7 filas: con 8, la última pisa el selector "Page".
            { control: 'Space', action: 'Warrior: Critical Strike · Mage: Meteor Strike' },
            { pad: ['X'], action: 'Warrior: Critical Strike · Mage: Meteor Strike' },
            { control: 'Red orb button (touch)', action: 'Warrior: Critical Strike · Mage: Meteor Strike' },
            { control: 'Number on the red orb', action: 'Warrior: charges (+1 each 20 s) · Mage: secs left' },
            { control: 'Getting hit', action: 'Warrior: also refills the charges' },
            { control: 'Every 10 levels', action: 'Warrior: one more charge, and more damage' },
            { control: 'More Mag', action: 'Mage: Meteor Strike recharges faster' },
        ],
    },
    {
        // Fase 17A: la pantalla de los 4 personajes (CharacterSlotsScene). Página propia: en las otras no caben más filas.
        name: 'Characters',
        rows: [
            { control: 'Click or tap a character', action: 'Choose it' },
            { control: 'Click or tap it again', action: 'Play, or continue its run' },
            { control: 'Empty slot', action: 'Create a new character' },
            { control: 'Delete key or button', action: 'Delete it (press twice)' },
            // Fase 17B: Create New Character.
            { control: 'Create: arrows next to a row', action: 'Change your look' },
            { control: 'Create: arrow keys / pad', action: 'Up-Down: row, Left-Right: change' },
        ],
    },
];
