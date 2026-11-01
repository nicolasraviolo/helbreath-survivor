// Pasivas: mejoras con rangos que salen como carta para las dos clases (Fase 6C; docs/DESIGN.md → Pasivas).
// Cada carta sube un rango, hasta maxRank. Desde la Fase 20C también las piedras Xelima (+10% de daño por carta)
// y Merien (−10% de daño recibido por carta, encadenado: 5 cartas ≈ −41%), solo para esa partida. Boots se quitó en el 20C.
//
// Cartas de poder (propietario, 1-nov-2026): sustituyen a las "Blessing of Str/Vit/..." que daban puntos de stat. Cada
// una sube UN efecto, hasta 5 cartas, y la rareza decide cuánto vale (×1 / ×1,5 / ×2, data/cardRarity.ts). Nombre e
// icono de objetos del Helbreath que no son anillos ni collares (esos quedan para equipo futuro). Valores comparados con
// lo que daba una Blessing de +3 (data/stats.ts): una carta da más o menos lo mismo de SU efecto; los que más rompen
// (movimiento, velocidad de ataque y de hechizos) van bajos.

/** The stones and the amulet of before (group 'stone') and the cards that replace the stat Blessings ('blessing'). */
export const PASSIVE_IDS = [
    'xelima', 'merien', 'magnetAmulet',
    'unicornWard', 'wizardElixir', 'archmageSapphire', 'arcaneDiamond', 'demonEye',
    'werewolfStride', 'cyclopsEye', 'hellhoundFrenzy', 'serpentGrace',
    'ogreHeart', 'orbOfQuickening',
    'scorpionSting', 'rubyOfWrath', 'goldenCarp',
    'ginsengRoot', 'giantsDraught',
] as const;

export type PassiveId = (typeof PASSIVE_IDS)[number];

/**
 * Picture on the card: a frame of the item icons (item-pack.spr) or an image of our own. `size` = share of the card's
 * picture box it fills (1 = all of it), to match the item icons (a stone looks ~40 px: 0.62 of 64).
 */
export type PassiveIcon = { kind: 'item'; sheet: number; frame: number } | { kind: 'image'; key: string; size?: number };

/** 'stone': the stones and the Magnet Amulet (listed in the stats panel). 'blessing': the cards of one stat effect. */
export type PassiveGroup = 'stone' | 'blessing';

export interface PassiveDef {
    name: string;
    /** One line for the card. */
    effect: string;
    maxRank: number;
    /** Bonus per rank (0.08 = +8%; Scorpion's Sting: points of critical chance). */
    perRank: number;
    /**
     * 'add': ranks add up (3 × 10% = 30%). 'chain': each rank removes `perRank` of what is left
     * (3 × 10% = 1 − 0.9³ ≈ 27%), so it never reaches 100%.
     */
    stacking: 'add' | 'chain';
    /** What the bonus is called on the card's "before → after" line, and its sign there. */
    statLabel: string;
    sign: '+' | '−';
    icon: PassiveIcon;
    group: PassiveGroup;
}

/** A blessing card: 5 cards, its bonus added up. `sheet`/`frame`: its item-pack icon. */
function blessing(name: string, effect: string, statLabel: string, perRank: number, sheet: number, frame: number): PassiveDef {
    return { name, effect, maxRank: 5, perRank, stacking: 'add', statLabel, sign: '+', icon: { kind: 'item', sheet, frame }, group: 'blessing' };
}

