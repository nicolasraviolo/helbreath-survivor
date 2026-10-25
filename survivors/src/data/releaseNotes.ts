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
        version: 'Phase 28',
        date: 'Oct 25, 2026',
        changes: [
            'New run magic: the Damage Aura hurts the monsters around you and grows with your cards.',
        ],
    },
    {
        version: 'Phase 27½',
        date: 'Oct 25, 2026',
        changes: [
            'Move your save to another device with a short code: Settings → Gameplay → Transfer Save.',
        ],
    },
    {
        version: 'Phase 27',
        date: 'Oct 23, 2026',
        changes: [
            'Monsters move in different ways: some flank you from the sides, others wander until they spot you.',
            'Some monsters stop with a "!" and then charge at you: step aside to dodge them.',
            'Monsters that cast from afar now keep their distance and back away when you get close.',
            'In town, a "Level Up" notice opens your Character window, and the pause menu opens your Equipment.',
        ],
    },
    {
        version: 'Phase 26',
        date: 'Oct 23, 2026',
        changes: [
            "The Mage's skill spell now costs mana, and a new Blue Potion refills it.",
            "On phones, drag the Mage's spell button to aim it.",
            'Many new Mage spells of lightning, ice and earth, unlocked as your Int grows.',
            'Ice spells slow monsters down, and a rare Blue Book teaches Bloody Shock Wave.',
            'Wands with Mana Save and robes with MP Recovery now work.',
        ],
    },
    {
        version: 'Phase 25',
        date: 'Oct 22, 2026',
        changes: [
            'Fullscreen button always at hand, also on handheld PCs like the Steam Deck.',
            'Handheld PCs now get the desktop interface.',
            'Bigger buttons to assign stat points on phones.',
            'Cleaner end-of-run screen.',
        ],
    },
    {
        version: 'Visual update',
        date: 'Oct 22, 2026',
        changes: ['Sharper text and graphics, especially on phones and high-resolution screens.'],
    },
    {
        version: 'Balance update',
        date: 'Oct 22, 2026',
        changes: [
            'Bosses are tougher: they take twice as long to defeat.',
            'Each character Level now adds health. The Mage is sturdier and can wear her robes and hats much sooner.',
            'More gold from monsters, and cheaper weapon upgrades.',
            'Big monsters have less health and you deal more damage as your Power grows: fewer crowds late in a run.',
            'Fixed a rare freeze when the Fire Wyvern appeared.',
        ],
    },
    {
        version: 'Phase 24',
        date: 'Oct 22, 2026',
        changes: [
            'Gold: monsters drop coins and bosses drop piles. You keep it even if you die.',
            'Loot is rarer but always special: armor now comes with bonuses too.',
            'Dying without a Zem now loses only half of your loot.',
            "New shop in town: spend your gold on the Zem, Abaddon's Blood, dice and wine.",
            'Your character no longer loses their clothes after changing equipment in town.',
            'Tom the blacksmith buys, sells and upgrades weapons and wands up to +3.',
            'New rare loot: the Stone of Xelima, used for weapon upgrades.',
            'Press I in town to open your equipment.',
            'Meet Gorn and Kaila: every account now starts with a warrior and a mage. More characters will unlock later.',
        ],
    },
    {
        version: 'Phase 23',
        date: 'Oct 21, 2026',
        changes: [
            'New town: walk around the Elvine farm between runs.',
            'Step on the teleport to choose your map.',
            'After a run, the Town button takes you back to the farm.',
            'Talk to the townsfolk: Howard keeps your gear, William your achievements.',
        ],
    },
    {
        version: 'Phase 22',
        date: 'Oct 21, 2026',
        changes: [
            'New Select Map screen: choose where to fight.',
            'New map: Traveler Zone, a short first adventure full of weak monsters (cats included).',
            'New map: Elvine Garden, with walking trees and a giant Cyclops.',
            'New map: Middleland, a long battle against a Giant Lizard, a Berserk Ettin and the Unicorn.',
            'Win a map, or reach its Level, to open the next one.',
            'Two new bosses, a giant Stone Golem and the Training Dummy, and two new achievements.',
            'Faster start: each map now loads only what it needs.',
            'Your character now casts a shadow, like the monsters.',
        ],
    },
    {
        version: 'Phase 21½',
        date: 'Oct 21, 2026',
        changes: [
            'Power cards now come as Common, Rare or Epic.',
            'Chest cards are always Rare or better, and Charisma brings rarer cards.',
            'New Reroll and Skip buttons on the cards, for those who own Dice or Wine.',
            'Champions: once or twice per run, a huge monster shows up. Defeat it for a better item.',
            'How to Play text now fits its window.',
        ],
    },
    {
        version: 'Phase 21',
        date: 'Oct 20, 2026',
        changes: [
            'Loot: monsters and bosses now drop gear. Equip it at once or keep it in your bag.',
            'Rare weapons: Sharp, Poison and Ancient, each with its own colour.',
            'The Mage can now find and equip wands.',
            'New shared Warehouse, and Equipment now shows only what you own.',
            'Win to keep your loot, or wear a Zemstone: bosses may drop one.',
            "New: Abaddon's Blood brings you back to life once per run.",
            'Health potions are now much rarer.',
            'Continue is gone from the menu: pick a character to resume or restart its run.',
        ],
    },
    {
        version: 'Phase 20',
        date: 'Oct 19, 2026',
        changes: [
            'Permanent Level: every run now makes your character stronger.',
            'New Character window to assign your stat points.',
            'New Equipment screen: choose your gear and see it on your character.',
            'New cards: Stone of Xelima and Stone of Merien.',
            'New slash, elite monsters, loading screen, Settings tabs and fixes.',
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
