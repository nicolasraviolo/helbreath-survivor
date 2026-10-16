// Pasivas (Fase 6, bloque 6C; docs/DESIGN.md → Pasivas): mejoras con rangos que salen como carta para las dos clases.
// Cada carta sube un rango, hasta maxRank. Números propios, a ajustar jugando.

export type PassiveId = 'boots' | 'magnetAmulet';

export interface PassiveDef {
    name: string;
    /** One line for the card. */
    effect: string;
    maxRank: number;
    /** Bonus per rank (0.08 = +8%). */
    perRank: number;
    /** What the bonus is called on the card's "before → after" line. */
    statLabel: string;
}

export const PASSIVES = {
    boots: { name: 'Boots', effect: 'Movement speed', maxRank: 5, perRank: 0.08, statLabel: 'Speed' },
    magnetAmulet: { name: 'Magnet Amulet', effect: 'Gems fly to you from further away', maxRank: 5, perRank: 0.3, statLabel: 'Pickup radius' },
} as const satisfies Record<PassiveId, PassiveDef>;

export const PASSIVE_IDS = ['boots', 'magnetAmulet'] as const satisfies readonly PassiveId[];

export function getPassive(id: PassiveId): PassiveDef {
    return PASSIVES[id];
}
