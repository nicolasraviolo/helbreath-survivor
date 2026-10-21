// Rareza de las cartas de Power (Fase 21½A; decidido por el propietario el 21-oct-2026, docs/PLAN-2.md "Fase 21½").
// - Cada carta sortea su rareza por separado: Common 80%, Rare 16%, Epic 4% (~3 Epic en una partida entera).
// - Stat: +3 / +5 / +8. Piedras y Magnet: +1 / +2 / +3 rangos, sin pasar del máximo. Si no caben los rangos de una
//   rareza, la carta baja a la que quepa (systems/UpgradePool.ts).
// - La Chr de la partida sube Rare y Epic: +1% de su probabilidad por punto sobre 10, hasta el doble.
// - Las cartas de los cofres ("Treasure!") nunca salen Common.
// - ?debug=epic: todas las cartas salen Epic.
import type { SoundKey } from '../config/assetManifest';

export const CARD_RARITIES = ['common', 'rare', 'epic'] as const;
export type CardRarity = (typeof CARD_RARITIES)[number];

export interface CardRarityDef {
    /** Shown over the card's title; empty for Common (it looks like before). */
    label: string;
    /** Base chance weight (they add up to 100). */
    weight: number;
    /** Points of a stat card. */
    statPoints: number;
    /** Ranks a passive card adds at once. */
    passiveRanks: number;
    /** Inner frame and label of the card. */
    color: number;
}

export const CARD_RARITY: Readonly<Record<CardRarity, CardRarityDef>> = {
    common: { label: '', weight: 80, statPoints: 3, passiveRanks: 1, color: 0x8a7038 },
    rare: { label: 'Rare', weight: 16, statPoints: 5, passiveRanks: 2, color: 0x4a90ff },
    epic: { label: 'Epic', weight: 4, statPoints: 8, passiveRanks: 3, color: 0xc060ff },
};

/** Chr over this value raises the chance of Rare and Epic cards. */
export const RARITY_CHR_BASE = 10;
/** Each Chr point over the base multiplies the Rare and Epic weights by this much more (0.01 = +1%). */
export const RARITY_CHR_PER_POINT = 0.01;
/** The Chr bonus never more than doubles the Rare and Epic chances. */
export const RARITY_CHR_MAX_MULTIPLIER = 2;

/** Epic cards: a soft glow that grows and fades in a loop behind the card, and a sound when the cards appear. */
export const EPIC_CARD_GLOW = { pad: 10, alpha: { min: 0.15, max: 0.45 }, pulseMs: 800 } as const;
export const EPIC_CARD_SOUND: SoundKey = 'sfx.cardEpic';

/** Weights of each rarity for this Chr; `chest` leaves out Common. */
export function rarityWeights(chr: number, chest: boolean): Record<CardRarity, number> {
    const bonus = Math.min(RARITY_CHR_MAX_MULTIPLIER, 1 + Math.max(0, chr - RARITY_CHR_BASE) * RARITY_CHR_PER_POINT);
    return {
        common: chest ? 0 : CARD_RARITY.common.weight,
        rare: CARD_RARITY.rare.weight * bonus,
        epic: CARD_RARITY.epic.weight * bonus,
    };
}
