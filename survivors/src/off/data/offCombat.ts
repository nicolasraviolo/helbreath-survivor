// Helbreath Off (Fase Off-2): reglas del combate, del servidor original (reference/Server.cpp):
// - Acertar (iCalculateAttackEffect): probabilidad = puntería / defensa × 50, entre un mínimo y un máximo. El jugador
//   suma 50 a su puntería siempre. Por la espalda (mirando igual que el que pega) la defensa va a la mitad.
// - Defensa del jugador: 2 × DEX + la de la armadura. Daño recibido: menos (1d(VIT/10) − 1).
// - Daño de un arma: sus dados (contra pequeños o grandes) × (1 + STR / 500).
// - Monstruos (NpcBehavior_*): buscan cada acción en un cuadrado de su alcance; si pierden 20 turnos persiguiendo,
//   lo dejan. Con 2 de vida o menos y 1d(valentía) ≤ 3 huyen 10 acciones (ya portado en Survivors, MONSTER_AI).
// Hasta que haya equipo (Off-4), el personaje lleva una Dagger (propietario, 6-nov-2026). Sus stats y la fórmula de la
// vida están en off/data/offCharacter.ts (Off-3A).
import { MELEE_WEAPONS } from '../../data/weapons';

export interface OffWeaponDef {
    name: string;
    /** Damage dice against small monsters (Item.cfg values 1–3) and large ones (4–6): count, sides, bonus. */
    small: readonly [number, number, number];
    large: readonly [number, number, number];
    /** Tiles it reaches (1 = next to the target). */
    range: number;
    /** STR needed to equip it (Item.cfg weight / 100). Checked when there is gear to equip (Off-3C / Off-4). */
    strToEquip: number;
    /** Item.cfg speed: 0 = fastest. Every OFF_ATTACK_SPEED.strPerStep of STR takes 1 off it (see offAttackMs). */
    speed: number;
    /** Drawn in the hand. */
    look: { sprite: typeof MELEE_WEAPONS.dagger.sprite.key; startSheet: number };
}

/** The novice's Dagger (Item.cfg 1: 1d5 small, 1d4 large; weight 200 → STR 2; speed 0, the fastest whatever the STR). */
export const OFF_DAGGER: OffWeaponDef = {
    name: 'Dagger',
    small: [1, 5, 0],
    large: [1, 4, 0],
    range: 1,
    strToEquip: 2,
    speed: 0,
    look: { sprite: MELEE_WEAPONS.dagger.sprite.key, startSheet: MELEE_WEAPONS.dagger.sprite.startSheet },
};

/**
 * Attack speed (Fase Off-3B; propietario, 7-nov-2026: depends on the weapon and the STR).
 * - Server (reference/Server.cpp, on equipping): slowness = Item.cfg speed − STR / 13 (whole division), never below 0.
 *   So a weapon reaches its best speed with STR = speed × 13 (the original shop showed "speed ~ speed×13").
 * - Time of one attack: 8 frames of 56 + slowness × 11 ms (docs/hb-wiki/armas.md: 448 ms at the fastest).
 */
export const OFF_ATTACK_SPEED = {
    strPerStep: 13,
    frames: 8,
    baseFrameMs: 56,
    frameMsPerSlowness: 11,
} as const;

/** How slow a weapon swings with that STR (0 = its best). */
export function offWeaponSlowness(weapon: Pick<OffWeaponDef, 'speed'>, str: number): number {
    return Math.max(0, weapon.speed - Math.floor(str / OFF_ATTACK_SPEED.strPerStep));
}

/** Time of one attack (animation and wait) with that weapon and STR, ms. */
export function offAttackMs(weapon: Pick<OffWeaponDef, 'speed'>, str: number): number {
    const a = OFF_ATTACK_SPEED;
    return a.frames * (a.baseFrameMs + offWeaponSlowness(weapon, str) * a.frameMsPerSlowness);
}

/** STR at which a weapon swings at its best. */
export function offBestSpeedStr(weapon: Pick<OffWeaponDef, 'speed'>): number {
    return weapon.speed * OFF_ATTACK_SPEED.strPerStep;
}

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
