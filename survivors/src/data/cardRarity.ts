// Rareza de las cartas de Power (Fase 21½A; decidido por el propietario el 21-oct-2026, docs/PLAN-2.md "Fase 21½").
// - Cada carta sortea su rareza por separado. Fase 28½A (propietario, 25-oct-2026): Common 86,5%, Rare 12%, Epic 1,5%
//   (~1 Epic por partida con Chr 10); antes 80 / 16 / 4.
// - Stat: +3 / +5 / +8. Piedras, Magnet y magias: desde la 28½A **siempre 1 rango** (5 cartas como mucho); la rareza
//   decide cuánto vale esa carta: ×1 / ×1,5 / ×2 (Xelima Epic = +20%). En las magias el extra va al daño (dagas,
//   angelito) o al tamaño del anillo (aura): MAGIC_EXTRA_PER_POINT.
// - La Chr de la partida sube Rare y Epic: +2% de su probabilidad por punto sobre 10, hasta ×3 (Chr 110+).
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
    /** What a passive or magic card is worth (it always adds one rank): Xelima ×1 = +10%, ×2 = +20%. */
    value: number;
    /** Inner frame and label of the card. */
    color: number;
}

export const CARD_RARITY: Readonly<Record<CardRarity, CardRarityDef>> = {
    common: { label: '', weight: 86.5, statPoints: 3, value: 1, color: 0x8a7038 },
    rare: { label: 'Rare', weight: 12, statPoints: 5, value: 1.5, color: 0x4a90ff },
    epic: { label: 'Epic', weight: 1.5, statPoints: 8, value: 2, color: 0xc060ff },
};

/** Chr over this value raises the chance of Rare and Epic cards. */
export const RARITY_CHR_BASE = 10;
/** Each Chr point over the base multiplies the Rare and Epic weights by this much more (0.02 = +2%). */
export const RARITY_CHR_PER_POINT = 0.02;
/** The Chr bonus never more than triples the Rare and Epic chances. */
export const RARITY_CHR_MAX_MULTIPLIER = 3;
/**
 * Magics: each point a card is worth over 1 (Rare 0.5, Epic 1) makes the magic's main value this much bigger: the damage
 * of the daggers and the angel, the aura's ring (not its slow). 5 Epic cards = +50% (Claude, 25-oct-2026).
 */
export const MAGIC_EXTRA_PER_POINT = 0.1;

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
