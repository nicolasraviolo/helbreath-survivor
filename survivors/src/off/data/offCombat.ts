// Helbreath Off (Fase Off-2): reglas del combate, del servidor original (reference/Server.cpp):
// - Acertar (iCalculateAttackEffect): probabilidad = puntería / defensa × 50, entre un mínimo y un máximo. El jugador
//   suma 50 a su puntería siempre. Por la espalda (mirando igual que el que pega) la defensa va a la mitad.
// - Defensa del jugador: 2 × DEX + la de la armadura. Daño recibido: menos (1d(VIT/10) − 1).
// - Daño de un arma: sus dados (contra pequeños o grandes) × (1 + STR / 500).
// - Monstruos (NpcBehavior_*): buscan cada acción en un cuadrado de su alcance; si pierden 20 turnos persiguiendo,
//   lo dejan. Con 2 de vida o menos y 1d(valentía) ≤ 3 huyen 10 acciones (ya portado en Survivors, MONSTER_AI).
// Hasta que haya personaje (Off-3) y equipo (Off-4), el novato lleva stats fijos y una Dagger (propietario, 6-nov-2026).
import { MELEE_WEAPONS } from '../../data/weapons';

/** The novice's stats until Off-3: the original's 70 starting points, split evenly between the 5 stats of Off. */
export const OFF_NOVICE_STATS = { level: 1, str: 14, vit: 14, dex: 14, int: 14, mag: 14 } as const;

/** Original max health: VIT×3 + Level×2 + STR/2 (server, integer division). */
export function offMaxHp(stats: { level: number; str: number; vit: number }): number {
    return stats.vit * 3 + stats.level * 2 + Math.floor(stats.str / 2);
}

export interface OffWeaponDef {
    name: string;
    /** Damage dice against small monsters (Item.cfg values 1–3) and large ones (4–6): count, sides, bonus. */
    small: readonly [number, number, number];
    large: readonly [number, number, number];
    /** Tiles it reaches (1 = next to the target). */
    range: number;
    /** Time of one attack (animation and wait), ms. */
    attackMs: number;
    /** Drawn in the hand. */
    look: { sprite: typeof MELEE_WEAPONS.dagger.sprite.key; startSheet: number };
}

/**
 * The novice's Dagger (Item.cfg 1: 1d5 small, 1d4 large).
 * Attack time: the original client took 8·(56 + (15 − v)·11) ms, with v a speed index that grows with STR up to the
 * weapon's best (docs/hb-wiki/armas.md). Without enough STR for the Dagger's best (18) we take v = 12: 712 ms.
 * Off-3 will work it out from STR.
 */
export const OFF_DAGGER: OffWeaponDef = {
    name: 'Dagger',
    small: [1, 5, 0],
    large: [1, 4, 0],
    range: 1,
    attackMs: 712,
    look: { sprite: MELEE_WEAPONS.dagger.sprite.key, startSheet: MELEE_WEAPONS.dagger.sprite.startSheet },
};

export const OFF_COMBAT = {
    /** Hit chance limits, % (server DEF_MINIMUMHITRATIO / DEF_MAXIMUMHITRATIO). */
    minHitPercent: 15,
    maxHitPercent: 99,
    /** Added to the player's hit ratio on every attack (server: iAttackerHitRatio += 50). */
    playerHitBonus: 50,
    /** The novice's weapon skill (mastery) until there are skills: the hit ratio before the bonus. Ours. */
    noviceSkill: 0,
    /** Share of the attack animation when the blow lands (ours; sp-client plays the hit on frame 2–3 of 8). */
    hitShare: 0.4,
    /** Monsters: attack turns before giving up a chase and wandering again (server NpcBehavior_Attack). */
    giveUpTurns: 20,
    /** Monsters: extra random ms added to ATime when one appears (server, 0–299). */
    actionTimeJitterMs: 299,
    /** Monsters: share of wandering actions spent standing still (ours, so they don't walk all the time). */
    wanderIdleChance: 0.4,
    /** How long a dead monster's body stays before it goes (NPC.cfg RegenTime; not in the repo: ours). */
    corpseMs: 3000,
    corpseFadeMs: 400,
    /** The player, after dying, comes back after this long at the start, with full health (more in Off-2B). */
    playerRespawnMs: 3000,
    /** The player flinches (hurt pose) when hit while standing still. */
    playerHurtMs: 267,
    /** Gamepad and Space: A picks the nearest monster this many tiles away or nearer; LB / RB cycle among them. Ours. */
    targetRangeTiles: 8,
} as const;
