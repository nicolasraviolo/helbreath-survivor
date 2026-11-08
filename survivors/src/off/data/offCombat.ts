// Helbreath Off (Fase Off-2): reglas del combate, del servidor original (reference/Server.cpp):
// - Acertar (iCalculateAttackEffect): probabilidad = puntería / defensa × 50, entre un mínimo y un máximo. El jugador
//   suma 50 a su puntería siempre. Por la espalda (mirando igual que el que pega) la defensa va a la mitad.
// - Defensa del jugador: 2 × DEX + la de la armadura. Daño recibido: menos (1d(VIT/10) − 1).
// - Daño de un arma: sus dados (contra pequeños o grandes) × (1 + STR / 500).
// - Monstruos (NpcBehavior_*): buscan cada acción en un cuadrado de su alcance; si pierden 20 turnos persiguiendo,
//   lo dejan. Con 2 de vida o menos y 1d(valentía) ≤ 3 huyen 10 acciones (ya portado en Survivors, MONSTER_AI).
// Las armas (la Dagger de salida y las de prueba, Off-3C) están en off/data/offItems.ts. Los stats y la fórmula de la
// vida, en off/data/offCharacter.ts (Off-3A).
export interface OffWeaponDef {
    name: string;
    /** Damage dice against small monsters (Item.cfg values 1–3) and large ones (4–6): count, sides, bonus. */
    small: readonly [number, number, number];
    large: readonly [number, number, number];
    /** Tiles it reaches (1 = next to the target). */
    range: number;
    /** STR needed to equip it (Item.cfg weight / 100). Checked on the Equipment screen (Off-3C). */
    strToEquip: number;
    /** Item.cfg speed: 0 = fastest. Every OFF_ATTACK_SPEED.strPerStep of STR takes 1 off it (see offAttackMs). */
    speed: number;
}

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

/**
 * Speed shown on the Equipment screen (propietario, 7-nov-2026): the weapon's own speed (Item.cfg), whatever the STR.
 * With enough STR every weapon swings as fast as the Dagger, so the label tells how slow it is before STR helps; the
 * screen also says the STR at which it reaches its best. Ours, by Item.cfg speed: Fast 0–2 (Dagger, Short Sword),
 * Medium 3–7 (Rapier, Esterk, Light Axe, Long Sword, Broad Sword, Claymore), Slow 8+ (Great Sword, Flameberge, War Axe,
 * Battle Axe, hammers). In order, fastest first.
 */
export const OFF_SPEED_LABELS = [
    { upToSpeed: 2, label: 'Fast' },
    { upToSpeed: 7, label: 'Medium' },
    { upToSpeed: Infinity, label: 'Slow' },
] as const;

/** Fast / Medium / Slow, and its place in OFF_SPEED_LABELS (0 = fastest), for a weapon. */
export function offSpeedLabel(weapon: Pick<OffWeaponDef, 'speed'>): { label: string; rank: number } {
    const rank = Math.max(0, OFF_SPEED_LABELS.findIndex((s) => weapon.speed <= s.upToSpeed));
    return { label: OFF_SPEED_LABELS[rank]?.label ?? 'Slow', rank };
}

/** STR at which a weapon swings at its best. */
export function offBestSpeedStr(weapon: Pick<OffWeaponDef, 'speed'>): number {
    return weapon.speed * OFF_ATTACK_SPEED.strPerStep;
}

/**
 * Off-7D: armour that takes away part of a monster's blow, as the original (reference/Server.cpp, iCalculateAttackEffect
 * ~L54055): each blow falls on one body part (body 50 %, legs 25 %, arms 15 %, head 10 %) and the piece worn there takes
 * away its `absorb` % (at most 80 %). The shield takes away its own % (defence − defence / 3, at most 80 %) when 1d100 ≤
 * the shield skill; Off has no skills, so shield skill = DEX × 2, up to 100 (owner, 8-nov-2026, as the weapon skill of
 * Off-7C). Off has nothing for the arms yet (the original's Hauberk). Spells are not absorbed (only blows).
 */
export const OFF_ARMOR = {
    /** Body part a blow falls on, and its share of the blows. */
    parts: [
        { slot: 'body', share: 0.5 },
        { slot: 'legs', share: 0.25 },
        { slot: undefined, share: 0.15 },
        { slot: 'helm', share: 0.1 },
    ] as ReadonlyArray<{ slot: 'body' | 'legs' | 'helm' | undefined; share: number }>,
    maxAbsorbPercent: 80,
    shieldSkillPerDex: 2,
    maxShieldSkill: 100,
} as const;

export const OFF_COMBAT = {
    /** Hit chance limits, % (server DEF_MINIMUMHITRATIO / DEF_MAXIMUMHITRATIO). */
    minHitPercent: 15,
    maxHitPercent: 99,
    /** Added to the player's hit ratio on every attack (server: iAttackerHitRatio += 50). */
    playerHitBonus: 50,
    /**
     * Off-7C (owner, 8-nov-2026): Off has no skills, so the weapon skill (mastery) is always at its original cap,
     * DEX × 2, up to 100 (as the Magic skill is MAG × 2). Server: hit ratio = skill + 50, + (DEX − 50) above DEX 50.
     */
    skillPerDex: 2,
    maxSkill: 100,
    /** DEX above this adds to the hit ratio, point by point (server, iCalculateAttackEffect). */
    dexBonusFrom: 50,
    /** Off-7C (owner): a critical blow does this many times the damage (orange number, as Survivors). */
    criticalDamage: 2,
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

/**
 * Critical Strike (Off-8A, owner, 8-nov-2026): the original's "crit" (Alt), with Survivors' charges and damage
 * (data/critStrike.ts: 1 + level/10 charges, +1 every CRIT_STRIKE.rechargeMs and every CRIT_STRIKE.hitsPerCharge
 * blows taken, damage × (2 + level/30)). It is apart from the random critical of a Critical weapon (Off-7C).
 */
export const OFF_CRIT_STRIKE = {
    /** Added to the hit ratio of the strike (server, iCalculateAttackEffect: iAttackerHitRatio += 100). */
    hitBonus: 100,
    /** Camera shake when it is launched (as Survivors). */
    shakePx: 4,
    shakeMs: 200,
    /** The sparks (fx.crit.strike) are drawn this far above the feet (px; as Survivors). */
    effectOffsetY: 24,
} as const;