export const PASSIVES: Readonly<Record<PassiveId, PassiveDef>> = {
    xelima: {
        name: 'Stone of Xelima', effect: 'More damage this run', maxRank: 5, perRank: 0.1, stacking: 'add',
        statLabel: 'Damage', sign: '+', icon: { kind: 'item', sheet: 5, frame: 128 }, group: 'stone',
    },
    merien: {
        name: 'Stone of Merien', effect: 'Less damage taken this run', maxRank: 5, perRank: 0.1, stacking: 'chain',
        statLabel: 'Damage taken', sign: '−', icon: { kind: 'item', sheet: 5, frame: 129 }, group: 'stone',
    },
    magnetAmulet: {
        name: 'Magnet Amulet', effect: 'Gems fly to you from further away', maxRank: 5, perRank: 0.3, stacking: 'add',
        statLabel: 'Pickup radius', sign: '+', icon: { kind: 'image', key: 'card.magnet', size: 0.62 }, group: 'stone',
    },
    // Before Mag: magic resistance (Unicorn Horn), mana recovery (Super Blue Potion), mana (Magic Sapphire), and the two
    // it also gave (owner, 1-nov-2026): magic damage (Magic Diamond) and spell accuracy (Demon Eye).
    unicornWard: blessing("Unicorn's Ward", 'Resist more spells this run', 'Magic resistance', 0.1, 5, 98),
    wizardElixir: blessing("Wizard's Elixir", 'Mana comes back faster', 'Mana recovery', 0.1, 5, 135),
    archmageSapphire: blessing('Sapphire of the Archmage', 'More maximum mana', 'Mana', 0.1, 19, 9),
    arcaneDiamond: blessing('Arcane Diamond', 'Your spells hit harder', 'Magic damage', 0.08, 19, 6),
    demonEye: blessing('Eye of the Demon', 'Your spells miss less', 'Spell accuracy', 0.04, 5, 93),
    // Before Dex: movement (Werewolf Tail), blows that land (Cyclops Eye), attack speed (Hellbound Claw) and dodge (Snake Skin).
    werewolfStride: blessing("Werewolf's Stride", 'Move faster', 'Speed', 0.03, 5, 104),
    cyclopsEye: blessing('Cyclops Eye', 'Your blows miss less', 'Accuracy', 0.04, 5, 23),
    hellhoundFrenzy: blessing("Hellhound's Frenzy", 'Attack faster', 'Attack speed', 0.04, 5, 32),
    serpentGrace: blessing("Serpent's Grace", 'Dodge more blows', 'Defense ratio', 0.1, 5, 18),
    // Before Str and Int: physical damage (Ogre Heart) and casting speed (Blue Ball).
    ogreHeart: blessing('Heart of the Ogre', 'Your blows hit harder', 'Physical damage', 0.08, 5, 39),
    orbOfQuickening: blessing('Orb of Quickening', 'Cast spells faster', 'Cast speed', 0.04, 5, 126),
    // Before Chr: critical chance in points (Scorpion Sting), critical damage (Magic Ruby), Rare and Epic cards (Gold Carp).
    scorpionSting: blessing("Scorpion's Sting", 'More critical hits', 'Critical chance', 0.02, 5, 46),
    rubyOfWrath: blessing('Ruby of Wrath', 'Critical hits hit harder', 'Critical damage', 0.15, 19, 7),
    goldenCarp: blessing('Golden Carp', 'More Rare and Epic cards', 'Rare and Epic chance', 0.1, 5, 16),
    // Before Vit: health recovery (Ginseng) and maximum health (Super Red Potion). The monster hearts all look alike:
    // only the Ogre's is used.
    ginsengRoot: blessing('Ginseng Root', 'Health comes back faster', 'Health recovery', 0.2, 5, 114),
    giantsDraught: blessing("Giant's Draught", 'More maximum health', 'Health', 0.08, 5, 134),
};

export function getPassive(id: PassiveId): PassiveDef {
    return PASSIVES[id];
}

/** A record with 0 for every passive (ranks, values or bonuses). */
export function emptyPassiveRecord(): Record<PassiveId, number> {
    const record = {} as Record<PassiveId, number>;
    for (const id of PASSIVE_IDS) record[id] = 0;
    return record;
}

/**
 * Total bonus of a passive, e.g. 0.3 = +30% (or −30% for Merien). `value` = what its cards are worth added up
 * (Fase 28½A: Common 1, Rare 1.5, Epic 2; data/cardRarity.ts), so 5 Epic Xelima = +100%.
 */
export function passiveBonus(id: PassiveId, value: number): number {
    const def = getPassive(id);
    return def.stacking === 'add' ? def.perRank * value : 1 - (1 - def.perRank) ** value;
}

/**
 * How often each kind of card comes out in the draw, by weight (one card of a kind, not all of them): the 3 magics and
 * 3 stones would drown among 16 blessings with the same weight. Weights 4 / 2 / 1 ≈ 35% / 18% / 47% of the cards.
 */
export const CARD_DRAW_WEIGHT = { magic: 4, stone: 2, blessing: 1 } as const;

/**
 * When every passive and magic is at its maximum (owner, 1-nov-2026): a card of gold or of health. Their amount is ×
 * the card's rarity value (Rare 1.5, Epic 2). Gold: `piles` gold piles of the map (data/gold.ts). Heal: share of max health.
 */
export const FILLER_CARDS = {
    gold: { name: 'Pouch of Gold', effect: 'Gold for this run', piles: 2, icon: { kind: 'item', sheet: 5, frame: 0 } },
    heal: { name: 'Big Red Potion', effect: 'Heal now', healShare: 0.3, icon: { kind: 'item', sheet: 5, frame: 2 } },
} as const satisfies Record<string, { name: string; effect: string; icon: PassiveIcon; piles?: number; healShare?: number }>;

export type FillerId = keyof typeof FILLER_CARDS;
export const FILLER_IDS = ['gold', 'heal'] as const satisfies readonly FillerId[];
