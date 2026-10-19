// Textos de la página "How to play" (Fase 11): cómo se juega y los controles de cada dispositivo.
// Es el ÚNICO sitio del juego que explica teclas, botones y gestos: la partida y los menús no muestran textos de controles.
// Al añadir un control nuevo (apuntado, crit, tótems...), se añade aquí.

/** Gamepad buttons drawn as Xbox icons (scenes/HowToPlayScene.ts). */
export type PadIcon = 'A' | 'B' | 'X' | 'Y' | 'R2' | 'Start' | 'LeftStick' | 'RightStick' | 'Dpad';

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
            'Each time your Power goes up, choose a card to grow stronger.',
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
            { control: 'C / Esc', action: 'Character window / Pause' },
            { control: 'Arrows + Enter, or click', action: 'Choose in menus and cards' },
            { control: 'Esc or Backspace', action: 'Go back' },
            // Fase 19C: se pueden cambiar la tecla del crit y la del panel de stats.
            { control: 'Settings, Controls', action: 'Change the Crit and Character keys' },
        ],
    },
    {
        name: 'Gamepad',
        rows: [
            { pad: ['LeftStick', 'Dpad'], action: 'Move' },
            { pad: ['RightStick'], action: 'Aim your attacks' },
            { pad: ['Y'], action: 'Character window' },
            { pad: ['Start'], action: 'Pause' },
            { pad: ['Dpad', 'A'], action: 'Choose in menus and cards' },
            { pad: ['B'], action: 'Go back' },
            { control: 'Settings, Controls', action: 'Change the Crit and Character buttons' },
        ],
    },
    {
        name: 'Touch',
        rows: [
            { control: 'Drag on the left half', action: 'Move' },
            { control: 'Drag on the right half', action: 'Aim (let go: auto aim)' },
            { control: 'Aim Stick off (Settings)', action: 'Drag anywhere to move' },
            { control: 'Helmet / Pause buttons', action: 'Character window / Pause' },
            { control: 'Tap a card or option', action: 'Choose it' },
            { control: 'Top-right icon', action: 'Fullscreen' },
        ],
    },
    {
        // Fase 19A: Critical Strike del Guerrero; 19B: hechizo activo del Mago (desde el 20D, el del hueco Spell 2), con el mismo botón.
        name: 'Crit',
        rows: [
            // Como mucho 7 filas: con 8, la última pisa el selector "Page".
            { control: 'Space', action: 'Warrior: Critical Strike · Mage: active spell (Spell 2)' },
            { pad: ['R2'], action: 'Warrior: Critical Strike · Mage: active spell (Spell 2)' },
            { control: 'Red orb button (touch)', action: 'Warrior: Critical Strike · Mage: active spell (Spell 2)' },
            { control: 'Number on the red orb', action: 'Warrior: charges (+1 each 15 s) · Mage: secs left' },
            { control: 'Getting hit', action: 'Warrior: also refills the charges' },
            { control: 'Every 10 Power', action: 'Warrior: one more charge, and more damage' },
            { control: 'More Mag', action: 'Mage: the active spell recharges faster' },
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
    {
        // Fase 20A: Level permanente y Power de la partida. Como mucho 7 filas.
        name: 'Level',
        rows: [
            { control: 'Power', action: 'Your level inside a run: it starts at 1 each run' },
            { control: 'End of a run (win or lose)', action: 'All its XP goes to your character\'s Level' },
            { control: 'Each Level', action: '3 stat points, kept forever' },
            { control: 'Level Set. (Select Character)', action: 'Open the Character window to assign them' },
            { control: '+ / − next to a stat', action: 'Add a point / take it back' },
            { control: 'Ok', action: 'Confirm: points can never be moved again' },
            { control: 'Arrows, Enter, − key or pad X', action: 'Choose a stat, add a point, take it back' },
        ],
    },
    {
        // Fase 20B: pantalla Equipment. Como mucho 7 filas.
        name: 'Equipment',
        rows: [
            { control: 'Equipment (Select Character)', action: 'Choose what your character wears' },
            { control: 'I key or pad X', action: 'Open it for the marked character' },
            { control: 'Each run', action: 'Starts with that equipment on' },
            { control: 'Requirements', action: 'Your permanent Str, Mag and Level: red = not met' },
            { control: 'Left-Right / Down', action: 'Choose a slot / go down its list' },
            { control: 'Enter, pad A or a click', action: 'Wear the item (saved at once)' },
        ],
    },
];
