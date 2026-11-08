// Helbreath Off (Fase Off-9A): a quién podéis pegar tú, tu mercenario y vuestras magias: un monstruo o un Raider (un
// OffMercenary de la otra ciudad, `isRaider`). Estas funciones dan lo que cambia entre los dos (dónde está el cuerpo,
// la defensa, la resistencia a la magia, el tamaño para el daño del arma) sin que el resto tenga que preguntarlo.
import { PLAYER_BODY_OFFSET_Y } from '../../config/gameConfig';
import type { MagicElement } from '../../data/elements';
import { OFF_RAIDER } from '../data/offRaiders';
import type { OffMercenary } from '../entities/OffMercenary';
import type { OffMonster } from '../entities/OffMonster';

/** A monster, or a Raider. */
export type OffFoe = OffMonster | OffMercenary;

export function isRaider(foe: OffFoe): foe is OffMercenary {
    return foe.kind === 'person';
}

/** Where its body is drawn (numbers, spells and blood go there). */
export function foeBodyY(foe: OffFoe): number {
    return isRaider(foe) ? foe.y - PLAYER_BODY_OFFSET_Y : foe.y - foe.def.base.bodyOffsetY;
}

/** Its defence against blows (a monster's Defense Ratio; a Raider's, as a player's). */
export function foeDefense(foe: OffFoe): number {
    return isRaider(foe) ? foe.defense : foe.def.base.defenseRatio;
}

/** Its chance (1–100 scale) of shrugging off a spell. */
export function foeMagicResist(foe: OffFoe): number {
    return isRaider(foe) ? OFF_RAIDER.magicResist : foe.def.magicResist;
}

/** Its element against spells (a person has none). */
export function foeElement(foe: OffFoe): MagicElement {
    return isRaider(foe) ? 'neutral' : foe.def.base.element;
}

/** Which of a weapon's damage rolls it takes (people are small, as players in the original). */
export function foeSize(foe: OffFoe): 'small' | 'large' {
    return isRaider(foe) ? 'small' : foe.def.size;
}

/** It is fighting someone now (a Raider always is: it came for you). */
export function foeAttacking(foe: OffFoe): boolean {
    return isRaider(foe) || foe.mode === 'attack';
}
