// Helbreath Off (Fase Off-2): los monstruos de los pits con los números del servidor original (NPC.cfg, ver
// docs/hb-wiki/monstruos-comportamiento.md y monstruos.md). Sprite, sonidos, ritmo (ATime), daño, puntería, defensa y
// valentía se toman de Survivors (data/enemies.ts), que ya los tiene del original; aquí va lo que Survivors cambió:
// - Vida: dados de vida (HitDice) del original, no la vida comprimida de Survivors.
// - Experiencia: la del original (se usa en el bloque Off-2B).
// - Rabbit neutral (propietario, 6-nov-2026): no busca a nadie; solo ataca a quien le pega.
import { ENEMIES, type EnemyDef } from '../../data/enemies';

export type OffMonsterId = 'slime' | 'rabbit';

export interface OffMonsterDef {
    /** Survivors' monster with the same sprite, sounds and original combat numbers. */
    base: EnemyDef;
    /** Display name (over the head when marked). */
    name: string;
    /** NPC.cfg HitDice: health = HD d4 + HD when HD ≤ 5, else HD×4 + HD + 1dHD (server, at spawn). */
    hitDice: number;
    /** NPC.cfg search range: it notices a player this many tiles away (square around it). 0 = never looks. */
    searchRange: number;
    /** NPC.cfg experience: a random value between the two, at spawn. */
    exp: readonly [number, number];
    /** NPC.cfg Size: small monsters take the weapons' small-size dice (Dagger 1d5), large ones the large dice. */
    size: 'small' | 'large';
    /** Never starts a fight (propietario: the Rabbits). */
    neutral: boolean;
}

export const OFF_MONSTERS: Record<OffMonsterId, OffMonsterDef> = {
    // NPC.cfg Slime: ATime 2100, 1d4, HitDice 2, search 2; wiki: 7 HP, 400–499 XP, HR 30, DR 10.
    slime: { base: ENEMIES.slime, name: 'Slime', hitDice: 2, searchRange: 2, exp: [400, 499], size: 'small', neutral: false },
    // NPC.cfg Rabbit: ATime 1500, 1d5, HitDice 4, search 2; wiki: 14 HP, 250 XP, HR 35, DR 10.
    rabbit: { base: ENEMIES.bunny, name: 'Rabbit', hitDice: 4, searchRange: 2, exp: [250, 250], size: 'small', neutral: true },
};

/** Health of a new monster (server, at spawn). */
export function rollMonsterHp(hitDice: number, roll: (count: number, sides: number) => number): number {
    return hitDice <= 5 ? roll(hitDice, 4) + hitDice : hitDice * 4 + hitDice + roll(1, hitDice);
}
