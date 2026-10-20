// Monstruos élite (lista de bugs del 19-oct-2026, M2): de vez en cuando un monstruo normal (nunca un jefe) sale
// "Berserk", como los del original: con la misma copia roja sumada que el jugador con el buff Berserk, pega más,
// aguanta más y da más EXP.
// - Probabilidad: baja para los flojos y muy baja para los duros (según su vida, en escala logarítmica).
// - Según cómo vaya la partida: con la vida casi llena salen el doble; con poca vida no sale ninguno.
import type { EnemyDef } from './enemies';
import { BUFFS, BUFF_OVERLAY_ALPHA } from './pickups';

export const ELITE = {
    /** Chance for the weakest monsters (health ≤ `weakHp`) and for the toughest ones (health ≥ `toughHp`). */
    weakChance: 1 / 50,
    toughChance: 1 / 200,
    weakHp: 20,
    toughHp: 1000,
    /** Player health share above which the chance is multiplied by `easyFactor`, and below which there are none. */
    easyHealthShare: 0.75,
    easyFactor: 2,
    hardHealthShare: 0.35,
    /** What an elite has more of. */
    damageMultiplier: 1.5,
    hpMultiplier: 2,
    xpMultiplier: 3,
    /** The player's Berserk glow (sp-client: copy of the sprite in ADD mode, 0xff4444 at 50%). */
    glowTint: BUFFS.berserk.overlayTint,
    glowAlpha: BUFF_OVERLAY_ALPHA,
} as const;

/** Chance that a monster of this kind comes out elite, given the player's health share (0..1). Bosses: never. */
export function eliteChance(def: EnemyDef, playerHealthShare: number): number {
    if (def.boss || playerHealthShare < ELITE.hardHealthShare) return 0;
    const t = Math.log(def.maxHp / ELITE.weakHp) / Math.log(ELITE.toughHp / ELITE.weakHp);
    const clamped = Math.min(1, Math.max(0, t));
    const chance = ELITE.weakChance + (ELITE.toughChance - ELITE.weakChance) * clamped;
    return playerHealthShare > ELITE.easyHealthShare ? chance * ELITE.easyFactor : chance;
}
