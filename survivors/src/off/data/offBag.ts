// Helbreath Off (Fase Off-4B; Off-12B): textos de la bolsa (la ventana del personaje, pestaña Bag,
// off/scenes/OffBagScene.ts). Off-12C: también los de las pestañas Stats y Magic (OFF_STATS_TEXT, OFF_MAGIC_TEXT). Lo que pasa al usar o tirar algo sale también en la lista de abajo a la izquierda.
// Medidas de la ventana en off/config/offBag.ts; tamaño de la bolsa y límite de pociones en off/data/offLoot.ts.
import type { OffPotionRestores } from './offGoods';

const BAR_NAMES: Record<OffPotionRestores, string> = { hp: 'Health', mana: 'Mana', stamina: 'Stamina' };

export const OFF_BAG_TEXT = {
    /** The window's tabs (Off-12C: Magic only with a spell learned). */
    tabs: { bag: 'Bag', stats: 'Stats', magic: 'Magic' },
    equipmentLabel: 'Equipment',
    /** Short names inside the empty slots (they must fit a 44 px slot). */
    slotNames: { weapon: 'Weapon', shield: 'Shield', helm: 'Helm', body: 'Body', legs: 'Legs', boots: 'Boots', cape: 'Cape', ring: 'Ring' },
    dropButton: 'Drop',
    equipButton: 'Equip',
    drinkButton: 'Drink',
    useButton: 'Use',
    removeButton: 'Remove',
    /** Filters over the bag (Off-12B). */
    filters: { all: 'All', weapon: 'Weapons', armor: 'Armor', potion: 'Potions' },
    goldLabel: 'Gold',
    gold: (amount: number) => amount.toLocaleString('en-US'),
    potions: (count: number, limit: number) => `Potions ${count} / ${limit}`,
    items: (count: number, size: number) => `${count} / ${size}`,
    /** Header under the name: city (or none yet) and level. */
    subtitle: (city: string | undefined, level: number) => `${city ?? 'Traveler'} · Level ${level}`,
    expToNext: (left: number, next: number) => `${left.toLocaleString('en-US')} to lv ${next}`,
    expMax: 'Max level',
    empty: 'Your bag is empty. Monsters drop gold, potions and gear: walk over them to pick them up.',
    pickHint: 'Choose an item to see it here.',
    removed: (name: string) => `You took off the ${name}. It went back to your bag.`,
    /** Card of an empty slot. */
    emptySlot: 'Nothing worn here.',
    emptySlotHint: 'Pick something for it from your bag.',
    bareHands: 'Spells need an empty hand or a wand.',
    worn: 'worn',
    equipped: (name: string) => `You put on the ${name}.`,
    /** Off-7E: a two-handed weapon and a shield don't go together. */
    equippedTakingOff: (name: string, off: string) => `You put on the ${name}. The ${off} went back to your bag.`,
    bagFull: 'Your bag is full.',
    needsStr: (str: number) => `Not enough Str (needs ${str}).`,
    needsLevel: (level: number) => `Your level is too low (needs Level ${level}).`,
    alreadyFull: (what: OffPotionRestores) => `Your ${BAR_NAMES[what]} is already full.`,
    cantUse: (name: string) => `${name} can't be used. Sell it in town.`,
    dropped: (name: string) => `You dropped the ${name}.`,
    /** Quick potions (Off-7B): nothing of that kind to drink. */
    noPotion: (what: 'hp' | 'mana') => `You have no ${what === 'hp' ? 'Health' : 'Mana'} potions.`,
} as const;

/** Stats tab (Off-12C): spend points with − / +, then Confirm. */
export const OFF_STATS_TEXT = {
    attributesLabel: 'Attributes',
    detailsLabel: 'Details',
    pointsLabel: 'Points',
    names: { str: 'Strength', vit: 'Vitality', dex: 'Dexterity', int: 'Intelligence', mag: 'Magic' },
    reset: 'Reset',
    confirm: 'Confirm',
    health: 'Health',
    mana: 'Mana',
    stamina: 'Stamina',
    hitRatio: 'Hit Ratio',
    level: 'Level',
    experience: 'Experience',
    nextLevel: 'Next level',
    enemyKills: 'Enemy Kills',
    maxLevel: '—',
    now: (value: number) => `now ${value}`,
    noPoints: (perLevel: number) => `You get ${perLevel} points every level.`,
    maxed: (name: string, max: number) => `${name} is already at ${max}.`,
    noPointsLeft: 'No points left to spend.',
    confirmed: (spent: number) => `${spent} point${spent === 1 ? '' : 's'} spent.`,
    /** At the top of the help box when points are waiting for Confirm. */
    pending: 'Confirm to keep them: closing the window gives them back.',
} as const;

/** Magic tab (Off-12C): the spells known by circle, the marked one's card and the keys 1–8. */
export const OFF_MAGIC_TEXT = {
    spellsLabel: 'Spells',
    manaLabel: 'Mana',
    keysLabel: 'Keys',
    circle: (circle: number) => `Circle ${circle}`,
    castChance: 'Cast chance',
    onKey: (name: string, key: string) => `${name} is on ${key}.`,
    offKey: (name: string) => `${name} is on no key now.`,
    /** Key 3 = "3 (RT + X)". */
    keyName: (key: string, pad: string | undefined) => (pad ? `${key} (${pad})` : key),
} as const;

