// Textos de la pantalla "Select Character" de Helbreath Off (8-nov-2026). Las medidas, el fondo y los botones son los de
// Survivors (config/characterSlots.ts, SLOTS_*): es la misma pantalla del original.

export const OFF_SLOTS = {
    emptyLabel: 'Empty',
    emptyHelp: 'Empty slot.\nCreate New Character to make one here.',
    fullHelp: 'All four slots are in use.\nDelete a character first.',
    deleteEmptyHelp: 'This slot is empty.',
    /** Help line of a marked character: name, level and home town. */
    characterHelp: (name: string, level: number, home: string) => `${name}, Level ${level}.\nHome: ${home}.`,
    pointsHelp: (points: number) => `${points} points to assign (C in the world).`,
    controlsHelp: 'Del / Y: delete.',
    deleteTitle: 'Delete Character',
    deleteQuestion: (name: string) => `Delete ${name}?`,
    deleteWarning: "This can't be undone.",
} as const;
