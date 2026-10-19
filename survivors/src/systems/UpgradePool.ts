// Arma las cartas de subida de nivel, las "cartas de Power" (ver la skill anadir-mejora y docs/DESIGN.md → "Cartas al subir de nivel").
// Desde la Fase 20C las cartas ya no dan armas, hechizos ni armaduras: eso es el equipo permanente (pantalla Equipment).
// - Stat: +3 a un stat, solo en esta partida. Siempre disponible.
// - Pasiva (Stone of Xelima, Stone of Merien, Magnet Amulet): sube un rango, hasta el máximo. Para las dos clases.
// Como mucho MAX_ITEM_CARDS cartas de pasiva; el resto son de stat, sin repetir.
import Phaser from 'phaser';
import { getPassive, PASSIVE_IDS, type PassiveId } from '../data/passives';
import { LEVEL_UP_CHOICES, MAX_ITEM_CARDS, STAT_CARD_POINTS, STAT_IDS, type StatId } from '../data/stats';
import type { Equipment } from '../entities/Equipment';

export type LevelUpChoice =
    | { kind: 'stat'; stat: StatId; points: number }
    /** One more rank of a passive. */
    | { kind: 'passive'; passive: PassiveId; rank: number };

/** `onlyPassives` (debug, ?debug=stones): every passive not maxed out, before any stat card. */
export function buildLevelUpChoices(equipment: Equipment, onlyPassives = false): LevelUpChoice[] {
    const passives = Phaser.Utils.Array.Shuffle(passiveChoices(equipment)).slice(0, onlyPassives ? LEVEL_UP_CHOICES : MAX_ITEM_CARDS);
    const statIds = Phaser.Utils.Array.Shuffle([...STAT_IDS]).slice(0, LEVEL_UP_CHOICES - passives.length);
    const choices: LevelUpChoice[] = [...passives, ...statIds.map((stat): LevelUpChoice => ({ kind: 'stat', stat, points: STAT_CARD_POINTS }))];
    return Phaser.Utils.Array.Shuffle(choices);
}

function passiveChoices(equipment: Equipment): LevelUpChoice[] {
    const choices: LevelUpChoice[] = [];
    for (const passive of PASSIVE_IDS) {
        const rank = equipment.passives[passive];
        if (rank < getPassive(passive).maxRank) choices.push({ kind: 'passive', passive, rank: rank + 1 });
    }
    return choices;
}
