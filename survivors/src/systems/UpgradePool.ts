// Arma las cartas de subida de nivel, las "cartas de Power" (ver la skill anadir-mejora y docs/DESIGN.md → "Cartas al subir de nivel").
// Desde la Fase 20C las cartas ya no dan armas, hechizos ni armaduras: eso es el equipo permanente (pantalla Equipment).
// - Stat: +3 a un stat, solo en esta partida. Siempre disponible.
// - Pasiva (Stone of Xelima, Stone of Merien, Magnet Amulet): sube un rango, hasta el máximo. Para las dos clases.
// - Fase 21½A: cada carta tiene rareza (Common / Rare / Epic, data/cardRarity.ts) que sube sus puntos o sus rangos.
// Como mucho MAX_ITEM_CARDS cartas de pasiva; el resto son de stat, sin repetir.
import Phaser from 'phaser';
import { getPassive, PASSIVE_IDS, type PassiveId } from '../data/passives';
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
    /** `rank`: the passive's rank after picking it (one to three more, by rarity). */
    | { kind: 'passive'; passive: PassiveId; rank: number; rarity: CardRarity };

/** Three cards; each draws its rarity apart (data/cardRarity.ts), with the run's Chr. */
export function buildLevelUpChoices(equipment: Equipment, chr: number, options: LevelUpOptions = {}): LevelUpChoice[] {
    const roll = (): CardRarity => (options.allEpic ? 'epic' : rollRarity(rarityWeights(chr, options.chest ?? false)));
    const passiveIds = Phaser.Utils.Array.Shuffle(PASSIVE_IDS.filter((p) => equipment.passives[p] < getPassive(p).maxRank));
    const passives = passiveIds.slice(0, options.onlyPassives ? LEVEL_UP_CHOICES : MAX_ITEM_CARDS).map((passive): LevelUpChoice => {
        const current = equipment.passives[passive];
        const rarity = fitRarity(roll(), getPassive(passive).maxRank - current);
        return { kind: 'passive', passive, rank: current + CARD_RARITY[rarity].passiveRanks, rarity };
    });
    const statIds = Phaser.Utils.Array.Shuffle([...STAT_IDS]).slice(0, LEVEL_UP_CHOICES - passives.length);
    const stats = statIds.map((stat): LevelUpChoice => {
        const rarity = roll();
        return { kind: 'stat', stat, points: CARD_RARITY[rarity].statPoints, rarity };
    });
    return Phaser.Utils.Array.Shuffle([...passives, ...stats]);
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

/** The rarity, or the best one below it whose ranks still fit before the passive's maximum. */
function fitRarity(rarity: CardRarity, ranksLeft: number): CardRarity {
    for (let i = CARD_RARITIES.indexOf(rarity); i > 0; i--) {
        const r = CARD_RARITIES[i];
        if (r && CARD_RARITY[r].passiveRanks <= ranksLeft) return r;
    }
    return 'common';
}
