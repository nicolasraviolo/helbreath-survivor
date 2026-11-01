// Cómo se escriben los valores derivados del personaje, igual en las cartas de subida de nivel y en el panel de la
// tecla C (cartas de poder, bloque 2, 1-nov-2026): así "Health 137 → 148" en una carta es lo mismo que se ve en la C.
import type { CharacterStats } from '../entities/CharacterStats';
import { HP_REGEN_INTERVAL_MS, MANA_REGEN_INTERVAL_MS } from '../data/stats';

/** A multiplier as a total bonus: 1.12 → "+12%", 0.9 → "-10%". */
export function totalBonus(multiplier: number): string {
    return `${multiplier >= 1 ? '+' : ''}${Math.round((multiplier - 1) * 100)}%`;
}

/** A chance or share: 0.82 → "82%". */
export function percent(share: number): string {
    return `${Math.round(share * 100)}%`;
}

/** Attack or cast speed from its cooldown multiplier (0.8 = cooldowns 20% shorter → "+25%"). */
export function speedFromCooldown(cooldownMultiplier: number): string {
    return totalBonus(1 / cooldownMultiplier);
}

/** Critical damage multiplier: 2 → "×2", 2.15 → "×2.15". */
export function critDamage(multiplier: number): string {
    return `×${Number(multiplier.toFixed(2))}`;
}

/** An amount that can be small: one decimal under 10 (3.6), whole above (54). */
function amount(value: number): string {
    return value < 10 ? String(Number(value.toFixed(1))) : String(Math.round(value));
}

/** Seconds between two batches of health or mana (they arrive all at once, like in the original). */
export const HP_REGEN_SECONDS = HP_REGEN_INTERVAL_MS / 1000;
export const MANA_REGEN_SECONDS = MANA_REGEN_INTERVAL_MS / 1000;

/** Health of each batch, with the armor's HP Recovery (`hpRecovery`, 0.3 = +30%). */
export function hpPerBatch(stats: Readonly<CharacterStats>, hpRecovery: number): string {
    return amount(stats.hpRegenPerSecond * (1 + hpRecovery) * HP_REGEN_SECONDS);
}

/** Mana of each batch, with the armor's MP Recovery. */
export function manaPerBatch(stats: Readonly<CharacterStats>, mpRecovery: number): string {
    return amount(stats.manaRegenPerSecond * (1 + mpRecovery) * MANA_REGEN_SECONDS);
}
