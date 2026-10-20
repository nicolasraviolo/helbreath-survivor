// Novedades de cada fase, para la pantalla "What's new" del menú principal (scenes/ReleaseNotesScene.ts).
// En inglés como todo el juego, contadas para el jugador (nada técnico). Frases CORTAS y de alto nivel, sin números
// ni detalles ("Mage damage rebalanced", "Several bugs fixed"): deben caber en la caja. La más nueva va PRIMERO:
// `/checkpoint fase` añade aquí la fase que se cierra.

export interface ReleaseNote {
    /** "Phase 19". */
    version: string;
    /** "Oct 18, 2026". */
    date: string;
    /** One short line per change. */
    changes: readonly string[];
}

export const RELEASE_NOTES: readonly ReleaseNote[] = [
    {
        version: 'Phase 20',
        date: 'Oct 19, 2026',
        changes: [
            'Permanent Level: every run now makes your character stronger.',
            'New Character window to assign your stat points.',
            'New Equipment screen: choose your gear and spells before each run.',
            'New cards: Stone of Xelima and Stone of Merien.',
            'New sword slash, rare elite monsters and many fixes.',
        ],
    },
    {
        version: 'Phase 19',
        date: 'Oct 18, 2026',
        changes: [
            'Warrior: Critical Strike. Mage: Meteor Strike.',
            'Gamepad vibration and custom controls.',
            'New "What\'s new" screen.',
        ],
    },
    {
        version: 'Phase 18',
        date: 'Oct 18, 2026',
        changes: [
            'Dodge: Dexterity and armor give a chance to avoid physical hits.',
            'Magic resistance against monster spells.',
        ],
    },
    {
        version: 'Phase 17',
        date: 'Oct 18, 2026',
        changes: [
            'Helbreath-style character list: up to 4 saved characters.',
            'Choose your character\'s look when creating it.',
        ],
    },
    {
        version: 'Phase 16',
        date: 'Oct 18, 2026',
        changes: [
            'Minimap showing you and the bosses.',
            'Totems with buffs, freeze and full heal. Chests now give a card.',
            'Fewer but tougher monsters, with enemy types paced over the run.',
        ],
    },
    {
        version: 'Phase 15',
        date: 'Oct 18, 2026',
        changes: [
            'Auto-aim goes for bosses first.',
            'Manual aim with right click, the right stick or a touch aim stick.',
        ],
    },
    {
        version: 'Phase 14',
        date: 'Oct 18, 2026',
        changes: [
            '14 achievements, with a notice when you unlock one.',
            'Warrior and Mage damage evened out.',
            'The final boss always appears. New game icon.',
        ],
    },
    {
        version: 'Phase 13',
        date: 'Oct 18, 2026',
        changes: [
            'New map: Bleeding Isle.',
            'The final boss calls minions and opens an exit portal.',
            'Five new monsters and a stampede event. Balance pass.',
        ],
    },
    {
        version: 'Phase 12',
        date: 'Oct 18, 2026',
        changes: [
            'Install the game as an app.',
            'Run saves: leave and come back with Continue.',
            'Touch-friendly settings and a fullscreen button.',
        ],
    },
    {
        version: 'Phase 11',
        date: 'Oct 18, 2026',
        changes: [
            'How to Play screen.',
            'Option for large trees. Better character select on phones.',
        ],
    },
    {
        version: 'Phase 10',
        date: 'Oct 17, 2026',
        changes: [
            'Screen shake, hit particles and new death and level-up sounds.',
            'Original level-up voices.',
            'Bigger, sharper interface on phones, with a compact HUD.',
        ],
    },
    {
        version: 'Phase 9',
        date: 'Oct 17, 2026',
        changes: [
            'Play on your phone with touch controls.',
            'The game is online: play it from any browser.',
        ],
    },
    {
        version: 'Phase 8',
        date: 'Oct 17, 2026',
        changes: ['Main menu, settings, credits, achievements and pause.'],
    },
    {
        version: 'Phase 7',
        date: 'Oct 17, 2026',
        changes: [
            'Waves and bosses, with monsters that behave like the original.',
            'End-of-run screen.',
        ],
    },
    {
        version: 'Phase 6',
        date: 'Oct 16, 2026',
        changes: [
            'Pick your character: Warrior or Mage.',
            'Warrior weapons and armor, Mage spells and clothing.',
            'Pickups, chest buffs and passive upgrades.',
        ],
    },
    {
        version: 'Phase 5',
        date: 'Oct 16, 2026',
        changes: ['XP gems, character stats and level-up cards.', 'Helbreath-style bottom bar.'],
    },
    {
        version: 'Phase 4',
        date: 'Oct 16, 2026',
        changes: ['First weapon: an auto-firing Energy Bolt, with damage numbers.'],
    },
    {
        version: 'Phase 3',
        date: 'Oct 16, 2026',
        changes: ['Monsters chase you and hurt you on contact. Game over.'],
    },
    {
        version: 'Phase 2',
        date: 'Oct 16, 2026',
        changes: ['First map and a Warrior you can move with keyboard, gamepad or mouse.'],
    },
    {
        version: 'Phase 1',
        date: 'Oct 16, 2026',
        changes: ['The project begins: the first Helbreath sprites come to life.'],
    },
];
