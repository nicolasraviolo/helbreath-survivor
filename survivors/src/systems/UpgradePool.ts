// Arma las cartas de subida de nivel, las "cartas de Power" (ver la skill anadir-mejora y docs/DESIGN.md → "Cartas al subir de nivel").
// Desde la Fase 20C las cartas ya no dan armas, hechizos ni armaduras: eso es el equipo permanente (pantalla Equipment).
// - Pasiva: sube un rango, hasta el máximo. Para las dos clases. Las piedras y el Magnet Amulet ('stone'), y desde el
//   1-nov-2026 las cartas de un efecto que sustituyen a las de stat ('blessing', data/passives.ts).
// - Magia (Fase 28, data/passiveMagic.ts): aura, espadas o angelitos; sube un rango. Una magia nueva solo sale si la
//   partida tiene menos de MAX_MAGICS_PER_RUN.
// - Fase 21½A: cada carta tiene rareza (Common / Rare / Epic, data/cardRarity.ts). Desde la 28½A las pasivas y magias
//   suben siempre 1 rango y la rareza decide cuánto vale la carta (`value`).
// - Las 3 cartas salen sin repetir, por peso (CARD_DRAW_WEIGHT): magia 4, piedra 2, blessing 1. Si ya no queda nada que
//   subir, se completan con oro o vida (FILLER_CARDS), una de cada como mucho.
import { CARD_DRAW_WEIGHT, FILLER_IDS, getPassive, PASSIVE_IDS, type FillerId, type PassiveId } from '../data/passives';
import { getMagic, MAGIC_IDS, magicMaxRank, MAX_MAGICS_PER_RUN, type MagicId } from '../data/passiveMagic';
import { CARD_RARITIES, CARD_RARITY, rarityWeights, type CardRarity } from '../data/cardRarity';
import { LEVEL_UP_CHOICES } from '../data/stats';
import type { Equipment } from '../entities/Equipment';

/** Options of a set of cards: `chest` (a chest's cards, never Common), `onlyPassives` (?debug=stones: no magics), `allEpic` (?debug=epic). */
export interface LevelUpOptions {
    chest?: boolean;
    onlyPassives?: boolean;
    allEpic?: boolean;
}

export type LevelUpChoice =
    /** `rank`: the passive's rank after picking it (always one more). `value`: what its cards are worth after it (Fase 28½A). */
    | { kind: 'passive'; passive: PassiveId; rank: number; value: number; rarity: CardRarity }
    /** `rank`, `value`: the magic's after picking it (Fase 28). */
    | { kind: 'magic'; magic: MagicId; rank: number; value: number; rarity: CardRarity }
    /** Nothing left to take: gold or health, × `value` (the rarity's). */
    | { kind: 'filler'; filler: FillerId; value: number; rarity: CardRarity };

/** A passive or a magic that can still go up, before its rarity is drawn. */
type RankedCard =
    | { kind: 'passive'; passive: PassiveId; current: number; currentValue: number }
    | { kind: 'magic'; magic: MagicId; current: number; currentValue: number };

/**
 * Three cards; each draws its rarity apart (data/cardRarity.ts), with the run's Chr and `luck` (Golden Carp,
 * CharacterStats.cardLuckMultiplier).
 */
export function buildLevelUpChoices(equipment: Equipment, chr: number, luck: number, options: LevelUpOptions = {}): LevelUpChoice[] {
    const roll = (): CardRarity => (options.allEpic ? 'epic' : rollRarity(rarityWeights(chr, luck, options.chest ?? false)));
    const pool = rankedCards(equipment).filter((card) => !options.onlyPassives || card.kind === 'passive');
    const choices: LevelUpChoice[] = [];
    while (choices.length < LEVEL_UP_CHOICES && pool.length > 0) {
        const card = pool.splice(pickWeighted(pool.map(drawWeight)), 1)[0];
        if (!card) break;
        const rarity = roll();
        const rank = card.current + 1;
        const value = card.currentValue + CARD_RARITY[rarity].value;
        choices.push(card.kind === 'passive'
            ? { kind: 'passive', passive: card.passive, rank, value, rarity }
            : { kind: 'magic', magic: card.magic, rank, value, rarity });
    }
    for (const filler of FILLER_IDS) {
        if (choices.length >= LEVEL_UP_CHOICES) break;
        const rarity = roll();
        choices.push({ kind: 'filler', filler, value: CARD_RARITY[rarity].value, rarity });
    }
    return choices;
}

function drawWeight(card: RankedCard): number {
    return card.kind === 'magic' ? CARD_DRAW_WEIGHT.magic : CARD_DRAW_WEIGHT[getPassive(card.passive).group];
}

/** Index drawn with these weights. */
function pickWeighted(weights: readonly number[]): number {
    let left = Math.random() * weights.reduce((sum, w) => sum + w, 0);
    for (let i = 0; i < weights.length; i++) {
        left -= weights[i] ?? 0;
        if (left < 0) return i;
    }
    return weights.length - 1;
}

/** Passives below their maximum, and the ready magics the run has below their maximum or could still take. */
function rankedCards(equipment: Equipment): RankedCard[] {
    const cards: RankedCard[] = [];
    for (const passive of PASSIVE_IDS) {
        const max = getPassive(passive).maxRank;
        if (equipment.passives[passive] < max) {
            cards.push({ kind: 'passive', passive, current: equipment.passives[passive], currentValue: equipment.passiveValues[passive] });
        }
    }
    const roomForNew = equipment.magicCount < MAX_MAGICS_PER_RUN;
    for (const magic of MAGIC_IDS) {
        const current = equipment.magics[magic];
        const max = magicMaxRank(magic);
        if (getMagic(magic).ready && current < max && (current > 0 || roomForNew)) {
            cards.push({ kind: 'magic', magic, current, currentValue: equipment.magicValues[magic] });
        }
    }
    return cards;
}

function rollRarity(weights: Record<CardRarity, number>): CardRarity {
    const total = CARD_RARITIES.reduce((sum, r) => sum + weights[r], 0);
    let left = Math.random() * total;
    for (const rarity of CARD_RARITIES) {
        left -= weights[rarity];
        if (left < 0) return rarity;
    }
    return 'common';
}

