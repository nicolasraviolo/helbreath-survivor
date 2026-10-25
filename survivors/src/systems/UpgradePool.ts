// Arma las cartas de subida de nivel, las "cartas de Power" (ver la skill anadir-mejora y docs/DESIGN.md → "Cartas al subir de nivel").
// Desde la Fase 20C las cartas ya no dan armas, hechizos ni armaduras: eso es el equipo permanente (pantalla Equipment).
// - Stat: +3 a un stat, solo en esta partida. Siempre disponible.
// - Pasiva (Stone of Xelima, Stone of Merien, Magnet Amulet): sube un rango, hasta el máximo. Para las dos clases.
// - Magia (Fase 28, data/passiveMagic.ts): aura, espadas o angelitos; sube un rango. Una magia nueva solo sale si la
//   partida tiene menos de MAX_MAGICS_PER_RUN.
// - Fase 21½A: cada carta tiene rareza (Common / Rare / Epic, data/cardRarity.ts) que sube sus puntos. Desde la 28½A
//   las pasivas y magias suben siempre 1 rango y la rareza decide cuánto vale la carta (`value`).
// Como mucho MAX_ITEM_CARDS cartas de pasiva o magia (comparten esos huecos); el resto son de stat, sin repetir.
import Phaser from 'phaser';
import { getPassive, PASSIVE_IDS, type PassiveId } from '../data/passives';
import { getMagic, MAGIC_IDS, magicMaxRank, MAX_MAGICS_PER_RUN, type MagicId } from '../data/passiveMagic';
import { CARD_RARITIES, CARD_RARITY, rarityWeights, type CardRarity } from '../data/cardRarity';
import { LEVEL_UP_CHOICES, MAX_ITEM_CARDS, STAT_IDS, type StatId } from '../data/stats';
import type { Equipment } from '../entities/Equipment';

/** Options of a set of cards: `chest` (a chest's cards, never Common), `onlyPassives` (?debug=stones), `allEpic` (?debug=epic). */
export interface LevelUpOptions {
    chest?: boolean;
    onlyPassives?: boolean;
    allEpic?: boolean;
}

export type LevelUpChoice =
    | { kind: 'stat'; stat: StatId; points: number; rarity: CardRarity }
    /** `rank`: the passive's rank after picking it (always one more). `value`: what its cards are worth after it (Fase 28½A). */
    | { kind: 'passive'; passive: PassiveId; rank: number; value: number; rarity: CardRarity }
    /** `rank`, `value`: the magic's after picking it (Fase 28). */
    | { kind: 'magic'; magic: MagicId; rank: number; value: number; rarity: CardRarity };

/** A passive or a magic that can still go up, before its rarity is drawn. */
type RankedCard =
    | { kind: 'passive'; passive: PassiveId; current: number; currentValue: number }
    | { kind: 'magic'; magic: MagicId; current: number; currentValue: number };

/** Three cards; each draws its rarity apart (data/cardRarity.ts), with the run's Chr. */
export function buildLevelUpChoices(equipment: Equipment, chr: number, options: LevelUpOptions = {}): LevelUpChoice[] {
    const roll = (): CardRarity => (options.allEpic ? 'epic' : rollRarity(rarityWeights(chr, options.chest ?? false)));
    const ranked = Phaser.Utils.Array.Shuffle(rankedCards(equipment));
    const special = ranked.slice(0, options.onlyPassives ? LEVEL_UP_CHOICES : MAX_ITEM_CARDS).map((card): LevelUpChoice => {
        const rarity = roll();
        const rank = card.current + 1;
        const value = card.currentValue + CARD_RARITY[rarity].value;
        return card.kind === 'passive'
            ? { kind: 'passive', passive: card.passive, rank, value, rarity }
            : { kind: 'magic', magic: card.magic, rank, value, rarity };
    });
    const statIds = Phaser.Utils.Array.Shuffle([...STAT_IDS]).slice(0, LEVEL_UP_CHOICES - special.length);
    const stats = statIds.map((stat): LevelUpChoice => {
        const rarity = roll();
        return { kind: 'stat', stat, points: CARD_RARITY[rarity].statPoints, rarity };
    });
    return Phaser.Utils.Array.Shuffle([...special, ...stats]);
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

