// Pasivas: mejoras con rangos que salen como carta para las dos clases (Fase 6C; docs/DESIGN.md → Pasivas).
// Cada carta sube un rango, hasta maxRank. Desde la Fase 20C también las piedras Xelima (+10% de daño por carta)
// y Merien (−10% de daño recibido por carta, encadenado: 5 cartas ≈ −41%), solo para esa partida. Boots se quitó en el 20C.

export type PassiveId = 'xelima' | 'merien' | 'magnetAmulet';

/**
 * Picture on the card: a frame of the item icons (item-pack.spr) or an image of our own. `size` = share of the card's
 * picture box it fills (1 = all of it), to match the item icons (a stone looks ~40 px: 0.62 of 64).
 */
export type PassiveIcon = { kind: 'item'; sheet: number; frame: number } | { kind: 'image'; key: string; size?: number };

export interface PassiveDef {
    name: string;
    /** One line for the card. */
    effect: string;
    maxRank: number;
    /** Bonus per rank (0.08 = +8%). */
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
}

export const PASSIVES = {
    xelima: {
        name: 'Stone of Xelima', effect: 'More damage this run', maxRank: 5, perRank: 0.1, stacking: 'add',
        statLabel: 'Damage', sign: '+', icon: { kind: 'item', sheet: 5, frame: 128 },
    },
    merien: {
        name: 'Stone of Merien', effect: 'Less damage taken this run', maxRank: 5, perRank: 0.1, stacking: 'chain',
        statLabel: 'Damage taken', sign: '−', icon: { kind: 'item', sheet: 5, frame: 129 },
    },
    magnetAmulet: {
        name: 'Magnet Amulet', effect: 'Gems fly to you from further away', maxRank: 5, perRank: 0.3, stacking: 'add',
        statLabel: 'Pickup radius', sign: '+', icon: { kind: 'image', key: 'card.magnet', size: 0.62 },
    },
} as const satisfies Record<PassiveId, PassiveDef>;

export const PASSIVE_IDS = ['xelima', 'merien', 'magnetAmulet'] as const satisfies readonly PassiveId[];

export function getPassive(id: PassiveId): PassiveDef {
    return PASSIVES[id];
}

/** Total bonus of a passive at that rank, e.g. 0.3 = +30% (or −30% for Merien). */
export function passiveBonus(id: PassiveId, rank: number): number {
    const def = getPassive(id);
    return def.stacking === 'add' ? def.perRank * rank : 1 - (1 - def.perRank) ** rank;
}
